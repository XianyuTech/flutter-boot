const fs = require('fs')
const execSync = require('child_process').execSync
const ncp = require('ncp').ncp
const path = require('path')
const XCODEPROJ_SUFFIX = '.xcodeproj'
const log = require('../log')

let lsCache = {}

function hasFileSync (path, reg) {
  const dirfiles = fs.readdirSync(path.resolve())
  return !dirfiles.every(filename => {
    return !reg.test(filename)
  })
}
function hasFileInList (list, reg) {
  return !list.every(filename => {
    return !reg.test(filename)
  })
}

function ls () {}

function syncLs () {}

function replaceContent (filePath, searchContent, replaceContent) {
  let rawdata = fs.readFileSync(filePath, 'utf8')
  let lines = rawdata.split('\n')
  let searchIndex = lines.findIndex(line => {
    return line.includes(searchContent)
  })
  if (searchIndex > -1) {
    lines[searchIndex] = replaceContent
    fs.writeFileSync(filePath, lines.join('\n'))
    return true
  }
  return false
}

function addContent (filePath, searchContent, addContent) {
  let rawdata = fs.readFileSync(filePath, 'utf8')
  let lines = rawdata.split('\n')
  let isAddContentExist = lines.includes(addContent)
  if (isAddContentExist) {
    return
  }
  let searchIndex = lines.findIndex(line => {
    return line.includes(searchContent)
  })
  if (searchIndex > -1) {
    lines.splice(searchIndex + 1, 0, addContent)
    fs.writeFileSync(filePath, lines.join('\n'))
    return true
  }
  return false
}

function addOrReplaceContent (filePath, searchReg, replaceContent) {
  let rawdata = fs.readFileSync(filePath, 'utf8')
  let isContentExist = rawdata.includes(replaceContent)
  if (isContentExist) {
    return false
  }
  let res = searchReg.test(rawdata)
  if (res) {
    rawdata = rawdata.replace(searchReg, replaceContent)
  } else {
    rawdata = rawdata + replaceContent
  }
  fs.writeFileSync(filePath, rawdata)
  return true
}

function addOrReplaceContentByReg (filePath, searchValue, replaceValue) {
  let rawdata = fs.readFileSync(filePath, 'utf8')
  rawdata = rawdata.replace(searchValue, replaceValue)
  fs.writeFileSync(filePath, rawdata)
  return true
}

function addOrReplaceContentBySurround (
  filePath,
  startContent,
  endContent,
  replaceContent
) {
  let rawdata = fs.readFileSync(filePath, 'utf8')
  let isContentExist = rawdata.includes(replaceContent)

  if (isContentExist) {
    return false
  }
  let startContentIndex = rawdata.indexOf(startContent)
  let endContentIndex = rawdata.indexOf(endContent)
  let injection = rawdata

  const validEnd = !(endContent == '' || endContent == undefined)
  if (
    startContentIndex > -1 &&
    (!validEnd || (endContentIndex > -1 && startContentIndex < endContentIndex))
  ) {
    log.silly('REPLACE_CONTENT',
      rawdata.substring(0, startContentIndex + startContent.length) +
        replaceContent
    )
    injection =
      rawdata.substring(0, startContentIndex + startContent.length) +
      replaceContent +
      (validEnd
        ? rawdata.substring(endContentIndex)
        : rawdata.substring(startContentIndex + startContent.length))
    log.silly('REPLACE_CONTENT',injection)
  } else {
    injection = rawdata + replaceContent
  }
  fs.writeFileSync(filePath, injection)
  return true
}

function createSoftLink (linkPath, targetDir) {
  try {
    fs.unlinkSync(linkPath)
  } catch (e) {}
  fs.symlinkSync(targetDir, linkPath, 'dir')
}

function projectChecker (projectPath) {
  let checker = function () {}
  checker.refresh = () => {
    const dirfiles = fs.readdirSync(projectPath)
    checker.dirfiles = dirfiles
    checker.currentPath = projectPath
    checker.getProjectName(true)
  }
  checker.isAndroid = () => {
    return hasFileInList(checker.dirfiles, /gradle$/)
  }
  checker.isIOS = () => {
    return hasFileInList(
      checker.dirfiles,
      /(xcodeproj)|(xcworkspace)|(Podfile)$/
    )
  }
  checker.isNative = () => {
    return checker.isIOS() || checker.isAndroid()
  }
  checker.gradlePath = () => {
    return path.join(checker.currentPath, 'app/build.gradle')
  }
  checker.getProjectName = (force = false) => {
    if (!force && checker.projectName) {
      return checker.projectName
    }
    if (checker.isIOS()) {
      const dirfiles = checker.dirfiles
      let projectFullName = ''
      dirfiles.every(filename => {
        if (filename.endsWith(XCODEPROJ_SUFFIX)) {
          projectFullName = filename
          return false
        }
        return true
      })
      const projectName = projectFullName.substring(
        0,
        projectFullName.indexOf(XCODEPROJ_SUFFIX)
      )
      checker.projectName = projectName
    } else {
      checker.projectName = path.basename(checker.currentPath)
    }
    return checker.projectName
  }
  checker.xcodeproj = () => {
    return path.join(
      checker.currentPath,
      checker.getProjectName() + XCODEPROJ_SUFFIX
    )
  }
  checker.refresh()
  return checker
}

function copyFolderAsync (source, destination, options = {}) {
  return new Promise((resolve, reject) => {
    if (options.mkdes && !fs.existsSync(destination)) {
      log.silly('COPY_FOLDER', 'create destination')
      execSync(`mkdir -p ${destination}`)
    }
    ncp(source, destination, options, function (err) {
      if (err) {
        reject(err)
        return
      }
      log.silly('COPY_FOLDER', `copy success from ${source} to ${destination}`)
      resolve(true)
    })
  })
}

module.exports = {
  hasFileSync,
  hasFileInList,
  addContent,
  replaceContent,
  createSoftLink,
  projectChecker,
  addOrReplaceContent,
  copyFolderAsync,
  addOrReplaceContentByReg,
  addOrReplaceContentBySurround
}
