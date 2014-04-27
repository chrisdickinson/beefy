module.exports = handleStatic

var path = require('path')
  , mime = require('mime')
  , fs = require('fs')

function handleStatic(opts, io, nextHandler) {
  var cwd = opts.cwd || process.cwd()

  return handle

  function handle(server, req, resp, parsed) {
    var filepath = path.join.apply(
        path
      , [cwd].concat(parsed.pathname.split('/'))
    )

    var check = [filepath]

    if(/html/.test(req.headers.accept || '')) {
      check.push(path.join(filepath, 'index.html'))
      check.push(filepath + '.html')
    }

    return iter()

    function iter() {
      if(!check.length) {
        return nextHandler(server, req, resp, parsed)
      }

      var currentPath = check.shift()

      fs.lstat(currentPath, function(err, stat) {
        if(err || stat.isDirectory()) {
          return iter()
        }

        resp.setHeader('content-type', mime.lookup(currentPath))
        fs.createReadStream(currentPath)
          .pipe(resp)
      })
    }
  }
}
