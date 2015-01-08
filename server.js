var shoe = require('shoe');
var mongojs = require('mongojs');

var db = mongojs(process.env.mongodb || 'localhost/sync-test');

var Synopsis = require('synopsis');
var debug = require('debug')('sync-server');
var jiff = require('jiff');

var through2 = require('through2');

var express = require('express');
var app = express();

var browserify = require('browserify-middleware');

var MuxDemux = require('mux-demux');
var streamRouter = require('stream-router')();

streamRouter.addRoute(':name/:start', connectToSynopsis);

app.use('/', browserify('./public', { transform: ['brfs'] }));

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

function connectToSynopsis(stream) {
  var metaParts = stream.meta.split('/');

  var targetName = metaParts[0];
  var start = metaParts[1];

  stream.error(function(err) {
    debug('stream error', err);
  });

  buildSynopsis(targetName, function(err, target) {
    if (err) {
      debug('could not create synopsis', err);
      stream.close();
      return;
    }

    //TODO: Make it buffer and then send any patches that come in during initialization

    debug('getting client up to speed');
    target.size(sendInitialUpdates);

    function sendInitialUpdates(err, count) {
      if (err) return debug('error', err);

      target.delta(start, count, function(err, patch) {
        if (err) return debug('error', err);

        debug('sending initial updates');

        stream.write([patch, count]);
        target.on('patched', patchClient);

        debug('listening for client patches');

        stream.on('data', processClientPatch);
      });

      function processClientPatch(patch) {
        debug('received data from client', patch);

        if (patch.length === 0) {
          debug('dropping empty patch');
          return;
        }
        target.patch(patch, function(err) {
          if (err) {
            debug('unable to apply patch', err);
          }
        });
      }

      function patchClient(patch) {
        debug('sending patch', patch);
        stream.write([patch, ++count]);
      }

      stream.once('close', function() {
        debug('uninstalling stream listeners');
        target.removeListener('patched', patchClient);
        stream.removeListener('data', processClientPatch);
      });
    }
  });
}

function buildSynopsis(targetName, cb) {
  var target = targets[targetName];
  if (target) {
    debug('reusing model', targetName);
    cb(null, target);
  } else {
    debug('creating model', targetName);

    target = new Synopsis({
      start: {},
      patcher: function(doc, patch) {
        return jiff.patch(patch, doc);
      },
      differ: function(before, after) {
        return jiff.diff(before, after, function(obj) {
          return obj.id || obj._id || obj.hash || JSON.stringify(obj);
        });
      },
      store: buildMongoStore(targetName)
    });

    target.on('ready', function() {
      debug('target ready', targetName);
      targets[targetName] = target;
      cb(null, target);
    });
  }
}

function buildMongoStore(name) {
  var collection = db.collection(name);

  return {
    get: function(key, cb) {
      collection.findOne({key: key}, function(err, doc) {
        if (err) return cb(err);

        cb(null, doc ? doc.val : null);
      });
    },
    set: function(key, val, cb) {
      collection.update({key: key}, {$set: {key: key, val: val}}, {upsert: true, multi: false}, cb);
    }
  };
}

server.listen(3000);
