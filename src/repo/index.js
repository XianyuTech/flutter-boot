'use strict'

module.exports = function () {
  const Promise = require('bluebird')

  const manager = Promise.promisifyAll(
    require('./manager')(require('./git')('git'), require('./svn')('svn'))
  )

  const repo = {}

  repo.init = init
  repo.remotePushUrl = remotePushUrl
  repo.checkout = checkout
  repo.clone = clone
  repo.update = update
  repo.commitAll = commitAll
  repo.getCurrentBranch = getCurrentBranch
  repo.getBranches = getBranches
  repo.deleteBranch = deleteBranch
  repo.switchBranch = switchBranch
  repo.getChanged = getChanged
  repo.status = status
  repo.publish = publish
  repo.fetch = fetch
  repo.info = info
  repo.getAllTags = getAllTags

  return repo

  function init (data) {
    data = data || {}
    return manager.initAsync(
      data.baseDir || process.cwd(),
      data.distUrl,
      data.version
    )
  }

  function remotePushUrl (data) {
    data = data || {}
    return manager.remotePushUrlAsync(data.baseDir || process.cwd())
  }

  function checkout (data) {
    data = data || {}
    return manager.checkoutAsync(
      data.distUrl,
      data.baseDir || process.cwd(),
      data.version
    )
  }

  function clone (data) {
    data = data || {}
    return manager.cloneAsync(
      data.distUrl,
      data.baseDir || process.cwd(),
      data.version
    )
  }
  function update (data) {
    data = data || {}
    return manager.updateAsync(data.baseDir || process.cwd())
  }
  function commitAll (data) {
    data = data || {}
    return manager.commitAllAsync(data.baseDir || process.cwd(), data.msg)
  }
  function getCurrentBranch (data) {
    data = data || {}
    return manager.getCurrentBranchAsync(data.baseDir || process.cwd())
  }
  function getBranches (data) {
    data = data || {}
    return manager.getBranchesAsync(
      data.baseDir || process.cwd(),
      data.includeRemote || false
    )
  }
  function deleteBranch (data) {
    data = data || {}
    return manager.deleteBranchAsync(
      data.baseDir || process.cwd(),
      data.branchUrl,
      data.includeRemote || false
    )
  }
  function switchBranch (data) {
    data = data || {}
    return manager.switchAsync(data.baseDir || process.cwd(), data.branchUrl)
  }
  function getChanged (data) {
    data = data || {}
    return manager.getChangedAsync(data.baseDir || process.cwd())
  }
  function status (data) {
    data = data || {}
    return manager.statusAsync(data.baseDir || process.cwd())
  }
  function publish (data) {
    data = data || {}
    return manager.publishAsync(
      data.baseDir || process.cwd(),
      data.tagName,
      data.msg
    )
  }
  function fetch (data) {
    data = data || {}
    return manager.fetchAsync(data.baseDir || process.cwd())
  }
  function info (data) {
    data = data || {}
    return manager.infoAsync(data.baseDir || process.cwd())
  }
  function getAllTags (data) {
    data = data || {}
    return manager.getAllTagsAsync(data.baseDir || process.cwd(), data.reg)
  }
}
