module.exports = suite

var resolve = require('resolve')
  , tape = require('tape')
  , path = require('path')
  , fs = require('fs')

function suite(baseTest) {
  var modulePath = resolve.sync('chokidar', {
      basedir: path.dirname(resolve.sync('watchify'))
  })

  var chokidar = require(modulePath)

  return test

  function test(name, fn) {
    var oldChokidar = chokidar.watch
      , oldWatch = fs.watch
      , watchers = []

    tape('integration / setup stub fs.watch', function(assert) {
      fs.watch = function() {
        return watchers.unshift(oldWatch.apply(this, arguments)), watchers[0]
      }
      chokidar.watch = function() {
        return watchers.unshift(
            oldChokidar.apply(this, arguments)), watchers[0]
      }

      assert.end()
    })

    var result = baseTest(name, fn)

    tape('integration / teardown stub fs.watch', function(assert) {
      fs.watch = oldWatch
      chokidar.watch = oldChokidar

      // TODO(chrisdickinson): remove this setTimeout
      // once https://github.com/paulmillr/chokidar/pull/130/files is merged.
      setTimeout(function() {
        while(watchers.length) {
          try {
            watchers.shift().close()
          } catch(err) {
            // noop.
          }
        }

        assert.end()
      }, 100)
    })

    return result
  }
}
