#!/usr/bin/env node

const remoteLinker = require('../generator/remoteLinker')
const ui = require('../ui')
const log = require('../log')
const fs = require('fs')
const isEmpty = require('../utils/isEmpty')
const fsutils = require('../utils/fsutils')

const fbconfig = require('../config')

const flutterRecorder = require('../utils/flutterRecorder')
const repo = require('../repo')()

const TAG = '[remote-link]'

module.exports = program => {
  program
    .command('remotelink')
    .description('远程连接：链接你的远程flutter工程')
    .alias('rl')
    .option('-f --force', 'update remote flutter')
    .action(async function () {
      log.info(TAG, 'Running flutter boot remotelink...')
      const cmd = arguments[arguments.length - 1]
      await link({
        force: cmd.force
      })
    })
}

async function link (options) {
  const projChecker = fsutils.projectChecker(process.cwd())

  if (!projChecker.isNative()) {
    log.error(
      TAG,
      '当前目录不是有效的iOS或Android目录,请切换到iOS或Android目录下'
    )
    return
  }
  if (!options.force) {
    const remoteConfig = fbconfig.read(process.cwd())
    if (
      remoteConfig &&
      !isEmpty(remoteConfig.flutterRepo) &&
      !isEmpty(remoteConfig.flutterRepoBranchOrTag)
    ) {
      log.info(TAG, '你已经完成远程链接，如需重置请使用flutter-boot rl -f')
      return
    }
  }

  let flutterRepo
  const localConfig = fbconfig.readLocal(process.cwd())
  if (
    localConfig &&
    localConfig.flutterPath &&
    fs.existsSync(localConfig.flutterPath)
  ) {
    log.info(TAG, 'fetch remote repo from local')
    const url = await repo
      .remotePushUrl({
        baseDir: localConfig.flutterPath
      })
      .catch(e => {
        return undefined
      })
    flutterRepo = url
    if (flutterRepo) {
      log.info(TAG, `repo path is:${flutterRepo}`)
    } else {
      log.info(TAG, 'local flutter is not a git repo')
    }
  } else {
    log.info(TAG, "haven't done local-link")
    log.info(TAG, 'do remote-link')
  }

  if (!flutterRepo) {
    flutterRepo = (await ui.input('请输入flutter仓库地址')).trim()
  }

  const flutterRepoBranchOrTag = (await ui.input(
    '请输入flutter仓库分支或tag',
    'master'
  )).trim()
  if (isEmpty(flutterRepo) || isEmpty(flutterRepoBranchOrTag)) {
    log.error(TAG, 'flutter仓库信息为空，请重试')
    return
  }

  await remoteLinker.link({
    nativePath: process.cwd(),
    flutterRepo,
    flutterRepoBranchOrTag,
    update: true
  })
}

async function update () {
  const config = fbconfig.read(process.cwd())
  if (!config.flutterRepo || !config.flutterRepoBranchOrTag) {
    log.error(TAG, '未指定远程flutter依赖，你可以运行flutter-boot remotelink')
  }
  await remoteLinker.update(
    Object.assign({}, config, {
      nativePath: process.cwd()
    })
  )
}
