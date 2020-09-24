import { Model } from 'objection';

import { Search } from '../../types/search';
import Compiler from '../compiler';

export interface ExtendedProperties {
  search: <M extends typeof Model>(this: M, s: Search) => Promise<Model[]>;
}

export default function (
  ModelClass: typeof Model
): typeof Model & ExtendedProperties {
  return class extends ModelClass {
    static search<M extends typeof Model>(this: M, search: Search) {
      const compiler = new Compiler();

      return compiler.compile(search, this);
    }
  };
}
