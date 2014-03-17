var extract = require('../../lib/extract-port.js')
  , path = require('path')
  , mock = require('mock')

extract = mock('../../lib/extract-port.js', {
    portfinder: mockPortfinder()
})

module.exports = testExtractPort

if(module === require.main) {
  require('../index.js')(testExtractPort)
}

function testExtractPort(test) {
  test('uses parsed.port', function(assert) {
    var expect = ~~(Math.random() * 1024) + 1

    extract({port: expect, _: [1]}, function(err, port, remain) {
      assert.equal(err, null, 'no error')
      assert.equal(port, expect)
      assert.deepEqual(remain, [1])
      assert.end()
    })
  })

  test('uses positional number arg', function(assert) {
    var expect = ~~(Math.random() * 1024) + 1

    extract({_: ['-w', 'boop', expect]}, function(err, port, remain) {
      assert.equal(err, null, 'no error')
      assert.equal(port, expect)
      assert.deepEqual(remain, ['-w', 'boop'])
      assert.end()
    })
  })

  test('falls back to portfinder: success', function(assert) {
    var expect = ~~(Math.random() * 1024) + 1

    mockPortfinder.port = expect

    extract({_: ['beep', 'boop']}, function(err, port, remain) {
      assert.equal(err, null, 'no error')
      assert.equal(port, expect)
      assert.deepEqual(remain, ['beep', 'boop'])
      assert.end()
    })
  })

  test('falls back to portfinder: failure', function(assert) {
    mockPortfinder.port = null

    extract({_: ['beep', 'boop']}, function(err, port, remain) {
      assert.ok(err, 'error')
      assert.end()
    })
  })
}

function mockPortfinder() {
  return {
      getPort: getPort
  }

  function getPort(ready) {
    process.nextTick(function() {
      mockPortfinder.port === null ?
        ready(new Error('no port')) :
        ready(null, mockPortfinder.port)
    })
  }
}
