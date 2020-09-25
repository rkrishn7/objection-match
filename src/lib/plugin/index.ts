import { Model } from 'objection';

import { ModelClass } from '../../types/objection';
import { Search } from '../../types/search';
import Compiler from '../compiler';

export interface ExtendedProperties {
  search: <M extends Model>(this: { new (): M }, s: Search) => Promise<M[]>;
}

export default function (
  ModelClass: typeof Model
): typeof Model & ExtendedProperties {
  return class extends ModelClass {
    static search<M extends Model>(this: { new (): M }, search: Search) {
      const compiler = new Compiler();

      return compiler.compile(search, this as ModelClass<M>);
    }
  };
}
