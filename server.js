var shoe = require('shoe');
var Model = require('gossip-object');

var fs = require('fs');

var targets = {};

var debug = require('debug')('sync-server');

var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public/'));

app.get('/', function (req, res) {
  fs.createReadStream(__dirname + '/index.html').pipe(res);
  req.resume();
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

shoe(function (stream) {
  stream.on('data', targetScuttlebutt);

  function targetScuttlebutt(targetName) {
    stream.removeListener('data', targetScuttlebutt);

    var target = targets[targetName];
    if (target) {
      model = target.model;
    } else {
      model = new Model();
      model.on('change', function() {
        debug('model %s changed', targetName, model.toJSON());
      });
      target = { model: model};
      targets[targetName] = target;
    }

    stream.pipe(model.createStream()).pipe(stream);
  }
}).install(server, '/sync');

server.listen(3000);
