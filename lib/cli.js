module.exports = cli

var http = require('http')
  , open = require('open')

var createHandler = require('./create-handler.js')
  , parseArgs = require('./args-to-options.js')
  , help = require('./help.js')

function cli(argv, cwd, stdout, stderr, ready) {
  var io = {
      isTTY: process.stdout.isTTY
    , error: outputError
    , log: outputLog
  }

  parseArgs(argv, cwd, function(err, options) {
    if(err) {
      return ready(err)
    }

    var handlerOpts = options.handler
      , openOpts = options.open
      , server

    if(openOpts.help) {
      help(io)

      return ready(null, null)
    }

    server = http.createServer(createHandler(handlerOpts, io))
    server.listen(openOpts.port, function(err) {
      if(err) {
        return ready(err)
      }

      if(openOpts.openBrowser) {
        open(openOpts.openURL)
      }

      server.openURL = openOpts.openURL
      io.log('beefy is listening on ' + openOpts.openURL)

      return server.once('close', ready)
    })
  })

  function outputLog(what) {
    stdout.write(what)
    stdout.write('\n')
  }

  function outputError(what) {
    stderr.write(what)
    stderr.write('\n')
  }
}
