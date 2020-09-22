# ro.rqb

Stands for: _Read-Only Relational Query Builder_

A lightweight search DSL built on top of [Objection.js](https://github.com/Vincit/objection.js).

## Why Objection?

Objection already has a powerful, expressive way for loading relations on a model. Its syntax for relation expressions is something I wanted to emulate in this, but also make it easy to add simple parameters to a search. I understand, however, that this limits the library's reach. In the future the plan is to move away from using another ORM.

## Motivation

I wanted to build a small language that makes it easy to express a search on a database by simply stating a set of constraints. Front-end programmers, for example, often work with requesting and displaying data, but don't necessarily know/care how it is represented. Requesting a set of data that meets certain constraints becomes easy when you can disregrard the underlying query language. **ro.rqb** lets you generate results by passing in a predicate that must resolve to true. It uses Objection to determine the relation between different tables and builds a relation tree that compiles to a [Relation Expression](https://vincit.github.io/objection.js/api/types/#type-relationexpression). Finally, it analyzes the constraints stated in the predicate and generates a database query.

A common use case for this library could be for a search that contains a dynamic set of constraints. In a distributed setting, the set of constraints would be defined on some client machine and be sent to the server for processing. This is where **ro.rqb** fits in. It provides a minimal, easy-to-read format for stating a set of constraints. On the server, the compiler is responsible for parsing the _predicate_, building an Objection query, and returning the results.

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

A simple, browser-compatible package that constructs this syntax will be available as well.

## Compiler

The compiler needs to be initialized so we can parse predicates and get results. It requires a set of Objection models that are used to build the query.

Example:

```tsx
const models = {
  Salary,
  Employee,
  Department,
};

const search = new Compiler({ models });
```

## Search

A `Search` takes a `predicate`, a table to search `on`, and other properties that build the query, such as `limit`.

Example: We need to find an employee who has had a high salary for a long time. The employee's salary, and when it started can be found in the `salaries` table. Objection should already have metadata about our models' relations, so the compiler lets us easily express nested relations by chaining with `.`.

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

You can also alias columns in the predicate, which makes it easier to read:

```tsx
const searchResults = await search.search({
  predicate: `
    match_all: {
      geq: ["salary", 60000],
      geq: ["salary_start_date", "1986-06-26"]
    }
  `,
  on: 'employees',
  limit: 50,
  aliases: {
    salary: 'salaries.salary',
    salary_start_date: 'salaries.from_date',
  },
});
```

The language syntax makes it extremely easy to express nested relations without having to think about a bunch of joins. Here's the resulting SQL:

```SQL
select * from `employees` left join `salaries` on `salaries`.`emp_no` = `employees`.`emp_no` where (`salaries`.`salary` >= 60000 and `salaries`.`from_date` >= '1986-06-26') limit 50
```

WIP
