#!/usr/bin/env node

const fs = require('fs')
const log = require('../log')
const path = require('path')
const fsutils = require('../utils/fsutils')
const execSync = require('child_process').execSync
const ANDROID_SHELL = 'android_shell'
const IOS_SHELL = 'ios_shell'
const TAG = '[ShellProject]'

function androidShellProject (flutterPath) {
  return path.join(flutterPath, ANDROID_SHELL)
}

function iosShellProject(flutterPath) {
  return path.join(flutterPath, IOS_SHELL)
}

/**
 * 生成端壳子工程：用于产物打包等
 * @param {} flutterPath 
 */
function generateShellProject(flutterPath) {
  execSync('flutter make-host-app-editable', {
    cwd: flutterPath,
    stdio: 'inherit'
  })
  fs.renameSync(path.join(flutterPath, 'android'), androidShellProject(flutterPath))
  fs.renameSync(path.join(flutterPath, 'ios'), iosShellProject(flutterPath))
  configAndroidShellProject(flutterPath)
  configIosShellProject(flutterPath)
}

function configAndroidShellProject(flutterPath) {
  if (!fs.existsSync(androidShellProject(flutterPath))) {
    return
  }
  // 默认创建软链接到shell工程
  if (!fs.existsSync(path.join(flutterPath, 'android'))) {
    log.info(TAG, `create android softlink to ${androidShellProject(flutterPath)}`)
    fsutils.createSoftLink(path.join(flutterPath, 'android'), androidShellProject(flutterPath))
  }
}

function configIosShellProject(flutterPath) {
  if (!fs.existsSync(iosShellProject(flutterPath))) {
    return
  }
  // 默认创建软链接到shell工程
  if (!fs.existsSync(path.join(flutterPath, 'ios'))) {
    log.info(TAG, `create ios softlink to ${iosShellProject(flutterPath)}`)
    fsutils.createSoftLink(path.join(flutterPath, 'ios'), iosShellProject(flutterPath))
  }
}

module.exports = {
  generateShellProject
}