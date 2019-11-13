const path = require('path')
const ui = require('../ui')
const fs = require('fs')
const log = require('../log')
const { recordFlutterModule } = require('../utils/flutterRecorder')
const { generateShellProject } = require('./shellProject')
const execSync = require('child_process').execSync
const repo = require('../repo')()
const TAG = '[create]'
const del = require('del')
const fsutils = require('../utils/fsutils')

class creator {
  async createModule (options) {
    // if (fs.existsSync(path.join(process.cwd(), 'pubspec.yaml'))) {
    //   recordFlutterModule(process.cwd())
    //   return
    // }
    await this.cleanGit(options)
    const moduleName = await this.createFlutterModule(options)
    const flutterPath = path.join(options.initDir, moduleName)
    this.prepareGitIgnore(flutterPath)
    await this.createGit(options)
    return moduleName
  }

  async createFlutterModule (options) {
    const initDir = options.initDir
    const moduleName = options.moduleName
    const androidX = options.androidX
    log.info(TAG, 'creating flutter module')
    let createCmd = 'flutter create'
    if (androidX) {
      createCmd += ' --androidx'
    }
    createCmd += (' -t module ' + moduleName.toLowerCase())
    execSync(createCmd, {
      stdio: 'inherit'
    })
    recordFlutterModule(path.join(initDir, moduleName))
    log.info(TAG, 'flutter module created')
    generateShellProject(path.join(initDir, moduleName))
    log.info(TAG, 'native shell project created')
    return moduleName
  }

  async cleanGit (options) {
    log.info(TAG, 'clean flutter module git')
    const initDir = options.initDir
    const moduleName = options.moduleName
    const flutterRepo = options.flutterRepo
    const flutterRepoBranchOrTag = options.flutterRepoBranchOrTag
    const flutterPath = path.join(initDir, moduleName)

    if (
      !flutterRepo ||
      flutterRepo.length == 0 ||
      !flutterRepoBranchOrTag ||
      flutterRepoBranchOrTag.length == 0
    ) {
      log.info('[create]', 'done: no git info')
      return
    }
    path.resolve()

    await repo
      .clone({
        baseDir: flutterPath,
        distUrl: flutterRepo,
        version: flutterRepoBranchOrTag
      })
      .catch(() => {})
      .then(() => {
        const dirfiles = fs.readdirSync(flutterPath)
        if (dirfiles.length == 1) {
          log.info(TAG, 'empty git, remove for git init')
          del.sync([flutterPath], {
            dot: true,
            onlyFiles: false,
            absolute: true,
            force: true
          })
          options.emptyGit = true
        } else {
          log.info(TAG, 'non-empty git, remove all files')
          del.sync([flutterPath + '/**/*', '!' + flutterPath + '/.git{,/**}'], {
            dot: true,
            onlyFiles: false,
            absolute: true,
            force: true
          })
          return repo.commitAll({
            baseDir: flutterPath,
            msg: 'clean'
          })
        }
      })
  }

  async createGit (options) {
    log.info(TAG, 'init flutter module git')
    const initDir = options.initDir
    const moduleName = options.moduleName
    const flutterRepo = options.flutterRepo
    const flutterRepoBranchOrTag = options.flutterRepoBranchOrTag
    const flutterPath = path.join(initDir, moduleName)

    if (
      !flutterRepo ||
      flutterRepo.length == 0 ||
      !flutterRepoBranchOrTag ||
      flutterRepoBranchOrTag.length == 0
    ) {
      log.info('[create]', 'done: no git info')
      return
    }
    if (options.emptyGit) {
      await repo.init({
        baseDir: path.join(initDir, moduleName),
        distUrl: flutterRepo,
        version: flutterRepoBranchOrTag
      })
    } else {
      repo.commitAll({
        baseDir: flutterPath,
        msg: 'init flutter'
      })
    }
    log.info('[create]', 'done: init flutter module git')
  }

  gitignore (flutterPath) {
    return path.join(flutterPath, '.gitignore')
  }
  prepareGitIgnore (flutterPath) {
    log.silly(TAG, 'prepare gitignore')
    const _gitignore = this.gitignore(flutterPath)
    if (!fs.existsSync(_gitignore)) {
      fs.writeFileSync(_gitignore, '.ios/Flutter/engine')
    } else {
      let filecontent = fs.readFileSync(_gitignore, 'utf-8')
      // ignore string likes .iosSomePath
      if (filecontent.indexOf('.ios') >= 0) {
        filecontent = filecontent.replace('.ios', '.ios/Flutter/engine')
      }
      fs.writeFileSync(_gitignore, filecontent)
      fsutils.addOrReplaceContent(_gitignore, /\nios\n/g, '\nios\n')
      fsutils.addOrReplaceContent(_gitignore, /\nandroid\n/g, '\nandroid\n')
    }
  }
}

module.exports = new creator()
