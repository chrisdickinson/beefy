module.exports = extractPort

var portfinder = require('portfinder')

function extractPort(parsed, ready) {
  var remain
    , port

  remain = parsed._.slice()
  port = parsed.port

  if(!isNaN(+remain[remain.length - 1]) && !parsed.port) {
    port = +remain[remain.length - 1]
    remain = remain.slice(0, -1)
  }

  if(port) {
    return ready(null, port, remain)
  }

  portfinder.basePort = 9966
  portfinder.getPort(function onport(err, port) {
    if(err) {
      return ready(err)
    }

    return ready(null, port, remain)
  })
}
