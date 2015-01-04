//client
var debug = require('debug')('sync-client');

var Store = require('./store');

var store = window.test = new Store('test');

store.on('ready', function() {
  debug('store ready');
});

store.on('change', function(newValue) {
  document.getElementById('test-content').innerText = JSON.stringify(newValue);
  debug('store changed', newValue);
});
