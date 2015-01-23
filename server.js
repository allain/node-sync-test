var express = require('express');
var app = express();
var shoe = require('shoe');
var debug = require('debug')('synopsis-example');

var browserify = require('browserify-middleware');
app.use('/', browserify('./public', {
  transform: ['brfs']
}));

app.use(express.static(__dirname + '/public/'));

var server = app.listen(process.env.PORT || 3000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

var SynopsisBackend = require('synopsis-backend');

var backend = new SynopsisBackend({
	authenticator: function(auth, cb) {
		debug('faking success of authing ', auth);
		cb();
	}
});


shoe(function(stream) {
  stream.pipe(backend.createStream()).pipe(stream);
}).install(server, '/sync');
