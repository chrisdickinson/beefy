module.exports = accumError

var Buffer = require('buffer').Buffer
  , through = require('through')
  , path = require('path')
  , fs = require('fs')

var DOMError = fs.readFileSync(
    path.join(__dirname, 'frontend-js', 'error.js')
  , 'utf8'
)

function accumError(outputError, resp) {
  var stream = through(write, end)
    , error = []

  return stream

  function write(buf) {
    error.push(buf)
  }

  function end() {
    if(error.length) {
      outputError(Buffer.concat(error))
      resp.end(
          '(' + DOMError + ')(' + JSON.stringify(error + '') + ')'
      )
    }

    stream.queue(null)
  }
}

