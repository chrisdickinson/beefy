module.exports = run

var http = require('http')
  , spawn = require('child_process').spawn
  , url = require('url')
  , path = require('path')
  , fs = require('fs')

var portfinder = require('portfinder')
  , serve = require('./server')
  , colors = require('colors')
  , help = require('./help')
  , nopt = require('nopt')
  , open = require('open')

var RESPONSE_MAP = [
    'grey'
  , 'grey'
  , 'green'
  , 'magenta'
  , 'yellow'
  , 'red'
]

var options = {
  'live': Boolean
, 'port': Number
, 'browserify': path
, 'debug': Boolean
, 'help': Boolean
, 'open': String
, 'cwd': path
, 'url': url
}

var shorthands = {
  'l': ['--live']
, 'p': ['--port']
, 'd': ['--debug']
, 'h': ['--help']
, 'o': ['--open']
, 'u': ['--url']
, 'bundler': ['--browserify']
}

function run() {
  if(!process.argv.length) {
    return help()
  }

  for(var i = 0, len = process.argv.length; i < len; ++i) {
    if(process.argv[i] === '--') {
      break
    }
  }

  var browserify_args = process.argv.splice(i+1, process.argv.length - i)
    , parsed = nopt(options, shorthands, process.argv)
    , browserify
    , cwd

  if(parsed.debug === undefined && !parsed.browserify) {
    browserify_args.push('-d')
  }

  if(parsed.help) {
    return help()
  }
 
  cwd = parsed.cwd || process.cwd()
  browserify = which_browserify(parsed, cwd)

  var remain = parsed.argv.remain
    , entry_points
    , port

  if(!remain || !remain.length) {
    return help()
  }

  if(!isNaN(+remain[remain.length - 1]) && !parsed.port) {
    port = +remain[remain.length - 1] 
    entry_points = remain.slice(0, -1)
  } else {
    port = parsed.port || 9966
    entry_points = remain.slice()
  }

  entry_points = entry_points.map(function(entry) {
    return entry.indexOf(':') > -1 ? entry.split(':') : [entry, entry]
  }).reduce(function(lhs, rhs) {
    lhs[rhs[1].replace(/^\.\\/g, '')] = rhs[0] === '' ? null : path.resolve(path.join(cwd, rhs[0]))
    return lhs
  }, {})

  if(parsed.url) {
    open(parsed.url)
  } else if(parsed.open) {
    return portfinder.getPort(function(err, _port) {
      if(err) {
        console.log('could not automatically find port.')
        return        
      }
      port = _port
      done()
      var filePath = parsed.open === 'true' || parsed.open.charAt(0) === '-' ? '' : parsed.open
      open('http://localhost:'+_port+'/'+filePath)
    })    
  }

  return done()

  function done() {
    info('listening on http://localhost:' + port + '/')

    return serve(
        cwd
      , browserify
      , browserify_args
      , entry_points
      , parsed.live
      , log
    ).listen(port)
  }

  function log(code, time, bytesize, logged_pathname, color) {
    if(logged_pathname.indexOf('/-') === 0) {
      return
    }

    if(color) {
      logged_pathname = logged_pathname[color]
    }
    console.log(
        code[RESPONSE_MAP[code.charAt(0)]] + ' '
      + pad(time + 'ms', 6) + ' '
      + pad(sized(bytesize), 9).grey + ' '
      + logged_pathname
    )
  }
}

function which_browserify(parsed) {
  if(parsed.browserify) {
    return parsed.browserify
  }

  var local = path.join(process.cwd(), 'node_modules/.bin/browserify')
  if (process.platform === 'win32') local += '.cmd'
  if(fs.existsSync(local)) {
    return local
  }
  return 'browserify' + ((process.platform === 'win32') ? '.cmd' : '')
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
