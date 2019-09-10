#!/usr/bin/env node

const fs = require('fs')
const log = require('../log')
const fsutils = require('../utils/fsutils')
const fsconfig = require('../config')
const execSync = require('child_process').execSync

const TAG = '[link]'

class BaseLinker {
  link (options) {
    const nativePath = options.nativePath
    const flutterPath = options.flutterPath

    log.silly(TAG, 'checking platform...')
    let linker
    const projChecker = fsutils.projectChecker(nativePath)
    if (projChecker.isAndroid()) {
      linker = require('../android/link.js')
      fsconfig.updateLocalFlutterPath(nativePath, flutterPath)
    } else if (projChecker.isIOS()) {
      linker = require('../ios/link.js')
      fsconfig.updateLocalFlutterPath(nativePath, flutterPath)
    } else {
      log.error(TAG, '不在native工程内')
      process.exit(1)
    }
    log.silly(TAG, 'linking...')
    linker.link(options)
    log.silly(TAG, 'link process finished')
    log.silly(TAG, 'run packages get...')
    execSync('flutter packages get', {
      stdio: 'inherit',
      cwd: options.flutterPath
    })
    log.info(TAG, 'link success')
  }
}

module.exports = new BaseLinker()
