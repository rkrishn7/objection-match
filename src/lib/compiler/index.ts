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
import { Debug } from '../../utils';
import parser from '../parser';

import CompilerError from './compilerError';
import Relation from './relation';

enum BuilderFunction {
  andWhere = 'andWhere',
  orWhere = 'orWhere',
  where = 'where',
}

const ComparisonFunctionMappings: Record<
  ComparisonFunction,
  BuilderFunction
> = {
  match_all: BuilderFunction.andWhere,
  match_any: BuilderFunction.orWhere,
};

const LogicalFunctionMappings: Record<LogicalFunction, string> = {
  eq: '=',
  neq: '<>',
  leq: '<=',
  geq: '>=',
};

interface CompilerOptions {
  models: Record<string, typeof Model>;
}

export default class SearchEngine {
  constructor(private options: CompilerOptions) {}

  search(search: Search) {
    const rootTable = search.on;
    const root = parser.parse(search.predicate) as Node;
    const modelName = upperFirst(trimEnd(rootTable, 's'));
    const model = this.options.models[modelName];

    // Initialize relation tree w/ root node.
    const { expression: relationExpression } = new Relation(
      rootTable,
      root,
      search.aliases
    );
    Debug.log(`Relation Expression: ${relationExpression}`);
    return model.query().modify((builder) => {
      if (relationExpression) builder.withGraphJoined(relationExpression);
      if (search.limit) builder.limit(search.limit);
      this.processNode(root, builder, BuilderFunction.where, rootTable);
    });
  }

  processNode(
    node: Node,
    qb: QueryBuilder<Model>,
    builderFn: BuilderFunction,
    rootTable: string
  ) {
    if (node.type === 'logical') {
      return this.processLogicalNode(node, qb, builderFn, rootTable);
    } else if (node.type === 'comparison') {
      return this.processComparisonNode(node, qb, builderFn, rootTable);
    } else {
      throw new CompilerError(
        `Unexpected Error. Expected node type to be one of ["logical", "comparison"]`
      );
    }
  }

  processLogicalNode(
    node: LogicalNode,
    qb: QueryBuilder<Model>,
    builderFn: BuilderFunction,
    rootTable: string
  ) {
    const condition = ComparisonFunctionMappings[node.fn];
    qb[builderFn]((builder) => {
      node.constraints.map((c) =>
        this.processNode(c, builder, condition, rootTable)
      );
    });
  }

  processComparisonNode(
    node: ComparisonNode,
    qb: QueryBuilder<Model>,
    builderFn: BuilderFunction,
    rootTable: string
  ) {
    const operator = LogicalFunctionMappings[node.fn];
    const tokens = node.args.identifier.split('.');

    if (tokens.length === 1)
      qb[builderFn](`${rootTable}.${tokens[0]}`, operator, node.args.value);
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
