# objection-match

A lightweight search plugin built on top of [Objection.js](https://github.com/Vincit/objection.js).

**objection-match** was created for programs that wish to easily support dynamic searches. In a distributed setting, a set of constraints for a search may be defined on a client machine and sent to a server for processing. However, the task of parsing the payload, loading relations, and building a query can be cumbersome. This library provides a robust and portable query language that can be used to represent a complex search with various constraints, and from it, build an Objection query.

## Installation

```
# NPM
npm install --save objection-match

# yarn
yarn add objection-match
```

## Grammar

The grammar can be found in [src/lib/parser/parser.pegjs](https://github.com/rkrishn7/objection-match/blob/master/src/lib/parser/parser.pegjs). It defines the structure of the query language.

Briefly, a query consists of _logical_ and _comparison_ nodes. The tables below describe the mapping from each node to their respective function.

<table>
<tr><th>Logical Node Mappings</th><th>Comparison Node Mappings</th></tr>
<tr><td>

| Logical Node | Corresponding Function |
| ------------ | ---------------------- |
| match_all    | AND                    |
| match_any    | OR                     |

</td><td>

| Comparison Node | Corresponding Function |
| --------------- | ---------------------- |
| eq              | =                      |
| neq             | !=                     |
| geq             | >=                     |
| leq             | <=                     |
| lt              | <                      |
| gt              | >                      |
| like            | LIKE                   |
| in              | IN                     |

</td></tr> </table>

Logical nodes can contain children that include both node types while comparison nodes cannot contain any children. Here's an example:

```js
match_all: {
  eq: ["person.name", "Antonio"],
  neq: ["shirt.color", "white"],
  match_any: {
    eq: ["shirt.style", "polo"],
    eq: ["shirt.style", "dress"]
  }
}
```

A simple, browser-compatible package that constructs this syntax will be available as well.

## Usage

The `search()` method is invoked directly on a model class. In order to support this, the plugin mixin needs to be added to any models that wish to use it. Example usage:

```tsx
import Search from 'objection-match';

class Employee extends Search({ ...plugin options })(Model) {
  ...
}
```

Now, you can call the `search()` method like so:

```tsx
const results = await Employee.search({
  predicate: `
    match_all: {
      geq: ["salary", 60000],
      geq: ["salary_start_date", "1986-06-26"],
      in: ["first_name", "Georgi, Bob"]
    }
  `,
  limit: 5,
  fields: ['salary', 'salary_start_date'],
  aliases: {
    salary: 'salaries.salary',
    salary_start_date: 'salaries.from_date',
  },
  orderBy: ['salary', 'desc'],
});
```

`search()` requires a `Search` object as its argument, which has the following properties:

| Property                           | Description                                                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| predicate `string` (required)      | The search string, as described in **Grammar**                                                                       |
| limit `number`                     | A limit on the number of results                                                                                     |
| fields `string[]`                  | Fields to select (supports aliased fields)                                                                           |
| aliases `Record<string, string>`   | An object that contains mappings from alias name to relation name. These are to be used in `predicate` and `fields`. |
| orderBy `[string, 'desc' / 'asc']` | Used for ordering results.                                                                                           |

## Caching

objection-match can cache the query builder object so it doesn't have to parse and build frequently used searches. To enable caching pass options to the mixin function when initializing the plugin on a model. The options include:

| Property                           | Description                |
| ---------------------------------- | -------------------------- |
| enableCache `boolean`              | Turns on caching           |
| cacheMaxSize `number` (default 10) | Sets the size of the cache |

For more information on third-party plugins, check out [Objection's docs](https://vincit.github.io/objection.js/guide/plugins.html#_3rd-party-plugins).
