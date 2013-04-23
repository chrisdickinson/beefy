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

http.createServer().listen(PORT)

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
