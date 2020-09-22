import { RelationMappings } from '../../types/relation-mapping';
import {
  ComparisonFunction,
  ComparisonNode,
  LogicalFunction,
  LogicalNode,
  Node,
  Search,
} from '../../types/search';
import parser from '../parser';

import CompilerError from './compilerError';

const ComparisonFunctionMappings: Record<ComparisonFunction, string> = {
  match_all: 'AND',
  match_any: 'OR',
};

const LogicalFunctionMappings: Record<LogicalFunction, string> = {
  eq: '=',
  neq: '<>',
  leq: '<=',
  geq: '>=',
};

export default class Compiler {
  ast!: Node;
  tables!: string[];

  constructor(
    private search: Search,
    private relationMappings: RelationMappings
  ) {
    this.tables = [];
  }

  compile() {
    const { predicate: input, on } = this.search;

    this.ast = parser.parse(input) as Node;
    const compiled = this.processNode(this.ast);
    const relations = this.generateRelations();

    const output = `SELECT ${on} FROM ${relations} WHERE ${compiled}`;
    return output;
  }

  generateRelations() {
    if (this.tables.length === 0)
      throw new CompilerError(`Unexpected Error. No tables found`);

    if (this.tables.length === 1) return this.tables[0];

    const queue = this.tables.map((tbl) => ({
      name: tbl,
      processed: false,
    }));

    try {
      return queue
        .map(({ name, processed }) => {
          if (processed) return null;

          const joinOn = this.relationMappings[name].join.on;
          const joinWith = this.relationMappings[name].join.with;

          queue.find((elem) => elem.name === joinWith).processed = true;

          return `${name} JOIN ${joinWith} ON ${joinOn}`;
        })
        .join(' ');
    } catch (e) {
      console.error(e);
      throw new CompilerError('Error processing relation mappings');
    }
  }

  processNode(node: Node) {
    if (node.type === 'logical') {
      return this.processLogicalNode(node);
    } else if (node.type === 'comparison') {
      return this.processComparisonNode(node);
    } else {
      throw new CompilerError(
        `Unexpected Error. Expected node type to be one of ["logical", "comparison"]`
      );
    }
  }

  processLogicalNode(node: LogicalNode) {
    const condition = ComparisonFunctionMappings[node.fn];
    return (
      '(' +
      node.constraints.map((n) => this.processNode(n)).join(` ${condition} `) +
      ')'
    );
  }

  processComparisonNode(node: ComparisonNode) {
    const operator = LogicalFunctionMappings[node.fn];

    const { identifier } = node.args;
    let { value } = node.args;

    if (typeof value === 'string') {
      value = `'${value}'`;
    }

    const [table, column] = identifier.split('.');

    if (!table || !column) {
      throw new CompilerError(
        `Invalid identifier ${identifier}: Expected format: <table>.<column>`
      );
    }

    if (this.tables.indexOf(table) === -1) this.tables.push(table);

    return `${identifier} ${operator} ${value}`;
  }
}
