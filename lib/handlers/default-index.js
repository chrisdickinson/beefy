module.exports = handleDefault

var ansicolors = require('ansicolors')
  , path = require('path')
  , fs = require('fs')

function handleDefault(opts, io, nextHandler) {
  var generatedIndex = opts.generatedIndex

  if(generatedIndex === undefined) {
    generatedIndex = path.join(__dirname, 'default.html')
  }

  if(!generatedIndex) {
    return nextHandler
  }

  return handle

  function handle(server, req, resp, parsed) {
    if(!/html/.test(req.headers.accept || '')) {
      return nextHandler(server, req, resp, parsed)
    }

    return fs.readFile(generatedIndex, 'utf8', onfile)

    function onfile(err, data) {
      if(err) {
        io.error(err.stack)

        return nextHandler(server, req, resp, parsed)
      }

      parsed.loggedPathname = ansicolors.blue(parsed.pathname) +
        ' (' + ansicolors.blue('generated') + ')'
      resp.setHeader('content-type', 'text/html; charset=utf-8')
      resp.end(data.replace(
          /\{\{entry\}\}/g
        , Object.keys(opts.entries || {})[0] || ''
      ))
    }
  }
}
