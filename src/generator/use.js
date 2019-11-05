const fs = require('fs')
const path = require('path')
const pubspecHelper = require('../utils/pubspecHelper')
const marketConfigHelper = require('../utils/marketConfigHelper')
const execSync = require('child_process').execSync
const fsutils = require('../utils/fsutils')
const execUtils = require('../utils/execUtils')
const log = require('../log')

const TAG = '[use]'

class GeneratorUse {
  async use (options) {
    const depName = options.depName
    const config = this.depConfig(depName)
    const version = options.version
      ? config.support_version[options.version]
      : undefined
    const flutterPath = options.flutterPath
    const nativePath = options.nativePath
    const pubspecConfig = marketConfigHelper.pubspec(config, version)
    const androidConfig = marketConfigHelper.android(config, version)
    const iosConfig = marketConfigHelper.ios(config, version)
    const dartConfig = marketConfigHelper.dart(config, version)
    const gradleConfig = marketConfigHelper.gradle(config, version)
    pubspecHelper.addDep(flutterPath, pubspecConfig)
    execSync('flutter packages get', {
      stdio: 'inherit',
      cwd: options.flutterPath
    })

    const projChecker = fsutils.projectChecker(nativePath)

    const vEnv = {
      FLUTTER_PATH: flutterPath,
      PROJECT_NAME: projChecker.getProjectName()
    }

    if (projChecker.isAndroid()) {
      vEnv.ANDROID_PATH = nativePath
      let targetPath = androidConfig.targetPath
      targetPath = marketConfigHelper.resolveVar(nativePath, vEnv)
      log.silly(TAG, `android target path:${targetPath}`)
      await this.copyTpl('android', depName, targetPath)

      if (gradleConfig) {
        this.injectGradle(projChecker.gradlePath(), gradleConfig)
      }
    } else if (projChecker.isIOS()) {
      vEnv.IOS_PATH = nativePath
      let targetPath = iosConfig.targetPath
      targetPath = marketConfigHelper.resolveVar(nativePath, vEnv)
      log.silly(TAG, `ios target path:${targetPath}`)
      await this.copyTpl('ios', depName, targetPath)
      execUtils.execRubySync('add_ios_tpl.rb', [
        projChecker.xcodeproj(),
        targetPath
      ])
    }
    if (dartConfig) {
      let targetPath = dartConfig.targetPath
      targetPath = marketConfigHelper.resolveVar(flutterPath, vEnv)
      log.silly(TAG, `flutter target path:${targetPath}`)
      await this.copyTpl('dart', depName, targetPath)
    }

    if (projChecker.isIOS()) {
      execSync('pod update --no-repo-update', {
        stdio: 'inherit',
        cwd: nativePath
      })
    }
  }

  depConfig (depName) {
    return JSON.parse(
      fs.readFileSync(
        path.join(process.env.FB_DIR, 'src/market', depName, 'config.json'),
        'utf-8'
      )
    )
  }

  supportList (depName) {
    const config = this.depConfig(depName)
    if (config.support_version) {
      return Object.keys(config.support_version)
    } else {
      return undefined
    }
  }

  tplfile (platform, packageName) {
    const tplPath = path.join(
      process.env.FB_DIR,
      'src',
      'market',
      packageName,
      'tpl',
      platform
    )
    log.silly(TAG, `tpl path:${tplPath}`)
    return tplPath
  }

  async copyTpl (platform, packageName, targetPath) {
    await fsutils
      .copyFolderAsync(this.tplfile(platform, packageName), targetPath, {
        mkdes: true
      })
      .catch(e => {
        log.error(TAG, `copy error:${e}`)
      })
  }

  injectGradle (gradlePath, depStr) {
    log.info(TAG, 'inject gradle')
    if (!fs.existsSync(gradlePath)) {
      log.error(TAG, `未找到build.gradle:${gradlePath}`)
      return
    }
    const start = '[FLUTTER_DEPENDENCY_END]'
    const injection = this.gradleInjection(depStr)
    fsutils.replaceContent(gradlePath, injection, '')
    if (
      fsutils.addOrReplaceContentBySurround(gradlePath, start, '', injection)
    ) {
      log.info(TAG, `injection path: ${gradlePath}, content: ${injection}`)
    } else {
      log.info(TAG, `inject failed, path: ${gradlePath}`)
    }
  }

  gradleInjection (str) {
    return `\n//[FLUTTER_MARKET_START]\n${str} \n//[FLUTTER_MARKET_END]\n`
  }
}

module.exports = new GeneratorUse()
