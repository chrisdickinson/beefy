var setupWatchify = require('./lib/bundlers/watchify.js')
  , createHandler = require('./lib/create-handler.js')
  , makeIO = require('./lib/make-io.js')
  , path = require('path')

var parseArgs = require('./lib/args-to-options.js')

module.exports = beefy

function beefy(opts, ready) {
  var io = makeIO(process, process.stdout, process.stderr)

  opts =
    typeof opts === 'string' ? {entries: [opts]} :
    Array.isArray(opts) ? {entries: opts} :
    opts

  opts.cwd = opts.cwd || path.dirname(module.parent)
  opts.entries = opts.entries || []
  opts.bundlerFlags = opts.bundlerFlags || []
  opts.bundler = opts.bundler || null
  opts.quiet = opts.quiet === undefined ? true : opts.quiet
  opts.live = !!opts.live
  opts.watchify = opts.watchify === undefined ? true : opts.watchify

  var args = ['9999']
    , innerHandler

  if(opts.cwd) {
    args.push('--cwd', opts.cwd)
  }

  if(opts.live) {
    args.push('--live')
  }

  if(typeof opts.bundler === 'string') {
    args.push('--bundler', opts.bundler)
  }

  if(opts.index) {
    args.push('--index', opts.index)
  }

  if('watchify' in opts && !opts.watchify) {
    args.push('--no-watchify')
  }

  args.push('--')
  args = args.concat(opts.bundlerFlags)

  parseArgs(args, opts.cwd, function(err, genOpts) {
    if(err) {
      if(ready) {
        return ready(err)
      }

      throw err
    }

    switch(opts.bundler && typeof opts.bundler) {
      case 'function':
        genOpts.handler.bundler.command = opts.bundler
        break
      case 'object':
        genOpts.handler.bundler = opts.bundler
        break
    }

    genOpts.handler.entries = fixupEntries(opts.entries)
    genOpts.handler.log = opts.quiet ? false : genOpts.handler.log
    innerHandler = createHandler(genOpts.handler, io, opts.unhandled)
  })

  return handler

  function handler(req, resp) {
    if(!innerHandler) {
      return setTimeout(handler, 0, req, resp)
    }

    innerHandler(req, resp)
  }

  function fixupEntries(entries) {
    return Array.isArray(entries) ? entries.reduce(toObject, {}) : entries

    function toObject(obj, entry) {
      entry = path.resolve(opts.cwd, entry)

      obj[entry
        .replace(opts.cwd, '/')
        .replace('\\', '/')
        .replace(/\/+/g, '/')] = entry

      return obj
    }
  }
}
