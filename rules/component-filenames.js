var path = require('path');

var join = require('../lib/join');
var match = require('../lib/match');

module.exports = function (context) {
  var filenames = null;

  if (context.options && context.options.length > 0) {
    filenames = context.options[0].filenames;
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

      var filename = path.basename(context.getFilename());

      if (filenames) {
        if (filenames.indexOf(filename) === -1) {
          context.report(node, 'filename should be ' + join(filenames));
        }
      }
    },
  };
};

module.exports.schema = [
  {
    type: 'object',
    properties: {
      filenames: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  },
];
