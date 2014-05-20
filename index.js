var setupWatchify = require('./lib/bundlers/watchify.js')
  , createHandler = require('./lib/create-handler.js')
  , makeIO = require('./lib/make-io.js')
  , path = require('path')

module.exports = beefy

function beefy(dir, entries, innerHandler, bundlerFlags, quiet, ready) {
  var io = makeIO(process)
    , serverHandler
    , opts
    , idx

  opts = typeof arguments[0] === 'object' ? dir : {
        log: !quiet
      , entries: entries
      , bundler: null
      , cwd: dir
  }

  opts.entries = fixupEntries(opts.entries)
  idx = arguments.length - 1

  while(typeof arguments[idx] !== 'function' && idx !== -1) {
    --idx
  }

  ready = arguments[idx] || Function()
  ready = ready === innerHandler ? Function() : ready

  if(opts.bundler) {
    serverHandler = createHandler(opts, io, innerHandler)
    ready(null, serverHandler)

    return beefyHandler
  }

  setupWatchify(
      path.dirname(require.resolve('watchify'))
    , opts.entries
    , bundlerFlags || (opts.bundler && opts.bundler.flags) || []
    , onready
  )

  return beefyHandler

  function beefyHandler(req, resp) {
    if(!serverHandler) {
      return setTimeout(beefyHandler, 0, req, resp)
    }

    serverHandler(req, resp)
  }

  function fixupEntries(entries) {
    return Array.isArray(entries) ? entries.reduce(toObject, {}) : entries

    function toObject(obj, entry) {
      entry = path.resolve(dir, entry)

      obj[entry.replace(opts.cwd, '/').replace('\\', '/')] = entry

      return obj
    }
  }

  function onready(err, handler) {
    if(err) {
      return ready(err)
    }

    opts.bundler = {command: handler, flags: bundlerFlags || []}

    serverHandler = createHandler(opts, io, innerHandler)
    ready(null, serverHandler)
  }
}
