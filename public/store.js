module.exports = Store;

var EventEmitter = require('events').EventEmitter;
var reconnect = require('reconnect');
var inherits = require('util').inherits;
var jiff = require('jiff');
var MuxDemux = require('mux-demux');
var through2 = require('through2');
var jsonPatchStream = require('json-patch-stream');

inherits(Store, EventEmitter);

function Store(name, endPoint) {
  if (typeof name !== 'string') throw new Error('store must be given a name');
  if (!/^[a-z][a-z0-9]*$/.test(name)) throw new Error('Invalid store name given');


  EventEmitter.call(this);

  var self = this;

  var doc = JSON.parse(localStorage['store-' + name] || '{}');
  var patchCount = parseInt(localStorage['store-' + name + '-end'] || '0', 10) || 0;

  endPoint = endPoint || '/sync';

  var debug = require('debug')('store:' + name);

  var initialized = false;

  var mdm = MuxDemux({
    error: false
  });

  var patchStream;
  reconnect(function (stream) {
    stream.pipe(mdm).pipe(stream);

    patchStream = mdm.createStream(name + '/' + patchCount);

    this.patchStream = patchStream;
    patchStream
    .pipe(through2.obj(function(update, enc, next) {
      // update = [patch, end]
      debug('update received', update);

      self.emit('patch', update);

      this.push(update[0]);
      localStorage['store-' + name + '-end'] = update[1];
      next();
    }))
    .pipe(jsonPatchStream.toDocs(doc))
    .pipe(through2.obj(function(newDoc, enc, next) {
      localStorage['store-' + name] = JSON.stringify(newDoc);
      doc = newDoc;

      self.emit('change', doc);
      next();
    }));

    patchStream.on('error', function(err) {
      console.log(err);
    });

    if (!initialized) {
      self.emit('ready');
      initialized = false;
    }
  }).connect(endPoint);

  this.update = function(newDoc) {
    try {
      var patch = jiff.diff(doc, newDoc, function(obj) {
        return obj.id || obj._id || obj.hash || JSON.stringify(obj);
      });

      var written = patchStream.write(patch);
      if (!written) {
        debug('error writing patch to stream');
      }
    } catch (e) {
      debug('unable to generate patch', e);
    }
  };
}
