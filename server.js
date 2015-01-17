var debug = require('debug')('sync-server');
var shoe = require('shoe');

var mongojs = require('mongojs');
var Synopsis = require('synopsis');
var jiff = require('jiff');
var express = require('express');


var db = mongojs(process.env.MONGOLAB_URI || 'localhost/sync-test');

var app = express();

app.use('/', require('browserify-middleware')('./public', { transform: ['brfs'] }));

app.use(express.static(__dirname + '/public/'));

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

var targets = {};

shoe(function (stream) {
  stream.once('data', connectToSynopsis);
  
  function connectToSynopsis(meta) {
    debug('meta received: ' + meta);

    var metaParts = meta.split('/');

    var targetName = metaParts[0];
    var start = metaParts[1];

    stream.on('error', function(err) {
      debug('stream error', err);
    });

    buildSynopsis(targetName, function(err, syn) {
      if (err) {
        debug('could not create synopsis', err);
        stream.close();
        return;
      }

      //TODO: handle errors way way better than this
      syn.createStream(parseInt(start, 10), function(err, synStream) {
        stream.pipe(synStream).pipe(stream);
      });
    });
  }
}).install(server, '/sync');


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
