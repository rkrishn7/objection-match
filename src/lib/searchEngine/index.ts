import { trimEnd, upperFirst } from 'lodash';
import { Model, QueryBuilder } from 'objection';

import {
  ComparisonFunction,
  ComparisonNode,
  LogicalFunction,
  LogicalNode,
  Node,
  Search,
} from '../../types/search';
import parser from '../parser';

type BuilderFunction = 'andWhere' | 'orWhere' | 'where';

const ComparisonFunctionMappings: Record<
  ComparisonFunction,
  BuilderFunction
> = {
  match_all: 'andWhere',
  match_any: 'orWhere',
};

const LogicalFunctionMappings: Record<LogicalFunction, string> = {
  eq: '=',
  neq: '<>',
  leq: '<=',
  geq: '>=',
};

interface SearchEngineOptions {
  models: Record<string, typeof Model>;
}

type RelationNode = { name: string; children: RelationNode[] };
type RelationTree = RelationNode;

export default class SearchEngine {
  relationTree: RelationTree;
  table!: string;

  constructor(private options: SearchEngineOptions) {}

  search(search: Search) {
    const root = parser.parse(search.predicate) as Node;
    this.table = search.on;
    const model = upperFirst(trimEnd(this.table, 's'));

    // Initialize relation tree w/ root node.
    this.relationTree = { name: this.table, children: [] };
    this.buildRelationTree(root);
    const relationExpression = this.generateRelationExpression(
      this.relationTree,
      { root: true }
    );
    return this.options.models[model].query().modify((builder) => {
      if (relationExpression) builder.withGraphJoined(relationExpression);
      if (search.limit) builder.limit(search.limit);
      this.processNode(root, builder, 'where');
    });
  }

  buildRelationTree(node: Node) {
    if (node.type === 'logical') {
      node.constraints.map((c) => this.buildRelationTree(c));
    } else if (node.type === 'comparison') {
      const tokens = node.args.identifier.split('.');
      let top = this.relationTree;
      for (let i = 0; i < tokens.length - 1; ++i) {
        const node = top.children.find((child) => child.name === tokens[i]);

        if (!node) {
          top.children.push({ name: tokens[i], children: [] });
          top = top.children[top.children.length - 1];
        } else {
          top = node;
        }
      }
    }
  }

  generateRelationExpression(node: RelationNode, { root } = { root: false }) {
    if (node.children.length === 0) {
      return root ? null : node.name;
    } else if (node.children.length === 1) {
      return `${!root ? `${node.name}.` : ''}${this.generateRelationExpression(
        node.children[0]
      )}`;
    } else {
      return `${!root ? `${node.name}.` : ''}[${node.children
        .map((child) => this.generateRelationExpression(child))
        .join(',')}]`;
    }
  }

  processNode(node: Node, qb: QueryBuilder<Model>, builderFn: BuilderFunction) {
    if (node.type === 'logical') {
      return this.processLogicalNode(node, qb, builderFn);
    } else if (node.type === 'comparison') {
      return this.processComparisonNode(node, qb, builderFn);
    } else {
      throw new Error(
        `Unexpected Error. Expected node type to be one of ["logical", "comparison"]`
      );
    }
  }

  processLogicalNode(
    node: LogicalNode,
    qb: QueryBuilder<Model>,
    builderFn: BuilderFunction
  ) {
    const condition = ComparisonFunctionMappings[node.fn];
    qb[builderFn]((builder) => {
      node.constraints.map((c) => this.processNode(c, builder, condition));
    });
  }

  processComparisonNode(
    node: ComparisonNode,
    qb: QueryBuilder<Model>,
    builderFn: BuilderFunction
  ) {
    const operator = LogicalFunctionMappings[node.fn];
    const tokens = node.args.identifier.split('.');

    if (tokens.length === 1)
      qb[builderFn](`${this.table}.${tokens[0]}`, operator, node.args.value);
    else {
      const relations = [];
      for (let i = 0; i < tokens.length - 1; ++i) {
        relations.push(tokens[i]);
      }
      qb[builderFn](
        `${relations.join(':')}.${tokens[tokens.length - 1]}`,
        operator,
        node.args.value
      );
    }
  }
}
