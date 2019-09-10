#!/usr/bin/env node

const updator = require('../generator/updator')
const fsutils = require('../utils/fsutils')
const log = require('../log')
const TAG = '[update]'

module.exports = program => {
  program
    .command('update')
    .description('更新远程flutter')
    .action(function () {
      log.info(TAG, 'Running flutter boot update...')
      update()
    })
}

function update () {
  const projChecker = fsutils.projectChecker(process.cwd())

  if (!projChecker.isNative()) {
    log.error(
      TAG,
      '当前目录不是有效的iOS或Android目录,请切换到iOS或Android目录下'
    )
    return
  }

  updator.update({
    nativePath: process.cwd()
  })
}
