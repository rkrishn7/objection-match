import test from 'ava';

import parser from './index';

test('throws error #1', (t) => {
  t.throws(() => parser.parse(``));
});

test('simple query #1', (t) => {
  const parsed = parser.parse(`
    match_all: {}
  `);

  t.deepEqual(parsed, {
    predicate: 'match_all',
    constraints: [],
  });
});

test('simple query #2', (t) => {
  const parsed = parser.parse(`
    match_all: {
      neq: ["shirt.color", "white"]
    }
  `);

  t.deepEqual(parsed, {
    predicate: 'match_all',
    constraints: [{ op: 'neq', value: { key: 'shirt.color', value: 'white' } }],
  });
});

test('recursive query #1', (t) => {
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

  t.deepEqual(parsed, {
    predicate: 'match_all',
    constraints: [
      { op: 'neq', value: { key: 'shirt.color', value: 'white' } },
      {
        predicate: 'match_any',
        constraints: [
          { op: 'eq', value: { key: 'shirt.owner', value: 'Paul' } },
          { op: 'eq', value: { key: 'shirt.owner', value: 'Dom' } },
          { op: 'eq', value: { key: 'shirt.owner', value: 'Phil' } },
        ],
      },
    ],
  });
});
