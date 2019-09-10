const assert = require('assert')
const fs = require('fs')
const path = require('path')
const flutterRecorder = require('../src/utils/flutterRecorder')
const execSync = require('child_process').execSync
const sd = require('./sandbox')

describe('test create', () => {
  describe('flutterRecorder', () => {
    before(() => {
      process.env.FB_DIR = process.cwd()
    })
    // it 是单个测试用例
    it('recordFlutterModule', () => {
      flutterRecorder.recordFlutterModule('fakeflutterpath')
      // assert 用来进行断言，没通过的用例会让mocha输出错误信息
      assert(
        fs.existsSync(flutterRecorder.flutterRecorderPath()) &&
          fs.readFileSync(flutterRecorder.flutterRecorderPath(), 'utf-8') ==
            'fakeflutterpath',
        'flutter module记录失败'
      )
    })
    it('existedFlutterModule', () => {
      assert(flutterRecorder.existedFlutterModule(), 'flutter module记录失败')
    })
    it('cleanFlutterRecord', () => {
      assert(
        !fs.existsSync(flutterRecorder.existedFlutterModule()),
        'flutter无记录'
      )
      flutterRecorder.cleanFlutterRecord()
      assert(
        !fs.existsSync(flutterRecorder.existedFlutterModule()),
        '删除flutter module记录失败'
      )
    })
  })

  describe('create command', () => {
    it('test create', async () => {
      const sandbox = sd.one()
      const response = await sandbox
        .execute(
          ['create'],
          {},
          [
            'tflutter',
            {
              value: '',
              timeout: 1000
              // before: () => {
              //   sandbox.getTpl('fluttergit')
              //   fs.copyFileSync(
              //     path.join(sandbox.path, '.git'),
              //     path.join(sandbox.path, 'tflutter', '.git')
              //   )
              // }
            }
          ],
          {
            maxTimeout: 40000
          }
        )
        .catch(() => {
          assert(false)
        })
      console.log('response')
      console.log(response)
      assert(response.code == 0)
      sd.del(sandbox)
    }).timeout(40000)
  })
})
