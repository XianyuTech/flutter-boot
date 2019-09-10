'use strict';

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var iconv = require('iconv-lite');
var async = require('async');
var svnParser = require('svn-info');
var Promise = require('bluebird');

module.exports = function(cmd) {
  var svn = {};

  svn.clone = function(repo, baseDir, cb) {
    //checkout a repo
    run(
      svn.cmd,
      ['co', repo, baseDir || repo.fileName()],
      {
        cwd: baseDir
      },
      cb
    );
  };

  svn.tag = function(source, target, msg, cb) {
    //tag an svn {source} with the provided {name}
    run(
      svn.cmd,
      ['copy', source, target, '-m', '"' + msg.replace('"', "'") + '"'],
      {
        cwd: source
      },
      cb
    );
  };

  svn.update = function(baseDir, cb) {
    //update a local {path} to a given svn {source}
    run(
      svn.cmd,
      ['up', baseDir],
      {
        cwd: baseDir
      },
      cb
    );
  };

  svn.commit = function(baseDir, msg, cb) {
    run(
      svn.cmd,
      ['commit', '-m', '"' + msg + '"'],
      {
        cwd: baseDir
      },
      cb
    );
  };

  svn.status = function(baseDir, cb) {
    run(
      svn.cmd,
      ['status'],
      {
        cwd: baseDir
      },
      cb
    );
  };

  svn.getCurrentBranch = function(baseDir, callback) {
    exec(
      svn.cmd + ' info',
      {
        cwd: baseDir
      },
      function(error, stdout, stderr) {
        if (error) {
          callback(error);
        } else {
          var urlLineText = stdout
            .match(/URL.*/)[0]
            .match(/(branches|trunk)\/[^\/]+/)[0];
          callback(
            null,
            urlLineText.indexOf('trunk') != -1
              ? 'trunk'
              : urlLineText.replace(/(\/|\^|branches)/g, '')
          );
        }
      }
    );
  };

  svn.getBranches = function(baseDir, includeRemote, callback) {
    this.getRootUrl(baseDir, function(err, root) {
      exec(
        svn.cmd + ' list ' + root + '/branches',
        {
          cwd: baseDir
        },
        function(error, stdout, stderr) {
          if (stdout) {
            callback(null, stdout.replace(/\//g, '').split(/\r\n/));
          } else {
            callback(error);
          }
        }
      );
    });
  };

  svn.switch = function(baseDir, branchUrl, cb) {
    if (/http/.test(branchUrl)) {
      run(
        svn.cmd,
        ['sw', branchUrl],
        {
          cwd: baseDir
        },
        cb
      );
    } else {
      this.getRootUrl(baseDir, function(err, root) {
        var appName = root.split('/').slice(-1)[0];
        if (branchUrl == 'trunk') {
          branchUrl = root + '/trunk/' + appName;
        } else {
          branchUrl = root + '/branches/' + branchUrl + '/' + appName;
        }

        run(
          svn.cmd,
          ['sw', branchUrl],
          {
            cwd: baseDir
          },
          cb
        );
      });
    }
  };

  svn.getRootUrl = function(baseDir, cb) {
    if (process.platform === 'win32') {
      exec(
        svn.cmd + ' info',
        {
          cwd: baseDir
        },
        function(error, stdout, stderr) {
          error
            ? cb(error)
            : cb(null, stdout.split(/\r\n/)[4].split(/\:\s/)[1]);
        }
      );
    } else {
      svnParser(baseDir, function(err, result) {
        cb(err, result.repositoryRoot);
      });
    }
  };

  var each = function(s, i, fun) {
    var index = 0;
    while (index <= s.length) {
      (fun || function() {})(s.substr(index, i));
      index += i;
    }
  };

  svn.getChanged = function(baseDir, cb) {
    exec(
      svn.cmd + ' status',
      {
        cwd: baseDir,
        encoding: process.platform === 'win32' ? 'hex' : 'utf8'
      },
      function(error, stdout, stderr) {
        if (error) {
          cb(error);
        } else {
          if (!stdout) {
            cb(null, '');
          } else {
            if (process.platform === 'win32') {
              var arr = [];
              each(stdout, 2, function(data) {
                arr.push(parseInt(data, 16));
              });
              var result = iconv.decode(new Buffer(arr), 'gbk');
              cb(null, result ? result.replace('\r\n\u0000', '') : result);
            } else {
              cb(null, stdout);
            }
          }
        }
      }
    );
  };

  svn.commitAll = function(baseDir, msg, cb) {
    svn.getChanged(baseDir, function(error, result) {
      if (error) {
        cb(error);
      } else {
        if (result) {
          //analyze status result and split to delete list and add list
          var delList = [],
            addList = [];
          result.split('\r\n').forEach(function(line) {
            var st = line.split(/\s{5,}/);
            if (st[0] == '?') {
              addList.push(st[1]);
            } else if (st[0] == '!') {
              delList.push(st[1]);
            }
          });

          async.series(
            [
              function(cb) {
                async.eachSeries(
                  delList,
                  function(p, callback) {
                    run(
                      svn.cmd,
                      ['delete', p],
                      {
                        cwd: baseDir
                      },
                      callback
                    );
                  },
                  cb
                );
              },
              function(cb) {
                async.eachSeries(
                  addList,
                  function(p, callback) {
                    run(
                      svn.cmd,
                      ['add', p],
                      {
                        cwd: baseDir
                      },
                      callback
                    );
                  },
                  cb
                );
              }
            ],
            function(error) {
              if (error) {
                cb(error);
              } else {
                run(
                  svn.cmd,
                  ['commit', '-m', '"' + msg + '"'],
                  {
                    cwd: baseDir
                  },
                  cb
                );
              }
            }
          );
        } else {
          cb();
        }
      }
    });
  };

  svn.info = function(baseDir, cb) {
    async.series(
      {
        rootUrl: function(callback) {
          svn.getRootUrl(baseDir, callback);
        },
        branchName: function(callback) {
          svn.getCurrentBranch(baseDir, callback);
        },
        url: function(callback) {
          svnParser(baseDir, callback);
        },
        vs: function(callback) {
          callback(null, 'svn');
        }
      },
      function(err, results) {
        if (err) {
          cb(err);
        } else {
          cb(null, results);
        }
      }
    );
  };

  svn.publish = svn.deleteBranch = svn.fetch = function() {
    arguments.pop()();
  };

  svn.cmd = cmd;

  return svn;
};

function run(cmd, args, options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = {};
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
  );

  ps.on('exit', function(data) {
    cb();
  });
}
