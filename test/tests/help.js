var help = require('../../lib/help.js')

module.exports = testHelp

if(module === require.main) {
  require('../index.js')(testHelp)
}

function testHelp(test) {
  test('outputs information to stderr', function(assert) {
    var output = null

    help({error: capture})
    assert.ok(output, 'information is present in beefy help output')
    assert.end()

    function capture(what) {
      output = what
    }
  })
}
