'use strict'

var exec = require('child_process').exec
var spawn = require('child_process').spawn
var async = require('async')
var git_url_parse = require('git-url-parse')

module.exports = function (cmd) {
  var git = {}

  git.init = function (baseDir, repo, version, callback) {
    const task = [
      'git init',
      `git remote add origin ${repo}`,
      'git add .',
      "git commit -m 'init'",
      `git push -u origin ${version}`
    ].join('&&')
    exec(
      task,
      {
        cwd: baseDir,
        stdio: 'inherit'
      },
      function (error, stdout, stderr) {
        if (error) {
          callback(error)
        } else {
          if (stdout) {
            callback(null, '')
          } else {
            callback(null, '')
          }
        }
      }
    )
  }

  git.remotePushUrl = function (baseDir, callback) {
    exec(
      'git remote get-url --push origin',
      {
        cwd: baseDir
        // stdio: 'inherit'
      },
      function (error, stdout, stderr) {
        if (error) {
          callback(error)
        } else {
          if (stdout) {
            callback(null, stdout.trim())
          } else {
            callback(null, '')
          }
        }
      }
    )
  }

  git.clone = function (repo, srcPath, version, callback) {
    run(git.cmd, ['clone', repo, srcPath], function (err) {
      if (err) {
        callback(err)
      } else {
        if (version) {
          git.switch(srcPath, version, callback)
        } else {
          callback()
        }
      }
    })
  }

  git.allTags = function (baseDir, reg, callback) {
    exec(
      git.cmd + ' tag --list ' + (reg != undefined ? `\' + ${reg} + \'` : ''),
      {
        cwd: baseDir
      },
      function (error, stdout, stderr) {
        if (error) {
          callback(error)
        } else {
          if (stdout) {
            callback(null, stdout.split(/\s+/g))
          } else {
            callback(null, '')
          }
        }
      }
    )
  }

  git.update = function (baseDir, callback) {
    run(
      git.cmd,
      ['pull'],
      {
        cwd: baseDir
      },
      callback
    )
  }

  git.commit = function (baseDir, msg, callback) {
    run(
      git.cmd,
      ['add', '-A'],
      {
        cwd: baseDir
      },
      function (error, stdout, stderr) {
        if (!error) {
          // run commit now
          run(
            git.cmd,
            ['commit', '-m', '"' + msg + '"'],
            {
              cwd: baseDir
            },
            callback
          )
        } else {
          callback(error, stdout, stderr)
        }
      }
    )
  }

  git.status = function (baseDir, callback) {
    run(
      git.cmd,
      ['status', '--porcelain'],
      {
        cwd: baseDir
      },
      callback
    )
  }

  git.getCurrentBranch = function (baseDir, callback) {
    exec(
      git.cmd + ' branch --no-color',
      {
        cwd: baseDir
      },
      function (error, stdout, stderr) {
        if (error) {
          callback(error)
        } else {
          var match = stdout.match(/\*\s+\S+/)
          if (match) {
            callback(null, match[0].replace(/(\s|\*)/g, ''))
          } else {
            callback(null, '')
          }
        }
      }
    )
  }

  git.getBranches = function (baseDir, includeRemote, callback) {
    exec(
      git.cmd + ' branch' + (includeRemote ? ' -a' : ''),
      {
        cwd: baseDir
      },
      function (error, stdout, stderr) {
        if (error) {
          callback(error)
        } else {
          callback(
            '',
            stdout
              ? stdout.split(/\s/).filter(function (b) {
                return (
                  b && b != '*' && b != '->' && b != 'remotes/origin/HEAD'
                )
              })
              : ''
          )
        }
      }
    )
  }

  git.deleteBranch = function (baseDir, branchUrl, includeRemote, cb) {
    run(
      git.cmd,
      ['branch', branchUrl, '-d'],
      {
        cwd: baseDir
      },
      function (err) {
        if (err) {
          cb(err)
        } else {
          if (includeRemote) {
            git.push(baseDir, ':' + branchUrl, cb)
          } else {
            cb()
          }
        }
      }
    )
  }

  git.push = function (baseDir, branchUrl, cb) {
    var options

    if (typeof branchUrl === 'function') {
      cb = branchUrl
      options = ['push']
    } else {
      options = ['push', '-u', 'origin', branchUrl]
    }

    run(
      git.cmd,
      options,
      {
        cwd: baseDir
      },
      cb
    )
  }

  git.switch = function (baseDir, branchUrl, cb) {
    git.getBranches(baseDir, true, function (err, branchs) {
      if (err) {
        cb(err)
      } else {
        if (branchs.indexOf(branchUrl) != -1) {
          // local has this branch and directly checkout
          run(
            git.cmd,
            ['checkout', branchUrl],
            {
              cwd: baseDir
            },
            cb
          )
        } else if (branchs.indexOf('remotes/origin/' + branchUrl) != -1) {
          // remote branch has exists must checkout
          run(
            git.cmd,
            ['checkout', '-b', branchUrl, 'origin/' + branchUrl],
            {
              cwd: baseDir
            },
            cb
          )
        } else {
          run(
            git.cmd,
            ['checkout', '-b', branchUrl, 'master'],
            {
              cwd: baseDir
            },
            function () {
              // if remove has this branch please track it
              git.push(baseDir, branchUrl, cb)
            }
          )
        }
      }
    })
  }

  git.getChanged = function (baseDir, cb) {
    exec(
      git.cmd + ' status',
      {
        cwd: baseDir
      },
      function (error, stdout, stderr) {
        if (error) {
          cb(error)
        } else {
          cb('', stdout)
        }
      }
    )
  }

  git.tag = function (baseDir, tagName, msg, cb) {
    run(
      git.cmd,
      ['tag', tagName, '-m', '"' + msg + '"'],
      {
        cwd: baseDir
      },
      cb
    )
  }

  git.pushTag = function (baseDir, tagName, cb) {
    run(
      git.cmd,
      ['push', 'origin', tagName],
      {
        cwd: baseDir
      },
      cb
    )
  }

  git.publish = function (baseDir, tagName, msg, cb) {
    git.tag(baseDir, tagName, msg, function (err) {
      if (!err) {
        git.pushTag(baseDir, tagName, cb)
      }
    })
  }

  git.commitAll = function (baseDir, msg, callback) {
    run(
      git.cmd,
      ['add', '-A'],
      {
        cwd: baseDir
      },
      function (error, stdout, stderr) {
        if (!error) {
          // run commit now
          run(
            git.cmd,
            ['commit', '-m', '"' + msg + '"'],
            {
              cwd: baseDir
            },
            function (error, stdout) {
              if (error) {
                callback(error)
              } else {
                git.push(baseDir, callback)
              }
            }
          )
        } else {
          callback(error, stdout, stderr)
        }
      }
    )
  }

  git.fetch = function (baseDir, callback) {
    run(
      git.cmd,
      ['fetch', '-p'],
      {
        cwd: baseDir
      },
      callback
    )
  }

  git.info = function (baseDir, callback) {
    function getGitUrl (callback) {
      exec(
        git.cmd + ' config --local --get remote.origin.url',
        {
          cwd: baseDir
        },
        function (err, stdout) {
          if (err && err.code == 1) {
            // 处理没有remote url的情况
            callback(null, '')
          } else {
            callback(err, stdout ? stdout.replace(/\r|\n/, '') : stdout)
          }
        }
      )
    }

    async.series(
      {
        rootUrl: function (cb) {
          getGitUrl(cb)
        },
        branchName: function (cb) {
          git.getCurrentBranch(baseDir, cb)
        },
        url: function (cb) {
          getGitUrl(cb)
        },
        vs: function (cb) {
          cb(null, 'git')
        }
      },
      function (err, results) {
        if (err) {
          callback(err)
        } else {
          results.parsed = git_url_parse(results.rootUrl || '')
          callback(null, results)
        }
      }
    )
  }

  git.cmd = cmd

  return git
}

function run (cmd, args, options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }
  var ps = spawn(
    cmd,
    args,
    Object.assign(
      {},
      {
        stdio: 'inherit'
      },
      options
    )
  )

  ps.on('exit', function (data) {
    cb && cb()
  })
}
