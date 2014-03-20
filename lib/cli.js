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

  return parseArgs(argv, cwd, onparsed)

  function onparsed(err, options) {
    if(err) {
      return ready(err)
    }

    var handlerOpts = options.handler
      , openOpts = options.open
      , server

    if(openOpts.showHelp) {
      help(io)

      return ready(new Error('--help'))
    }

    server = http.createServer(createHandler(handlerOpts, io))
    server.listen(openOpts.port, function(err) {
      if(openOpts.openBrowser) {
        open(openOpts.openURL)
      }

      server.openURL = openOpts.openURL
      io.log('beefy is listening on ' + openOpts.openURL)

      return ready(null, server)
    })
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
