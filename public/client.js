// file: client.js
var debug = require('debug')('sync-client');

var Store = require('./store');
var Handlebars = require('handlebars');
var fs = require('fs');
var $ = require('jquery');

var store = window.test = new Store('test');

store.on('ready', function() {
  debug('store ready');
});

var ui = Handlebars.compile(fs.readFileSync(__dirname + '/ui.hbs', 'utf8'));

var uiState = {
  json: "{}",
  updates: []
};

store.on('change', function(newDoc) {
  uiState.json = JSON.stringify(newDoc);
  updateUI();
});

store.on('patch', function(update) {
  uiState.updates.push({
    patch: JSON.stringify(update[0]),
    index: update[1]
  });

  updateUI();
});

function updateUI() {
  $('#app').html(ui(uiState));
}

$("#app").on('change', '#json', function(e) {
  var newDoc = JSON.parse($(this).val());
  store.update(newDoc);
});

window.jiff = require('jiff');
