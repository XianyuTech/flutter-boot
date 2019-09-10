'use strict'

const path = require('path')
const spawn = require('child_process').spawn
const execSync = require('child_process').execSync

const BUILDER_REG = /^(@ali\/)?builder-[a-zA-Z0-9_-]+$/
const GENERATOR_REG = /^(@ali\/)?generator-[a-zA-Z0-9_-]+$/
const PLUGIN_REG = /^(@ali\/)?def-plugin-[a-zA-Z0-9_-]+$/
const MOD_REG = /^(@ali\/)?def-[a-zA-Z0-9_-]+$/
const KIT_REG = /^(@ali\/)?def-kit-[a-zA-Z0-9_-]+$/

const REG = /^(@ali\/)?(builder|generator|def-kit|def-plugin|def)-([-_a-zA-Z0-9]+)$/

const util = (module.exports = {})

util.spawnCommand = function (command, args, options) {
  var win32 = process.platform === 'win32'

  var winCommand = win32 ? 'cmd' : command
  var winArgs = win32 ? ['/c'].concat(command, args) : args

  return spawn(winCommand, winArgs, options)
}

util.getStrictSSL = function () {
  try {
    var strictSSL = execSync('npm config get strict-ssl')
      .toString()
      .trim()
    return strictSSL !== 'false'
  } catch (err) {
    console.error('exec npm config get strict-ssl ERROR: ' + err.message)
    return true
  }
}

util.getIgnoreScripts = function () {
  try {
    var ignoreScripts = execSync('npm config get ignore-scripts')
      .toString()
      .trim()
    return ignoreScripts === 'true'
  } catch (err) {
    console.error('exec npm config get ignore-scripts ERROR: ' + err.message)
    return false
  }
}

util.getPython = function () {
  try {
    return execSync('npm config get python')
      .toString()
      .trim()
  } catch (err) {
    console.error('exec npm config get python ERROR:' + err.message)
  }
  return ''
}

util.getMsvsVersion = function () {
  try {
    return execSync('npm config get msvs_version')
      .toString()
      .trim()
  } catch (err) {
    console.error('exec npm config get msvs_version ERROR:' + err.message)
  }
  return ''
}

util.generatePath = function (m, suffix, flatten) {
  if (flatten) {
    return path.join(m, suffix || '')
  }
  return path.join(m, 'node_modules', m, suffix || '')
}

util.info = function (n) {
  let m = n.match(REG)
  if (!m) {
    return {
      name: n,
      type: 'unknown'
    }
  }

  let name = m[3]
  let type = m[2]
  if (type == 'def' || type == 'def-plugin') {
    type = 'plugin'
  } else if (type == 'def-kit') {
    type = 'kit'
  }
  return {
    name: name,
    type: type
  }
}

util.isGenerator = function (m) {
  return GENERATOR_REG.test(m)
}
util.isBuilder = function (m) {
  return BUILDER_REG.test(m)
}
util.isPlugin = function (m) {
  let c = PLUGIN_REG.test(m)
  if (!c) {
    c = MOD_REG.test(m) && !KIT_REG.test(m)
  }
  return c
}
util.isKit = function (m) {
  return KIT_REG.test(m)
}
util.type = function (m) {
  let t = ''
  if (this.isGenerator(m)) {
    t = 'generator'
  } else if (this.isBuilder(m)) {
    t = 'builder'
  } else if (this.isPlugin(m)) {
    t = 'plugin'
  } else if (this.isKit(m)) {
    t = 'kit'
  }
  return t
}
util.suffix = function (m) {
  if (PLUGIN_REG.test(m)) {
    return m.replace('@ali/def-plugin-', '')
  } else if (KIT_REG.test(m)) {
    return m.replace('@ali/def-kit-', '')
  } else if (MOD_REG.test(m)) {
    return m.replace('def-', '').replace('@ali/', '')
  } else if (BUILDER_REG.test(m)) {
    return m.replace()
  }
}

util.parseJSON = function (str) {
  return require('json-parse-helpfulerror').parse(str)
}
