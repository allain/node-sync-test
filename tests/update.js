var assert = require('chai').assert;
var Store = require('../store.js');

describe('store.update', function() {
  var store;
  beforeEach(function() {
    store = new Store();
  });

  it('supports simple prop set', function() {
    store.update({a: 10});
    assert.deepEqual({a:10}, store.toJSON());
  });

  it('supports simple prop delete', function() {
    store.update({a: 10});
    store.update({});
    assert.deepEqual({}, store.toJSON());
  });

  it('supports simple prop change', function() {
    store.update({a: 10});
    store.update({a: false});
    assert.deepEqual({a: false}, store.toJSON());
  });

  it('supports full docs additions', function() {
    var doc = {a: {b: true}};
    store.update(doc);
    assert.deepEqual(store.toJSON(), doc);
  });

  it('supports smart object updates', function() {
    var doc = {a: {b: true}};
    store.update(doc);
    doc.a.c = false;
    store.update(doc);
    assert.deepEqual(store.toJSON(), doc);
  });

  it('does not support arrays', function() {
    try {
      store.update({a: []});
      assert(false);
    } catch(e) {
      assert.equal(e.message, 'arrays not supported');
    }

    try {
      store.update({a: {b: [1, 2]}});
      assert(false);
    } catch(e) {
      assert.equal(e.message, 'arrays not supported');
    }
  });
});
