const log = require('../log')
const path = require('path')
const fs = require('fs')
const fsutils = require('../utils/fsutils')
const TAG = '[AndroidChecker]'

const FLAG_ANDROIDX_1 = 'android.useAndroidX=true'
const FLAG_ANDROIDX_2 = 'android.enableJetifier=true'

class checker {

  checker () {
    this.flutterPath = ''
    this.nativePath = ''
  }

  flutterGradleProperties () {
    return path.join(this.flutterPath, '.android/gradle.properties')
  }

  nativeGradleProperties () {
    return path.join(this.nativePath, 'gradle.properties')
  }

  check(options) {
    this.flutterPath = options.flutterPath
    this.nativePath = options.nativePath
    var checkResult = this.checkAndroidX()
    if (!checkResult) {
      return checkResult
    }
    log.info(TAG, 'android check passed!!!')
    return checkResult
  }

  checkAndroidX() {
    var nativeAndroidX = this.isSupportAndroidX(this.nativeGradleProperties())
    var flutterAndroidX = this.isSupportAndroidX(this.flutterGradleProperties())
    if (nativeAndroidX != flutterAndroidX) {
      if (!nativeAndroidX) {
        log.error(TAG, 'check androidx failed: ' + this.nativePath + ' not support AndroidX!')
      } else if (!flutterAndroidX) {
        log.error(TAG, 'check androidx failed: ' + this.flutterPath + ' not support AndroidX!')
      }
      return false
    }
    return true
  }

  isSupportAndroidX(gradlePropertiesPath) {
    if (!fs.existsSync(gradlePropertiesPath)) {
      return false
    }
    let rawdata = fs.readFileSync(gradlePropertiesPath, 'utf8')
    return rawdata.includes(FLAG_ANDROIDX_1) && rawdata.includes(FLAG_ANDROIDX_2)
  }
}

module.exports = new checker()
