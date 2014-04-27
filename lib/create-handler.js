module.exports = createServer

var xtend = require('xtend')
  , http = require('http')
  , url = require('url')

var legacyBundle = require('./handlers/legacy-bundle.js')
  , defaultIndex = require('./handlers/default-index.js')
  , liveReload = require('./handlers/live-reload.js')
  , modernBundle = require('./handlers/bundle.js')
  , serveStatic = require('./handlers/static.js')
  , logRequests = require('./handlers/log.js')

function createServer(opts, io, innerHandler) {
  var handlers
    , handler
    , inner

  // order is important here. the higher
  // in the list, the deeper the handler
  // is in the resolution order.
  handlers = [
      defaultIndex
    , serveStatic
    , legacyBundle
    , modernBundle
    , logRequests
    , liveReload
  ]

  handler = innerHandler || _404

  inner = handlers.reduce(function(lhs, rhs) {
    return rhs(opts, io, lhs)
  }, handler)

  return beefyMainHandler

  function beefyMainHandler(req, resp) {
    var parsed = url.parse(req.url, true)

    return inner(this, req, resp, parsed)
  }

  function _404(server, req, resp, parsed) {
    resp.writeHead(404, {'content-type': 'text/plain'})
    resp.end('not found ):')
  }
}
