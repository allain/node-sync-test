//client
var debug = require('debug')('sync-client');
var reconnect = require('reconnect');
var Model = require('gossip-object');


var model = window.model = new Model();
model.on('change', function() {
  debug('model changed', this.toJSON());
});

reconnect(function (stream) {
  debug('connected');
  stream.write('test');

  stream.pipe(model.createStream()).pipe(stream);
  debug('suttlebutt setup');
}).connect('/sync');
