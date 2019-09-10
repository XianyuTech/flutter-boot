// const assert = require('assert')
// const fs = require('fs')
// const path = require('path')
// const flutterRecorder = require('../src/utils/flutterRecorder')
// const execSync = require('child_process').execSync
// const sd = require('./sandbox')
// const { cleanFlutterRecord } = require('../src/utils/flutterRecorder')

// describe('test remotelink', () => {
//   before(() => {
//     execSync('flutter-boot create -n tflutter -R', {
//       cwd: path.join(process.cwd(), 'test', 'tpl')
//     })
//     cleanFlutterRecord()
//   })
//   describe('link command', () => {
//     it('test link ios and flutter', async () => {
//       const sandbox = sd.one()

//       const tios = await sandbox.getTpl('tios')
//       const tflutter = await sandbox.getTpl('tflutter')
//       const response = await sandbox
//         .execute(
//           ['remotelink'],
//           {
//             cwd: tios
//           },
//           [
//             'your flutter git',
//             `test`
//           ],
//           {
//             maxTimeout: 40000
//           }
//         )
//         .catch(() => {
//           assert(false, 'error occured')
//         })

//       assert(response.code == 1)
//       sd.del(sandbox)
//     }).timeout(40000)
//   })
// })
