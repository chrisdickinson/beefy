# beefy

a local development server designed to work with browserify.

it:

* can live reload your browser when your code changes (if you want)
* works with whatever version of browserify or watchify; globally installed or 
  locally installed to `node_modules/`.
* will spit compile errors out into the browser so you don't have that
  1-2 seconds of cognitive dissonance and profound ennui that follows
  refreshing the page only to get a blank screen.
* will spit out a default `index.html` for missing routes so you don't
  need to even muck about with HTML to get started
* serves up static files with grace and aplomb (and also appropriate
  mimetypes)
* is designed to fall away gracefully, as your project gets bigger.
* loves you, unconditionally

## how do I get it?

`npm install -g beefy`; and if you want to always have a browserify available
for beefy to use, `npm install -g browserify`.

## usage

```javascript
$ cd directory/you/want/served
$ beefy path/to/thing/you/want/browserified.js [PORT] [-- browserify args]
```

## what bundler does it use?

Beefy searches for bundlers in the following order:

* First, it checks your local project's node_modules for watchify.
* Then it checks locally for browserify.
* Failing that, it checks for a global watchify.
* Then falls back to a global browserify.

#### `path/to/file.js`

the path to the file you want browserified. can be just a normal node module.
you can also alias it: `path/to/file.js:bundle.js` if you want -- so all requests
to `bundle.js` will browserify `path/to/file.js`. this is helpful for when you're
writing `gh-pages`-style sites that already have an index.html, and expect the
bundle to be pregenerated and available at a certain path.

You may provide multiple entry points, if you desire!

#### `--browserify command`
#### `--bundler command`

use `command` instead of `browserify` or `./node_modules/.bin/browserify`.

~~in theory, you could even get this working with `r.js`, but that would probably
be scary and bats would fly out of it. but it's there if you need it!~~ if you want
to use `r.js` with beefy, you'll need a config that can write the resulting bundle
to stdout, and you can run beefy with `beefy :output-url.js --bundler r.js -- -o config.js`.

**NB:** This will not work in Windows.

#### `--live`

Enable live reloading. this'll start up a sideband server and an `fs` watch on
the current working directory -- if you save a file, your browser will refresh.

if you're not using the generated index file, beefy has your back -- it'll still
automatically inject the appropriate script tag.

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

#### `--index=path/to/file`

Provide your own default index! This works great for single page apps,
as every URL on your site will be redirected to the same HTML file. Every
instance of `{{entry}}` will be replaced with the entry point of your app.

## api

```javascript
var beefy = require('beefy')
  , http = require('http')

var handler = beefy('entry.js')

http.createServer(handler).listen(8124)
```

Beefy defaults the `cwd` to the directory of the file requiring it,
so it's easy to switch from CLI mode to building a server.

As your server grows, you may want to expand on the information you're
giving beefy:

```javascript
var beefy = require('beefy')
  , http = require('http')

http.createServer(beefy({
    entries: ['entry.js']
  , cwd: __dirname
  , live: true
  , quiet: false
  , bundlerFlags: ['-t', 'brfs']
  , unhandled: on404
})).listen(8124)

function on404(req, resp) {
  resp.writeHead(404, {})
  resp.end('sorry folks!')
}
```

### beefy(opts: BeefyOptions, ready: (err: Error) => void)

Create a request handler suitable for providing to `http.createServer`.
Calls `ready` once the appropriate bundler has been located. If `ready`
is not provided and a bundler isn't located, an error is thrown.

### BeefyOptions

Beefy's options are a simple object, which may contain the following
attributes:

* `cwd`: String. The base directory that beefy is serving. Defaults to the
directory of the module that **first** required beefy.
* `quiet`: Boolean. Whether or not to output request information to the console. Defaults to true.
* `live`: Boolean. Whether to enable live reloading. Defaults to false.
* `bundler`: null, String, or Function. If a string is given, beefy will
attempt to run that string as a child process whenever the path is given.
If a function is given, it is expected to accept a path and return an 
object comprised of `{stdout: ReadableStream, stderr: ReadableStream}`. If
not given, beefy will search for an appropriate bundler.
* `bundlerFlags`: Flags to be passed to the bundler. Ignored if `bundler`
is a function.
* `entries`: String, Array, or Object. The canonical form is that of an
object mapping URL pathnames to paths on disk relative to `cwd`. If given
as an array or string, entries will be mapped like so: `index.js` will
map `/index.js` to `<cwd>/index.js`.
* `unhandled`: Function accepting req and resp. Called for 404s. If not
given, a default 404 handler will be used.
* `watchify`: defaults to true -- when true, beefy will prefer using watchify
to browserify. If false, beefy will prefer browserify.

Beefy may accept, as a shorthand, `beefy("file.js")` or `beefy(["file.js"])`.

## license

MIT
