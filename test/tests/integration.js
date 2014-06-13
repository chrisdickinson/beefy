var beefy = require('../../index.js')
  , concat = require('concat-stream')
  , through = require('through')
  , mock = require('mock')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')

module.exports = testIntegration
module.exports.stubs = [
    require('../stub-fs-watch.js')
  , require('../http-server.js')
]

if(module === require.main) {
  require('../index.js')(testIntegration)
}

function testIntegration(test) {
  var BASE_DIR = path.join(__dirname, '..', 'fixtures')

  test('GET /no-ext works for no-ext.html', function(assert, server) {
    var cwd = path.join(BASE_DIR, 'no-ext-as-file')

    server.on('request', beefy({
        quiet: true
      , cwd: cwd
    }))

    var headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml'
    }

    http.get({
        host: 'localhost'
      , port: 8124
      , path: '/no-ext'
      , headers: headers
    }, onresponse)

    function onresponse(resp) {
      resp.pipe(concat(ondata))
    }

    function ondata(data) {
      assert.equal(
          data + ''
        , fs.readFileSync(path.join(cwd, 'no-ext.html'), 'utf8')
      )
      assert.end()
    }
  })

  test('GET /no-ext/ works for no-ext.html', function(assert, server) {
    var cwd = path.join(BASE_DIR, 'no-ext-as-file')

    server.on('request', beefy({
        quiet: true
      , cwd: cwd
    }))

    var headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml'
    }

    http.get({
        host: 'localhost'
      , port: 8124
      , path: '/no-ext/'
      , headers: headers
    }, onresponse)

    function onresponse(resp) {
      resp.pipe(concat(ondata))
    }

    function ondata(data) {
      assert.equal(
          data + ''
        , fs.readFileSync(path.join(cwd, 'no-ext.html'), 'utf8')
      )
      assert.end()
    }
  })

  test('GET /no-ext/ gets no-ext/index.html', function(assert, server) {
    var cwd = path.join(BASE_DIR, 'no-ext-as-dir')

    server.on('request', beefy({
        quiet: true
      , cwd: cwd
    }))

    var headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml'
    }

    http.get({
        host: 'localhost'
      , port: 8124
      , path: '/no-ext/'
      , headers: headers
    }, onresponse)

    function onresponse(resp) {
      resp.pipe(concat(ondata))
    }

    function ondata(data) {
      assert.equal(
          data + ''
        , fs.readFileSync(path.join(cwd, 'no-ext', 'index.html'), 'utf8')
      )
      assert.end()
    }
  })

  test('GET /no-ext gets no-ext/index.html', function(assert, server) {
    var cwd = path.join(BASE_DIR, 'no-ext-as-dir')

    server.on('request', beefy({
        quiet: true
      , cwd: cwd
    }))

    var headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml'
    }

    http.get({
        host: 'localhost'
      , port: 8124
      , path: '/no-ext'
      , headers: headers
    }, onresponse)

    function onresponse(resp) {
      resp.pipe(concat(ondata))
    }

    function ondata(data) {
      assert.equal(
          data + ''
        , fs.readFileSync(path.join(cwd, 'no-ext', 'index.html'), 'utf8')
      )
      assert.end()
    }
  })

  test('supports multiple entries', function(assert, server) {
    var cwd = path.join(BASE_DIR, 'multi-bundle')

    var entries = {
        '/bundle-a.js': path.join(cwd, 'a.js')
      , '/bundle-b.js': path.join(cwd, 'b.js')
      , '/test/bundle-c.js': path.join(cwd, 'c.js')
    }

    var pathnames = Object.keys(entries)
      , pending = pathnames.length
      , bundler

    bundler = {
        command: createBundler
      , flags: []
    }

    server.on('request', beefy({
        quiet: true
      , cwd: cwd
      , entries: entries
      , bundler: bundler
    }))

    pathnames.forEach(function(pathname) {
      getPath(pathname, path.basename(entries[pathname]), onready)
    })

    function onready() {
      !--pending && assert.end()
    }

    function createBundler(entryPath) {
      var stdout = through()
        , stderr = through()

      require('browserify/bin/args.js')([entryPath])
        .on('error', function(err) {
          stderr.end(err.stack + '')
        })
        .bundle().pipe(stdout)

      return {stdout: stdout, stderr: stderr}
    }

    function getPath(pathname, value, ready) {
      http.get({
          host: 'localhost'
        , port: 8124
        , path: pathname
      }, onresponse)

      function onresponse(resp) {
        resp.pipe(concat(ondata))
      }

      function ondata(data) {
        assert.equal(
            Function('xs', data + '; return xs')()
          , value
        )
        ready()
      }
    }
  })

  test('concurrent conns do not trigger a warning', function(assert, server) {
    var cwd = path.join(BASE_DIR, 'multi-bundle')

    var entries = {
        '/bundle-a.js': path.join(cwd, 'a.js')
      , '/bundle-b.js': path.join(cwd, 'b.js')
      , '/test/bundle-c.js': path.join(cwd, 'c.js')
    }

    var bundler = {
        command: createBundler
      , flags: []
    }

    server.on('request', beefy({
        quiet: true
      , cwd: cwd
      , entries: entries
      , bundler: bundler
    }))

    var original = console.trace
      , conns = []
      , pending

    console.trace = function() {
      original.apply(console, arguments)

      throw new Error('should not console.trace')
    }

    // NB: 11 is chosen since it's past EventEmitter's default
    // limit of 10.
    for(var i = 0, len = 11; i < len; ++i) {
      conns.push(http.request({
          host: 'localhost'
        , port: 8124
        , path: '/'
        , agent: false
        , headers: {'accept': 'html'}
      }).on('error', console.log))
    }

    pending = conns.length

    conns.forEach(function(req) {
      req.on('response', function(resp) {
        resp.pipe(concat(function(data) {
          !--pending && assert.end()
        }))
      })
      req.end('')
    })

    function createBundler(entryPath) {
      var stdout = through()
        , stderr = through()

      require('browserify/bin/args.js')([entryPath])
        .on('error', function(err) {
          stderr.end(err.stack + '')
        })
        .bundle().pipe(stdout)

      return {stdout: stdout, stderr: stderr}
    }
  })
}
