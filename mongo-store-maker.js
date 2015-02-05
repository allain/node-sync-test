var mongojs = require('mongojs');
var db = mongojs(process.env.MONGOLAB_URI || 'localhost/sync-test');

module.exports = function(name, cb) {
  var collection = db.collection(name);

  function noopErr(err) {
    if (err) {
      debug('error writing to db', err);
    }
  }

  return cb(null, {
    get: function(key, cb) {
      collection.findOne({
        key: key
      }, function(err, doc) {
        if (err) return cb(err);
        cb(null, doc ? doc.val : null);
      });
    },
    set: function(key, val, cb) {
      collection.update({
        key: key
      }, {
        $set: {
          key: key,
          val: val
        }
      }, {
        upsert: true,
        multi: false
      }, cb || noopErr);
    }
  });
};