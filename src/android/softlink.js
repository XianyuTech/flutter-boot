const log = require('../log')
const path = require('path')
const fs = require('fs')
const fsutils = require('../utils/fsutils')
const TAG = '[softlink]'

function softlink (options) {
  var flutterPath = options.flutterPath
  var nativePath = options.nativePath
  log.info(TAG, `flutterPath: ${flutterPath}; nativePath: ${nativePath}`)
  configAndroidHost(nativePath)
  fsutils.createSoftLink(path.join(flutterPath, 'android'), nativePath)
}

/**
 * 配置native业务工程
 */
function configAndroidHost(nativePath) {
  let injection = "def flutterPluginVersion = 'managed' \n\n";
  let filePath = path.join(nativePath, 'app/build.gradle')
  let rawdata = fs.readFileSync(filePath, 'utf8')
  if (!rawdata.includes(injection)) {
    const content = injection + rawdata
    fs.writeFileSync(filePath, content)
    console.log('Patch:' + injection)
  }
}

module.exports = {
  softlink
}
