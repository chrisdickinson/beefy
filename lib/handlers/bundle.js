module.exports = handleEntryPoints

var accumError = require('../accumulate-error.js')
  , ansicolors = require('ansicolors')
  , es = require('event-stream')

var cache = {}

// opts = {
//     entries: {
//         <repr>: <path>
//     }
//   , bundler: {
//         flags: []
//       , command: ""
//     }
// }
function handleEntryPoints(opts, io, nextHandler) {
  var entries = opts.entries
    , bundlerOpts

  bundlerOpts = opts.bundler

  if(!opts.entries || !opts.bundler) {
    return nextHandler
  }

  if(bundlerOpts.legacy) {
    return nextHandler
  }

  return handle

  function handle(server, req, resp, parsed) {
    if(!(parsed.pathname in entries) && !('browserify' in parsed.query)) {
      return nextHandler(server, req, resp, parsed)
    }

    if (opts.cache && cache[parsed.pathname]) {
      resp.setHeader('content-type', 'text/javascript')
      return es.readArray(cache[parsed.pathname]).pipe(resp)
    }

    var entryPath = entries[parsed.pathname]
      , args = bundlerOpts.flags.slice()
      , bundler
      , output

    args.unshift(bundlerOpts.command.bundler, entryPath)
    parsed.loggedPathname = ansicolors.magenta(
        parsed.pathname + ' ➞ ' + args.map(toLocal).join(' ')
    )
    args.shift()
    args.shift()

    bundler = bundlerOpts.command(entryPath)
    bundler.stderr.pipe(accumError(io.error, resp))
    resp.setHeader('content-type', 'text/javascript')
    bundler.stdout.pipe(resp)

    if (opts.cache) {
      bundler.stdout.pipe(es.writeArray(function(err, data) {
        cache[parsed.pathname] = data
      }))
    }
  }

  function toLocal(file) {
    return (file || '').replace(opts.cwd, '.')
  }

}
