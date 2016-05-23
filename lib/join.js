module.exports = function join(a) {
  if (a.length === 0) {
    return '';
  }

  if (a.length === 1) {
    return a[0];
  }

  return a.slice(0, a.length - 1).join(', ') + ' or ' + a[a.length - 1];
};
