var setupBrowserify = require('../../lib/bundlers/browserify.js')
  , concat = require('concat-stream')
  , path = require('path')

module.exports = testBrowserify

if(module === require.main) {
  require('../index.js')(testBrowserify)
}

function testBrowserify(test) {
  var resolved = path.resolve(__dirname, '../fixtures/browserify')

  test('works correctly', function(assert) {
    require(resolved)(function(stream, args) {

    })

    setupBrowserify(resolved, {}, [], onready)

    function onready(err, instantBrowserify) {
      assert.ok(!err, 'no error')

      var result = instantBrowserify('entry')

      assert.ok(result.stdout, 'has stdout')
      assert.ok(result.stderr, 'has stderr')
      assert.end()
    }
  })

  test('stderr works as expected', function(assert) {
    require('../fixtures/browserify')(function(stream, args) {
      process.nextTick(function() {
        stream.emit('error', new Error('expected text'))
      })
    })

    setupBrowserify(resolved, {}, [], onready)

    function onready(err, instantBrowserify) {
      assert.ok(!err, 'no error')

      var result = instantBrowserify('entry')

      assert.ok(result.stdout, 'has stdout')
      assert.ok(result.stderr, 'has stderr')
      result.stderr.pipe(concat(function(data) {
        assert.equal(data.split('\n')[0], 'Error: expected text')
        assert.end()
      }))
    }
  })

  test('stdout works as expected', function(assert) {
    require('../fixtures/browserify')(function(stream, args) {
      process.nextTick(function() {
        stream.end('YES THIS IS DOG')
      })
    })

    setupBrowserify(resolved, {}, [], onready)

    function onready(err, instantBrowserify) {
      assert.ok(!err, 'no error')

      var result = instantBrowserify('entry')

      assert.ok(result.stdout, 'has stdout')
      assert.ok(result.stderr, 'has stderr')
      result.stdout.pipe(concat(function(data) {
        assert.equal(data, 'YES THIS IS DOG')
        assert.end()
      }))
    }
  })
}
