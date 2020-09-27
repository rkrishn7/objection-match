import LruCache from 'lru-cache';
import { Model, QueryBuilder } from 'objection';

import { ModelClass } from '../../types/objection';
import { Search } from '../../types/search';
import { Debug } from '../../utils/debug';
import Compiler from '../compiler';

export interface MatchPluginOptions {
  enableCache?: boolean;
  cacheMaxSize?: number;
}

export interface ExtendedProperties {
  search: <M extends Model>(this: { new (): M }, s: Search) => Promise<M[]>;
}

const DefaultPluginOptions: MatchPluginOptions = {
  enableCache: false,
  cacheMaxSize: 20,
};

export default ({
  enableCache,
  cacheMaxSize,
}: MatchPluginOptions = DefaultPluginOptions) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cache: LruCache<string, any>;
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
            cached = cache.get(key);

          if (cached) {
            Debug.success(`Using cached query builder`);
            return cached as QueryBuilder<M, M[]>;
          }

          const builder = compiler.compile(search, this as ModelClass<M>);
          if (cache.set(key, builder)) {
            Debug.success(`Succesfully cached query builder`);
          } else {
            Debug.error(`Unable to cache query builder`);
          }
          return builder;
        }

        const builder = compiler.compile(search, this as ModelClass<M>);
        return builder;
      }
    };
  };
};
