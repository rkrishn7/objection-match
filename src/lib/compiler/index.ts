import { Model, QueryBuilder } from 'objection';

import { ModelClass } from '../../types/objection';
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
import Relation from './relation';

enum BuilderFunction {
  andWhere = 'andWhere',
  orWhere = 'orWhere',
  where = 'where',
}

const LogicalFunctionMappings: Record<LogicalFunction, BuilderFunction> = {
  match_all: BuilderFunction.andWhere,
  match_any: BuilderFunction.orWhere,
};

const ComparisonFunctionMappings: Record<ComparisonFunction, string> = {
  eq: '=',
  neq: '<>',
  leq: '<=',
  geq: '>=',
  lt: '<',
  gt: '>',
  like: 'like',
};

export default class Compiler {
  /**
   * Takes a search payload that contains a predicate and additional filters
   * and returns a set of results.
   * @param search the search to compile
   * @param model the model to search on
   */
  async compile<M extends Model>(search: Search, model: ModelClass<M>) {
    const table = model.tableName;
    const root = parser.parse(search.predicate) as Node;

    // Initialize relation tree w/ root node.
    const { expression: relationExpression } = new Relation(
      root,
      search.aliases
    );

    const results = await model.query().modify((builder) => {
      if (relationExpression) builder.withGraphJoined(relationExpression);
      if (search.limit) builder.limit(search.limit);
      if (search.fields) this.processFields(search.fields, builder);
      if (search.orderBy)
        builder.orderBy(
          this.mapAliases([search.orderBy[0]], search.aliases)[0],
          search.orderBy[1]
        );
      this.processNode(root, builder, BuilderFunction.where, table);
    });

    return results;
  }

  /**
   * Maps a set of aliases onto fields
   * @param fields
   * @param aliases
   */
  mapAliases(fields: string[], aliases?: Search['aliases']) {
    if (aliases) return fields.map((f) => (f in aliases ? aliases[f] : f));
    else return fields;
  }

  /**
   * Processes 'fields' in the Search payload, and modifies the query builder.
   * @param fields
   * @param builder
   * @param aliases
   */
  processFields(
    fields: string[],
    builder: QueryBuilder<Model>,
    aliases?: Search['aliases']
  ) {
    this.mapAliases(fields, aliases).forEach((field) => {
      const parts = field.split('.');
      const pathExpression = parts.slice(0, parts.length - 1).join('.');
      const selected = parts[parts.length - 1];

      if (pathExpression)
        builder.modifyGraph(pathExpression, (builder) =>
          builder.select(selected)
        );
      else builder.select(selected);
    });
  }

  /**
   * Base method for processing a generic node in the predicate tree
   * @param node
   * @param qb
   * @param builderFn
   * @param rootTable
   */
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

  /**
   * A logical node is one that uses a logical function (e.g. 'match_all' or 'match_any').
   * This method modifies the builder using the respective predicate function and recursively
   * calls processNode() for any child nodes.
   * @param node
   * @param qb
   * @param builderFn
   * @param rootTable
   */
  processLogicalNode(
    node: LogicalNode,
    qb: QueryBuilder<Model>,
    builderFn: BuilderFunction,
    rootTable: string
  ) {
    const condition = LogicalFunctionMappings[node.fn];
    qb[builderFn]((builder) => {
      node.constraints.map((c) =>
        this.processNode(c, builder, condition, rootTable)
      );
    });
  }

  /**
   * A comparison node is on that uses a comparison function (e.g. '<', '>', '=', etc.).
   * It takes no children so we simply modify the builder.
   * @param node
   * @param qb
   * @param builderFn
   * @param rootTable
   */
  processComparisonNode(
    node: ComparisonNode,
    qb: QueryBuilder<Model>,
    builderFn: BuilderFunction,
    rootTable: string
  ) {
    const operator = ComparisonFunctionMappings[node.fn];
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
