#!/usr/bin/env node

const linker = require('../generator/linker')
const ui = require('../ui')
const log = require('../log')
const fs = require('fs')
const fbconfig = require('../config')
const isEmpty = require('../utils/isEmpty')
const fsutils = require('../utils/fsutils')
const pathUtils = require('../utils/pathUtils')

const flutterRecorder = require('../utils/flutterRecorder')

const TAG = '[link]'

module.exports = program => {
  program
    .command('link [path]')
    .description('本地链接：链接你的本地flutter工程')
    .option('-f --force', 'force link')
    .action(async function () {
      log.info(TAG, 'Running flutter boot link...')

      const cmd = arguments[arguments.length - 1]
      const arg0 = arguments[0]
      const flutterPath = typeof arg0 === 'string' ? arg0 : undefined
      await link({
        force: cmd.force,
        flutterPath: flutterPath
      })
    })
}

async function link (options) {
  if (!options.force) {
    log.info(TAG, 'checking if installed...')
    const localConfig = fbconfig.readLocal(process.cwd())
    if (localConfig && !isEmpty(localConfig.flutterPath)) {
      log.error(TAG, '你已经完成本地链接，如需重置请使用flutter-boot link -f')
      return
    }
  }

  const projChecker = fsutils.projectChecker(process.cwd())

  log.silly(TAG, 'checking current path...')
  if (!projChecker.isNative()) {
    log.error(
      TAG,
      '当前目录不是有效的iOS或Android目录,请切换到iOS或Android目录下'
    )
    return
  }

  let flutterModulePath =
    options.flutterPath || flutterRecorder.existedFlutterModule()
  if (!flutterModulePath) {
    flutterModulePath = (await ui.input('请输入flutter module路径')).trim()
  }
  let input_flutterModulePath = flutterModulePath
  flutterModulePath = pathUtils.absolutePath(flutterModulePath, process.cwd())

  if (!fs.existsSync(flutterModulePath)) {
    log.error(
      TAG,
      `can not find flutter module path:${input_flutterModulePath}; absolute path:${flutterModulePath}`
    )
    return
  }

  linker.link({
    flutterPath: flutterModulePath,
    nativePath: process.cwd()
  })
}
