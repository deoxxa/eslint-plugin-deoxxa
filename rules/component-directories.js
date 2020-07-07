var path = require('path');

var join = require('../lib/join');
var match = require('../lib/match');

module.exports = function (context) {
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

      var dirname = path.basename(path.dirname(context.getFilename()));

      if (dirname !== node.id.name) {
        context.report(node, 'directory name should match component name');
      }
    },
  };
};
