module.exports = keepTheGate

function keepTheGate(opts, io, nextHandler) {
  if (!opts.localonly) {
    return nextHandler;
  }

  return handle;

  function handle(server, req, resp, parsed) {
    // Only permit requests from/to localhost. All others will get 404.
    if (req.socket.localAddress !== '127.0.0.1' ||
	req.socket.remoteAddress !== '127.0.0.1') {
      resp.writeHead(404, {'content-type': 'text/plain'})
      resp.end('not found ):')
    } else {
      return nextHandler(server, req, resp, parsed);
    }
  }
}
