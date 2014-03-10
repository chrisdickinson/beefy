module.exports = normalizeEntryPoints

var path = require('path')

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

  output[normRepr(entryPoint)] = normPath(entryPoint)
}

function normRepr(repr) {
  return '/' + repr.split(path.sep).join('/')
}

function normPath(filepath) {
  return path.resolve(filepath)
}

