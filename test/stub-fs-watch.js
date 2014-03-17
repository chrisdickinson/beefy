module.exports = suite

var tape = require('tape')
  , fs = require('fs')

function suite(baseTest) {
  return test

  function test(name, fn) {
    var oldWatch = fs.watch
      , watchers = []

    tape('integration / setup stub fs.watch', function(assert) {
      fs.watch = function() {
        return watchers.unshift(oldWatch.apply(this, arguments)), watchers[0]
      }   

      assert.end()
    })

    var result = baseTest(name, fn)

    tape('integration / teardown stub fs.watch', function(assert) {
      fs.watch = oldWatch

      while(watchers.length) {
        try {
          watchers.shift().close()
        } catch(err) {
          // noop.
        }
      }

      assert.end()
    })

    return result
  }
}
