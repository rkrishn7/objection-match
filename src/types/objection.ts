import { Model, QueryBuilder } from 'objection';

/**
 * A subset of Objection's Model class used to properly type
 * the return result from compile()
 */
export interface ModelClass<M extends Model> {
  new (): M;
  tableName: string;
  query(): QueryBuilder<M>;
}
