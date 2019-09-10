const path = require('path')

function absolutePath (input, base) {
  if (!path.isAbsolute(input)) {
    input = path.resolve(base, input)
  }
  return input
}

module.exports = {
  absolutePath
}
