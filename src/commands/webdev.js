#!/usr/bin/env node
'use strict'

const ui = require('../ui')
const fs = require('fs')
const path = require('path')
const execSync = require('child_process').execSync
const spawn = require('child_process').spawn

const log = require('../log')
const isEmpty = require('../utils/isEmpty')

const http = require('http')
const express = require('express')
const app = express()
const ejs = require('ejs')

const TAG = '[webdev]'

module.exports = program => {
  program
    .command('wdev')
    .option('-p, --port [name]', '端口号')
    .description('查看flutter web')
    .action(async function () {
      const cmd = arguments[arguments.length - 1]
      log.info(TAG, 'debug flutter web')

      let port
      if (cmd.port) {
        port = cmd.port
      } else {
        port = '30011'
      }

      log.info(TAG, 'building web...')
      execSync('flutter build web')

      const entryPath = path.join(
        process.env.FB_DIR,
        'src',
        'scripts',
        'webindex.html'
      )
      log.info(TAG, 'making entry file...')
      const entryFile = fs.readFileSync(entryPath, 'utf-8')
      const interfaces = require('os').networkInterfaces() // 在开发环境中获取局域网中的本机iP地址
      let ip = ''
      for (var devName in interfaces) {
        var iface = interfaces[devName]
        for (var i = 0; i < iface.length; i++) {
          var alias = iface[i]
          if (
            alias.family === 'IPv4' &&
            alias.address !== '127.0.0.1' &&
            !alias.address.startsWith('169.254.') &&
            !alias.internal
          ) {
            ip = alias.address
            break
          }
        }
      }
      const opts = {
        port,
        ip,
        host: ip + ':' + port
      }

      log.info(TAG, 'add static files...')
      app.use(express.static(path.join(process.cwd(), 'build', 'web')))

      const pages = ['index.html']

      app.get('/entry', function (req, res, next) {
        // util.checkSPM('http://' + opts.host + '/build/channelHome.weex.js', function () {

        // })
        log.info(TAG, 'visit entry')

        res.send(
          ejs.render(entryFile, {
            opts: opts,
            pages: pages
          })
        )
      })
      log.info(TAG, 'creating server...')
      const server = http.createServer(app).listen(opts.port, () => {})
      const addressInfo = server.address()
      log.info(TAG, `listening on:http://${opts.host}`)

      const spawnOpt = [`http://${opts.host}/entry`]
      spawn('open', spawnOpt, { stdio: 'inherit' })
    })
}
