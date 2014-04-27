var normalize = require('../../lib/normalize-entry-points.js')
  , path = require('path')

module.exports = testNormalizeEntryPoints

if(module === require.main) {
  require('../index.js')(testNormalizeEntryPoints)
}

function testNormalizeEntryPoints(test) {
  test('resolves "file:repr"', function(assert) {
    assert.deepEqual(normalize(['file:repr', 'file2:repr2']), {
        '/repr': path.join(process.cwd(), 'file')
      , '/repr2': path.join(process.cwd(), 'file2')
    })

    assert.end()
  })

  test('resolves ":repr"', function(assert) {
    assert.deepEqual(normalize([':repr']), {
        '/repr': null
    })

    assert.end()
  })

  test('resolves "file"', function(assert) {
    assert.deepEqual(normalize(['file']), {
        '/file': path.join(process.cwd(), 'file')
    })

    assert.end()
  })

  test('file can be relative (./file, .\\file)', function(assert) {
    var args = ['./file', '../file2', './ex/file3', '../ex/file4']

    assert.deepEqual(normalize(args), {
        '/file': path.join(process.cwd(), 'file')
      , '/file2': path.join(process.cwd(), '..', 'file2')
      , '/ex/file3': path.join(process.cwd(), 'ex', 'file3')
      , '/ex/file4': path.join(process.cwd(), '..', 'ex', 'file4')
    })

    assert.end()
  })

  test('file can be implicitly relative (file)', function(assert) {
    assert.deepEqual(normalize(['file', 'file/path']), {
        '/file': path.join(process.cwd(), 'file')
      , '/file/path': path.join(process.cwd(), 'file', 'path')
    })

    assert.end()
  })

  test('file can be unix absolute (/file)', function(assert) {
    assert.deepEqual(normalize(['/file']), {
        '/file': path.resolve('/file')
    })
    assert.end()
  })
}
