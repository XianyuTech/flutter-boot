const repo = require('../repo')()
const fs = require('fs')
const path = require('path')
const fbconfig = require('../config')
const updator = require('./updator')
const log = require('../log')

const TAG = '[remote-link]'

class RemoteLinker {
  async link (options) {
    const flutterRepo = options.flutterRepo
    const flutterRepoBranchOrTag = options.flutterRepoBranchOrTag
    fbconfig.update(process.cwd(), {
      flutterRepo,
      flutterRepoBranchOrTag
    })
    if (options.update) {
      log.info(TAG, 'auto update after remote link')
      await updator.update(options)
    }
  }
}

module.exports = new RemoteLinker()
