const _execSync = require('child_process').execSync
const fs = require('fs')
const path = require('path')
const program = require('commander')
const YAML = require('js-yaml')
const ConfigName = 'flutter-boot.yaml'
const log = require('../log')
const fsutils = require('../utils/fsutils')

const { softlink } = require('./softlink')

const TAG = '[link]'
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
    console.log(this.nativePath)
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
    this.inject_xcode(this.projectName)
    this.addRunnerTargetToProject()
    this.addRunnerTargetToPodfile()
    this.injectGitIgnore()
    this.execSync('pod install')
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
        log.error(TAG, `error when pod init, code: ${e}`)
      }
    }
  }

  preparePodHelper () {
    fs.copyFileSync(
      path.join(process.env.FB_DIR, 'src', 'scripts', 'fbpodhelper.rb'),
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

  inject_xcode (project_name) {
    const xcodeprojPath = this.xcodeproj()
    const pbxproj = this.pbxproj()
    const xocdeAlreadyUpdated = fs
      .readFileSync(pbxproj, 'utf8')
      .includes('Flutter Build Script')
    if (xocdeAlreadyUpdated) {
      log.info(TAG, 'xcode already settled')
      return
    }

    log.silly(TAG, 'updating xcode setting')
    const task = [
      'gem install xcodeproj',
      `ruby ${path.join(
        process.env.FB_DIR,
        'src/scripts/inject_flutter_script.rb'
      )} ${xcodeprojPath}`
    ].join('&&')

    try {
      this.execSync(task)
    } catch (e) {
      log.error(TAG, `error when update xcode setting, code: ${code}`)
    }
  }

  generate_config_file () {
    var ob = {
      module_path: program.directory,
      module_repo: {
        url: program.git_repo,
        ref: 'master'
      }
    }

    const content = YAML.dump(ob)
    const fs = require('fs')
    console.log('Creating boot config file:' + content)
    fs.writeFileSync('./' + ConfigName, content)
  }

  // 在工程中创建Runner Target，以便执行flutter run时可以直接运行
  addRunnerTargetToProject () {
    log.silly(TAG, 'prepare Runner target')
    const xcodeprojPath = this.xcodeproj()
    const projectName = this.getProjectName()
    const task = `ruby ${path.join(
      process.env.FB_DIR,
      'src/ios/duplicate_target.rb'
    )} ${xcodeprojPath} ${projectName} Runner`

    try {
      this.execSync(task)
    } catch (e) {
      log.error(TAG, 'error when add Runner target to project.' + e)
    }
  }

  addRunnerTargetToPodfile () {
    log.silly(TAG, 'prepare Runner target to podfile')
    let podfilePath = this.podfile()
    let rawdata = fs.readFileSync(podfilePath, 'utf8')
    let start = this.getTargetNameStr(this.projectName)
    let end = 'end'
    let runnerStart = this.getTargetNameStr('Runner')

    if (rawdata.includes(start) && !rawdata.includes(runnerStart)) {
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
    } else {
      log.silly(
        TAG,
        `no target found in Podfile, start:${start};runnerStart:${runnerStart}`
      )
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
          log.error(
            TAG,
            'Podfile contains unmatched target and end, fail to modify Podfile!'
          )
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
        log.error(TAG, 'No target or end found in Podfile.')
        break
      }
    }
    return retStr
  }

  checkPostInstallHook () {
    let rawdata = fs.readFileSync(this.podfile(), 'utf8')
    if (
      rawdata.includes('post_install do |installer|') &&
      !rawdata.includes(FLAG)
    ) {
      log.error(
        TAG,
        '`post_install` hook exists, which will conflict with podhelper.rb and rise a `multiple post_install hooks` error. See https://github.com/flutter/flutter/issues/26212 for detail.'
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
