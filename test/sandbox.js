const _del = require('del')
const uuid = require('uuid')
const fs = require('fs')
const path = require('path')
const fsutils = require('../src/utils/fsutils')

const SANDBOX = path.join(process.cwd(), 'test', 'sandbox/')
const cmd = require('./cmd')

function tplfile (name) {
  return path.join(process.cwd(), 'test', 'tpl', name)
}

function one () {
  const _id = uuid()
  const sandbox = path.join(SANDBOX, _id)
  if (fs.existsSync(sandbox)) {
    return tmp()
  } else {
    if (!fs.existsSync(SANDBOX)) {
      fs.mkdirSync(SANDBOX, { recursive: true })
    }
    fs.mkdirSync(sandbox, { recursive: true })
  }
  return {
    _id,
    // sandbox路径
    path: sandbox,
    // 在sandbox下执行命令
    execute: (args, processOption, inputs, opts) => {
      return cmd.execute(
        args,
        Object.assign(
          {
            cwd: sandbox
          },
          processOption
        ),
        inputs,
        opts
      )
    },
    // 将tpl文件复制到sandbox下
    getTpl: type => {
      let target = path.join(sandbox, type)
      if (type == 'fluttergit') {
        target = path.join(sandbox, '.git')
        return fsutils
          .copyFolderAsync(path.join(tplfile('fluttergit'), '.git'), target)
          .then(() => {
            return target
          })
      } else {
        return fsutils.copyFolderAsync(tplfile(type), target).then(() => {
          return target
        })
      }
    }
  }
}

function del (id) {
  _del.sync(SANDBOX)
}

module.exports = {
  one,
  del
}
