var createStatic = require('../../lib/handlers/static.js')
  , concat = require('concat-stream')
  , http = require('http')
  , path = require('path')
  , url = require('url')
  , os = require('os')

module.exports = testStaticHandler

if(module === require.main) {
  require('../index.js')(testStaticHandler)
}

function testStaticHandler(test) {
  var staticDir = path.join(__dirname, '..', 'fixtures', 'static')

  test('test default extensions', function(assert) {
    var parameterized = [
        ['has-index/index.html', 'has-index/index.html', 200, 'plain', 'html']
      , ['has-extname', 'has-extname/index.html', 200, 'html', 'html']
      , ['has-extname.html', 'has-extname.html', 200, 'html', 'html']
      , ['has-index', 'has-index/index.html', 200, 'html', 'html']
      , ['plain-file', 'plain-file.html', 200, 'html', 'html']
      , ['has-index', 'not found', 404, 'plain', 'plain']
      , ['dne', 'not found', 404, 'html', 'plain']
    ]

    var pending = parameterized.length

    parameterized.forEach(function(tuple, idx) {
      var handleStatic = createStatic({
          cwd: staticDir
      }, {}, _404)

      var server = http.createServer(function(req, resp) {
        handleStatic(server, req, resp, url.parse(req.url, true))
      })

      server.listen(12456 + idx, onlistening)

      function onlistening() {
        var opts = url.parse(
            'http://127.0.0.1:' + (12456 + idx) + '/' + tuple[0]
        )

        opts.headers = {
            accept: 'text/' + tuple[3]
        }

        http.get(opts, onresponse)
      }

      function onresponse(resp) {
        assert.equal(resp.statusCode, tuple[2])
        assert.equal(resp.headers['content-type'], 'text/' + tuple[4])
        resp.pipe(concat(function(data) {
          assert.equal((data + '').split(os.EOL)[0], tuple[1])
          server.close(function() {
            !--pending && assert.end()
          })
        }))
      }
    })
  })

  function _404(server, req, resp, parsed) {
    resp.writeHead(404, {'content-type': 'text/plain'})
    resp.end('not found')
  }
}
