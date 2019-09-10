const { existsSync } = require('fs')
const { constants } = require('os')
const spawn = require('cross-spawn')
const concat = require('concat-stream')
const path = require('path')
const PATH = process.env.PATH

function createProcess (args = [], opts = null) {
  args = [path.join(process.cwd(), 'index.js')].concat(args)

  // This works for node based CLIs, but can easily be adjusted to
  // any other process installed in the system
  return spawn(
    'node',
    args,
    Object.assign(
      {
        env: Object.assign({}, process.env, {
          NODE_ENV: 'test',
          preventAutoStart: false,
          PATH // This is needed in order to get all the binaries in your current terminal
        }),
        stdio: [null, null, null, 'ipc'] // This enables interprocess communication (IPC)
      },
      opts
    )
  )
}

function executeWithInput (
  args = [],
  processOption = {},
  inputs = [],
  opts = {}
) {
  if (!Array.isArray(inputs)) {
    opts = inputs
    inputs = []
  }
  const tmpInputs = []
  inputs.forEach((i, index) => {
    tmpInputs.push(i)
    tmpInputs.push('\x0D')
  })
  inputs = tmpInputs
  const { timeout = 1000, maxTimeout = 10000 } = opts
  const env = processOption.env || { DEBUG: true }

  const childProcess = createProcess(args, processOption)
  childProcess.stdin.setEncoding('utf-8')

  let currentInputTimeout, killIOTimeout
  const loop = inputs => {
    if (killIOTimeout) {
      clearTimeout(killIOTimeout)
    }
    if (!inputs.length) {
      childProcess.stdin.end()

      // Set a timeout to wait for CLI response. If CLI takes longer than
      // maxTimeout to respond, kill the childProcess and notify user
      killIOTimeout = setTimeout(() => {
        console.error('Error: Reached I/O timeout')
        childProcess.kill(constants.signals.SIGTERM)
      }, maxTimeout)

      return
    }
    let tmptime = timeout
    let input = inputs[0]
    let inputValue = inputs[0]
    let beforeInput
    if (typeof input === 'object') {
      inputValue = input.value
      if (input.timeout) {
        tmptime = input.timeout
      }
      if (input.before) {
        beforeInput = input.before
      }
    }
    currentInputTimeout = setTimeout(() => {
      if (beforeInput) {
        beforeInput()
      }
      childProcess.stdin.write(inputValue)
      // Log debug I/O statements on tests
      if (env && env.DEBUG) {
        console.log('input:', inputs[0])
      }
      loop(inputs.slice(1))
    }, tmptime)
  }
  const promise = new Promise((resolve, reject) => {
    childProcess.stderr.on('data', data => {
      // Log debug I/O statements on tests
      if (env && env.DEBUG) {
        console.log('error:', data.toString())
      }
    })

    // Get output from CLI
    childProcess.stdout.on('data', data => {
      // Log debug I/O statements on tests
      if (env && env.DEBUG) {
        console.log('output:', data.toString())
      }
    })
    childProcess.stderr.once('data', err => {
      childProcess.stdin.end()
      if (currentInputTimeout) {
        clearTimeout(currentInputTimeout)
        inputs = []
      }
      reject(err.toString())
    })

    childProcess.on('error', reject)
    // Kick off the process
    loop(inputs)
    childProcess.stdout.pipe(
      concat(result => {
        if (killIOTimeout) {
          clearTimeout(killIOTimeout)
        }
        resolve({
          code: 0,
          result: result.toString()
        })
      })
    )
  })

  // Appending the process to the promise, in order to
  // add additional parameters or behavior (such as IPC communication)
  promise.attachedProcess = childProcess
  return promise
}
module.exports = { execute: executeWithInput }
