const _execSync = require('child_process').execSync
const fs = require('fs')
const path = require('path')
const ConfigName = 'flutter-boot.yaml'
const log = require('../../log')
const fsutils = require('../../utils/fsutils')
const exit = require('../../utils/exit')

const { softlink } = require('../softlink')

const TAG = '[link-1.9]'
const XCODEPROJ_SUFFIX = '.xcodeproj'
const FLAG = '# Created by flutter-boot'

class linker {
  linker () {
    this.flutterPath = ''
    this.nativePath = ''
    this.projectName = ''
  }

  podfile () {
    return path.join(this.nativePath, 'Podfile')
  }

  xcodeproj () {
    return path.join(this.nativePath, this.projectName + XCODEPROJ_SUFFIX)
  }

  pbxproj () {
    return path.join(this.xcodeproj(), 'project.pbxproj')
  }

  gitignore () {
    return path.join(this.nativePath, '.gitignore')
  }

  execSync (command, option) {
    _execSync(
      command,
      Object.assign(
        {},
        {
          stdio: 'inherit',
          cwd: this.nativePath
        },
        option
      )
    )
  }

  link (options) {
    this.nativePath = options.nativePath
    this.flutterPath = options.flutterPath
    this.projectName = this.getProjectName()
    this.preparePodfile()
    this.preparePodHelper()
    this.addRunnerTargetToProject()
    this.addRunnerTargetToPodfile()
    this.injectGitIgnore()
    this.execSync('pod install')
    this.replaceXcodeBackendScript()
    softlink(options)
  }

  linkRemote () {}

  preparePodfile () {
    let hasPodfile = fs.existsSync(this.podfile())
    if (hasPodfile) {
      this.checkPostInstallHook()
    } else {
      log.silly(TAG, 'prepare podfile')
      try {
        this.execSync('pod init')
        fsutils.addOrReplaceContentByReg(
          this.podfile(),
          '# platform',
          'platform'
        )
      } catch (e) {
        exit(TAG, `error when pod init, code: ${e}`, -1)
      }
    }
  }

  preparePodHelper () {
    fs.copyFileSync(
      path.join(process.env.FB_DIR, 'src', 'ios', '1.9', 'fbpodhelper.rb'),
      path.join(this.nativePath, 'fbpodhelper.rb')
    )
  }

  getProjectName () {
    const dirfiles = fs.readdirSync(this.nativePath)
    let projectFullName = ''
    dirfiles.every(filename => {
      if (filename.endsWith(XCODEPROJ_SUFFIX)) {
        projectFullName = filename
        return false
      }
      return true
    })
    const projectName = projectFullName.substring(
      0,
      projectFullName.indexOf(XCODEPROJ_SUFFIX)
    )
    return projectName
  }

  // 在工程中创建Runner Target，以便执行flutter run时可以直接运行
  addRunnerTargetToProject () {
    log.silly(TAG, 'prepare Runner target')
    const xcodeprojPath = this.xcodeproj()
    const projectName = this.getProjectName()
    const task = `ruby ${path.join(
      process.env.FB_DIR,
      'src/scripts/duplicate_target.rb'
    )} ${xcodeprojPath} ${projectName} Runner`

    try {
      this.execSync(task)
    } catch (e) {
      exit(
        TAG, 
        'error when add Runner target to project.' + e, 
        -1)
    }
  }

