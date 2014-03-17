module.exports = setupBrowserify

var through = require('through')

function setupBrowserify(dir, entryPoints, flags, ready) {
  var parseArgs = require(dir + '/bin/args.js')

  instantiate.bundler = dir

  return ready(null, instantiate)

  function instantiate(entryPath) {
    var stdout = through()
      , stderr = through()
      , bundle

    bundle = parseArgs([entryPath].concat(flags))

    bundle.bundle().on('error', function(err) {
      stderr.end(err.stack + '')
    }).pipe(stdout)

    return {stderr: stderr, stdout: stdout}
  }
}

