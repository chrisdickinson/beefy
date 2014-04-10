module.exports = run

var path = require('path')

if(require.main === module) {
  module.exports(require('tape'))
}

function run(test) {
  var files = [
      path.resolve(__dirname, '..', 'index.js')
    , path.resolve(__dirname, '..', '..', 'index.js')
    , path.resolve(__dirname, '..', '..', 'lib', 'cli.js')
  ]

  test(
      'test lint rules'
    , require('jsl/rules').test(files)
  )
}

