module.exports = cli

var http = require('http')
  , open = require('open')

var createHandler = require('./create-handler.js')
  , parseArgs = require('./args-to-options.js')
  , makeIO = require('./make-io.js')
  , help = require('./help.js')
  , path = require('path')
  , fs = require('fs')

function cli(argv, cwd, stdout, stderr, ready) {
  var io = makeIO(process, stdout, stderr)

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
      io.log(
          'beefy (v' + version() + ') ' +
          'is listening on ' + openOpts.openURL
      )

      return ready(null, server)
    })
  }

  function version() {
    return JSON.parse(fs.readFileSync(
        path.join(__dirname, '..', 'package.json'))
    ).version
  }
}
