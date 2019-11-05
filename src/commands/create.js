#!/usr/bin/env node
'use strict'

const ui = require('../ui')
const fs = require('fs')
const path = require('path')
const execSync = require('child_process').execSync
const log = require('../log')
const isEmpty = require('../utils/isEmpty')

const creator = require('../generator/creator')

const TAG = '[create]'

module.exports = program => {
  program
    .command('create')
    .option('-n, --modulename [name]', '名称')
    .option('-r, --repo [gitrepo]')
    .option('-b, --branch [gitbranch]')
    .option('-R, --no-repo')
    .description('创建flutter module')
    .action(async function () {
      const cmd = arguments[arguments.length - 1]
      log.info(TAG, 'creating flutter module.')

      let moduleName
      if (cmd.modulename) {
        moduleName = cmd.modulename
      } else {
        moduleName = await ui.input(
          '请输入flutter工程名称：',
          'my_flutter_module'
        )
      }
      let flutterRepo
      if (cmd.repo != undefined && cmd.repo != true) {
        flutterRepo = cmd.repo
      } else {
        flutterRepo = (await ui.input('请输入flutter仓库地址，回车跳过')).trim()
      }

      let flutterRepoBranchOrTag
      if (cmd.branch) {
        flutterRepoBranchOrTag = cmd.branch
      } else if (!isEmpty(flutterRepo)) {
        flutterRepoBranchOrTag = (await ui.input(
          '请输入flutter仓库分支或tag',
          'master'
        )).trim()
      }

      if (fs.existsSync(path.join(process.cwd(), moduleName))) {
        // log.error('[create]', 'module文件夹已存在，请换一个名字')
        // const continueInstall = await ui.confirm('工程已存在，是否继续？')
        log.error(TAG, '工程已存在')
        return
      }
      await creator.createModule({
        initDir: process.cwd(),
        moduleName,
        flutterRepo,
        flutterRepoBranchOrTag
      })
    })
}
