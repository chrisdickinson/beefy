module.exports = script_injector_stream

var fs = require('fs')

var Transform = require('readable-stream/transform')
var hp = require('htmlparser2')

function script_injector_stream(script, options) {
  var self = this;
  if(!(self instanceof script_injector_stream)) {
    return new script_injector_stream(script, options)
  }

  Transform.call(self, options)

  self._script = (script) ? script.toString() : 'console.log(\'You didn\'t provide a script to inject\');'
  self.should_inject = true
  self.html_parser = new hp.Parser({
    onprocessinginstruction: function (name, data) {
      self.push('<' + data + '>')
    },
    onopentag: function (name, attribs) {
      var output = ''
      if(name === 'script' && self.should_inject) {
        self.should_inject = false
        output += '<script type=\"text/javascript\">\n;(' + self._script + ')()\n<\/script>\n'
      }
      output += '<' + name
      for(var key in attribs) {
        output += ' ' + key + '=\"' + attribs[key] + '\"'
      }
      output += '>'
      self.push(output)
    },
    ontext: function (text) {
      self.push(text)
    },
    onclosetag: function (name) {
      if(name === 'body' && self.should_inject) {
        self.should_inject = false
        self.push('<script type=\"text/javascript\">\n;(' + self._script + ')()\n<\/script>\n')
      }
      self.push('<\/' + name + '>')
    }
  })

  self.on('end', function () { self.html_parser.parseComplete() })

}

script_injector_stream.prototype = Object.create(
  Transform.prototype, { constructor: { value: script_injector_stream }})

script_injector_stream.prototype._transform = function(chunk, encoding, done) {
  this.html_parser.write(chunk)
  done()
}