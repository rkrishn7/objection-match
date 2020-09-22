import Knex from 'knex';

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

export default knex;
