# ro.orm

Stands for: read only object relational mapper

A lightweight search DSL that compiles to SQL. Provides a declarative, recursive interface for generating queries from a set of search constraints.

## Grammar

The grammar can be found in `src/lib/parser/parser.pegjs`

Briefly, a _predicate_ is a collection of constraints that must be matched.
The format can be recursive, nesting as many `match_all`'s or `match_any`'s as desired. Primitive constraints that take comparison functions such as `eq`, `neq`, `geq`, `leq` are available as well.

Sample predicate:

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

Entire program:

```tsx
const compiler = new Compiler(
  {
    predicate: `
  match_all: {
    eq: ["person.name", "Antonio"],
    neq: ["shirt.color", "white"],
    match_any: {
      eq: ["shirt.style", "polo"],
      eq: ["shirt.style", "dress"]
    }
  }
`,
    find: 'shirt.*',
  },
  {
    person: {
      join: {
        with: 'shirt',
        on: 'shirt.owner = person.id',
      },
    },
  }
);
const compiled = compiler.compile();
console.log(compiled);
```

The resulting SQL is:

```sql
SELECT shirt.* FROM person JOIN shirt ON shirt.owner = person.id  WHERE (person.name = 'Antonio' AND shirt.color <> 'white' AND (shirt.style = 'polo' OR shirt.style = 'dress'))
```

`Compiler` takes 2 arguments of types `Search` and `RelationMappings`.

- A `Search` consists of a predicate to be matched and a set to find.
- `RelationMappings` are specified so the compiler knows how to join different tables.
