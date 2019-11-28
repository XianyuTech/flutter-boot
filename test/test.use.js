const assert = require('assert')
const fs = require('fs')
const path = require('path')
const execSync = require('child_process').execSync
const sd = require('./sandbox')
const { cleanFlutterRecord } = require('../src/utils/flutterRecorder')
const androidLinker = require('../src/android/link.js')
const marketConfigHelper = require('../src/utils/marketConfigHelper')

describe('test use', () => {
  before(() => {
    cleanFlutterRecord()
  })

  describe('market config helper', () => {
    it('test tag match when tagged option is unique', () => {
      const mock = {
        '1': {
          pubspec: {
            name: 'flutter_boost',
            version: '0.1.52'
          }
        }
      }
      assert(
        marketConfigHelper.pubspec(mock, {
          tag: '1'
        }).version == '0.1.52'
      )
    })
    it('test tag match when has default option', () => {
      const mock = {
        '1': {
          pubspec: {
            name: 'flutter_boost',
            version: '0.1.52'
          }
        },
        pubspec: {
          name: 'flutter_boost',
          version: '0.1.53'
        }
      }

      assert(
        marketConfigHelper.pubspec(mock, {
          tag: '1'
        }).version == '0.1.52'
      )
    })
    it('no tag match', () => {
      const mock = {
        '1': {
          pubspec: {
            name: 'flutter_boost',
            version: '0.1.52'
          }
        },
        pubspec: {
          name: 'flutter_boost',
          version: '0.1.53'
        }
      }
      assert(
        marketConfigHelper.pubspec(mock, {
          tag: '2'
        }).version == '0.1.53'
      )
    })
  })
  describe('use command', () => {
    it('use flutterboost in iOS', async () => {
      const sandbox = sd.one()

      const tios = await sandbox.getTpl('tios')
      const tflutter = await sandbox.getTpl('tflutter_1_9')
      await sandbox
        .execute(
          ['link'],
          {
            cwd: tios
          },
          [tflutter],
          {
            maxTimeout: 30000
          }
        )
        .catch((e) => {
          assert(false, `error occured`)
        })
      const response = await sandbox
        .execute(
          ['use'],
          {
            cwd: tios
          },
          ['\n'],
          {
            maxTimeout: 30000
          }
        )
        .catch(() => {
          assert(false, 'error occured')
        })

      assert(response.code == 0)
      sd.del(sandbox)
    }).timeout(30000)
  })
})
