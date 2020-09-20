// import util from 'util';

import Compiler from '../lib/compiler';
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
  const compiler = new Compiler(
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
  const compiled = compiler.compile();

  console.log(compiled);
}

main();
