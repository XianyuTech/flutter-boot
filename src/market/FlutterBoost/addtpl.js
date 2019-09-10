const fs = require('fs')
const path = require('path')

class AddTPL {
  constructor () {
    this.insertPoints = []
  }

  replace (options) {
    const delegatePath = options.givenDelegateFilePath || this.findDelegate()
    var rawdata = fs.readFileSync(delegatePath, 'utf8')
    this.insertPoints.forEach(p => {
      rawdata.replace(p.search, p.replacement)
    })
  }

  findDelegate (projPath) {
    const dirfiles = fs.readdirSync(projPath)
    const stack = []
    const targetPath = undefined
    dirfiles.forEach(filename => {
      stack.push(path.join(projPath, filename))
    })
    while (stack.length > 0) {
      const curPath = stack.shift()
      if (fs.statSync(curPath).isDirectory()) {
        stack = stack.concat(fs.readdirSync(projPath))
      } else {
        const curname = path.basename(curPath)
        if (curname.toLowerCase() == 'appdelegate.m') {
          targetPath = curPath
          return targetPath
        }
      }
    }
  }
}
