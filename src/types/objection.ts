import { Model, QueryBuilder } from 'objection';

export interface ModelClass<M extends Model> {
  new (): M;
  tableName: string;
  query(): QueryBuilder<M>;
}
