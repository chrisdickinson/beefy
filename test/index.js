var tape = require('tape')

var tests = { 
    'normalize-entry-points': require('./tests/normalize-entry-points.js')
  , 'setup-bundler-browserify': require('./tests/setup-bundler-browserify.js')
  , 'setup-bundler': require('./tests/setup-bundler.js')
}

if(module === require.main) {
  return run(tests)
}

module.exports = run

function run(tests) {
  for(var key in tests) {
    tests[key](tape)
  }
}
