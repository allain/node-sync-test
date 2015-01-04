module.exports = Store;

var EventEmitter = require('events').EventEmitter;
var Model = require('scuttle-patch');
var reconnect = require('reconnect');
var inherits = require('util').inherits;
var MuxDemux = require('mux-demux');

inherits(Store, EventEmitter);

function Store(name, endPoint) {
  if (typeof name !== 'string') throw new Error('store must be given a name');
  if (!/^[a-z][a-z0-9]*$/.test(name)) throw new Error('Invalid store name given');


  EventEmitter.call(this);

  var self = this;

  endPoint = endPoint || '/sync';

  var debug = require('debug')('store:' + name);

  var model = new Model({
    persist: {
      set: function(key, val) {
        localStorage[name + '-' + key] = JSON.stringify(val);
      },
      get: function(key) {
        var val = localStorage[name + '-' + key];
        if (val) {
          return JSON.parse(val);
        }
      }
    }
  });

  var initialized = false;

  var mdm = MuxDemux({
    error: false
  });

  reconnect(function (stream) {
    stream.pipe(mdm).pipe(stream);

    var scuttleStream = mdm.createStream(name);

    var modelStream = model.createStream();
    modelStream.on('error', debug);

    scuttleStream.pipe(modelStream).pipe(scuttleStream);
    debug('scuttlebutt piping');

    if (!initialized) {
      self.emit('ready');
      initialized = false;
    }
  }).connect(endPoint);


  this.update = function(newDoc) {
    model.update(newDoc);
  };

  this.toJSON = model.toJSON.bind(model);

  model.on('change', function() {
    self.emit('change', self.toJSON());
  });
}
