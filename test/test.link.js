const assert = require('assert')
const fs = require('fs')
const path = require('path')
const flutterRecorder = require('../src/utils/flutterRecorder')
const execSync = require('child_process').execSync
const sd = require('./sandbox')
const { cleanFlutterRecord } = require('../src/utils/flutterRecorder')
const androidLinker = require('../src/android/link.js')

describe('test link', () => {
  before(() => {
    // execSync('flutter-boot create -n tflutter -R', {
    //   cwd: path.join(process.cwd(), 'test', 'tpl')
    // })
    cleanFlutterRecord()
  })
  describe('link command', () => {
    it('test link ios and flutter', async () => {
      const sandbox = sd.one()

      const tios = await sandbox.getTpl('tios')
      const tflutter = await sandbox.getTpl('tflutter')
      const response = await sandbox
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
          assert(false, `error occured:${e}`)
        })

      assert(response.code == 0)
      sd.del(sandbox)
    }).timeout(30000)
  })

  describe('test android link', () => {
    var sandbox
    var tandroid
    var tflutter
    before(async () => {
      sandbox = sd.one()
      tandroid = await sandbox.getTpl('tandroid')
      tflutter = await sandbox.getTpl('tflutter')
      androidLinker.setOptions({
        flutterPath: tflutter,
        nativePath: tandroid
      })
    })

    it('test injectCompileOptions', () => {
      androidLinker.injectCompileOptions()
      let buildGradlePath = androidLinker.buildGradle()
      let rawdata = fs.readFileSync(buildGradlePath, 'utf8')
      assert(rawdata.includes(androidLinker.injectionBuildGradle()))
    })

    it('test injectDependency', () => {
      androidLinker.injectDependency()
      const dependencyTag = "implementation project(':flutter')"
      let buildGradlePath = androidLinker.buildGradle()
      let rawdata = fs.readFileSync(buildGradlePath, 'utf8')
      assert(rawdata.includes(dependencyTag))
    })

    it('test injectGradleProperties', () => {
      androidLinker.injectGradleProperties()
      let gradlePropertiesPath = androidLinker.gradleProperties()
      let rawdata = fs.readFileSync(gradlePropertiesPath, 'utf8')
      assert(rawdata.includes(androidLinker.injectionGradleProperties()))
    })

    it('test injectGradleSettings', () => {
      androidLinker.injectGradleSettings()
      let realPath = androidLinker.settingsGradle()
      let rawdata = fs.readFileSync(realPath, 'utf8')
      assert(rawdata.includes(androidLinker.injectionGradleSettings()))
    })

    after(() => {
      sd.del(sandbox)
    })
  })

  describe('link command', () => {
    it('test link android and flutter', async () => {
      const sandbox = sd.one()

      const tandroid = await sandbox.getTpl('tandroid')
      const tflutter = await sandbox.getTpl('tflutter')
      const response = await sandbox
        .execute(
          ['link'],
          {
            cwd: tandroid
          },
          [tflutter],
          {
            maxTimeout: 30000
          }
        )
        .catch(() => {
          assert(false, 'error occured')
        })

      assert(response.code == 0)
      if (response.code == 0) {
        console.log('android link success')
      }
      sd.del(sandbox)
    }).timeout(30000)
  })
})
