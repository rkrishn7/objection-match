import util from 'util';

import knex from '../helpers/setup/db';
import { Employee } from '../helpers/setup/models';

async function main() {
  const results = await Employee.search({
    predicate: `
      match_all: {
        geq: ["salaries.salary", 60000],
        geq: ["salaries.from_date", "1986-06-26"]
      }
    `,
    limit: 50,
  });

  //results;
  console.log(util.inspect(results, false, null, true));

  await knex.destroy();
}

main();
