import util from 'util';

import { upperFirst } from 'lodash';
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

const ComparisonFunctionMappings: Record<
  ComparisonFunction,
  'andWhere' | 'orWhere'
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
  treeDepth!: number;
  relationDepth!: number;
  relationExpression!: string;
  relationTree: RelationTree;
  table!: string;

  constructor(private options: SearchEngineOptions) {
    this.treeDepth = 0;
    this.relationDepth = 0;
    this.options;
  }

  search(search: Search) {
    const root = parser.parse(search.predicate) as Node;
    const [table] = search.find.split('.');
    this.table = table;
    const model = upperFirst(table);

    // Initialize relation tree w/ root node.
    this.relationTree = { name: table, children: [] };
    this.buildRelationTree(root);
    const relationExpression = this.generateRelationExpression(
      this.relationTree
    );
    console.log(util.inspect(this.relationTree, false, null, true));
    console.log(relationExpression);
    const stuff = this.options.models[model]
      .query()
      .withGraphJoined(relationExpression)
      .modify((builder) => {
        this.processNode(root, builder, null);
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

  generateRelationExpression(node: RelationNode) {
    if (node.children.length === 0) {
      return node.name;
    } else if (node.children.length === 1) {
      return `${node.name}.${this.generateRelationExpression(
        node.children[0]
      )}`;
    } else {
      return `${node.name}.[${node.children
        .map((child) => this.generateRelationExpression(child))
        .join(',')}]`;
    }
  }

  processNode(
    node: Node,
    qb: QueryBuilder<Model>,
    conditionFn: 'andWhere' | 'orWhere' | null,
    positionRelativeToScope = 0
  ) {
    if (node.type === 'logical') {
      return this.processLogicalNode(
        node,
        qb,
        conditionFn,
        positionRelativeToScope
      );
    } else if (node.type === 'comparison') {
      return this.processComparisonNode(
        node,
        qb,
        conditionFn,
        positionRelativeToScope
      );
    } else {
      throw new Error(
        `Unexpected Error. Expected node type to be one of ["logical", "comparison"]`
      );
    }
  }

  processLogicalNode(
    node: LogicalNode,
    qb: QueryBuilder<Model>,
    conditionFn: 'andWhere' | 'orWhere',
    positionRelativeToScope: number
  ) {
    const condition = ComparisonFunctionMappings[node.fn];
    const builderFn = positionRelativeToScope === 0 ? 'where' : conditionFn;
    qb[builderFn]((builder) => {
      node.constraints.map((c, i) =>
        this.processNode(c, builder, condition, i)
      );
    });
  }

  processComparisonNode(
    node: ComparisonNode,
    qb: QueryBuilder<Model>,
    conditionFn: 'andWhere' | 'orWhere',
    positionRelativeToScope: number
  ) {
    const operator = LogicalFunctionMappings[node.fn];
    const tokens = node.args.identifier.split('.');
    const builderFn = positionRelativeToScope === 0 ? 'where' : conditionFn;

    if (tokens.length === 1)
      qb[builderFn](`${this.table}.${tokens[0]}`, operator, node.args.value);
    else {
      const relations = [this.table];
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
