const path = require('path')

function hasTagConfig (config, version) {
  return version && version.tag && config[version.tag]
}

function condi (config, version, name) {
  let content
  if (hasTagConfig(config, version)) {
    content = config[version.tag][name]
  }
  if (!content) {
    content = config[name]
  }
  return content
}
function pubspec (config, version) {
  return condi(config, version, 'pubspec')
}

function android (config, version) {
  return condi(config, version, 'android')
}

function ios (config, version) {
  return condi(config, version, 'ios')
}

function dart (config, version) {
  return condi(config, version, 'dart')
}

function gradle (config, version) {
  return condi(config, version, 'gradle')
}

function resolveVar (condi, vEnv) {
  Object.keys(vEnv).forEach(k => {
    condi = condi.replace(`\$\{${k}\}`, vEnv[k])
  })
  return condi
}

module.exports = {
  pubspec,
  android,
  ios,
  dart,
  gradle,
  resolveVar
}
