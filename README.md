# beefy

a local development server designed to work with browserify.

it:

* can live reload your browser when your code changes (if you want)
* works with whatever version of browserify; globally installed or 
  locally installed to `node_modules/browserify`.
* will spit compile errors out into the browser so you don't have that
  1-2 seconds of cognitive dissonance and profound ennui that follows
  refreshing the page only to get a blank screen.
* will spit out a default `index.html` for missing routes so you don't
  need to even muck about with HTML to get started
* serves up static files with grace and aplomb (and also appropriate
  mimetypes)
* makes it easy to sanity check your [testling ci tape test suite](http://npm.im/tape/).
* loves you, unconditionally

## how do I get it?

`npm install -g beefy`; and if you want to always have a browserify available
for beefy to use, `npm install -g browserify`.

## usage

```javascript
$ cd directory/you/want/served
$ beefy path/to/thing/you/want/browserified.js PORT -- [browserify args]
```

#### `path/to/file.js`

the path to the file you want browserified. can be just a normal node module.
you can also alias it: `path/to/file.js:bundle.js` if you want -- so all requests
to `bundle.js` will browserify `path/to/file.js`. this is helpful for when you're
writing `gh-pages`-style sites that already have an index.html, and expect the
bundle to be pregenerated and available at a certain path.

#### `--browserify command`
#### `--bundler command`

use `command` instead of `browserify` or `./node_modules/.bin/browserify`.

~~in theory, you could even get this working with `r.js`, but that would probably
be scary and bats would fly out of it. but it's there if you need it!~~ if you want
to use `r.js` with beefy, you'll need a config that can write the resulting bundle
to stdout, and you can run beefy with `beefy :output-url.js --bundler r.js -- -o config.js`.

#### `--live`

enable live reloading. this'll start up a sideband server and an `fs` watch on
the current working directory -- if you save a file, your browser will refresh.

if you're not using the generated index file, put the following script tag above
all of your other JS:

```html
    <script src="/-/live-reload.js"></script>
```

#### `--cwd dir`

serve files as if running from `dir`.

#### `--debug=false`

turn off browserify source map output. by default, beefy automatically inserts
`-d` into the browserify args -- this turns that behavior off.

#### `--open`

automatically discover a port and open it using your default browser.

## api

beefy exports one function which returns a http server created from `http.createServer()`

### beefy(cwd, browserify_path, browserify_args, entry_points, live_reload, log, custom_handler)

* `cwd` (string) root folder beefy uses for serving content. this folder is also watched if the `live_reload` parameter is set.
* `browserify_path` (string) command to execute when browserifying the code. use `'browserify'` for standard behavior.
* `browserify_args` (array of strings) arguments to the browserify command. use e.g. `[ '-d' ]` for debug mode.
* `entry_points` (object) dictionary for your entry points and corresponding file to browserify. see example below.
* `live_reload` (boolean) enable live reload if set
* `log` (function) optional logging callback. see signature below.
* `custom_handler` (function) optional custom request handler. return falsy in handler to delegate back to beefy.

```js
var beefy = require('beefy')
var entry_points = { 'bundle.js': 'path/to/some/js/file.js' }
var server = beefy('path/to/wwwroot', 'browserify', [ '-d' ], entry_points, true, log,
                   custom_handler)
server.listen(9966)

function log(code, time, bytesize, logged_pathname, color) {}

function custom_handler(req, resp) {
  if (req.url == '/foo') {
    // custom handling of '/foo'
    resp.end('bar\n')
    return true
  }
  // delegate back to beefy
}

```

the server object is patched with a `reload()` method which allows you to reload clients programmatically:

```js
var watchr = require('watchr')
watchr.watch({
    path: '/some/other/path/not/watched/by/beefy'
  , listener: function (event, file, stat_now, stat_then) {
      // do stuff ..
      server.reload()
    }
})

```


## the fake index

by default, if you get a URL that doesn't exist (with an `Accept` header that has `html` in it someplace), you'll get the "fake index." this page is setup so that
it automatically includes both the live reload script (if it's enabled) **and** the
path you want browserified. 

## license

MIT
