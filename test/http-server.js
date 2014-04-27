module.exports = suite

var tape = require('tape')
  , http = require('http')

function suite(baseTest) {
  return test

  function test(name, fn) {
    var server = http.createServer()

    tape('setup server', function(assert) {
      server.listen(8124, function() {
        assert.end()
      })
    })

    baseTest(name, function() {
      var args = [].slice.call(arguments)

      args.push(server)
      fn.apply(this, args)
    })

    tape('teardown server', function(assert) {
      server.close(function() {
        assert.end()
      })
    })
  }
}
