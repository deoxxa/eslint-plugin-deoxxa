var path = require('path');

var join = require('../lib/join');
var match = require('../lib/match');

module.exports = function (context) {
  var parents = null;

  if (context.options && context.options.length > 0) {
    parents = context.options[0].parents;
  }

  return {
    ClassDeclaration: function (node) {
      var isComponent = match(node, {
        type: 'ClassDeclaration',
        id: {
          type: 'Identifier',
        },
        superClass: {
          type: 'Identifier',
          name: 'Component',
        },
      });

      if (!isComponent) {
        return;
      }

      var parent = path.basename(
        path.dirname(path.dirname(context.getFilename()))
      );

      if (parents) {
        if (parents.indexOf(parent) === -1) {
          context.report(node, 'parent directory should be ' + join(parents));
        }
      }
    },
  };
};

module.exports.schema = [
  {
    type: 'object',
    properties: {
      parents: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  },
];
