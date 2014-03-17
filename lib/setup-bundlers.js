module.exports = setupBundler

var findGlobals = require('find-global-packages')
  , resolve = require('resolve')
  , path = require('path')

var setupBrowserify = require('./bundlers/browserify.js')
  , setupWatchify = require('./bundlers/watchify.js')

// local watchify, local browserify ->
// global watchify, global browserify
function setupBundler(cwd, entryPoints, flags, noWatchify, ready) {
  noWatchify ?
    onlocalwatchify() :
    resolve('watchify', {basedir: cwd}, onlocalwatchify)

  function onlocalwatchify(err, localDir) {
    if(err || !localDir) {
      return resolve('browserify', {basedir: cwd}, onlocalbrowserify)
    }

    setupWatchify(path.dirname(localDir), entryPoints, flags, ready)
  }

  function onlocalbrowserify(err, localDir) {
    if(err || !localDir) {
      return findGlobals(onglobals)
    }

    setupBrowserify(path.dirname(localDir), entryPoints, flags, ready)
  }

  function onglobals(err, dirs) {
    if(err) {
      return ready(err)
    }

    dirs = dirs.sort()

    for(var i = 0, len = dirs.length; i < len; ++i) {
      if(!noWatchify && path.basename(dirs[i]) === 'watchify') {
        return setupWatchify(dirs[i], entryPoints, flags, ready)
      }

      if(path.basename(dirs[i]) === 'browserify') {
        return setupBrowserify(dirs[i], entryPoints, flags, ready)
      }
    }

    return ready(new Error('Could not find a suitable bundler!'))
  }
}
