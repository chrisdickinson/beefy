var setupWatchify = require('../../setup-bundler-watchify.js')
  , concat = require('concat-stream')
  , touch = require('touch')
  , path = require('path')
  , fs = require('fs')

module.exports = testWatchify
module.exports.stubs = [
    require('../stub-fs-watch')
]

if(module === require.main) {
  require('../index.js')(testWatchify)
}

function testWatchify(test) {
  var watchifyDir = path.dirname(require.resolve('watchify'))

  var base_path = path.join(
      __dirname
    , '..'
    , 'fixtures'
    , 'example-project'
  )

  var file1 = path.join(base_path, 'file-1.js')
    , file2 = path.join(base_path, 'file-2.js')
    , bad = path.join(base_path, 'bad-file.js')
    , dne = path.join(base_path, 'dne.js')

  test('queues request until bundle is available', function(assert) {
    setupWatchify(watchifyDir, {
        'nog': file2
      , 'dog': file1
    }, [], onready)

    function onready(err, bundler) {
      assert.ok(!err, 'there should be no error')

      touch(file1, function() {
        bundler(file1).stdout.pipe(concat(function(data) {
          expectModule(assert, data, 'YES THIS IS DOG')
          assert.end()
        }))
      })
    }
  })

  test('queues last error until rebuild', function(assert) {
    setupWatchify(watchifyDir, {
        'bad': bad
    }, [], onready)

    function onready(err, bundler) {
      assert.ok(!err, 'there should be no error')

      touch(bad, function() {
        iter(iter.bind(null, assert.end))

        function iter(next) {
          var io = bundler(bad)
            , pending = 2

          io.stdout.pipe(concat(function(data) {
            assert.equal(data + '', '')
            !--pending && next()
          }))

          io.stderr.pipe(concat(function(data) {
            assert.ok(
                /ParseError/.test(data)
              , '"ParseError" should be present in output.'
            )
            !--pending && next()
          }))
        }
      })
    }
  })

  test('queues last result until rebuild', function(assert) {
    setupWatchify(watchifyDir, {
        'good': file1
    }, [], onready)

    function onready(err, bundler) {
      assert.ok(!err, 'there should be no error')

      touch(bad, function() {
        iter(iter.bind(null, assert.end))

        function iter(next) {
          var io = bundler(file1)
            , pending = 2

          io.stdout.pipe(concat(function(data) {
            expectModule(assert, data, 'YES THIS IS DOG')
            !--pending && next()
          }))

          io.stderr.pipe(concat(function(data) {
            assert.equal(data + '', '')
            !--pending && next()
          }))
        }
      })
    }
  })

  test('non-existant file waits for instantiation', function(assert) {
    fs.unlink(dne, function() {
      var expect = JSON.stringify('hello ' + Math.random())

      setupWatchify(watchifyDir, {
          'dne': dne
      }, [], onready)

      function onready(err, bundler) {
        assert.ok(!err, 'there should be no error')

        var io = bundler(dne)
          , pending = 2

        io.stdout.pipe(concat(function(data) {
          expectModule(assert, data, JSON.parse(expect))

          !--pending && assert.end()
        }))

        io.stderr.pipe(concat(function(data) {
          assert.equal(data + '', '')
          !--pending && assert.end()
        }))

        fs.writeFile(dne, 'throw ' + expect, function() {
          // noop
        })
      }
    })
  })

  test('ensure dne is removed', function(assert) {
    fs.unlink(dne, function() {
      assert.end()
    })
  })

  test('bad transform does not break everything', function(assert) {
    var tr = path.join(__dirname, '..', 'fixtures', 'bad-transform.js')

    setupWatchify(watchifyDir, {
        'file1': file1
    }, ['-t', tr], onready)

    function onready(err, bundler) {
      assert.ok(!err, 'there should be no error')

      // HACK: this is a backdoor way of telling
      // the bundler to stop trying to retry watchify.
      setTimeout(bundler._abort, 1000)

      var io = bundler(file1)
        , pending = 2

      io.stdout.pipe(concat(function(data) {
        assert.equal(data + '', '')

        !--pending && assert.end()
      }))

      io.stderr.pipe(concat(function(data) {
        assert.ok(
            /Error: induced/.test(data)
          , '"Error: induced" should be present in output.'
        )
        !--pending && assert.end()
      }))
    }
  })

  test('returns results for different entry points', function(assert) {
    assert.end()
  })

  function expectModule(assert, bundled, value) {
    try {
      Function(bundled)()
      assert.ok(false, 'should have thrown')

    } catch(err) {
      assert.equal(err, value)
    }
  }
}
