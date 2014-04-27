module.exports = makeIO

function makeIO(process, stdout, stderr) {
  stdout = stdout || process.stdout
  stderr = stderr || process.stderr

  return {
      isTTY: process.stdout.isTTY
    , error: outputError
    , log: outputLog
  }

  function outputLog(what) {
    stdout.write(what)
    stdout.write('\n')
  }

  function outputError(what) {
    stderr.write(what)
    stderr.write('\n')
  }
}
