module.exports = handleEntryPoints

var ansicolors = require('ansicolors')
  , Buffer = require('buffer').Buffer
  , through = require('through')

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

  if(bundlerOpts.legacy) {
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

    args.unshift(bundlerOpts.command.bundler, entryPath)
    parsed.loggedPathname = ansicolors.magenta(
        parsed.pathname + ' ➞ ' + args.map(toLocal).join(' ')
    )
    args.shift()
    args.shift()

    bundler = bundlerOpts.command(entryPath)
    bundler.stderr.pipe(accumError(resp))
    resp.setHeader('content-type', 'text/javascript')
    bundler.stdout.pipe(resp)
  }

  function toLocal(file) {
    return file.replace(opts.cwd, '.')
  }

  function accumError(resp) {
    var stream = through(write, end)
      , error = []

    return stream

    function write(buf) {
      error.push(buf)
    }

    function end() {
      if(error.length) {
        io.error(Buffer.concat(error))
        resp.end(
            '(' + outputDOMError + ')(' + JSON.stringify(error + '') + ')'
        )
      }

      stream.queue(null)
    }
  }

  // ###############################################
  // ## WARNING! this function is stringified and ##
  // ## sent down to the browser. do not rely     ##
  // ## on outer scopes!                          ##
  // ###############################################
  function outputDOMError(error) {
    if(!document.body) {
      return document.addEventListener('DOMContentLoaded', function() {
        outputDOMError(error)
      })
    }

    var pre = document.createElement('pre')

    pre.textContent = error

    document.body.children.length ?
      document.body.insertBefore(pre, document.body.children[0]) :
      document.body.appendChild(pre)
  }
}
