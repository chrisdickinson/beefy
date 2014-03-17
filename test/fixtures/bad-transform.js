var through = require('through')

module.exports = badTransform

function badTransform(filename) {
  var stream = through()

  process.nextTick(function() {
    stream.emit('error', new Error('induced error'))
  })

  return stream
}
