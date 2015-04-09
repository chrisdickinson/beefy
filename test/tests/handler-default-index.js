var defaultIndex = require('../../lib/handlers/default-index.js')
  , concat = require('concat-stream')
  , http = require('http')
  , path = require('path')
  , mock = require('mock')
  , url = require('url')
  , fs = require('fs')

module.exports = testDefaultIndexHandler

if(module === require.main) {
  require('../index.js')(testDefaultIndexHandler)
}

function testDefaultIndexHandler(test) {
  var staticDir = path.join(__dirname, '..', 'fixtures', 'static')
    , currentReadFile

  var injected = mock('../../lib/handlers/default-index.js', {
      fs: makeFS()
  })

  test('handles fs.read error via output + 404', function(assert) {
    var handler = injected({}, {error: logError}, _404)
      , err = new Error
      , logged

    currentReadFile = function(filepath, enc, ready) {
      arguments[arguments.length - 1](err)
    }

    runServerAndRequest(handler, {accept: 'html'}, function(res, body) {
      assert.equal(res.statusCode, 404)
      assert.equal(logged, err.stack)
      assert.end()
    })

    function logError(what) {
      logged = what
    }
  })

  test('does not handle non-html requests', function(assert) {
    var handler = injected({}, {error: logError}, _404)
      , err = new Error
      , logged = null

    currentReadFile = function(filepath, enc, ready) {
      throw new Error('should never make it here')
    }

    runServerAndRequest(handler, {accept: 'tea'}, function(res, body) {
      assert.equal(res.statusCode, 404)
      assert.equal(logged, null)
      assert.end()
    })

    function logError(what) {
      logged = what
    }
  })

  test('sets a default index', function(assert) {
    var handler = defaultIndex({}, {error: logError}, _404)
      , err = new Error
      , logged = null

    runServerAndRequest(handler, {accept: 'html'}, function(res, body) {
      fs.readFile(
          path.join(__dirname, '..', '..', 'lib', 'handlers', 'default.html')
        , 'utf8'
        , onread
      )

      function onread(err, str) {
        assert.equal(res.statusCode, 200)
        assert.equal(logged, null)
        assert.equal(body + '', str.replace('{{entry}}', ''))
        assert.end()
      }
    })

    function logError(what) {
      logged = what
    }
  })

  test('accepts overrideable default index', function(assert) {
    var handler = defaultIndex({
            generatedIndex: __filename
        }, {error: logError}, _404)
      , err = new Error
      , logged = null

    runServerAndRequest(handler, {accept: 'html'}, function(res, body) {
      fs.readFile(
          __filename
        , 'utf8'
        , onread
      )

      function onread(err, str) {
        assert.equal(res.statusCode, 200)
        assert.equal(logged, null)
        assert.equal(body + '', str.replace(/\{\{entry\}\}/g, ''))
        assert.end()
      }
    })

    function logError(what) {
      logged = what
    }
  })

  test('accepts http requests without accept headers', function(assert) {
    var handler = defaultIndex({}, {error: logError}, _404)
      , err = new Error
      , logged = null

    runServerAndRequest(handler, {}, function(res, body) {
      assert.equal(res.statusCode, 404)
      assert.equal(logged, null)
      assert.equal(body + '', 'not found')
      assert.end()
    })

    function logError(what) {
      logged = what
    }
  })

  test('accepts disableable default index', function(assert) {
    var handler = defaultIndex({
            generatedIndex: false
        }, {error: logError}, _404)
      , err = new Error
      , logged = null

    runServerAndRequest(handler, {accept: 'html'}, function(res, body) {
      assert.equal(res.statusCode, 404)
      assert.equal(logged, null)
      assert.equal(body + '', 'not found')
      assert.end()
    })

    function logError(what) {
      logged = what
    }
  })

  test(
      'replaces {{entry}} with first available entry point'
    , testReplaceEntry
  )

  function testReplaceEntry(assert) {
    var entries = {'/expect/hello.js': 'womp'}

    var handler = defaultIndex({entries: entries}, {error: logError}, _404)
      , err = new Error
      , logged = null

    runServerAndRequest(handler, {accept: 'html'}, function(res, body) {
      fs.readFile(
          path.join(__dirname, '..', '..', 'lib', 'handlers', 'default.html')
        , 'utf8'
        , onread
      )

      function onread(err, str) {
        assert.equal(res.statusCode, 200)
        assert.equal(logged, null)
        assert.equal(body + '', str.replace('{{entry}}', '/expect/hello.js'))
        assert.end()
      }
    })

    function logError(what) {
      logged = what
    }
  }

  function makeFS() {
    return {readFile: readFile}
  }

  function readFile() {
    return currentReadFile.apply(this, arguments)
  }

  function runServerAndRequest(handler, headers, ready) {
    var server = http.createServer(function(req, resp) {
      handler(server, req, resp, url.parse(req.url, true))
    })

    server.listen(12456, onlistening)

    function onlistening() {
      var opts = url.parse(
          'http://127.0.0.1:12456/'
      )

      opts.headers = headers
      http.get(opts, onresponse)
    }

    function onresponse(resp) {
      resp.pipe(concat(function(data) {
        server.close(function() {
          ready(resp, data)
        })
      }))
    }
  }

  function _404(server, req, resp, parsed) {
    resp.writeHead(404, {'content-type': 'text/plain'})
    resp.end('not found')
  }
}
