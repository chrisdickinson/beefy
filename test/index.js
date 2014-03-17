var tape = require('tape')

var all = [ 
    require('./tests/normalize-entry-points.js')
  , require('./tests/setup-bundler-browserify.js')
  , require('./tests/setup-bundler-watchify.js')
  , require('./tests/setup-bundler.js')
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
