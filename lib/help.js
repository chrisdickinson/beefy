module.exports = help

function help(io) {
/*
beefy path/to/entry.js[:as.js] [PORT] -- [arguments to forward to bundler]

  Spins up a development server on ``http://localhost:PORT`` for working
  with static files and browserifiable JavaScript modules.

  If there's a path it doesn't recognize, it will serve up an empty HTML
  file with your javascript entry point included as a script tag.
  Otherwise you can provide your own ``index.html``.

  All arguments after ``--`` are forwarded to the ``browserify-command``.

  When the browser requests your entry point, it will run
  ``browserify-command`` with the forwarded arguments on the file and pipe
  the results into the response.

  If no PORT is defined, it defaults to 9966.

  If you specify your file in the form ``realfile.js:as-file.js``, any
  request to ``as-file.js`` will browserify ``realfile.js`` and return
  it as the output.

  arguments:

    --browserify command        The command to run to compile your
                                entry point. If not provided,
                                defaults to ``./node_modules/.bin/browserify``
                                and falls back to ``which browserify``
                                if that's not available.

    --live                      Enable live reloading. Reloads the page
                                every time your JavaScript changes.

    --cwd dir                   Serve files as if run from ``dir``.

    --open                      Automatically discover an open port, and
                                open the resulting URL in your
                                default browser.

    --index file                Use a different autogeneration template
                                for index.html.
*/

  var str = help + ''

  io.error(str.slice(str.indexOf('/*') + 3, str.indexOf('*/')))
}
