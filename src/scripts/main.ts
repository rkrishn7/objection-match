import util from 'util';

import parser from '../lib/parser';

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
  const parsed = parser.parse(`
  match_all: {
    neq: ["shirt.color", "white"],
    match_any: {
      eq: ["shirt.owner", "Paul"],
      eq: ["shirt.owner", "Dom"],
      eq: ["shirt.owner", "Phil"]
    }
  }
  `);

  console.log(util.inspect(parsed, false, null, true));
}

main();
