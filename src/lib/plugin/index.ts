import { Model } from 'objection';

import { Search } from '../../types/search';
import Compiler from '../compiler';

export interface ExtendedProperties {
  search: (s: Search) => Promise<Model[]>;
}

export default function (
  ModelClass: typeof Model
): typeof Model & ExtendedProperties {
  return class extends ModelClass {
    static search(search: Search) {
      const compiler = new Compiler();

      return compiler.compile(search, this as typeof Model);
    }
  };
}