  addRunnerTargetToPodfile () {
    log.silly(TAG, 'prepare Runner target to podfile')
    let podfilePath = this.podfile()
    let rawdata = fs.readFileSync(podfilePath, 'utf8')
    let start = this.getTargetNameStr(this.projectName)
    let end = 'end'
    let runnerStart = this.getTargetNameStr('Runner')
    if (!rawdata.includes(start)) {
      exit(TAG, 'no main target found in Podfile', -1)
    } else if (rawdata.includes(runnerStart)) {
      log.info(TAG, 'Runner target found in Podfile')
    } else {
      let defaultTargetStr = this.readPodfile(rawdata, this.projectName)
      let reg = new RegExp(this.projectName, 'g')
      let replacedTargetStr = defaultTargetStr.replace(reg, 'Runner')
      let startIndex = replacedTargetStr.indexOf(start)
      let endIndex = replacedTargetStr.lastIndexOf(end)
      let str =
        "\n  eval(File.read(File.join(File.dirname(__FILE__), 'fbpodhelper.rb')), binding)\n"
      let targetContent =
        FLAG + '\n' + replacedTargetStr.substring(startIndex, endIndex) + str
      let injection = '\n' + targetContent + '\n' + end + '\n'
      fs.appendFileSync(podfilePath, injection)
    }
  }

  getTargetNameStr (name) {
    return "target '" + name + "' do"
  }

  readPodfile (rawdata, targetName) {
    let stk = []
    let startStr = 'target'
    let endStr = 'end'
    let retStr = ''
    let isInTarget = false
    let i = rawdata.indexOf(startStr)

    while (i < rawdata.length) {
      let startIndex = rawdata.indexOf(startStr, i)
      let endIndex = rawdata.indexOf(endStr, i)
      if (startIndex > 0 && startIndex < endIndex) {
        if (
          stk.length == 0 &&
          rawdata
            .substring(startIndex + startStr.length)
            .trim()
            .startsWith("'" + targetName)
        ) {
          isInTarget = true
        }
        stk.push({
          value: startStr,
          pos: startIndex
        })
        i = startIndex + startStr.length
      } else if (endIndex > 0) {
        if (stk.length < 1) {
          exit(
            TAG,
            'Podfile contains unmatched target and end, fail to modify Podfile!',
             -1)
          break
        } else {
          let res = stk.pop()
          if (stk.length == 0 && isInTarget) {
            retStr = rawdata.substring(res.pos, endIndex + endStr.length)
            break
          }
        }
        i = endIndex + endStr.length
      } else {
        exit(TAG, 'No target or end found in Podfile.', -1)
        break
      }
    }
    return retStr
  }

  /*
    Flutter.framework files were made read-only to 
    "Provide a strong hint to developers that editing Flutter framework headers isn't supported" (cb2b89c).
    However this is making the Flutter binary readonly, 
    which is being copied into the final embedded Frameworks directories, then can't be codesigned.
    Unfortunately, this PR (556e3d9) is so far only available on the master channel, so we provide a DIY version.
    See https://github.com/flutter/flutter/pull/40174 for detail.
  */
  replaceXcodeBackendScript () {
    log.silly(TAG, 'Replace xcode_backend Script')
    fs.copyFileSync(
      path.join(process.env.FB_DIR, 'src', 'ios', '1.9', 'xcode_backend_1.9.1_bugfix.sh'),
      path.join(this.nativePath, 'xcode_backend_1.9.1_bugfix.sh')
    )

    const searchValue = '\\"$FLUTTER_ROOT\\"/packages/flutter_tools/bin/xcode_backend.sh'
    const replaceValue = '\\"$SOURCE_ROOT\\"/xcode_backend_1.9.1_bugfix.sh'
    const pbxprojPath = this.pbxproj()
    let fileStr = fs.readFileSync(pbxprojPath, 'utf8')
    let replacedStr = fileStr.replace(searchValue, replaceValue)
    fs.writeFileSync(pbxprojPath, replacedStr)
  }

  checkPostInstallHook () {
    let rawdata = fs.readFileSync(this.podfile(), 'utf8')
    if (
      rawdata.includes('post_install do |installer|') &&
      !rawdata.includes(FLAG)
    ) {
      log.warn(
        TAG,
        '`post_install` hook exists, which will conflict with podhelper.rb and rise a `multiple post_install hooks` error.\
        See https://github.com/flutter/flutter/issues/26212 for detail.'
      )
    }
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
