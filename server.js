var express = require('express');
var app = express();
var shoe = require('shoe');
var debug = require('debug')('synopsis-example');
var hyperquest = require('hyperquest');
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

var authCache = {};
var backend = new SynopsisBackend({
  authenticator: function(auth, cb) {
    if (auth.access_token && auth.network === 'google') {
      var authed = (authCache[auth.network + '-' + auth.access_token]);
      if (authed !== void 0) {
        if (authed) {
          return cb(null);
        } else {
          return cb('Invaid Auth Token');
        }
      }

      return hyperquest('https://www.googleapis.com/plus/v1/people/me?access_token=' + auth.access_token, function(err, resp, body) {
        var error = null;

        debug(resp);
        debug(body);

        if (resp.statusCode >= 400) {
          error = new Error('Invalid Auth Token');
        }

        authCache[auth.network + '-' + auth.access_token] = !error;

        return cb(error);
      });
    }

    cb(new Error('Unrecognized Auth type'));
  }
});

shoe(function(stream) {
  stream.pipe(backend.createStream()).pipe(stream);
}).install(server, '/sync');