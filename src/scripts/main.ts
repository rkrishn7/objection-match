// import util from 'util';

// import Compiler from '../lib/compiler';
import SearchEngine from '../lib/searchEngine';
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

  const se = new SearchEngine({});

  se.search({
    predicate: `
    match_all: {
      eq: ["children.pets.paws.color", "Antonio"],
      neq: ["children.family.ethnicity", "white"],
      match_any: {
        eq: ["children.pets.coat", "polo"],
        eq: ["children.name", "dress"]
      }
    }
  `,
    find: 'world.*',
  });
}

main();
