var parseArgs = require('../../lib/args-to-options.js')
  , cli = require('../../lib/cli.js')
  , through = require('through')
  , path = require('path')
  , mock = require('mock')
  , http = require('http')

var currentParseArgs = parseArgs

cli = mock('../../lib/cli.js', {
    open: fakeOpen
  , '../../lib/args-to-options.js': maybeFakeParseArgs
})

module.exports = testCLI

if(module === require.main) {
  require('../index.js')(testCLI)
}

// NB: most of CLI is actually covered by tests for
// args-to-options and friends, so we're just cleaning
// up a few corner cases here.
function testCLI(test) {
  test('args-to-options error', function(assert) {
    var expect = new Error

    currentParseArgs = function() {
      var ready = arguments[arguments.length - 1]

      process.nextTick(function() {
        ready(expect)
      })
    }

    cli(['womp'], __dirname, {}, {}, function(err) {
      assert.equal(err, expect)
      assert.end()
      currentParseArgs = parseArgs
    })
  })

  test('help mode', function(assert) {
    var args = ['--help']

    var server = cli(args, __dirname, through(), through(), function(err) {
      assert.ok(err, 'should exit with error')
      assert.end()
      currentParseArgs = parseArgs
    })
  })

  test('open browser mode', function(assert) {
    var args = [12345, '--open']

    cli(args, __dirname, through(), through(), function(err, server) {
      assert.equal(fakeOpen.lastURL, 'http://127.0.0.1:12345')
      assert.end()
      server.close()
      currentParseArgs = parseArgs
    })
  })
}

function fakeOpen(url) {
  fakeOpen.lastURL = url
}

function maybeFakeParseArgs() {
  return currentParseArgs.apply(this, arguments)
}
