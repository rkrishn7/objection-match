export type LogicalFunction = 'match_all' | 'match_any';
export type ComparisonFunction =
  | 'eq'
  | 'neq'
  | 'geq'
  | 'leq'
  | 'lt'
  | 'gt'
  | 'like';

export type LogicalNode = {
  type: 'logical';
  fn: LogicalFunction;
  constraints: (LogicalNode | ComparisonNode)[];
};

export type ComparisonNode = {
  type: 'comparison';
  fn: ComparisonFunction;
  args: {
    identifier: string;
    value: string | number | boolean | null;
  };
};

export type AliasMap = Record<string, string>;
export type Node = LogicalNode | ComparisonNode;

export interface Search {
  predicate: string;
  limit?: number;
  aliases?: AliasMap;
  fields?: string[];
  orderBy?: [string, ('asc' | 'desc')?];
}
