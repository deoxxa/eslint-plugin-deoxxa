const path = require('path');
const rule = require('../../../rules/import-order');
const RuleTester = require('eslint').RuleTester;

const options = [
  {
    order: [
      '/^lib\\//',
      '/^ducks\\/?/',
      '/^containers\\//',
      '/^components\\//',
      '/^images\\//',
      '/^\\.\\.?\\/[A-Z]/',
      '/^\\.\\.?\\//',
    ],
  },
];

function gen(groups) {
  return groups
    .map(
      (group) =>
        group
          .map((line) =>
            [
              'import ',
              line[0],
              line[0] && line[1].length ? ', ' : '',
              line[1].length ? '{ ' : '',
              line[1]
                .map((specifier) =>
                  specifier.length === 1
                    ? specifier[0]
                    : specifier[0] + ' as ' + specifier[1]
                )
                .join(', '),
              line[1].length ? ' } ' : '',
              ' from ',
              "'" + line[2] + "'",
              ';',
            ].join('')
          )
          .join('\n') + '\n\n'
    )
    .join('');
}

function outdent(s) {
  const arr = s.split('\n');

  let indent = null;

  for (const line of arr) {
    if (line.match(/^\s+$/)) {
      continue;
    }

    const m = line.match(/^\s+/);
    if (!m) {
      continue;
    }

    const l = m[0].length;
    if (typeof indent !== 'number' || l < indent) {
      indent = l;
    }
  }

  if (indent === null) {
    return s;
  }

  return arr
    .map((e) => e.replace(new RegExp('^' + ' '.repeat(indent)), ''))
    .join('\n');
}

