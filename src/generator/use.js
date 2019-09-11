const fs = require('fs')
const path = require('path')
const pubspecHelper = require('../utils/pubspecHelper')
const execSync = require('child_process').execSync
const fsutils = require('../utils/fsutils')
const execUtils = require('../utils/execUtils')
const log = require('../log')

const TAG = '[use]'

class GeneratorUse {
  async use (options) {
    const depName = options.depName
    const flutterPath = options.flutterPath
    const nativePath = options.nativePath
    const config = JSON.parse(
      fs.readFileSync(
        path.join(process.env.FB_DIR, 'src/market', depName, 'config.json'),
        'utf-8'
      )
    )
    pubspecHelper.addDep(flutterPath, config.pubspec)
    execSync('flutter packages get', {
      stdio: 'inherit',
      cwd: options.flutterPath
    })

    const projChecker = fsutils.projectChecker(nativePath)

    if (projChecker.isAndroid()) {
      let targetPath = config.android.targetPath
      targetPath = targetPath.replace('${workspace}', nativePath)
      log.silly(TAG, `android target path:${targetPath}`)
      await this.copyTpl('android', depName, targetPath)

      if (config.gradle) {
        this.injectGradle(projChecker.gradlePath(), config.gradle)
      }
    } else if (projChecker.isIOS()) {
      let targetPath = config.ios.targetPath
      targetPath = targetPath.replace('${workspace}', nativePath)
      targetPath = targetPath.replace(
        '${projectname}',
        projChecker.getProjectName()
      )
      log.silly(TAG, `ios target path:${targetPath}`)
      await this.copyTpl('ios', depName, targetPath)
      execUtils.execRubySync('add_ios_tpl.rb', [
        projChecker.xcodeproj(),
        targetPath
      ])
    }
    let targetPath = config.dart.targetPath
    targetPath = targetPath.replace('${workspace}', flutterPath)
    log.silly(TAG, `flutter target path:${targetPath}`)
    await this.copyTpl('dart', depName, targetPath)

    if (projChecker.isIOS()) {
      execSync('pod update --no-repo-update', {
        stdio: 'inherit',
        cwd: nativePath
      })
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
      .copyFolderAsync(this.tplfile(platform, packageName), targetPath)
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
