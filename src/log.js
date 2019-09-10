'use strict'

const util = require('util')
const log = require('npmlog')

log.stream = process.stdout

// adapt console.*
const slice = Array.prototype.slice
const oldConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error
}

function _apply (args, key) {
  args = slice.call(args)
  log.record.push({
    level: '',
    prefix: '',
    message: util.format.apply(util, args)
  })
  oldConsole[key].apply(console, args)
}

console.log = function () {
  _apply(arguments, 'log')
}
console.info = function () {
  _apply(arguments, 'info')
}
console.warn = function () {
  _apply(arguments, 'warn')
}
console.error = function () {
  _apply(arguments, 'error')
}

// adapter
log.Adapter = function (prefix) {
  return {
    verbose: function () {
      return log.verbose.apply(
        log,
        ['[' + prefix + ']'].concat(slice.call(arguments))
      )
    },
    info: function () {
      return log.info.apply(
        log,
        ['[' + prefix + ']'].concat(slice.call(arguments))
      )
    },
    warn: function () {
      return log.warn.apply(
        log,
        ['[' + prefix + ']'].concat(slice.call(arguments))
      )
    },
    error: function () {
      return log.error.apply(
        log,
        ['[' + prefix + ']'].concat(slice.call(arguments))
      )
    }
  }
}

module.exports = log
