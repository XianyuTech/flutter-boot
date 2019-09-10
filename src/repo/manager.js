'use strict'

var fs = require('fs')
var path = require('path')
var Promise = require('bluebird')

module.exports = function (gitShell, svnShell) {
  var manager = {}

  manager.init = function (baseDir, repo, version, callback) {
    checkDirExists(baseDir).then(function (baseDir) {
      gitShell.init(baseDir, repo, version, callback)
    })
  }

  manager.remotePushUrl = function (baseDir, callback) {
    checkDirExists(baseDir).then(function (baseDir) {
      gitShell.remotePushUrl(baseDir, callback)
    })
  }

  manager.checkout = function (distUrl, baseDir, version, callback) {
    checkDirExists(baseDir).then(function (baseDir) {
      if (/git/.test(distUrl)) {
        gitShell.clone(distUrl, baseDir, version, callback)
      } else {
        callback()
      }
    })
  }

  manager.clone = function (distUrl, baseDir, version, callback) {
    new Promise(function (resolve, reject) {
      if (/git/.test(distUrl)) {
        gitShell.clone(distUrl, baseDir, version, callback)
      } else {
        callback()
      }
      resolve()
    })
  }

  manager.update = function (baseDir, callback) {
    checkDirExists(baseDir)
      .then(getShell)
      .then(function (shell) {
        shell ? shell.update(baseDir, callback) : callback()
      })
  }

  manager.commit = function (baseDir, msg, callback) {
    checkDirExists(baseDir)
      .then(getShell)
      .then(function (shell) {
        shell ? shell.commit(baseDir, msg, callback) : callback()
      })
  }

  manager.getCurrentBranch = function (baseDir, callback) {
    checkDirExists(baseDir)
      .then(getShell)
      .then(function (shell) {
        shell ? shell.getCurrentBranch(baseDir, callback) : callback()
      })
  }

  manager.getBranches = function (baseDir, includeRemote, callback) {
    if (typeof includeRemote === 'function') {
      callback = includeRemote
      includeRemote = false
    }
    checkDirExists(baseDir)
      .then(getShell)
      .then(function (shell) {
        shell ? shell.getBranches(baseDir, includeRemote, callback) : callback()
      })
  }

  manager.status = function (baseDir, callback) {
    checkDirExists(baseDir)
      .then(getShell)
      .then(function (shell) {
        shell ? shell.status(baseDir, callback) : callback()
      })
  }

  manager.switch = function (baseDir, branchUrl, callback) {
    checkDirExists(baseDir)
      .then(getShell)
      .then(function (shell) {
        shell ? shell.switch(baseDir, branchUrl, callback) : callback()
      })
  }

  manager.getChanged = function (baseDir, branchUrl, callback) {
    checkDirExists(baseDir)
      .then(getShell)
      .then(function (shell) {
        shell ? shell.getChanged(baseDir, branchUrl, callback) : callback()
      })
  }

  manager.publish = function (baseDir, tagName, msg, callback) {
    checkDirExists(baseDir)
      .then(getShell)
      .then(function (shell) {
        shell ? shell.publish(baseDir, tagName, msg, callback) : callback()
      })
  }

  manager.deleteBranch = function (baseDir, branchUrl, includeRemote, callback) {
    if (typeof includeRemote === 'function') {
      callback = includeRemote
      includeRemote = false
    }

    checkDirExists(baseDir)
      .then(getShell)
      .then(function (shell) {
        shell
          ? shell.deleteBranch(baseDir, branchUrl, includeRemote, callback)
          : callback()
      })
  }

  manager.commitAll = function (baseDir, msg, callback) {
    checkDirExists(baseDir)
      .then(getShell)
      .then(function (shell) {
        shell ? shell.commitAll(baseDir, msg, callback) : callback()
      })
  }

  manager.fetch = function (baseDir, callback) {
    checkDirExists(baseDir)
      .then(getShell)
      .then(function (shell) {
        shell ? shell.fetch(baseDir, callback) : callback()
      })
  }

  manager.info = function (baseDir, callback) {
    checkDirExists(baseDir)
      .then(getShell)
      .then(function (shell) {
        shell ? shell.info(baseDir, callback) : callback()
      })
  }

  manager.getAllTags = function (baseDir, reg, callback) {
    checkDirExists(baseDir)
      .then(getShell)
      .then(function (shell) {
        shell ? shell.allTags(baseDir, reg, callback) : callback()
      })
  }

  return manager

  function checkDirExists (baseDir) {
    return new Promise(function (resolve, reject) {
      if (fs.existsSync(baseDir)) {
        resolve(baseDir)
      } else {
        reject('dir not found')
      }
    })
  }

  function getShell (baseDir) {
    return new Promise(function (resolve, reject) {
      var gitExists = fs.existsSync(path.join(baseDir, '.git'))
      var svnExists = fs.existsSync(path.join(baseDir, '.svn'))
      if (gitExists) {
        resolve(gitShell)
      } else if (svnExists) {
        resolve(svnShell)
      } else {
        gitShell.getChanged(baseDir, function (err, result) {
          if (err) {
            ;/Not a git repository/.test(err.message) ? resolve() : reject(err)
          } else {
            resolve(gitShell)
          }
        })
      }
    })
  }
}
