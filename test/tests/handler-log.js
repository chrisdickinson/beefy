var ansicolors = require('ansicolors')
  , cli = require('../../lib/cli.js')
  , through = require('through')
  , http = require('http')
  , path = require('path')

module.exports = testLogHandler

if(module === require.main) {
  require('../index.js')(testLogHandler)
}

function testLogHandler(test) {
  test('test response code, time taken', function(assert) {
    run({path: '/dne'}, [], function(err, stdio) {
      var line = stdio.stdout.accum.join('').split('\n')[1]

      assert.equal(line.split(/\s+/g)[0], ansicolors.yellow('404'))
      assert.ok(/\d+ms/.test(line.split(/\s+/g)[1]), 'NNNms time column')
      assert.ok(/\d+B/.test(line.split(/\s+/g)[3]), 'NB size column')
      assert.equal(line.split(/\s+/g)[4], '/dne')
      assert.end()
    })
  })

  test('test no color', function(assert) {
    var file = '/' + path.basename(__filename)

    run({path: file}, ['--no-color'], function(err, stdio) {
      var line = stdio.stdout.accum.join('').split('\n')[1]

      assert.equal(line.split(/\s+/g)[0], '200')
      assert.ok(/\d+ms/.test(line.split(/\s+/g)[1]), 'NNNms time column')
      assert.ok(/\d+KB/.test(line.split(/\s+/g)[2]), 'NB size column')
      assert.equal(line.split(/\s+/g)[3], file)
      assert.end()
    })
  })

  function run(opts, args, ready) {
    var stdout = fakeStdio()
      , stderr = fakeStdio()
      , server
      , resp

    server = cli([12345].concat(args), __dirname, stdout, stderr, onserver)
    opts.host = 'localhost'
    opts.port = '12345'

    function onserver(err, svr) {
      http.get(opts, onres)
        .on('error', ready)
        .end()

      server = svr
      server.once('close', onclose)
    }

    function onres(res) {
      resp = res
      res.on('error', ready).pipe(through(null, onend))
    }

    function onend() {
      server.close()
    }

    function onclose() {
      ready(null, {stdout: stdout, stderr: stderr, response: resp})
    }
  }

  function fakeStdio() {
    var stream = through(write)

    stream.accum = []

    return stream

    function write(buf) {
      stream.accum.push(buf)
    }
  }
}
