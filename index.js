var http = require('http')
  , spawn = require('child_process').spawn
  , url = require('url')
  , path = require('path')
  , fs = require('fs')

var filed = require('filed')
  , LiveReloadServer = require('live-reload')
  , response_stream = require('response-stream')
  , optimist = require('optimist').argv
  , colors = require('colors')
  , through = require('through')

var help = require('./help')
  , fake_index_html = fs.readFileSync(path.join(__dirname, 'fake_index.html'), 'utf8')

var argv = process.argv.slice(/node/.test(process.argv[0]) ? 2 : 1)
  , CWD = process.cwd()
  , browserify_path = which_browserify()
  , browserify_args = null
  , ENTRY_POINT_TARGET
  , ENTRY_POINT_URL
  , LIVE_PORT
  , PORT

if(!get_args()) {
  return process.exit(1)
}

info('using '+browserify_path.replace(CWD, '.'))

var RESPONSE_MAP = [
    'grey'
  , 'grey'
  , 'green'
  , 'magenta'
  , 'yellow'
  , 'red'
]

http.createServer(function(req, resp) {
  var parsed = url.parse(req.url, true)
    , pathname = parsed.pathname.slice(1) || 'index.html'
    , filepath = path.resolve(path.join(CWD, pathname))
    , logged_pathname = '/'+pathname
    , logged_color = null 
    , query = parsed.query || {}
    , start = Date.now()
    , bytesize = 0
    , stream
    , args
    , bfy

  if(pathname === ENTRY_POINT_URL || 'browserify' in query) {
    args = [
      pathname === ENTRY_POINT_URL ? ENTRY_POINT_TARGET : filepath
    ].concat(browserify_args)

    logged_pathname = logged_pathname + ' -> ' + [browserify_path]
      .concat(args)
      .map(function(xxx) { return xxx.replace(CWD, '.') })
      .join(' ').magenta

    bfy = spawn(browserify_path, args)
    stream = response_stream(bfy.stdout)

    logged_color = 'underline'
    stream.setHeader('content-type', 'text/javascript')

    bfy.stderr.pipe(process.stdout)
    var error = []
    bfy.stderr.on('data', [].push.bind(error))
    bfy.stderr.on('end', function() {
      if(error.length) {
        bfyerror(error.join(''))
      }
    })
  } else if(fs.existsSync(filepath)) {
    stream = fs.createReadStream(filepath)
  } else if(/html/.test(req.headers.accept || '')) {
    logged_pathname = logged_pathname.blue + ' ' + '(generated)'.grey
    stream = response_stream(fake_index(query))
    stream.setHeader('content-type', 'text/html')
  } else {
    stream = response_stream(through())
    stream.writeHead(404, {'content-type': 'text/plain'})
    process.nextTick(function() {
      stream.end('not found')
    })
  }

  stream.pipe(resp)
  stream.on('end', log)
  stream.on('data', function(data) {
    bytesize += data.length
  })

  function log() {
    var code = resp.statusCode + ''

    console.log(
        code[RESPONSE_MAP[code.charAt(0)]] + ' '
      + pad(Date.now() - start + 'ms', 6) + ' '
      + pad(sized(bytesize), 9).grey + ' '
      + logged_pathname
    )
  }

  function bfyerror(data) {
    resp.end('('+function(error) {
      var pre = document.createElement('pre')
      pre.textContent = error
      document.body.children.length ?
        document.body.insertBefore(pre, document.body.children[0]) : 
        document.body.appendChild(pre)
    }+'('+JSON.stringify(data+'')+'))')
  }
}).listen(PORT)

if(optimist.live) {
  LIVE_PORT = optimist.live === true ? 9967 : optimist.live

  LiveReloadServer({
    port: LIVE_PORT
  })
}

function fake_index(query) {
  var stream = through()
    , index_path
    , live_text
    , html

  index_path = query.p || ENTRY_POINT_URL.replace(CWD, '')

  if(query.p) {
    index_path += '?browserify'
  }

  live_text = '<script src="http://localhost:' + LIVE_PORT + '"></script>'
  html = fake_index_html
    .replace('{{ PATH }}', index_path)
    .replace('{{ EXTRA }}', LIVE_PORT ? live_text : '')

  process.nextTick(function() {
    stream.end(html)     
  })

  return stream
}

function get_args() {
  if(!argv.length || optimist.h || optimist.help) {
    return help()
  }

  for(var i = 0, len = argv.length; i < len; ++i) {
    if(argv[i] === '--') {
      break
    }
  }

  browserify_args = argv.splice(i+1, argv.length - i)

  argv[0] = argv[0].split(':')
  ENTRY_POINT_TARGET = argv[0][0]
  ENTRY_POINT_URL = argv[0][~~(1 % argv[0].length)]
  ENTRY_POINT_TARGET = path.resolve(
    path.join(CWD, ENTRY_POINT_TARGET)
  )
  ENTRY_POINT_URL = ENTRY_POINT_URL.replace(/^\.\//g, '')


  PORT = +argv[1] || 9966
  info('listening on '+PORT)
  return true
}

function which_browserify() {
  if(optimist.browserify) {
    return optimist.browserify
  }

  var local = path.join(CWD, 'node_modules/.bin/browserify')
  if(fs.existsSync(local)) {
    return local
  }
  return 'browserify'
}

function info(what) {
  console.log(what.grey)
}

function sized(bytesize) {
  var powers = ['B', 'KB', 'MB', 'GB']
    , curr
    , next

  for(var i = 0, len = powers.length; i < len; ++i) {
    curr = Math.pow(1024, i)
    next = Math.pow(1024, i + 1) 

    if(bytesize < next) {
      return (bytesize / curr).toFixed(2).replace(/\.?0+$/g, '') + powers[i]
    }
  }
  return (bytesize / curr) + 'gib'
}

function pad(s, n, w) {
  while(s.length < n) {
    s = (w || ' ') + s
  }
  return s
}
