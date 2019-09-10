module.exports = function isNull (v) {
  if (v === 'null' || v === 'undefined') {
    return true
  }
  return !v
}
