import test from 'ava';

import knex from '../../helpers/setup/db';
import models from '../../helpers/setup/models';

test('simple search #1', async (t) => {
  const { Employee } = models;

  const searchResults = await Employee.search({
    predicate: `
      match_all: {
        eq: ["first_name", "Jerry"]
      }
    `,
    limit: 50,
  });

  const objectionResults = await Employee.query()
    .where('first_name', '=', 'Jerry')
    .limit(50);

  t.deepEqual(searchResults, objectionResults);
});

test('simple search #2', async (t) => {
  const { Employee } = models;

  const searchResults = await Employee.search({
    predicate: `
      match_all: {
        geq: ["salaries.salary", 60000],
        geq: ["salaries.from_date", "1986-06-26"]
      }
    `,
    limit: 50,
  });

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

test('aliasing #1', async (t) => {
  const { Employee } = models;

  const searchResults = await Employee.search({
    predicate: `
      match_all: {
        geq: ["salary", 60000],
        geq: ["salary_start_date", "1986-06-26"]
      }
    `,
    limit: 50,
    aliases: {
      salary: 'salaries.salary',
      salary_start_date: 'salaries.from_date',
    },
  });

  const objectionResults = await Employee.query()
    .modify((builder) => {
      builder.where('salaries.salary', '>=', 60000);
      builder.andWhere('salaries.from_date', '>=', '1986-06-26');
      builder.limit(5);
    })
    .withGraphJoined('salaries');

  t.deepEqual(searchResults, objectionResults);
});

test.after(async () => {
  await knex.destroy();
});
