'use strict'

const log = require('../log')

module.exports = function exitOnError(tag, err, errNo) {
  log.error(tag, err)
  process.exit(errNo)
}