module.exports = handleLiveReload

var responsify = require('response-stream')
  , inject = require('script-injector')
  , ignore = require('ignorepatterns')
  , watch = require('chokidar').watch
  , through = require('through')
  , path = require('path')
  , fs = require('fs')

var liveReloadCode = fs.readFileSync(
    path.join(__dirname, '..', 'frontend-js', 'live-reload.js')
  , 'utf8'
)

function handleLiveReload(opts, io, nextHandler) {
  if(!opts.live) {
    return nextHandler
  }

  var lastUpdate = Date.now()
    , pending = []

  watch(opts.cwd, {
      ignored: ignore
    , useFsEvents: true
    , usePolling: false
    , ignoreInitial: true
  }).on('all', onupdate)

  opts = opts.live
  opts.rate = +opts.rate || 1000
  opts.rate = Math.max(100, Math.min(opts.rate, 1000))

  return handle

  function handle(server, req, resp, parsed) {
    if(parsed.pathname === '/-/live-reload') {
      resp.writeHead(200, {'content-type': 'application/json'})

      pending.push(function ontimeout() {
        resp.end(JSON.stringify({
            lastUpdate: lastUpdate
        }))
        pending.splice(pending.indexOf(ontimeout), 1)
      })

      return setTimeout(pending[pending.length - 1], 60000)
    }

    // script-injector expects to be able to wrap & execute
    // the incoming code itself. so, we're wrapping it prior
    // to handing it over.
    var liveReloadInjection =   'function live() { (' + liveReloadCode + ')' +
          '(' + lastUpdate + ',' + opts.rate + ') }'
      , injector = inject(liveReloadInjection)
      , lazyResponse
      , piped

    lazyResponse = responsify(through())
    injector.pipe(resp)
    injector.on('error', function(err) {
      io.error(err.stack || err.message || 'script injection error')
    })

    lazyResponse
      .on('setHeader', setHeaderListener)
      .on('writeHead', writeHeadListener)

    return nextHandler(server, req, lazyResponse, parsed)

    function setHeaderListener(args, prevent) {
      var isCType = args[0].toLowerCase() === 'content-type'
        , isHTML = args[1].toLowerCase() === 'text/html'

      if(isCType) {
        if(isHTML) {
          lazyResponse.pipe(injector)
        } else {
          lazyResponse.pipe(resp)
        }

        lazyResponse.removeListener('setHeader', setHeaderListener)
        lazyResponse.removeListener('writeHead', writeHeadListener)
      }
    }

    function writeHeadListener(args, prevent) {
      var hasCType = 'content-type' in args[1]
        , isHTML

      isHTML = args[1]['content-type'] === 'text/html'

      if(hasCType && isHTML) {
        lazyResponse.pipe(injector)
      } else {
        lazyResponse.pipe(resp)
      }

      lazyResponse.removeListener('setHeader', setHeaderListener)
      lazyResponse.removeListener('writeHead', writeHeadListener)
    }
  }

  function onupdate() {
    lastUpdate = Date.now()

    // remove all functions from pending before
    // calling them so we don't have 'em constantly
    // indexOf-ing for themselves for no purpose.
    var queued = pending.splice(0, pending.length)

    for(var i = 0, len = queued.length; i < len; ++i) {
      queued[i]()
    }
  }
}
