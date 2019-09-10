#!/usr/bin/env node
'use strict'

const path = require('path')
const ui = require('../ui')
const _use = require('../generator/use.js')
const config = require('../config.js')
const fsutils = require('../utils/fsutils')
const log = require('../log')

const TAG = '[use]'
module.exports = program => {
  program
    .command('use')
    .description('集成插件')
    .action(async function () {
      const curPath = process.cwd()
      const projChecker = fsutils.projectChecker(curPath)

      if (!projChecker.isNative()) {
        log.error(
          TAG,
          '当前目录不是有效的iOS或Android目录,请切换到iOS或Android目录下'
        )
        return
      }

      const answer = await ui.list('选择需要集成的插件：', [
        {
          name: 'FlutterBoost',
          value: 'FlutterBoost'
        }
        // {
        //   name: 'Router',
        //   value: 'Router'
        // }
      ])
      const loadConfig = config.readLocal(process.cwd())
      if (!loadConfig.flutterPath) {
        log.error(TAG, '找不到flutter路径，请运行flutter-boot link')
        return
      }
      await _use.use({
        depName: answer,
        flutterPath: loadConfig.flutterPath,
        nativePath: curPath
      })
    })
}
