var express = require('express');
var app = express();
var shoe = require('shoe');
var debug = require('debug')('synopsis-example');
var hyperquest = require('hyperquest');
var browserify = require('browserify-middleware');
var JSONStream = require('JSONStream');

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
  makeStore: require('./mongo-store-maker.js'),
  authenticator: function(auth, cb) {
    if (auth.access_token && auth.network === 'google') {
      return hyperquest('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + auth.access_token)
        .pipe(JSONStream.parse()).once('data', function(response) {
          debug('google tokeninfo response', response);
          if (response.error) {
            return cb(new Error(response.error));
          }

          cb();
        });
    }

    cb(new Error('Unrecognized Auth type'));
  }
});

backend.on('ready', function() {
  shoe(function(stream) {
    stream.pipe(backend.createStream()).pipe(stream);
  }).install(server, '/sync');
});