const path = require('path')
const execSync = require('child_process').execSync
const fs = require('fs')
const log = require('../log')
const fsutils = require('../utils/fsutils')
const { softlink } = require('./softlink')
const checker = require('./check')
const TAG = '[Androidlink]'

const INJECTION_BUILD_GRADLE =
  '\n\
    compileOptions { \n\
        sourceCompatibility 1.8 \n\
        targetCompatibility 1.8 \n\
    } \n'

const INJECTION_GRADLE_PROPERTIES =
  '\n# [FLUTTER_CONFIG_BEGIN]\n\
# 自动探测flutter module源码目录功能开关，默认开 \n\
android_enableDetectFlutterDir=true \n\
# [FLUTTER_CONFIG_END]'

const INJECTION_GRADLE_SETTINGS =
  "\n    // [FLUTTER_CONFIG_BEGIN]\n\
  setBinding(new Binding([gradle: this])) \n\
  evaluate(new File('fbinclude_flutter.groovy')) \n\
  // [FLUTTER_CONFIG_END]"

class linker {
  linker () {
    this.flutterPath = ''
    this.nativePath = ''
  }

  setOptions (options) {
    this.flutterPath = options.flutterPath
    this.nativePath = options.nativePath
  }

  link (options) {
    this.flutterPath = options.flutterPath
    this.nativePath = options.nativePath
    if (!checker.check(options)) {
      log.error(TAG, 'link failed: check failed')
      process.exit(1)
    }
    this.injectCompileOptions()
    this.injectDependency()
    this.injectGradleProperties()
    this.prepareIncludeFlutter()
    this.injectGradleSettings()
    this.injectGitIgnore()
    softlink(options)
  }

  injectionBuildGradle () {
    return INJECTION_BUILD_GRADLE
  }

  injectionGradleProperties () {
    return INJECTION_GRADLE_PROPERTIES
  }

  injectionGradleSettings () {
    return INJECTION_GRADLE_SETTINGS
  }

  buildGradle () {
    return path.join(this.nativePath, 'app/build.gradle')
  }

  settingsGradle () {
    return path.join(this.nativePath, 'settings.gradle')
  }

  includeFlutter () {
    return path.join(this.flutterPath, '.android/include_flutter.groovy')
  }

  gradleProperties () {
    return path.join(this.nativePath, 'gradle.properties')
  }

  gitignore () {
    return path.join(this.nativePath, '.gitignore')
  }

  execSync (command, option) {
    execSync(
      command,
      Object.assign({}, option, {
        stdio: 'inherit',
        cwd: this.nativePath
      })
    )
  }

  injectCompileOptions () {
    log.info(TAG, 'init compile options')
    let realPath = this.buildGradle()
    var fs = require('fs')
    var rawdata = fs.readFileSync(realPath, 'utf8')

    const ai = rawdata.indexOf('android')
    if (ai < 0) {
      log.error(
        TAG,
        'invalid android build.gradle file, not android section found!'
      )
      return
    }

    const si = rawdata.indexOf('{', ai + 7)

    const injection = INJECTION_BUILD_GRADLE

    if (!rawdata.includes(injection)) {
      const content =
        rawdata.substring(0, si + 1) + injection + rawdata.substring(si + 1)
      fs.writeFileSync(realPath, content)
      log.silly(TAG, 'Patch:' + injection)
    } else {
    }

    log.info(TAG, 'compile options settled into app/build.gradle')
  }

  injectDependency () {
    log.info(TAG, 'update flutter dependency')
    let realPath = this.buildGradle()
    var fs = require('fs')
    var rawdata = fs.readFileSync(realPath, 'utf8')

    const ai = rawdata.indexOf('dependencies')
    if (ai < 0) {
      log.error(
        TAG,
        'invalid android build.gradle file, not dependencies section found!'
      )
      return
    }

    const si = rawdata.indexOf('{', ai + 'dependencies'.length)

    const dependencyTag = "implementation project(':flutter')"
    if (!rawdata.includes(dependencyTag)) {
      const injection =
        " \n\
    // [FLUTTER_DEPENDENCY_BEGIN] \n\
    if (gradle.isDetectedFlutterDir) { \n\
        implementation project(':flutter') \n\
    } else { \n\
        // 换成自己的远程flutter产物 \n\
    } \n\
    // [FLUTTER_DEPENDENCY_END] \n\
      "
      const content =
        rawdata.substring(0, si + 1) + injection + rawdata.substring(si + 1)
      fs.writeFileSync(realPath, content)
      log.silly(TAG, 'Patch:' + injection)
    }

    log.info(TAG, 'dependency settled in app/build.gradle')
  }

  injectGradleProperties () {
    log.info(TAG, 'init gradle.properties')
    let realPath = this.gradleProperties()
    if (!fs.existsSync(realPath)) {
      log.silly(TAG, 'create gradle.properties')
      fs.writeFileSync(realPath, '')
    }
    const reg = /\n# \[FLUTTER_CONFIG_BEGIN\](\n|.)*?# \[FLUTTER_CONFIG_END\]/g
    const injection = INJECTION_GRADLE_PROPERTIES
    if (fsutils.addOrReplaceContent(realPath, reg, injection)) {
      log.silly(TAG, 'Add properties:' + injection)
    }
  }

  prepareIncludeFlutter () {
    log.info(TAG, 'inject file: fbinclude_flutter.groovy')
    fs.copyFileSync(
      path.join(
        process.env.FB_DIR,
        'src',
        'scripts',
        'fbinclude_flutter.groovy'
      ),
      path.join(this.nativePath, 'fbinclude_flutter.groovy')
    )
  }

  injectGradleSettings () {
    log.info(TAG, 'init gradle settings')
    let realPath = this.settingsGradle()
    if (!fs.existsSync(realPath)) {
      log.info(TAG, 'create app/settings.gradle')
      fs.writeFileSync(realPath, '')
    }
    const reg = /\n\/\/ \[FLUTTER_CONFIG_BEGIN\](\n|.)*?\/\/ \[FLUTTER_CONFIG_END\]/g
    const injection = INJECTION_GRADLE_SETTINGS
    if (fsutils.addOrReplaceContent(realPath, reg, injection)) {
      log.info(TAG, 'Patch:' + injection)
    }
    log.info(TAG, 'settings settled in settings.gradle')
  }

  injectGitIgnore () {
    log.info(TAG, 'inject gitignore')
    let realPath = this.gitignore()
    const injection = '\nfbConfig.local.json'
    if (!fs.existsSync(realPath)) {
      fs.writeFileSync(realPath, injection)
    } else {
      fsutils.addOrReplaceContent(realPath, /\nfbConfig.local.json/g, injection)
    }
  }
}

module.exports = new linker()
