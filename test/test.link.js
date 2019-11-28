const assert = require('assert')
const fs = require('fs')
const path = require('path')
const flutterRecorder = require('../src/utils/flutterRecorder')
const execSync = require('child_process').execSync
const sd = require('./sandbox')
const { cleanFlutterRecord } = require('../src/utils/flutterRecorder')
const androidLinker = require('../src/android/link.js')
const util = require('../src/util')

describe('test link', () => {
  var tflutterPath
  before(() => {
    // execSync('flutter-boot create -n tflutter -R', {
    //   cwd: path.join(process.cwd(), 'test', 'tpl')
    // })
    cleanFlutterRecord()
    tflutterPath = 'tflutter_1_5'
    if (util.getShortFlutterVersion() == '1.9') {     
      tflutterPath = 'tflutter_1_9'
    }
  })

  describe('test iOS link', () => {
    let sandbox
    let tios
    let tflutter
    let iosLinker
    before(async () => {
      sandbox = sd.one()
      tios = await sandbox.getTpl('tios')
      tflutter = await sandbox.getTpl(tflutterPath)
      iosLinker = getIOSLinker()
      iosLinker.setOptions({
        flutterPath: tflutter,
        nativePath: tios,
        projectName: 'tios'
      })
    })

    it('test preparePodfile', () => {
      iosLinker.preparePodfile()
      let path = iosLinker.podfile()
      assert(fs.existsSync(path))
    })

    it('test preparePodHelper', () => {
      iosLinker.preparePodHelper()
      let path = iosLinker.fbpodhelperPath()
      assert(fs.existsSync(path))
    })

    if (util.getShortFlutterVersion().startsWith('1.5')) {
      it('test injectXcode', () => {
        iosLinker.injectXcode()
        let path = iosLinker.pbxproj()
        assert(fs.existsSync(path))
        assert(fs
          .readFileSync(path, 'utf8')
          .includes('Flutter Build Script'))
      })
    }

    it('test addRunnerTargetToProject', () => {
      iosLinker.addRunnerTargetToProject()
      let path = iosLinker.pbxproj()
      assert(fs.existsSync(path))
      assert(fs
        .readFileSync(path, 'utf8')
        .includes('/* Runner */'))
    })

    it('test addRunnerTargetToPodfile', () => {
      iosLinker.addRunnerTargetToPodfile()
      let path = iosLinker.podfile()
      assert(path)
      let rawdata = fs.readFileSync(path, 'utf8')
      assert(rawdata.includes("target 'Runner' do") &&
             rawdata.includes("eval(File.read(File.join(File.dirname(__FILE__), 'fbpodhelper.rb')), binding)"))
    })

    after(() => {
      sd.del(sandbox)
    })
  })

  describe('link command', () => {
    it('test link ios and flutter', async () => {
      const sandbox = sd.one()

      const tios = await sandbox.getTpl('tios')
      const tflutter = await sandbox.getTpl(tflutterPath)
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
        .catch(e => {
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
      tflutter = await sandbox.getTpl(tflutterPath)
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
      const tflutter = await sandbox.getTpl(tflutterPath)
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

function getIOSLinker () {
  let version = util.getShortFlutterVersion()
  if (version.startsWith('1.5')) {
    return require('../src/ios/1.5/link')
  } else if (version.startsWith('1.9')) {
    return require('../src/ios/1.9/link')
  }
}
