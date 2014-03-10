module.exports = locateBundler

var which = require('which')
  , path = require('path')
  , fs = require('fs')

function locateBundler(cwd, ready) {
  var allPaths = []
    , last = null
    , cur = cwd
    , pending

  do {
    allPaths.push(
        path.join(cur, 'node_modules', 'bin', 'browserify')
    )
    last = cur
    cur = path.resolve(cur, '..')
  } while(cur !== last)

  runAll(allPaths, function(err, stats) {
    if(err) {
      return ready(err)
    }

    for(var i = 0, len = stats.length; i < len; ++i) {
      if(stats[i] && stats[i].isFile()) {
        break
      }
    }

    if(i === len) {
      return which('browserify', function(err, loc) {
        return ready(err, loc)
      })
    }

    return ready(null, allPaths[i])
  })
}

function runAll(items, ready) {
  var pending = items.length
    , out = []

  if(!pending) {
    return ready(null, [])
  }

  items.forEach(function(item, idx) {
    fs.lstat(item, function(err, stat) {
      // "err" just means we don't see anything.

      out[idx] = stat

      !--pending && ready(null, out)
    })
  })
}
