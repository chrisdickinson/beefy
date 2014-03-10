module.exports = handleLiveReload

var ignorepatterns = require('ignorepatterns')
  , responsify = require('response-stream')
  , inject = require('script-injector')
  , through = require('through')
  , watchr = require('watchr')
  , path = require('path')

function handleLiveReload(opts, io, nextHandler) {
  if(!opts.live) {
    return nextHandler
  }

  var lastUpdate = Date.now()
    , pending = []

  watchr.watch({
      path: opts.cwd
    , listener: onupdate
    , ignoreHiddenFiles: true
    , ignorePatterns: true
  })

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

  function ignoreFiles(file) {
    return /[\/\\]\./.test(file) || ignorepatterns.match(path.basename(file))
  }

  // ###############################################
  // ## WARNING! this function is stringified and ##
  // ## sent down to the browser. do not rely     ##
  // ## on outer scopes!                          ##
  // ###############################################
  function liveReloadCode(lastUpdate, updateRate) {
    setTimeout(iter, updateRate)

    function iter() {
      var xhr = new XMLHttpRequest()

      xhr.open('GET', '/-/live-reload')
      xhr.onreadystatechange = function() {
        if(xhr.readyState !== 4) {
          return
        }

        try {
          var change = JSON.parse(xhr.responseText).lastUpdate

          if(lastUpdate < change) {
            window.location.reload()

            return
          }
        } catch(err) {
        }

        xhr =
        xhr.onreadystatechange = null
        setTimeout(iter, updateRate)
      }

      xhr.send(null)
    }
  }
}
