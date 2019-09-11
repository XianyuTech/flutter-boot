const assert = require('assert')
const fs = require('fs')
const path = require('path')
const execSync = require('child_process').execSync
const sd = require('./sandbox')
const { cleanFlutterRecord } = require('../src/utils/flutterRecorder')
const androidLinker = require('../src/android/link.js')

describe('test use', () => {
  before(() => {
    cleanFlutterRecord()
  })
  describe('use command', () => {
    it('use flutterboost in iOS', async () => {
      const sandbox = sd.one()

      const tios = await sandbox.getTpl('tios')
      const tflutter = await sandbox.getTpl('tflutter')
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
        .catch(() => {
          assert(false, 'error occured')
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
