import { Model, QueryBuilder } from 'objection';

/**
 * A subset of Objection's Model class used to properly type
 * the return result from compile()
 */
export interface ModelClass<M extends Model> {
  new (): M;
  tableName: string;
  query(): QueryBuilder<M>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fromDatabaseJson<M>(this: { new (): M }, json: any): M;
}
