module.exports = function match(a, b) {
  if (typeof a !== typeof b) {
    return false;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    // one is null, but not the other
    if (!!a !== !!b) {
      return false;
    }

    for (var k in b) {
      if (!match(a[k], b[k])) {
        return false;
      }
    }

    return true;
  }

  return a === b;
};
