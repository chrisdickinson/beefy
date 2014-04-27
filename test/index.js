var tape = require('tape')

var all = [
    require('./tests/normalize-entry-points.js')
  , require('./tests/handler-default-index.js')
  , require('./tests/handler-legacy-bundle.js')
  , require('./tests/bundler-browserify.js')
  , require('./tests/bundler-watchify.js')
  , require('./tests/args-to-options.js')
  , require('./tests/create-handler.js')
  , require('./tests/handler-bundle.js')
  , require('./tests/handler-static.js')
  , require('./tests/setup-bundlers.js')
  , require('./tests/extract-port.js')
  , require('./tests/handler-log.js')
  , require('./tests/integration.js')
  , require('./tests/help.js')
  , require('./tests/lint.js')
  , require('./tests/cli.js')
]

if(module === require.main) {
  run(all)
}

module.exports = run

function run(suites) {
  suites = Array.isArray(suites) ? suites : [suites]
  suites.forEach(function(suite) {
    suite((suite.stubs || []).reduce(function(lhs, rhs) {
      return rhs(lhs)
    }, tape))
  })
}
