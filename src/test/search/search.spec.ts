import anyTest, { TestInterface } from 'ava';

import Engine from '../../lib/searchEngine';
import knex from '../setup/db';
import models from '../setup/models';

interface Context {
  search: Engine;
}

const test = anyTest as TestInterface<Context>;

test.before((t) => {
  t.context.search = new Engine({ models });
});

test('simple search #1', async (t) => {
  const {
    context: { search },
  } = t;

  const searchResults = await search.search({
    predicate: `
      match_all: {
        eq: ["first_name", "Jerry"]
      }
    `,
    on: 'employees',
    limit: 50,
  });

  const { Employee } = models;

  const objectionResults = await Employee.query()
    .where('first_name', '=', 'Jerry')
    .limit(50);

  t.deepEqual(searchResults, objectionResults);
});

test('simple search #2', async (t) => {
  const {
    context: { search },
  } = t;

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

  const { Employee } = models;

  const objectionResults = await Employee.query()
    .modify((builder) => {
      builder.where('salaries.salary', '>=', 60000);
      builder.andWhere('salaries.from_date', '>=', '1986-06-26');
      builder.limit(5);
    })
    .withGraphJoined('salaries');

  t.deepEqual(searchResults, objectionResults);
});

test.todo('simple search #3');

test.todo('simple search #4');

test.after(async () => {
  await knex.destroy();
});
