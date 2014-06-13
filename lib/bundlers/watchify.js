module.exports = setupWatchify

var concat = require('concat-stream')
  , minimist = require('minimist')
  , resolve = require('resolve')
  , through = require('through')

function setupWatchify(dir, entryPoints, flags, ready) {
  var watchify = require(dir)

  resolve('browserify/bin/args.js', {basedir: dir}, onmodule)

  function onmodule(err, browserifyModule) {
    if(err) {
      return ready(err)
    }

    var parseArgs = require(browserifyModule)
      , watchifies = {}
      , lastOut = {}
      , lastErr = {}
      , closed

    for(var key in entryPoints) {
      watchifies[entryPoints[key]] = buildWatchify(entryPoints[key])
    }

    handlePath.bundler = dir

    // NB: this is a backdoor way of preventing retries
    // in the tests. eventually all bundlers should grow
    // a `.close()` that allows end users to `.close` a
    // beefy server.
    handlePath.close = function() {
      closed = true

      for(var key in entryPoints) {
        watchifies[entryPoints[key]].close()
      }
    }

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

      onrequest.close = function() {
        if(watcher.close) {
          return watcher.close()
        }
      }

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

        if(!closed) {
          setTimeout(buildWatchify, minimist(flags).delay || 600, entry)
            .unref()
        }
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
}
