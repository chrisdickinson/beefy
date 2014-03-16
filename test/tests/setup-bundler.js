var setupBundler = require('../../setup-bundler.js')

module.exports = testResolveOrder

if(module === require.main) {
  return testResolveOrder(require('tape'))
}

function testResolveOrder(test) {
  var currentGlobals = ''
    , resolveable

  var inject = {
      resolve: fakeResolve
    , setupWatchify: fakeResult('watchify')
    , setupBrowserify: fakeResult('browserify')
    , findGlobals: fakeFindGlobals
  }

  test('local watchify resolves first', function(assert) {
    var times = 0

    resolveable = function(what) {
      ++times

      return what === 'watchify'
    }

    setupBundler(__dirname, {}, [], function(err, data) {
      assert.equal(err, null, 'there should be no error')
      assert.equal(data, 'watchify', 'we should have returned watchify')
      assert.equal(times, 1, 'it should be the only thing we tried')
      assert.end()
    }, inject)
  })

  test('local browserify resolves second', function(assert) {
    var times = 0

    resolveable = function(what) {
      ++times

      return what === 'browserify'
    }

    setupBundler(__dirname, {}, [], function(err, data) {
      assert.equal(err, null, 'there should be no error')
      assert.equal(data, 'browserify', 'we should have returned browserify')
      assert.equal(times, 2, 'it should be second thing we tried')
      assert.end()
    }, inject)
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

    setupBundler(__dirname, {}, [], function(err, data) {
      assert.equal(err, null, 'there should be no error')
      assert.equal(data, 'watchify', 'we should have returned watchify')
      assert.equal(times, 2, 'we should have tried both locally first')
      assert.end()
    }, inject)
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

    setupBundler(__dirname, {}, [], function(err, data) {
      assert.equal(err, null, 'there should be no error')
      assert.equal(data, 'browserify', 'we should have returned browserify')
      assert.equal(times, 2, 'we should have tried both locally first')
      assert.end()
    }, inject)
  })

  test('not found resolves to an error', function(assert) {
    var times = 0

    currentGlobals = null 

    resolveable = function(what) {
      ++times

      return false
    }

    setupBundler(__dirname, {}, [], function(err, data) {
      assert.ok(err, 'there should be an error')
      assert.end()
    }, inject)
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
