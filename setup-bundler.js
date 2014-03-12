module.exports = setupBundler

var findGlobals = require('find-global-packages')
  , concat = require('concat-stream')
  , minimist = require('minimist')
  , resolve = require('resolve')
  , through = require('through')
  , path = require('path')

// local watchify, local browserify ->
// global watchify, global browserify
function setupBundler(cwd, entryPoints, flags, ready) {
  resolve('watchify', {basedir: cwd}, onlocalwatchify)

  function onlocalwatchify(err, localDir) {
    if(err || !localDir) {
      return resolve('browserify', {basedir: cwd}, onlocalbrowserify)
    }

    setupWatchify(path.dirname(localDir), entryPoints, flags, ready)
  }

  function onlocalbrowserify(err, localDir) {
    if(err || !localDir) {
      return findGlobals(onglobals)
    }

    setupBrowserify(path.dirname(localDir), entryPoints, flags, ready)
  }

  function onglobals(err, dirs) {
    // swallow this error.
    dirs = err ? [] : dirs
    dirs = dirs.sort().reverse()

    for(var i = 0, len = dirs.length; i < len; ++i) {
      if(path.basename(dirs[i]) === 'watchify') {
        return setupWatchify(dirs[i], entryPoints, flags, ready)
      }

      if(path.basename(dirs[i]) === 'browserify') {
        return setupBrowserify(dirs[i], entryPoints, flags, ready)
      }
    }

    return ready(new Error('Could not find a suitable bundler!'))
  }
}

function setupWatchify(dir, entryPoints, flags, ready) {
  var watchify = require(dir)

  resolve('browserify/bin/args.js', {basedir: dir}, onmodule)

  function onmodule(err, browserifyModule) {
    var parseArgs = require(browserifyModule)
      , watchifies = {}
      , lastOut = {}
      , lastErr = {}

    for(var key in entryPoints) {
      watchifies[entryPoints[key]] = buildWatchify(entryPoints[key])
    }

    handlePath.bundler = dir

    return ready(null, handlePath)

    function handlePath(entryPath) {
      return watchifies[entryPath]()
    }

    function buildWatchify(entry) {
      var watcher = watchify(parseArgs([entry].concat(flags)))
        , waiting = []

      watcher.on('update', onupdate)
      watcher.on('error', onerror)
      onupdate()

      return onrequest

      function onrequest() {
        var stdout = through()
          , stderr = through()
          , io

        io = {stderr: stderr, stdout: stdout}

        fulfillRequest(io)

        return io
      }

      function fulfillRequest(io) {
        process.nextTick(function() {
          lastOut[entry] ? (io.stdout.end(lastOut[entry]), io.stderr.end()) :
          lastErr[entry] ? (io.stderr.end(lastErr[entry]), io.stdout.end()) :
          waiting.push(fulfillRequest.bind(null, io))
        })
      }

      function onerror(err) {
        watcher.removeListener('update', onupdate)
        setTimeout(buildWatchify, minimist(flags).delay || 600, entry)
      }

      function onupdate() {
        var build = watcher.bundle()
          , caught

        build.on('error', function(err) {
          lastErr[entry] = err.stack || (err + '')
          lastOut[entry] = null

          waiting.slice().forEach(function(fulfill) {
            fulfill()
          })
          waiting.length = 0
        })

        build.pipe(concat(function(data) {
          lastErr[entry] = null
          lastOut[entry] = data

          waiting.slice().forEach(function(fulfill) {
            fulfill()
          })
          waiting.length = 0
        }))
      }
    }
  }

  function noop() {
  }
}

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
