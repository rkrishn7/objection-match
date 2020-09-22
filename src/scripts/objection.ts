import util from 'util';

import Knex from 'knex';
import { Model } from 'objection';

import SearchEngine from '../lib/compiler';

// Initialize knex.
const knex = Knex({
  client: 'mysql',
  useNullAsDefault: true,
  connection: {
    host: 'localhost',
    database: 'employees',
    user: 'root',
    password: 'password',
    debug: false,
  },
});

// Give the knex instance to objection.
Model.knex(knex);

class Department extends Model {
  static get tableName() {
    return 'departments';
  }
}

class Salary extends Model {
  static get tableName() {
    return 'salaries';
  }

  static get relationMappings() {
    return {
      employees: {
        relation: Model.BelongsToOneRelation,
        modelClass: Employee,
        join: {
          from: 'salaries.emp_no',
          to: 'employees.emp_no',
        },
      },
    };
  }
}

class Employee extends Model {
  static get tableName() {
    return 'employees';
  }

  static get relationMappings() {
    return {
      salaries: {
        relation: Model.HasManyRelation,
        modelClass: Salary,
        join: {
          from: 'employees.emp_no',
          to: 'salaries.emp_no',
        },
      },
      departments: {
        relation: Model.HasOneThroughRelation,
        modelClass: Department,
        join: {
          from: 'employees.emp_no',
          through: {
            from: 'dept_emp.emp_no',
            to: 'dept_emp.dept_no',
          },
          to: 'departments.dept_no',
        },
      },
    };
  }
}

async function main() {
  const models = {
    Salary,
    Employee,
    Department,
  };

  const se = new SearchEngine({ models });

  const results = await se.search({
    predicate: `
      match_all: {
        geq: ["salaries.salary", 60000],
        geq: ["salaries.from_date", "1986-06-26"]
      }
    `,
    on: 'employees',
    limit: 50,
  });

  //results;
  console.log(util.inspect(results, false, null, true));

  await knex.destroy();
}

/**
 *
  // Query employees.

  const employees = await Employee.query()
    .modify((builder) => {
      builder.andWhere('salaries.salary', '<=', 60000);
      builder.andWhere('salaries.from_date', '<=', '1986-06-26');
      builder.limit(5);
    })
    .withGraphJoined('salaries');

  console.log(employees.length);
  console.log('employees:', util.inspect(employees, false, null, true));

          eq: ["departments.dept_name", "Marketing"],
        match_any: {
          eq: ["first_name", "Georgi"],
          eq: ["first_name", "Bezalel"]
        }
 */

main();
