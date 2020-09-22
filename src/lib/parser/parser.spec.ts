import test from 'ava';

import parser from './index';

test('throws error #1', (t) => {
  t.throws(() => parser.parse(``));
});

test('simple query #1', (t) => {
  const parsed = parser.parse(`eq: ["person.age", 54]`);

  t.deepEqual(parsed, {
    type: 'comparison',
    fn: 'eq',
    args: { identifier: 'person.age', value: 54 },
  });
});

test('simple query #2', (t) => {
  const parsed = parser.parse(`
    match_all: {}
  `);

  t.deepEqual(parsed, {
    type: 'logical',
    fn: 'match_all',
    constraints: [],
  });
});

test('simple query #3', (t) => {
  const parsed = parser.parse(`
    match_all: {
      neq: ["shirt.color", "white"]
    }
  `);

  t.deepEqual(parsed, {
    type: 'logical',
    fn: 'match_all',
    constraints: [
      {
        type: 'comparison',
        fn: 'neq',
        args: { identifier: 'shirt.color', value: 'white' },
      },
    ],
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
    type: 'logical',
    fn: 'match_all',
    constraints: [
      {
        type: 'comparison',
        fn: 'neq',
        args: { identifier: 'shirt.color', value: 'white' },
      },
      {
        type: 'logical',
        fn: 'match_any',
        constraints: [
          {
            type: 'comparison',
            fn: 'eq',
            args: { identifier: 'shirt.owner', value: 'Paul' },
          },
          {
            type: 'comparison',
            fn: 'eq',
            args: { identifier: 'shirt.owner', value: 'Dom' },
          },
          {
            type: 'comparison',
            fn: 'eq',
            args: { identifier: 'shirt.owner', value: 'Phil' },
          },
        ],
      },
    ],
  });
});
