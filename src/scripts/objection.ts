import util from 'util';

import knex from '../helpers/setup/db';
import { Employee } from '../helpers/setup/models';

async function main() {
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

  await knex.destroy();
}

main();
