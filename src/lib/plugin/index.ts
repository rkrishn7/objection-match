import Knex, { SqlNative } from 'knex';
import LruCache from 'lru-cache';
import { Model } from 'objection';

import { ModelClass } from '../../types/objection';
import { Search } from '../../types/search';
import { Debug } from '../../utils/debug';
import Compiler from '../compiler';

export interface MatchPluginOptions {
  enableCache?: boolean;
  cacheMaxSize?: number;
  knexInstance?: Knex;
}

export interface ExtendedProperties {
  search: <M extends Model>(this: { new (): M }, s: Search) => Promise<M[]>;
}

const DefaultPluginOptions: MatchPluginOptions = {
  enableCache: false,
  cacheMaxSize: 1000,
  knexInstance: null,
};

export default ({
  enableCache,
  cacheMaxSize,
  knexInstance,
}: MatchPluginOptions = DefaultPluginOptions) => {
  let cache: LruCache<string, SqlNative>;
  if (enableCache) {
    cache = new LruCache({
      max: cacheMaxSize,
    });
  }

  return (ModelClass: typeof Model): typeof Model & ExtendedProperties => {
    return class extends ModelClass {
      static async search<M extends Model>(
        this: { new (): M },
        search: Search
      ) {
        const compiler = new Compiler();

        if (enableCache) {
          const key = JSON.stringify(search),
            val = cache.get(key);

          if (val) {
            Debug.success(`Using cached query: ${val.sql}`);
            const data = await knexInstance.raw(val.sql, val.bindings);
            return data.map((row) => ModelClass.fromDatabaseJson(row));
          }

          const results = compiler.compile(search, this as ModelClass<M>);
          const native = results.toKnexQuery().toSQL().toNative();
          if (cache.set(key, native)) {
            Debug.success(`Succesfully cached query: ${native.sql}`);
          } else {
            Debug.error(`Unable to cache query: ${native.sql}`);
          }
          return results;
        }

        const results = compiler.compile(search, this as ModelClass<M>);
        return results;
      }
    };
  };
};
