// import util from 'util';

// import Compiler from '../lib/compiler';
import SearchEngine from '../lib/compiler';
// import parser from '../lib/parser';

/**
 * match_all: {
      neq: ["shirt.color", "white"],
      match_any: {
        eq: ["shirt.owner", "Paul"],
        eq: ["shirt.owner", "Dom"],
        eq: ["shirt.owner", "Phil"],
      }
    }
 */

function main() {
  /*const compiler = new Compiler(
    {
      predicate: `
      match_all: {
        eq: ["person.name", "Antonio"],
        neq: ["shirt.color", "white"],
        match_any: {
          eq: ["shirt.style", "polo"],
          eq: ["shirt.style", "dress"]
        }
      }
    `,
      find: 'shirt.*',
    },
    {
      person: {
        join: {
          with: 'shirt',
          on: 'shirt.owner = person.id',
        },
      },
    }
  );
  const compiled = compiler.compile();*/

  const se = new SearchEngine({ models: null });

  se.search({
    predicate: `
    match_all: {
      geq: ["salaries.salary", 60000],
      geq: ["salaries.from_date", "1986-06-26"]
    }
  `,
    on: 'employees',
  });
}

main();
