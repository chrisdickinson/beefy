var parseArgs = require('../../lib/args-to-options.js')
  , lookup = require('dotpathlookup')
  , path = require('path')
  , mock = require('mock')

module.exports = testArgsToOptions

if(module === require.main) {
  require('../index.js')(testArgsToOptions)
}

function testArgsToOptions(test) {
  var browserify = path.dirname(require.resolve('browserify'))
    , watchify = path.dirname(require.resolve('watchify'))

  test('fake bad bundler', function(assert) {
    var fake = mock('../../lib/args-to-options.js', {
        '../../lib/setup-bundlers.js': bad_bundler
    })

    var expectedError = new Error

    fake([], __dirname, function(err) {
      assert.equal(err, expectedError)
      assert.end()
    })

    function bad_bundler() {
      var ready = arguments[arguments.length - 1]

      process.nextTick(function() {
        ready(expectedError)
      })
    }
  })

  test('bundler command autofind', function(assert) {
    var subargs = ['--bundler', '[', '--', 'bfy', ']', '--', '-z']

    var args_to_result = [
        [['--browserify', 'expected'], 'handler.bundler.command', 'expected']
      , [['--bundler', 'expected'], 'handler.bundler.command', 'expected']
      , [['--no-watchify'], 'handler.bundler.command.bundler', browserify]
      , [['--browserify', 'expected'], 'handler.bundler.legacy', true]
      , [['--bundler', 'expected'], 'handler.bundler.legacy', true]
      , [[], 'handler.bundler.command.bundler', watchify]

      , [['--index', 'expect'], 'handler.generatedIndex', 'expect']
      , [['-i', 'expect'], 'handler.generatedIndex', 'expect']
      , [[], 'handler.generatedIndex', undefined]

      , [['--cwd', 'expect'], 'handler.realCwd', __dirname]
      , [['--cwd', 'expect'], 'handler.cwd', 'expect']
      , [[], 'handler.cwd', __dirname]

      , [['-i', 'expect'], 'handler.generatedIndex', 'expect']
      , [[], 'handler.generatedIndex', undefined]

      , [['--live'], 'handler.live.rate', 2000]
      , [['-l'], 'handler.live.rate', 2000]
      , [[], 'handler.live', false]

      , [['--help'], 'open.showHelp', true]
      , [['-h'], 'open.showHelp', true]
      , [[], 'open.showHelp', false]

      , [['-p', 2020], 'open.openURL', 'http://127.0.0.1:2020']
      , [['--url', 'any'], 'open.openURL', 'any']
      , [['-u', 'any'], 'open.openURL', 'any']

      , [['--open'], 'open.openBrowser', true]
      , [['--url'], 'open.openBrowser', true]
      , [['-u'], 'open.openBrowser', true]
      , [['-o'], 'open.openBrowser', true]

      , [['--port', 2020], 'open.port', 2020]
      , [['-p', 2020], 'open.port', 2020]
      , [['9966'], 'open.port', 9966]

      , [['-h'], 'open.showHelp', true]
      , [[], 'open.showHelp', false]

      , [['9999', '--', '-d', '-z'], 'handler.bundler.flags.1', '-z']
      , [subargs, 'handler.bundler.flags.0', '-z']
      , [['--bundler', 'bfy'], 'handler.bundler.flags.0', undefined]
      , [['--', '-d'], 'handler.bundler.flags.0', '-d']
      , [['--debug'], 'handler.bundler.flags.0', '-d']
      , [[], 'handler.bundler.flags.0', '-d']
      , [['--debug=false'], 'handler.bundler.flags.0', undefined]
      , [['--debug', 'false'], 'handler.bundler.flags.0', undefined]
    ]

    var pending = args_to_result.length

    args_to_result.forEach(function(tuple, idx) {
      parseArgs(tuple[0], __dirname, function(err, opts) {
        assert.equal(
            lookup(tuple[1])(opts)
          , tuple[2]
          , (tuple[0].length ? tuple[0].join(' ') : '<default>') +
            ' should yield `' +
            tuple[2] + '` at `opts.' +
            tuple[1] + '`.'
        )

        !--pending && assert.end()
      })
    })
  })
}
