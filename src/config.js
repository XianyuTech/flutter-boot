const fs = require('fs')
const path = require('path')

class fbconfig {
  configPath (nativePath) {
    return path.join(nativePath, 'fbConfig.json')
  }
  localConfigPath (projectPath) {
    return path.join(projectPath, 'fbConfig.local.json')
  }
  read (nativePath) {
    const _configPath = this.configPath(nativePath)
    if (!fs.existsSync(_configPath)) {
      // fs.writeFileSync(_configPath, '')
      return {}
    }
    const config = fs.readFileSync(_configPath, 'utf-8')
    return JSON.parse(config)
  }
  update (nativePath, config) {
    config = Object.assign(this.read(nativePath), config)
    fs.writeFileSync(
      this.configPath(nativePath),
      JSON.stringify(config, null, '\t')
    )
  }
  readLocal (projectPath) {
    const _localConfigPath = this.localConfigPath(projectPath)
    if (!fs.existsSync(_localConfigPath)) {
      // fs.writeFileSync(_localConfigPath, '')
      return {}
    }
    const config = fs.readFileSync(_localConfigPath, 'utf-8')
    return JSON.parse(config)
  }

  updateLocal (projectPath, config) {
    config = Object.assign(this.readLocal(projectPath), config)
    fs.writeFileSync(
      this.localConfigPath(projectPath),
      JSON.stringify(config, null, '\t')
    )
  }

  updateLocalIOSPath (projectPath, iOSPath) {
    this.updateLocal(projectPath, {
      iOSPath: iOSPath
    })
  }

  updateLocalAndroidPath (projectPath, androidPath) {
    this.updateLocal(projectPath, {
      androidPath: androidPath
    })
  }

  updateLocalFlutterPath (projectPath, flutterPath) {
    this.updateLocal(projectPath, {
      flutterPath: path.resolve(projectPath, flutterPath)
    })
  }
}

module.exports = new fbconfig()
