const repo = require('../repo')()
const fs = require('fs')
const path = require('path')
const fbconfig = require('../config')
const log = require('../log')
const execSync = require('child_process').execSync

const TAG = '[update]'
const LocalFlutterFolder = '.fbflutter'
log.level = 'silly'
class Updator {
  remoteFlutterInLocal () {
    return path.join(this.nativePath, LocalFlutterFolder)
  }
  remoteFlutterGitInLocal () {
    return path.join(this.nativePath, LocalFlutterFolder, '.git')
  }
  remoteFlutterPubspecInLocal () {
    return path.join(this.nativePath, LocalFlutterFolder, 'pubspec.yaml')
  }

  async update (options) {
    log.info(TAG, 'updateing...')
    this.nativePath = options.nativePath

    const config = fbconfig.read(options.nativePath)
    if (!config.flutterRepo || !config.flutterRepoBranchOrTag) {
      log.error(TAG, '未指定远程flutter依赖，你可以运行flutter-boot remotelink')
    }
    const flutterRepo = config.flutterRepo
    const flutterRepoBranchOrTag = config.flutterRepoBranchOrTag
    if (!flutterRepo) {
      log.error(TAG, '请指定你的flutter业务代码仓库')
      return
    }
    if (!flutterRepoBranchOrTag) {
      log.error(TAG, '请指定你的flutter业务代码仓库的分支或版本号')
      return
    }
    const _remoteFlutterInLocal = this.remoteFlutterInLocal()
    const _remoteFlutterGitInLocal = this.remoteFlutterGitInLocal()
    if (!fs.existsSync(_remoteFlutterGitInLocal)) {
      log.silly(TAG, "flutter module hasn't checkout, do checkout")
      // if(fs.existsSync(_remoteFlutterInLocal)) {

      // }
      await this.checkout(flutterRepo, flutterRepoBranchOrTag)
    } else {
      await repo
        .getCurrentBranch({ baseDir: _remoteFlutterInLocal })
        .then(branch => {
          if (branch == flutterRepoBranchOrTag) {
            return repo.update({
              baseDir: _remoteFlutterInLocal
            })
          } else {
            log.silly(TAG, `branch ${branch} doesn't match config, do switch`)
            return repo.switchBranch({
              baseDir: _remoteFlutterInLocal,
              branchUrl: flutterRepoBranchOrTag
            })
          }
        })
    }
    if (!fs.existsSync(this.remoteFlutterPubspecInLocal())) {
      log.error(TAG, '不存在pubspec文件')
      return
    }
    execSync('flutter packages get', {
      cwd: _remoteFlutterInLocal,
      stdio: 'inherit'
    })
    log.info(TAG, 'updated!')
  }

  checkout (flutterRepo, flutterRepoBranchOrTag) {
    const _remoteFlutterInLocal = this.remoteFlutterInLocal()
    if (!fs.existsSync(_remoteFlutterInLocal)) {
      fs.mkdirSync(_remoteFlutterInLocal)
    }
    return repo.checkout({
      distUrl: flutterRepo,
      baseDir: _remoteFlutterInLocal,
      version: flutterRepoBranchOrTag
    })
  }
}

module.exports = new Updator()
