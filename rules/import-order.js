module.exports = {
  meta: {
    schema: [
      {
        type: 'object',
        properties: {
          order: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    ],
  },
  create: function(context) {
    const source = context.getSourceCode();
    const text = source.getText();

    let order = [];
    if (context.options && context.options.length > 0) {
      order = context.options[0].order.map(function(e) {
        if (e.indexOf('/') === 0) {
          return new RegExp(e.substr(1, e.length - 2));
        }

        return new RegExp('/^' + e.replace(/([\\\.])/, '\\$1') + '$/');
      });
    }

    function pos(s) {
      for (let i = 0; i < order.length; i++) {
        if (order[i].test(s)) {
          return i;
        }
      }

      return -1;
    }

    function cmp(a, b) {
      if (a[0] < b[0]) { return -1; }
      if (b[0] < a[0]) { return 1; }

      if (a[1].source.value < b[1].source.value) { return -1; }
      if (b[1].source.value < a[1].source.value) { return 1; }

      return 0;
    }

    return {
      ImportDeclaration: function(importNode) {
        const lines = source.getText(importNode).split('\n');
        if (lines.length === 1 && lines[0].length > 80) {
          context.report(importNode, 'import statements should not have lines longer than 80 characters');
        }

        const specifiers = importNode.specifiers.filter(function(e) { return e.type === 'ImportSpecifier'; });
        const sorted = specifiers.slice().sort(function(a, b) {
          switch (true) {
          case a.local.name > b.local.name:
            return 1;
          case b.local.name > a.local.name:
            return -1;
          default:
            return 0;
          }
        });

        sorted.forEach(function(node, correct) {
          const current = specifiers.indexOf(node);

          if (correct !== current) {
            if (correct === 0) {
              context.report({
                node: node,
                message: 'Incorrect import specifier order; {{node}} should come first',
                data: {
                  node: node.local.name,
                },
              });
            } else {
              const before = sorted[correct - 1];
              if (specifiers[current - 1] !== before) {
                context.report({
                  node: node,
                  message: 'Incorrect import specifier order; {{node}} should follow {{follow}}',
                  data: {
                    node: node.local.name,
                    follow: before.local.name,
                  },
                });
              }
            }
          }
        });
      },
      Program: function(programNode) {
        const imports = programNode.body.filter(function(e) {
          return e.type === 'ImportDeclaration';
        }).map(function(importNode) {
          return [ pos(importNode.source.value), importNode ];
        });
        const sorted = imports.slice().sort(cmp);

        sorted.forEach(function(pair, correct) {
          const [ , node ] = pair;

          const current = imports.indexOf(pair);

          if (current === correct) {
            return;
          }

          if (correct === 0) {
            context.report({
              node: node,
              message: 'Incorrect import order; {{node}} should come first',
              data: {
                node: node.source.value,
              },
            });
          } else {
            const before = sorted[correct - 1];
            if (imports[current - 1] !== before) {
              context.report({
                node: node,
                message: 'Incorrect import order; {{node}} should follow {{follow}}',
                data: {
                  node: node.source.value,
                  follow: before[1].source.value,
                },
              });
            }
          }
        });

        sorted.forEach(function(pair, correct) {
          const [ group, node ] = pair;

          const current = imports.indexOf(pair);
          if (current !== correct) {
            return;
          }

          const next = sorted[correct + 1];

          const nl = !next || next[0] !== group;

          if (nl) {
            if (text.substr(node.end, 3) === '\n\n\n' || text.substr(node.end, 2) !== '\n\n') {
              context.report(node, 'should be followed by exactly two new lines');
            }
          } else if (text[node.end] !== '\n') {
            context.report(node, 'should be followed by a new line');
          }
        });
      },
    };
  },
};
