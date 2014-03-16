module.exports = trigger

var mutate = require('../index.js').mutate
  , through = require('through')

function trigger(arg) {
  return {
      bundle: bundle
  }

  function bundle() {
    var stream = through()

    mutate(stream, arg)

    return stream
  }
}
