module.exports = {
  rules: {
    'no-prop-renaming': require('./rules/no-prop-renaming'),
    'component-directories': require('./rules/component-directories'),
    'component-filenames': require('./rules/component-filenames'),
    'component-parents': require('./rules/component-parents'),
  },
  rulesConfig: {
    'no-prop-renaming': 0,
  },
};
