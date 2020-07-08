module.exports = {
  meta: {
    fixable: true,
    schema: [
      {
        type: "object",
        properties: {
          maxLength: { type: "number" },
          order: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    ],
  },
  create: function (context) {
    const source = context.getSourceCode();
    const text = source.getText();

    let order = [];
    let maxLength = 80;

    if (context.options && context.options.length > 0) {
      order = context.options[0].order.map(function (e) {
        if (e.indexOf("/") === 0) {
          return new RegExp(e.substr(1, e.length - 2));
        }

        return new RegExp("/^" + e.replace(/([\\\.])/, "\\$1") + "$/");
      });

      if (typeof context.options[0].maxLength === "number") {
        maxLength = context.options[0].maxLength;
      }
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
      if (a[0] < b[0]) {
        return -1;
      }
      if (b[0] < a[0]) {
        return 1;
      }

      if (a[1].source.value < b[1].source.value) {
        return -1;
      }
      if (b[1].source.value < a[1].source.value) {
        return 1;
      }

      if (a[1].importKind === "value" && b[1].importKind === "type") {
        return -1;
      }
      if (b[1].importKind === "value" && a[1].importKind === "type") {
        return 1;
      }

      return 0;
    }

    return {
      ImportDeclaration: function (importNode) {
        if (typeof maxLength === "number" && maxLength > 0) {
          const lines = source.getText(importNode).split("\n");
          if (
            lines.length === 1 &&
            (importNode.specifiers.length > 1 ||
              (importNode.specifiers.length > 0 &&
                importNode.specifiers[0].type !== "ImportDefaultSpecifier")) &&
            lines[0].length > maxLength
          ) {
            context.report({
              node: importNode,
              message: `import statements should not have lines longer than ${maxLength} characters`,
            });
          }

          if (
            lines.length > 1 &&
            source
              .getText(importNode)
              .replace(/\s+/g, " ")
              .replace(/,\s+\}/, " }").length <= maxLength
          ) {
            context.report({
              node: importNode,
              message: `import statements should be on one line if they fit into ${maxLength} characters`,
            });
          }
        }

        const specifiers = importNode.specifiers.filter(function (e) {
          return e.type === "ImportSpecifier";
        });
        const sorted = specifiers.slice().sort(function (a, b) {
          switch (true) {
            case a.local.name > b.local.name:
              return 1;
            case b.local.name > a.local.name:
              return -1;
            default:
              return 0;
          }
        });

        let hasErrors = false;

        sorted.forEach(function (node, correct) {
          const current = specifiers.indexOf(node);
          if (current === correct) {
            return;
          }

          hasErrors = true;

          context.report({
            node: node,
            message:
              "Incorrect import specifier order; {{node}} should be in position {{position}}",
            data: {
              node: node.local.name,
              position: correct,
            },
          });
        });

        if (hasErrors) {
          context.report({
            node: importNode,
            message:
              "Incorrect import specifier order; should be {{correctOrder}}",
            data: {
              correctOrder: sorted.map((e) => source.getText(e)).join(", "),
            },
            fix: function fix(fixer) {
              return specifiers.map((replaceThis, index) => {
                const replaceWith = sorted[index];
                return fixer.replaceText(
                  replaceThis,
                  source.getText(replaceWith)
                );
              });
            },
          });
        }
      },
      Program: function (programNode) {
        const imports = programNode.body
          .filter(function (e) {
            return e.type === "ImportDeclaration";
          })
          .map(function (importNode) {
            return [pos(importNode.source.value), importNode];
          });
        const sorted = imports.slice().sort(cmp);

        const misplaced = imports.filter(function(pair) {
          return imports.indexOf(pair) !== sorted.indexOf(pair);
        });

        let hasErrors = false;
        let hasTypes = false;

        misplaced.forEach(function(pair) {
          var current = imports.indexOf(pair);
          var correct = sorted.indexOf(pair);

          hasErrors = true;

          const [, node] = pair;

          if (node.importKind === "type") {
            hasTypes = true;
          }

          context.report({
            node: node,
            message:
              "Incorrect import order; {{node}} {{nodeKind}} import should be in position {{position}}",
            data: {
              node: node.source.value,
              nodeKind: node.importKind,
              position: correct,
            },
          });
        });

        if (hasErrors) {
          context.report({
            node: programNode,
            message: "Incorrect file import order; should be {{correct}}",
            data: {
              correct: sorted
                .map((e) =>
                  hasTypes
                    ? e[1].source.value + " " + e[1].importKind
                    : e[1].source.value
                )
                .join(", "),
            },
            fix: function fix(fixer) {
              const fixes = [];

              imports.forEach((replaceThis, index) => {
                const replaceWith = sorted[index];

                fixes.push(fixer.replaceText(
                  replaceThis[1],
                  source.getText(replaceWith[1])
                ));
              });

              return fixes;
            },
          });
        }

        sorted.forEach(function (pair, correct) {
          const [group, node] = pair;

          const current = imports.indexOf(pair);
          if (current !== correct) {
            return;
          }

          const next = sorted[correct + 1];

          const boundary = !next || next[0] !== group;
          const expected = boundary ? 2 : 1;

          let count = 0;
          while (text[node.range[1] + count] === "\n") {
            count++;
          }

          if (count !== expected) {
            context.report({
              node: node,
              message:
                "{{node}} {{nodeKind}} import should be followed by exactly {{expected}} new line(s); found {{count}}",
              data: {
                node: node.source.value,
                nodeKind: node.importKind,
                expected: expected,
                count: count,
              },
              fix: function fix(fixer) {
                const fixes = [];
                if (count < expected) {
                  fixes.push(fixer.insertTextAfter(node, "\n"));
                } else {
                  fixes.push(
                    fixer.removeRange([
                      node.range[1] + count - expected,
                      node.range[1] + count,
                    ])
                  );
                }
                return fixes;
              },
            });
          }
        });
      },
    };
  },
};
