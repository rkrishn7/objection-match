import util from 'util';

import { initialize } from 'objection';

import knex from '../helpers/setup/db';
import { Department, Employee, Salary } from '../helpers/setup/models';

async function main() {
  await initialize([Department, Employee, Salary]);

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

  //results;
  console.log(util.inspect(results, false, null, true));

  const results2 = await Employee.search({
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

  //results;
  console.log(util.inspect(results2, false, null, true));

  await knex.destroy();
}

main();
