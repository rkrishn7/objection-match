# ro.rqb

Stands for: _Read-Only Relational Query Builder_

A lightweight search DSL built on top of [Objection.js](https://github.com/Vincit/objection.js). I chose to add this as another layer to Objection because already it contains an easy, comprehensible DSL for expressing and loading relations.

## Motivation

I sought out to build a small language that makes it easy to express a search on a database by simply stating a set of constraints. Numerous front-end programmers, for example, often work with requesting, manipulating, and displaying data, but don't necessarily know/care how it is represented. One could just pass the set of constraints along to the server, but this still puts the burden on back-end programmers to build routines that output the corresponding language used to query the database. I saw that for many use-cases, all of this can be abstracted. Lo and behold, **ro.rqb** was born.

A common use case for this library is some search that contains a dynamic set of constraints. In a distributed setting, the set of constraints would occur on some client machine and be sent to the server for processing. This is where **ro.rqb** fits in. It provides an easy-to-read format for stating a set of constraints. On the server, the evaluation engine is responsible for parsing the _predicate_, building an Objection query, and returning the results.

## Grammar

The grammar can be found in `src/lib/parser/parser.pegjs`. It defines the structure of a _predicate_.

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

## Evaluation Engine

We must initialize the engine in order to perform searches. It requires a set of Objection models that are queried in searches.

Example:

```tsx
const models = {
  Salary,
  Employee,
  Department,
};

const engine = new EvaluationEngine({ models });
```

## Search

A `Search` takes a `predicate`, a table to search `on`, and other properties that build the query, such as `limit`.

Example:

```tsx
const searchResults = await search.search({
  predicate: `
    match_all: {
      geq: ["salaries.salary", 60000],
      geq: ["salaries.from_date", "1986-06-26"]
    }
  `,
  on: 'employees',
  limit: 50,
});
```

The language makes it extremely easy to express nested relations without having to think about a bunch of joins. For example, we need to find an employees salary which exists in the `salaries` table. `employees` has a FK reference to `salaries`. Since objection should already have metadata that shows our models' relations, we can simply express nested relations by chaining with `.`. Here's the resulting SQL.

```SQL
select * from `employees` left join `salaries` on `salaries`.`emp_no` = `employees`.`emp_no` where (`salaries`.`salary` >= 60000 and `salaries`.`from_date` >= '1986-06-26') limit 50
```

WIP
