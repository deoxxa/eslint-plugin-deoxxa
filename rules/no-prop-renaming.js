var match = require('../lib/match');

module.exports = function (context) {
  return {
    JSXAttribute: function (node) {
      var passthrough = match(node, {
        type: 'JSXAttribute',
        name: {
          type: 'JSXIdentifier',
        },
        value: {
          type: 'JSXExpressionContainer',
          expression: {
            type: 'MemberExpression',
            object: {
              type: 'MemberExpression',
              object: { type: 'ThisExpression' },
              property: { type: 'Identifier', name: 'props' },
            },
            property: { type: 'Identifier' },
          },
        },
      });

      if (!passthrough) {
        return;
      }

      var leftSide = node.name.name;
      var rightSide = node.value.expression.property.name;

      if (leftSide !== rightSide) {
        context.report(node, 'prop ' + rightSide + ' passed as ' + leftSide);
      }
    },
  };
};
