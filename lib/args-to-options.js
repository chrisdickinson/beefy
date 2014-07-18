module.exports = parse

var minimist = require('minimist')
  , path = require('path')

var normalizeEntryPoints = require('./normalize-entry-points.js')
  , setupBundler = require('./setup-bundlers.js')
  , extractPort = require('./extract-port.js')

function parse(argv, cwd, ready) {
  var idx = argv.length
    , nestLevel = 0

  for(var i = 0, len = argv.length; i < len; ++i) {
    if(argv[i] === '[') {
      ++nestLevel
    } else if(argv[i] === ']') {
      --nestLevel
    }

    if(argv[i] === '--' && !nestLevel) {
      idx = i

      break
    }
  }

  var parsed = minimist(argv.slice(0, idx))
    , bundlerFlags = argv.slice(idx + 1)
    , legacyBundlerMode = false
    , entryPoints

  // open options
  parsed.open = parsed.o || parsed.open
  parsed.url = parsed.u || parsed.url || parsed.open
  parsed.help = parsed.h || parsed.help
  parsed.port = parsed.p || parsed.port

  // handler options
  parsed.cwd = parsed.cwd || cwd
  parsed.live = parsed.l || parsed.live
  parsed.debug = parsed.d || parsed.debug
  parsed.bundler = parsed.browserify || parsed.bundler
  parsed.watchify = parsed.watchify === undefined ? true : parsed.watchify
  parsed.index = parsed.i || parsed.index

  if(!parsed.bundler && parsed.debug !== 'false') {
    if(bundlerFlags.indexOf('-d') === -1) {
      bundlerFlags.unshift('-d')
    }
  }

  extractPort(parsed, ongotport)

  function ongotport(err, port, remain) {
    entryPoints = normalizeEntryPoints(remain)
    parsed.port = port

    if(parsed.bundler) {
      legacyBundlerMode = true

      return onbundler(null, parsed.bundler)
    }

    setupBundler(
        cwd
      , entryPoints
      , bundlerFlags
      , !parsed.watchify
      , onbundler
    )
  }

  function onbundler(err, bundler) {
    if(err) {
      return ready(err)
    }

    parsed.bundler = bundler

    return buildOutput()
  }

  function buildOutput() {
    var openOptions = {
        openURL: (typeof parsed.url === 'string' && parsed.url) ||
                 ('http://127.0.0.1:' + parsed.port)
      , openBrowser: !!(parsed.open || parsed.url)
      , showHelp: !!parsed.help
      , port: parsed.port
    }

    var hasColor = {
        color: parsed.color === undefined || parsed.color
    }

    var handlerOptions = {
        live: parsed.live ? {rate: 2000} : false
      , generatedIndex: parsed.index
      , entries: entryPoints
      , log: hasColor
      , cwd: parsed.cwd
      , realCwd: cwd
    }

    handlerOptions.bundler = {
        command: parsed.bundler
      , flags: bundlerFlags
      , legacy: legacyBundlerMode
    }

    ready(null, {
        handler: handlerOptions
      , open: openOptions
    })
  }
}
