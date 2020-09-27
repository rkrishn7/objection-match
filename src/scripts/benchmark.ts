import { initialize } from 'objection';

import knex from '../helpers/setup/db';
import { Department, Employee, Salary } from '../helpers/setup/models';

/**
 * Compares execution time between objection and objection-match.
 * Gives insight into how long parsing the predicate and building the query takes.
 *
 * TODO: add more tests to draw significant conclusions
 */
async function benchmark() {
  await initialize([Department, Employee, Salary]);

  console.time('objection');

  await Employee.query().modify((builder) => {
    builder.withGraphJoined('salaries');
    builder.limit(5);
    builder.andWhere('salaries.salary', '>=', 60000);
    builder.andWhere('salaries.from_date', '>=', '1986-06-26');
    builder.andWhere((builder) =>
      builder.whereIn('first_name', ['Georgi', 'Bob'])
    );
    builder.select(['salaries.salary', 'salaries.from_date']);
    builder.orderBy('salaries.salary', 'desc');
  });

  console.timeEnd('objection');

  console.time('objection-match');

  await Employee.search({
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

  console.timeEnd('objection-match');

  console.time('objection-match #cache');

  await Employee.search({
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

  console.timeEnd('objection-match #cache');

  await knex.destroy();
}

benchmark();
