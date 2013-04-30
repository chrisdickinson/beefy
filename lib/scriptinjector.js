module.exports = ScriptInjectorStream

var fs = require('fs')

var Transform = require('readable-stream/transform')
  , hp = require('htmlparser2')

function ScriptInjectorStream(script, options) {
  var self = this;
  if(!(self instanceof ScriptInjectorStream)) {
    return new ScriptInjectorStream(script, options)
  }

  Transform.call(self, options)

  self._script = script ?
    script+'':
    '('+function() { console.log("You didn't provide a script to inject.") }+')()'
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

var cons = ScriptInjectorStream
  , proto = cons.prototype = Object.create(Transform.prototype);

proto.constructor = cons

proto._transform = function(chunk, encoding, done) {
  this.html_parser.write(chunk)
  done()
}