const execSync = require('child_process').execSync
const path = require('path')

function execRubySync (name, args) {
  const cmdstr = `ruby ${path.join(
    process.env.FB_DIR,
    'src/scripts/' + name
  )} ${args.join(' ')}`
  console.log(cmdstr)
  execSync(cmdstr, {
    stdio: 'inherit'
  })
}

module.exports = {
  execRubySync
}
