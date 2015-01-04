var shoe = require('shoe');
var Model = require('scuttle-patch');

var debug = require('debug')('sync-server');

var express = require('express');
var app = express();

var browserify = require('browserify-middleware');

var MuxDemux = require('mux-demux');
var streamRouter = require('stream-router')();

streamRouter.addRoute(':name', connectScuttlebutt);

app.use('/', browserify('./public'));

app.use(express.static(__dirname + '/public/'));

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

var targets = {};

shoe(function (stream) {
  var mdm = MuxDemux({
    error: false
  });

  mdm.on("connection", streamRouter);

  stream.pipe(mdm).pipe(stream);
}).install(server, '/sync');

function connectScuttlebutt(stream) {
  var targetName = stream.meta;

  var target = targets[targetName];
  if (target) {
    debug('reusing model', targetName);
    model = target.model;
  } else {
    debug('creating model', targetName);
    model = new Model();
    model.on('change', function() {
      debug('model %s changed', targetName, model.toJSON());
    });
    target = { model: model};
    targets[targetName] = target;
  }

  stream.pipe(model.createStream()).pipe(stream);
}

server.listen(3000);
