export type ComparisonFunction = 'match_all' | 'match_any';
export type LogicalFunction = 'eq' | 'neq' | 'geq' | 'leq';

export type LogicalNode = {
  type: 'logical';
  fn: ComparisonFunction;
  constraints: (LogicalNode | ComparisonNode)[];
};

export type ComparisonNode = {
  type: 'comparison';
  fn: LogicalFunction;
  args: {
    identifier: string;
    value: string | number | boolean | null;
  };
};

export type Node = LogicalNode | ComparisonNode;

export interface Search {
  predicate: string;
  on: string;
  limit?: number;
}
