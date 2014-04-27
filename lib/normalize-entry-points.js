module.exports = normalizeEntryPoints

var path = require('path')
  , url = require('url')

function normalizeEntryPoints(entryPoints) {
  // entryPoint ::= file ":" repr
  //              | ":" repr
  //              | file
  //
  // file ::= relativePath
  //        | absolutePath
  //        | implicitRelativePath
  //
  // relativePath ::= "." path
  //
  // absolutePath ::= <path-sep> path
  //
  // implicitRelativePath ::= path
  //
  // path ::= [^\s]+
  //
  // repr ::= [^\s]+
  // -------------------------
  // output is `{repr: path, ...}`.
  // repr's *always* use `/`.
  // path's *may* use `\`.

  var output = {}

  for(var i = 0, len = entryPoints.length; i < len; ++i) {
    addEntryPoint(output, entryPoints[i])
  }

  return output
}

function addEntryPoint(output, entryPoint) {
  var colonIdx = entryPoint.indexOf(':')

  if(colonIdx !== -1) {
    // `repr: null` from ":repr"
    if(colonIdx === 0) {
      output[normRepr(entryPoint.slice(1))] = null

      return
    }

    // `repr: path` from "path:repr"
    entryPoint = entryPoint.split(':')
    output[normRepr(entryPoint[1])] = normPath(entryPoint[0])

    return
  }

  output[normSlashes(normRepr(entryPoint))] = normPath(entryPoint)
}

function normRepr(repr) {
  return '/' + repr.split(path.sep).join('/')
}

function normPath(filepath) {
  return path.resolve(filepath)
}

function normSlashes(urlPath) {
  urlPath = urlPath.replace(/\/\/+/g, '/')

  return url.parse(url.resolve('http://localhost', urlPath)).path
}
