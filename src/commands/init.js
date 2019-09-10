#!/usr/bin/env node
'use strict'

const path = require('path')
const YAML = require('js-yaml')
const ui = require('../ui')
const fs = require('fs')
const log = require('../log')
const linker = require('../generator/linker')
const remoteLinker = require('../generator/remoteLinker')
const creator = require('../generator/creator')
const execSync = require('child_process').execSync
const inquirer = require('inquirer')
const isEmpty = require('../utils/isEmpty')
const pathUtils = require('../utils/pathUtils')

const TAG = '[init]'

module.exports = program => {
  program
    .command('init')
    .option('-i --interface [interface]')
    .description('初始化你的混合项目')
    .action(async function () {
      log.info(TAG, 'init flutter module.')
      await init({
        interface: program.interface
      })
    })
}

async function init (options) {
  // if (!options.interface || options.interface == 'list') {
  if (options.interface == 'list') {
    interfaceA(options)
    return
  }

  const moduleName = await ui.input(
    '请输入flutter工程名称：',
    'my_flutter_module'
  )

  const flutterRepo = (await ui.input('请输入flutter仓库地址，回车跳过')).trim()
  let flutterRepoBranchOrTag
  if (!isEmpty(flutterRepo)) {
    flutterRepoBranchOrTag = (await ui.input(
      '请输入flutter仓库分支或tag',
      'master'
    )).trim()
  }
  await creator.createModule({
    initDir: process.cwd(),
    moduleName,
    flutterRepo,
    flutterRepoBranchOrTag
  })
  if (!moduleName) {
    log.error(TAG, 'invalid module name')
    return
  }

  const exist_ios = await ui.confirm('是否存在iOS工程？')
  if (exist_ios) {
    let ios_path = (await ui.input('iOS工程本地地址，回车跳过', '')).trim()
    let input_ios_path = ios_path
    if (ios_path.length == 0) {
      log.info('[init]', '跳过iOS')
    } else {
      ios_path = pathUtils.absolutePath(ios_path, process.cwd())
      if (fs.existsSync(ios_path)) {
        linker.link({
          flutterPath: path.join(process.cwd(), moduleName),
          nativePath: ios_path
        })
      } else {
        log.error('[init]', `地址不存在:${input_ios_path};绝对路径:${ios_path}`)
      }
    }
  } else {
    log.info(TAG, '你可以在创建iOS工程后调用 flutter-boot link来关联flutter')
  }
  const exist_aos = await ui.confirm('是否存在Android工程？')
  if (exist_aos) {
    let aos_path = (await ui.input('Android工程本地地址，回车跳过', '')).trim()
    let input_aos_path = aos_path
    if (aos_path.length == 0) {
      log.info('[init]', '跳过Android')
    } else {
      aos_path = pathUtils.absolutePath(aos_path, process.cwd())
      if (fs.existsSync(aos_path)) {
        linker.link({
          flutterPath: path.join(process.cwd(), moduleName),
          nativePath: aos_path
        })
      } else {
        log.error(TAG, `地址不存在:${input_aos_path};绝对路径:${aos_path}`)
      }
    }
  } else {
    log.info(
      TAG,
      '你可以在创建Android工程后调用 flutter-boot link来关联flutter'
    )
  }
  log.info(TAG, '混合工程初始化完成')
}

async function interfaceA (options) {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'moduleName',
        message: 'module name',
        default: 'my_flutter_module'
      },
      {
        type: 'input',
        name: 'iOSPath',
        message: 'ios path',
        default: ''
      },
      {
        type: 'input',
        name: 'androidPath',
        message: 'android path',
        default: ''
      }
    ])
    .then(async answer => {
      const moduleName = answer.moduleName
      const iOSPath = answer.iOSPath
      const androidPath = answer.androidPath

      await creator.createModule({
        initDir: process.cwd(),
        moduleName
      })
      linker.link({
        flutterPath: path.join(process.cwd(), moduleName),
        nativePath: iOSPath
      })
      linker.link({
        flutterPath: path.join(process.cwd(), moduleName),
        nativePath: androidPath
      })
    })
}
