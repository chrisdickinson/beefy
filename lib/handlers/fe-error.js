function outputDOMError(error) {
  if(!document.body) {
    return document.addEventListener('DOMContentLoaded', function() {
      outputDOMError(error)
    })
  }

  var pre = document.createElement('pre')

  pre.textContent = error

  document.body.children.length ?
    document.body.insertBefore(pre, document.body.children[0]) :
    document.body.appendChild(pre)
}
