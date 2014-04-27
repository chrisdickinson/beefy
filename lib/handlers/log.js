module.exports = handleLog

var responsify = require('response-stream')
  , ansicolors = require('ansicolors')
  , bytesize = require('pretty-bytes')
  , through = require('through')
  , pad = require('leftpad')
  , fs = require('fs')

// to authors of other handlers:
// if you want to add a special path to be
// logged, attach `loggedPathname` to the `parsed`
// url object.
function handleLog(opts, io, nextHandler) {
  if(!opts.log) {
    return nextHandler
  }

  opts = opts.log

  var colorEnabled =
    (opts.color === undefined || opts.color) && io.isTTY

  var statusDigitToColor = [
      'brightBlack'
    , 'brightBlack'
    , 'green'
    , 'magenta'
    , 'yellow'
    , 'red'
  ]

  return handle

  function handle(server, req, resp, parsed) {
    var stream = through(write, end)
      , outer = responsify(stream)
      , start = Date.now()
      , size = 0

    outer.pipe(resp)
    nextHandler(server, req, outer, parsed)

    function write(buf) {
      size += buf.length
      stream.queue(buf)
    }

    function end() {
      var code = resp.statusCode + ''
        , time = (Date.now() - start)
        , output

      output = [
          ansicolors[statusDigitToColor[code[0]]](code)
        , pad(time + 'ms', 6, ' ') + ' '
        , ansicolors.brightBlack(
              pad(bytesize(size).replace(' ', '').toUpperCase(), 9, ' ')
          ) + ' '
        , parsed.loggedPathname || parsed.pathname
      ].join(' ')

      if(!colorEnabled) {
        output = output.replace(/\x1B\[([\d;]+?)m/g, '')
      }

      io.log(output)
      stream.queue(null)
    }
  }
}
