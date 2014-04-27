var createBundler = require('../../lib/handlers/legacy-bundle.js')
  , concat = require('concat-stream')
  , through = require('through')
  , http = require('http')
  , path = require('path')
  , mock = require('mock')
  , url = require('url')

module.exports = testLegacyBundleHandler

if(module === require.main) {
  require('../index.js')(testLegacyBundleHandler)
}

function testLegacyBundleHandler(test) {
  var createBundler = mock('../../lib/handlers/legacy-bundle.js', {
      child_process: createMockChildProcess()
  })

  var lastCommand
    , lastArgs

  test('bundler skips if legacy mode is not set', function(assert) {
    var bundlerOpts = {
        flags: []
      , legacy: false
    }

    var expect = {}

    assert.equal(createBundler({
        bundler: bundlerOpts
      , entries: {}
    }, {}, expect), expect)
    assert.end()
  })

  test('bundler skips if pathname is not in entries', function(assert) {
    var bundlerOpts = {
        flags: []
      , legacy: false
    }

    var expect = {}

    assert.equal(createBundler({
        bundler: bundlerOpts
      , entries: {}
    }, {}, expect), expect)
    assert.end()
  })

  test('path?browserify bundles regardless of entrypoints', function(assert) {
    assert.end()
  })

  function createMockChildProcess() {
    return {spawn: spawn}

    function spawn(command, args) {
      lastCommand = command
      lastArgs = args

      var stdout = currentStdout()
        , stderr = currentStderr()

      return {
          stdout: stdout
        , stderr: stderr
      }
    }
  }

  function _404(server, req, resp, parsed) {
    resp.writeHead(404, {'content-type': 'text/plain'})
    resp.end('not found')
  }
}
