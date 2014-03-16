var lastMutator = Function()

module.exports = bind

bind.mutate = function(stream, args) {
  lastMutator(stream, args)
  lastMutator = Function()
}

function bind(fn) {
  lastMutator = fn
}
