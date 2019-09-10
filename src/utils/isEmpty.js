const typof = require('./typof')
const isNull = require('./isNull')
module.exports = function isEmpty (v) {
  if (isNull(v)) {
    return true
  } else {
    const type = typof(v)
    if (type === 'object') {
      return Object.keys(v).length === 0
    } else if (type === 'array' || type === 'string') {
      return v.length === 0
    }
    return false
  }
}
