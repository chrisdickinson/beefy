var createBundler = require('../../lib/handlers/bundle.js')
  , concat = require('concat-stream')
  , through = require('through')
  , http = require('http')
  , path = require('path')
  , url = require('url')

module.exports = testBundleHandler

if(module === require.main) {
  require('../index.js')(testBundleHandler)
}

function testBundleHandler(test) {
  test('bundler skips if legacy mode is set', function(assert) {
    var bundlerOpts = {
        flags: []
      , legacy: true
    }

    var expect = {}

    assert.equal(createBundler({
        bundler: bundlerOpts
      , entries: {}
    }, {}, expect), expect)
    assert.end()
  })

  test('bundler skips if no entry points are present', function(assert) {
    var bundlerOpts = {
        flags: []
    }

    var expect = {}

    assert.equal(createBundler({
        bundler: bundlerOpts
    }, {}, expect), expect)
    assert.end()
  })

  test('bundler skips if bundler opt is present', function(assert) {
    var expect = {}

    assert.equal(createBundler({}, {}, expect), expect)
    assert.end()
  })

  test('bundler has stderr', function(assert) {
    var bundlerOpts = {
        command: bundle
      , flags: []
    }

    var stderrText = new Error().stack
      , wroteError
      , entries

    bundle.bundler = 'womp'
    entries = {
        '/a.js': 'a.js'
    }

    var handleBundle = createBundler({
        bundler: bundlerOpts
      , entries: entries
    }, {error: writeError}, _404)

    var server = http.createServer(function(req, resp) {
      handleBundle(server, req, resp, url.parse(req.url, true))
    })

    server.listen(123456, onlistening)

    function onlistening() {
      http.get('http://127.0.0.1:123456/a.js', onresponse)
    }

    function onresponse(resp) {
      resp.pipe(concat(function(data) {
        assert.ok(
            (data + '').indexOf(JSON.stringify(stderrText)) > -1
          , 'error text in output'
        )
        assert.equal(wroteError + '', stderrText)
        server.close(function() {
          assert.end()
        })
      }))
    }

    function writeError(what) {
      wroteError = what
    }

    function bundle() {
      var out = {stdout: through(), stderr: through()}

      process.nextTick(write)

      return out

      function write() {
        out.stderr.end(new Buffer(stderrText))
        out.stdout.end()
      }
    }
  })

  test('bundler has stdout', function(assert) {
    var bundlerOpts = {
        command: bundle
      , flags: []
    }

    var expect = 'hello world'
      , entries

    bundle.bundler = 'womp'
    entries = {
        '/a.js': 'a.js'
    }

    var handleBundle = createBundler({
        bundler: bundlerOpts
      , entries: entries
    }, {}, _404)

    var server = http.createServer(function(req, resp) {
      handleBundle(server, req, resp, url.parse(req.url, true))
    })

    server.listen(123456, onlistening)

    function onlistening() {
      http.get('http://127.0.0.1:123456/a.js', onresponse)
    }

    function onresponse(resp) {
      resp.pipe(concat(function(data) {
        assert.equal(
            data + ''
          , expect
          , 'expected data comes through'
        )
        server.close(function() {
          assert.end()
        })
      }))
    }

    function bundle() {
      var out = {stdout: through(), stderr: through()}

      process.nextTick(write)

      return out

      function write() {
        out.stderr.end()
        out.stdout.end(new Buffer(expect))
      }
    }

  })

  function _404(server, req, resp, parsed) {
    resp.writeHead(404, {'content-type': 'text/plain'})
    resp.end('not found')
  }
}
