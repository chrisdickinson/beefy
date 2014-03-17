var setupBundler = require('../../lib/setup-bundlers.js')
  , mock = require('mock')

module.exports = testResolveOrder

if(module === require.main) {
  require('../index.js')(testResolveOrder)
}

function testResolveOrder(test) {
  var currentGlobals = []
    , resolveable

  var setupBundler = mock('../../lib/setup-bundlers.js', {
      'resolve': fakeResolve
    , '../../lib/bundlers/browserify.js': fakeResult('browserify')
    , '../../lib/bundlers/watchify.js': fakeResult('watchify')
    , 'find-global-packages': fakeFindGlobals
  })

  test('local watchify resolves first', function(assert) {
    var times = 0

    resolveable = function(what) {
      ++times

      return what === 'watchify'
    }

    setupBundler(__dirname, {}, [], false, function(err, data) {
      assert.equal(err, null, 'there should be no error')
      assert.equal(data, 'watchify', 'we should have returned watchify')
      assert.equal(times, 1, 'it should be the only thing we tried')
      assert.end()
    })
  })

  test('local browserify resolves second', function(assert) {
    var times = 0

    resolveable = function(what) {
      ++times

      return what === 'browserify'
    }

    setupBundler(__dirname, {}, [], false, function(err, data) {
      assert.equal(err, null, 'there should be no error')
      assert.equal(data, 'browserify', 'we should have returned browserify')
      assert.equal(times, 2, 'it should be second thing we tried')
      assert.end()
    })
  })

  test('global watchify resolves third', function(assert) {
    var times = 0

    currentGlobals = [
        '/bin/womp/bomp/browserify'
      , '/bin/gary/busey/watchify'
    ]

    resolveable = function(what) {
      ++times

      return false
    }

    setupBundler(__dirname, {}, [], false, function(err, data) {
      assert.equal(err, null, 'there should be no error')
      assert.equal(data, 'watchify', 'we should have returned watchify')
      assert.equal(times, 2, 'we should have tried both locally first')
      assert.end()
    })
  })

  test('global browserify resolves fourth', function(assert) {
    var times = 0

    currentGlobals = [
        '/bin/womp/bomp/browserify'
      , '/bin/gary/busey/jake'
    ]

    resolveable = function(what) {
      ++times

      return false
    }

    setupBundler(__dirname, {}, [], false, function(err, data) {
      assert.equal(err, null, 'there should be no error')
      assert.equal(data, 'browserify', 'we should have returned browserify')
      assert.equal(times, 2, 'we should have tried both locally first')
      assert.end()
    })
  })

  test('not found resolves to an error (1/2)', function(assert) {
    var times = 0

    currentGlobals = null

    resolveable = function(what) {
      ++times

      return false
    }

    setupBundler(__dirname, {}, [], false, function(err, data) {
      assert.ok(err, 'there should be an error')
      assert.end()
    })
  })

  test('not found resolves to an error (2/2)', function(assert) {
    var times = 0

    currentGlobals = []

    resolveable = function(what) {
      ++times

      return false
    }

    setupBundler(__dirname, {}, [], false, function(err, data) {
      assert.ok(err, 'there should be an error')
      assert.end()
    })
  })

  function fakeFindGlobals(ready) {
    process.nextTick(function() {
      currentGlobals === null ?
        ready(new Error('no globals')) :
        ready(null, currentGlobals)
    })
  }

  function fakeResolve(what, where, ready) {
    process.nextTick(function() {
      resolveable(what) ?
        ready(null, '/fake/' + what) :
        ready(new Error)
    })
  }

  function fakeResult(which) {
    return function(dir, entryPoints, flags, ready) {
      ready(null, which)
    }
  }
}
