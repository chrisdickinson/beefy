module.exports = handleEntryPoints

var accumError = require('../accumulate-error.js')
  , spawn = require('child_process').spawn
  , ansicolors = require('ansicolors')

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

  if(!bundlerOpts || !bundlerOpts.legacy) {
    return nextHandler
  }

  if(!opts.entries || !opts.bundler) {
    return nextHandler
  }

  return handle

  function handle(server, req, resp, parsed) {
    if(!(parsed.pathname in entries) && !('browserify' in parsed.query)) {
      return nextHandler(server, req, resp, parsed)
    }

    var entryPath = entries[parsed.pathname]
      , args = bundlerOpts.flags.slice()
      , bundler
      , output

    if(entryPath) {
      args.unshift(entryPath)
    }

    args.unshift(bundlerOpts.command)
    parsed.loggedPathname = ansicolors.magenta(
        parsed.pathname + ' -> ' + args.map(toLocal).join(' ')
    )
    args.shift()

    bundler = spawn(bundlerOpts.command, args)
    bundler.stderr.pipe(accumError(io.error, resp))
    resp.setHeader('content-type', 'text/javascript')
    bundler.stdout.pipe(resp)
  }

  function toLocal(file) {
    return file.replace(opts.cwd, '.')
  }
}
