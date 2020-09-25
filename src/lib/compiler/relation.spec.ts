import test from 'ava';

import parser from '../parser';

import Relation from './relation';

test('no relations #1', (t) => {
  const tree = parser.parse(`
    match_all: {
      neq: ["color", "white"],
      match_any: {
        eq: ["owner", "Paul"],
        eq: ["owner", "Dom"],
        eq: ["owner", "Phil"]
      }
    }
  `);

  const { expression: expected } = new Relation(tree);

  const actual = '';

  t.deepEqual(expected, actual);
});

test('top level relations #1', (t) => {
  const tree = parser.parse(`
    match_all: {
      neq: ["shirt.color", "white"],
      match_any: {
        eq: ["shirt.owner", "Paul"],
        eq: ["shirt.owner", "Dom"],
        eq: ["shirt.owner", "Phil"]
      }
    }
  `);

  const { expression: expected } = new Relation(tree);

  const actual = 'shirt';

  t.deepEqual(expected, actual);
});

test('top level relations #2', (t) => {
  const tree = parser.parse(`
    match_all: {
      neq: ["shirt.color", "white"],
      match_any: {
        eq: ["shirt.owner", "Paul"],
        eq: ["department.owner", "Dom"],
        eq: ["employee.number", 1]
      }
    }
  `);

  const { expression: expected } = new Relation(tree);

  const actual = '[shirt,department,employee]';

  t.deepEqual(expected, actual);
});

test('nested relations #1', (t) => {
  const tree = parser.parse(`
    match_all: {
      neq: ["shirt.color", "white"],
      match_any: {
        eq: ["shirt.owner", "Paul"],
        eq: ["department.badge.owner", "Dom"],
        eq: ["employee.owner.number", 1],
        eq: ["department.authority.owner", "Dom"]
      }
    }
  `);

  const { expression: expected } = new Relation(tree);

  const actual = '[shirt,department.[badge,authority],employee.owner]';

  t.deepEqual(actual, expected);
});

test('nested relations #2', (t) => {
  const tree = parser.parse(`
    match_all: {
      neq: ["shirt.color", "white"],
      match_any: {
        eq: ["shirt.owner", "Paul"],
        eq: ["department.badge.owner", "Dom"],
        eq: ["employee.owner.number", 1],
        eq: ["department.authority.hello.owner", "Dom"],
        eq: ["employee.gym.number", "11112"]
      }
    }
  `);

  const { expression: expected } = new Relation(tree);

  const actual =
    '[shirt,department.[badge,authority.hello],employee.[owner,gym]]';

  t.deepEqual(actual, expected);
});
