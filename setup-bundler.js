module.exports = setupBundler

var findGlobals = require('find-global-packages')
  , resolve = require('resolve')
  , path = require('path')

var setupBrowserify = require('./setup-bundler-browserify')
  , setupWatchify = require('./setup-bundler-watchify')

// local watchify, local browserify ->
// global watchify, global browserify
function setupBundler(cwd, entryPoints, flags, noWatchify, ready, inject) {
  inject = inject || {}

  var browserify = inject.setupBrowserify || setupBrowserify
    , watchify = inject.setupWatchify || setupWatchify
    , find = inject.findGlobals || findGlobals
    , res = inject.resolve || resolve

  noWatchify ?
    onlocalwatchify() :
    res('watchify', {basedir: cwd}, onlocalwatchify)

  function onlocalwatchify(err, localDir) {
    if(err || !localDir) {
      return res('browserify', {basedir: cwd}, onlocalbrowserify)
    }

    watchify(path.dirname(localDir), entryPoints, flags, ready)
  }

  function onlocalbrowserify(err, localDir) {
    if(err || !localDir) {
      return find(onglobals)
    }

    browserify(path.dirname(localDir), entryPoints, flags, ready)
  }

  function onglobals(err, dirs) {
    if(err) {
      return ready(err)
    }

    dirs = dirs.sort()

    for(var i = 0, len = dirs.length; i < len; ++i) {
      if(!noWatchify && path.basename(dirs[i]) === 'watchify') {
        return watchify(dirs[i], entryPoints, flags, ready)
      }

      if(path.basename(dirs[i]) === 'browserify') {
        return browserify(dirs[i], entryPoints, flags, ready)
      }
    }

    return ready(new Error('Could not find a suitable bundler!'))
  }
}
