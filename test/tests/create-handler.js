var createHandler = require('../../lib/create-handler.js')
  , lookup = require('dotpathlookup')
  , through = require('through')
  , http = require('http')
  , path = require('path')
  , mock = require('mock')

module.exports = testCreateHandler

if(module === require.main) {
  require('../index.js')(testCreateHandler)
}

function testCreateHandler(test) {
  var mocked = mock('../../lib/create-handler.js', {
      '../../lib/handlers/legacy-bundle.js': mockHandler('legacy-bundle')
    , '../../lib/handlers/default-index.js': mockHandler('default-index')
    , '../../lib/handlers/live-reload.js': mockHandler('live-reload')
    , '../../lib/handlers/bundle.js': mockHandler('bundle')
    , '../../lib/handlers/static.js': mockHandler('static')
    , '../../lib/handlers/log.js': mockHandler('log')
  })

  var currentHandlerGenerator = Function()

  test('ensure handler order', function(assert) {
    var order = []

    currentHandlerGenerator = function(named, opts, io, nextHandler) {
      order.push(named)
    }

    mocked({})

    assert.deepEqual(order, [
        'default-index'
      , 'static'
      , 'legacy-bundle'
      , 'bundle'
      , 'log'
      , 'live-reload'
    ])

    assert.end()
  })

  test('ensure handler override', function(assert) {
    currentHandlerGenerator = function(named, opts, io, nextHandler) {
      return function(server, req, resp, parsed) {
        return nextHandler(server, req, resp, parsed)
      }
    }

    var server = http.createServer(mocked({}, {}, fakeHandler))

    server.listen(12346, onlistening)

    function onlistening() {
      http.get('http://127.0.0.1:12346', onresponse)
    }

    function onresponse(resp) {
      assert.equal(resp.statusCode, 418)
      resp.pipe(through(null, function() {
        server.close(assert.end)
      }))
    }

    function fakeHandler(server, req, resp, parsed) {
      resp.writeHead(418, {
          'content-type': 'liquid/vnd.earl-grey+tea, charset=hot'
      })
      resp.end('ENGAGE')
    }
  })

  test('ensure handler fallback', function(assert) {
    var order = []

    currentHandlerGenerator = function(named, opts, io, nextHandler) {
      return function(server, req, resp, parsed) {
        order.push(named)

        return nextHandler(server, req, resp, parsed)
      }
    }

    var server = http.createServer(mocked({}))

    server.listen(12346, onlistening)

    function onlistening() {
      http.get('http://127.0.0.1:12346', onresponse)
    }

    function onresponse(resp) {
      assert.deepEqual(order, [
          'live-reload'
        , 'log'
        , 'bundle'
        , 'legacy-bundle'
        , 'static'
        , 'default-index'
      ])

      assert.equal(resp.statusCode, 404)
      resp.pipe(through(null, function() {
        server.close(assert.end)
      }))
    }
  })

  function mockHandler(named) {
    return function(opts, io, nextHandler) {
      return currentHandlerGenerator(named, opts, io, nextHandler)
    }
  }
}
