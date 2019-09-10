const fs = require('fs')
const path = require('path')

const yaml = require('js-yaml')
const fsutils = require('./fsutils')

function pubspec (flutterPath) {
  return path.join(flutterPath, 'pubspec.yaml')
}

function addDep (flutterPath, dep) {
  console.log(dep)
  __pubspecPath = pubspec(flutterPath)
  const pubspecContent = yaml.load(fs.readFileSync(__pubspecPath, 'utf-8'))
  if(dep.git) {
    pubspecContent.dependencies[dep.name] = {
      git: {
        url: dep.git,
        ref: dep.version
      }
    }
  } else {
    pubspecContent.dependencies[dep.name] = dep.version
  }
  fs.writeFileSync(__pubspecPath, yaml.dump(pubspecContent))
}

module.exports = {
  addDep
}
