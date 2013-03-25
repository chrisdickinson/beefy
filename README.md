# beefy

a local development server designed to work with browserify.

it:

* can live relaod your browser when your code changes (if you want)
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

use `command` instead of `browserify` or `./node_modules/.bin/browserify`.

in theory, you could even get this working with `r.js`, but that would probably
be scary and bats would fly out of it. but it's there if you need it!

#### `--live`

enable live reloading. this'll start up a sideband server and an `fs` watch on
the current working directory -- if you save a file, your browser will refresh.

## the fake index

by default, if you get a URL that doesn't exist (with an `Accept` header that has `html` in it someplace), you'll get the "fake index." this page is setup so that
it automatically includes both the live reload script (if it's enabled) **and** the
path you want browserified. 

## license

MIT
