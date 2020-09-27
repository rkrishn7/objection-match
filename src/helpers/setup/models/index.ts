/**
 * These models and their relations represent the schema found in
 * https://github.com/datacharmer/test_db. You'll need to follow
 * instructions there to create the populated database if you wish
 * to run tests.
 */

import { Model } from 'objection';

import SearchMixin from '../../../lib/plugin';
import knex from '../db';

Model.knex(knex);

export class Department extends Model {
  static get tableName() {
    return 'departments';
  }

  static get idColumn() {
    return 'dept_no';
  }
}

export class Salary extends Model {
  static get tableName() {
    return 'salaries';
  }

  static get idColumn() {
    return ['emp_no', 'from_date'];
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

export class Employee extends SearchMixin({
  enableCache: true,
})(Model) {
  static get tableName() {
    return 'employees';
  }

  static get idColumn() {
    return 'emp_no';
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
