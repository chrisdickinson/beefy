module.exports = beefy

var spawn = require('child_process').spawn
  , http = require('http')
  , path = require('path')
  , url = require('url')
  , fs = require('fs')

var response_stream = require('response-stream')
  , sse = require('sse-stream')('/-/live-reload')
  , through = require('through')
  , colors = require('colors')
  , watchr = require('watchr')
  , mime = require('mime')
  , script_injector = require('script-injector')

var fake_index_html = fs.readFileSync(path.join(__dirname, 'fake_index.html'), 'utf8')

function beefy(cwd, browserify_path, browserify_args, entry_points, live_reload, log, custom_handler) {
  var server = http.createServer(beefy_server)

  log = log || function noop() {}
  custom_handler = custom_handler || function noop() {}

  if(!live_reload) {
    return server
  }

  var should_reload = false
    , connections = []

  sse.install(server)
  sse.on('connection', function(conn) {
    connections.push(conn)
    conn.once('end', function() {
      connections.splice(connections.indexOf(conn), 1)
    })
  })

  watchr.watch({
      path: cwd
    , listener: do_reload
    , ignoreHiddenFiles: true
    , ignorePatterns: true
  })

  server.reload = do_reload

  return server

  function beefy_server(req, resp) {
    var parsed = url.parse(req.url, true)
      , pathname = parsed.pathname.slice(1) || 'index.html'
      , filepath = path.resolve(path.join(cwd, pathname))
      , logged_pathname = '/'+pathname
      , query = parsed.query || {}
      , logged_color = null
      , start = Date.now()
      , bytesize = 0
      , stream

    if((pathname in entry_points) || 'browserify' in query) {
      stream = handle_browserify(
          req
        , resp
        , pathname
        , entry_points[pathname]
      )
    }

    if(!stream && fs.existsSync(filepath)) {
      stream = handle_static(filepath)
    }

    if(!stream && live_reload && pathname === '-/live-reload') {
      resp.writeHead(200, {'content-type': 'application/json'})
      resp.end(JSON.stringify({
        should_reload: should_reload
      }))
      return should_reload = false
    }

    if(!stream && live_reload && pathname === '-/live-reload.js') {
      resp.writeHead(200, {'content-type': 'text/javascript'})
      resp.end(';('+live_reload_code+')()')
      return
    }

    if(!stream && custom_handler(req, resp)) return

    if(!stream && /html/.test(req.headers.accept || '')) {
      logged_pathname = logged_pathname.blue + ' ' + '(generated)'
      logged_color = 'grey'
      stream = response_stream(fake_index(query))
      stream.setHeader('content-type', 'text/html')
    }

    if(!stream) {
      stream = response_stream(through())
      stream.writeHead(404, {'content-type': 'text/plain'})
      process.nextTick(function() {
        stream.end('not found')
      })
    }

    logged_pathname = stream.logged_pathname || logged_pathname
    logged_color = stream.logged_color || logged_color
    stream
      .on('end', do_log)
      .on('data', do_tally)
      .pipe(resp)

    function do_log() {
      log(
          ''+resp.statusCode
        , Date.now() - start
        , bytesize
        , logged_pathname
        , logged_color
      )
    }

    function do_tally(data) {
      bytesize += data.length
    }
  }

  function do_reload() {
    should_reload = true
    connections.forEach(function(conn) {
      conn.write('reload')
    })
  }

  function handle_static(filepath) {
    var stat = fs.lstatSync(filepath)
      , stream

    if(stat.isDirectory()) {
      filepath = path.join(filepath, 'index.html')
      if(!fs.existsSync(filepath)) {
        return
      }
      return handle_static(filepath)
    }

    stream = fs.createReadStream(filepath)
    if(live_reload && path.extname(filepath) === '.html') {
      stream = stream.pipe(script_injector(live_reload_code))
    }
    stream = response_stream(stream)
    stream.setHeader('content-type', mime.lookup(filepath))
    return stream
  }

  function handle_browserify(req, resp, original, pathname) {
    var error = []
      , logged_path
      , stream
      , args
      , bfy

    args = pathname === null ?
      browserify_args.slice() :
      [pathname].concat(browserify_args)

    args.unshift(browserify_path)
    logged_path = '/' + original + ' -> ' + args.map(to_local).join(' ')
    args.shift()

    bfy = spawn(browserify_path, args)
    stream = response_stream(bfy.stdout)

    stream.setHeader('content-type', 'text/javascript')
    stream.logged_pathname = logged_path
    stream.logged_color = 'magenta'

    bfy.stderr.on('data', [].push.bind(error))
    bfy.stderr.on('end', function() {
      if(error.length) {
        bfyerror(error.join(''))
        process.stdout.write(error.join(''))
      }
    })

    return stream

    function bfyerror(data) {
      resp.end('('+function errored(error) {
        if(!document.body) {
          return document.addEventListener('DOMContentLoaded', function() {
            errored(error)
          })
        }

        var pre = document.createElement('pre')
        pre.textContent = error

        document.body.children.length ?
          document.body.insertBefore(pre, document.body.children[0]) :
          document.body.appendChild(pre)
      }+'('+JSON.stringify(data+'')+'))')
    }
  }

  function to_local(path) {
    return path.replace(cwd, '.')
  }

  function fake_index(query) {
    var stream = through()
      , ENTRY_POINT_URL = Object.keys(entry_points)[0]
      , index_path
      , html

    index_path = query.p || ENTRY_POINT_URL.replace(cwd, '')

    if(query.p) {
      index_path += '?browserify'
    }

    html = fake_index_html
      .replace('{{ PATH }}', index_path)
      .replace('{{ LIVE }}', live_reload ? '<script src="/-/live-reload.js"></script>' : '')
    process.nextTick(function() {
      stream.end(html)
    })

    return stream
  }

  function live_reload_code() {
    if(window.EventSource) {
      var es = (new EventSource('/-/live-reload'))
      es.onmessage = function(ev) {
        if(ev.data === 'reload') {
          window.location.reload()
        }
      }
    } else {
      setTimeout(iter, 2000)
    }

    function iter() {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', '/-/live-reload')
      xhr.onreadystatechange = function() {
        if(xhr.readyState !== 4) {
          return
        }

        if(/true/.test(xhr.responseText)) {
          return window.location = window.location
        }
        xhr =
        xhr.onreadystatechange = null
        setTimeout(iter, 2000)
      }

      xhr.send(null)
    }
  }
}