const test = {
  valid: [
    // ---
    // files
    // ---
    {
      options,
      code: gen([
        [
          ['X', [], 'x'],
          ['Y', [], 'y'],
        ],
      ]),
    },
    // ---
    // specifiers
    // ---
    {
      options,
      code: gen([
        [
          ['X', [['x1'], ['x2']], 'x'],
          ['Y', [['y1'], ['y2']], 'y'],
        ],
      ]),
    },
    // ---
    // groups
    // ---
    {
      options,
      code: gen([
        [
          ['X', [], 'x'],
          ['Y', [], 'y'],
        ],
        [
          ['libX', [], 'lib/x'],
          ['libY', [], 'lib/y'],
        ],
        [
          ['ducksX', [], 'ducks/x'],
          ['type DucksX', [], 'ducks/x'],
          ['ducksY', [], 'ducks/y'],
          ['type DucksY', [], 'ducks/y'],
        ],
      ]),
    },
  ],
  invalid: [
    // ---
    // files
    // ---
    {
      options,
      code: gen([
        [
          ['Y', [], 'y'],
          ['X', [], 'x'],
        ],
      ]),
      output: gen([
        [
          ['X', [], 'x'],
          ['Y', [], 'y'],
        ],
      ]),
      errors: [
        'Incorrect import order; y value import should be in position 1',
        'Incorrect file import order; should be x, y',
        'Incorrect import order; x value import should be in position 0',
      ],
    },
    {
      options,
      code: gen([
        [
          ['Z', [], 'z'],
          ['Y', [], 'y'],
          ['X', [], 'x'],
        ],
      ]),
      output: gen([
        [
          ['X', [], 'x'],
          ['Y', [], 'y'],
          ['Z', [], 'z'],
        ],
      ]),
      errors: [
        'Incorrect import order; z value import should be in position 2',
        'Incorrect file import order; should be x, y, z',
        'Incorrect import order; x value import should be in position 0',
      ],
    },
    {
      options,
      code: gen([
        [
          ['Z', [], 'z'],
          ['Y', [], 'y'],
          ['X', [], 'x'],
          ['W', [], 'w'],
        ],
      ]),
      output: gen([
        [
          ['W', [], 'w'],
          ['X', [], 'x'],
          ['Y', [], 'y'],
          ['Z', [], 'z'],
        ],
      ]),
      errors: [
        'Incorrect import order; z value import should be in position 3',
        'Incorrect file import order; should be w, x, y, z',
        'Incorrect import order; y value import should be in position 2',
        'Incorrect import order; x value import should be in position 1',
        'Incorrect import order; w value import should be in position 0',
      ],
    },
    // ---
    // types
    // ---
    {
      options,
      code: gen([
        [
          ['type XType', [], 'x'],
          ['XValue', [], 'x'],
        ],
      ]),
      output: gen([
        [
          ['XValue', [], 'x'],
          ['type XType', [], 'x'],
        ],
      ]),
      errors: [
        'Incorrect import order; x type import should be in position 1',
        'Incorrect file import order; should be x value, x type',
        'Incorrect import order; x value import should be in position 0',
      ],
    },
    // ---
    // specifiers
    // ---
    {
      options,
      code: gen([[['X', [['x2'], ['x1']], 'x']]]),
      output: gen([[['X', [['x1'], ['x2']], 'x']]]),
      errors: [
        'Incorrect import specifier order; should be x1, x2',
        'Incorrect import specifier order; x2 should be in position 1',
        'Incorrect import specifier order; x1 should be in position 0',
      ],
    },
    {
      options,
      code: gen([[['X', [['x3'], ['x2'], ['x1']], 'x']]]),
      output: gen([[['X', [['x1'], ['x2'], ['x3']], 'x']]]),
      errors: [
        'Incorrect import specifier order; should be x1, x2, x3',
        'Incorrect import specifier order; x3 should be in position 2',
        'Incorrect import specifier order; x1 should be in position 0',
      ],
    },
    {
      options,
      code: gen([[['X', [['x4'], ['x3'], ['x2'], ['x1']], 'x']]]),
      output: gen([[['X', [['x1'], ['x2'], ['x3'], ['x4']], 'x']]]),
      errors: [
        'Incorrect import specifier order; should be x1, x2, x3, x4',
        'Incorrect import specifier order; x4 should be in position 3',
        'Incorrect import specifier order; x3 should be in position 2',
        'Incorrect import specifier order; x2 should be in position 1',
        'Incorrect import specifier order; x1 should be in position 0',
      ],
    },
    {
      options,
      code: gen([
        [
          [
            'X',
            [
              ['x2', 'y2'],
              ['x1', 'y1'],
            ],
            'x',
          ],
        ],
      ]),
      output: gen([
        [
          [
            'X',
            [
              ['x1', 'y1'],
              ['x2', 'y2'],
            ],
            'x',
          ],
        ],
      ]),
      errors: [
        'Incorrect import specifier order; should be x1 as y1, x2 as y2',
        'Incorrect import specifier order; y2 should be in position 1',
        'Incorrect import specifier order; y1 should be in position 0',
      ],
    },
    {
      options,
      code: gen([
        [
          [
            'X',
            [
              ['x1', 'y2'],
              ['x2', 'y1'],
            ],
            'x',
          ],
        ],
      ]),
      output: gen([
        [
          [
            'X',
            [
              ['x2', 'y1'],
              ['x1', 'y2'],
            ],
            'x',
          ],
        ],
      ]),
      errors: [
        'Incorrect import specifier order; should be x2 as y1, x1 as y2',
        'Incorrect import specifier order; y2 should be in position 1',
        'Incorrect import specifier order; y1 should be in position 0',
      ],
    },
    {
      options,
      code: gen([
        [
          [
            'X',
            [
              ['x1', 'y3'],
              ['x2', 'y2'],
              ['x3', 'y1'],
            ],
            'x',
          ],
        ],
      ]),
      output: gen([
        [
          [
            'X',
            [
              ['x3', 'y1'],
              ['x2', 'y2'],
              ['x1', 'y3'],
            ],
            'x',
          ],
        ],
      ]),
      errors: [
        'Incorrect import specifier order; should be x3 as y1, x2 as y2, x1 as y3',
        'Incorrect import specifier order; y3 should be in position 2',
        'Incorrect import specifier order; y1 should be in position 0',
      ],
    },
    {
      options,
      code: gen([
        [
          [
            'X',
            [
              ['x1', 'y4'],
              ['x2', 'y3'],
              ['x3', 'y2'],
              ['x4', 'y1'],
            ],
            'x',
          ],
        ],
      ]),
      output: gen([
        [
          [
            'X',
            [
              ['x4', 'y1'],
              ['x3', 'y2'],
              ['x2', 'y3'],
              ['x1', 'y4'],
            ],
            'x',
          ],
        ],
      ]),
      errors: [
        'Incorrect import specifier order; should be x4 as y1, x3 as y2, x2 as y3, x1 as y4',
        'Incorrect import specifier order; y4 should be in position 3',
        'Incorrect import specifier order; y3 should be in position 2',
        'Incorrect import specifier order; y2 should be in position 1',
        'Incorrect import specifier order; y1 should be in position 0',
      ],
    },
    // ---
    // groups
    // ---
    {
      options,
      code: outdent(`
        import X from 'x';   import Y from 'y';
        class C {}
      `),
      output: outdent(`
        import X from 'x';
           import Y from 'y';

        class C {}
      `),
      errors: [
        'x value import should be followed by exactly 1 new line(s); found 0',
        'y value import should be followed by exactly 2 new line(s); found 1',
      ],
    },
    {
      options,
      code: outdent(`
        import X from 'x';
        import Y from 'y';
        import libX from 'lib/x';
        import libY from 'lib/y';
        class C {}
      `),
      output: outdent(`
        import X from 'x';
        import Y from 'y';

        import libX from 'lib/x';
        import libY from 'lib/y';

        class C {}
      `),
      errors: [
        'y value import should be followed by exactly 2 new line(s); found 1',
        'lib/y value import should be followed by exactly 2 new line(s); found 1',
      ],
    },
    {
      options,
      code: outdent(`
        import X from 'x';
        import libX from 'lib/x';
        import Y from 'y';
        import libY from 'lib/y';
        class C {}
      `),
      output: outdent(`
        import X from 'x';
        import Y from 'y';
        import libX from 'lib/x';
        import libY from 'lib/y';
        class C {}
      `),
      errors: [
        'Incorrect file import order; should be x, y, lib/x, lib/y',
        'Incorrect import order; lib/x value import should be in position 2',
        'Incorrect import order; y value import should be in position 1',
        'lib/y value import should be followed by exactly 2 new line(s); found 1',
      ],
    },
  ],
};

const ruleTester = new RuleTester({
  parser: require.resolve('@babel/eslint-parser'),
});

ruleTester.run('import-order', rule, test);
