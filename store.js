module.exports = Store;

var EventEmitter = require('events').EventEmitter;
var jiff = require('jiff');
var Model = require('gossip-object');
var diff = require('gossip-object-diff');
var reconnect = require('reconnect');

function Store(name) {
  if (typeof name !== 'string') throw new Error('store must be given a name');
  if (!/^[a-z][a-z0-9]*$/.test(name)) throw new Error('Invalid store name given');

  var debug = require('debug')('store:' + name);

  var store = new EventEmitter();
  var model = new Model();

  var initialized = false;
  reconnect(function (stream) {
    debug('connected');
    // handshake with server so it knows what store we're working on
    stream.write(name);

    stream.pipe(model.createStream()).pipe(stream);
    debug('scuttlebutt piping');

    if (!initialized) {
      store.emit('ready');
      initialized = false;
    }
  }).connect('/sync');

  store.update = function(newDoc) {
    diff(model.toJSON(), newDoc).forEach(function(op) {
      model.localChange(op);
    });
  };

  store.toJSON = model.toJSON.bind(model);

  model.on('change', function() {
    store.emit('change', store.toJSON());
  });

  return store;
}
