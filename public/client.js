// file: client.js
var debug = require('debug')('sync-client');

var SynopsisClient= require('synopsis-client');

var Handlebars = require('handlebars');
var fs = require('fs');
var $ = require('jquery');

var store = window.test = new SynopsisClient('test');

var ui = Handlebars.compile(fs.readFileSync(__dirname + '/ui.hbs', 'utf8'));

var appState = {};

store.on('change', function(newDoc) {
  debug('changed', newDoc);
  appState = newDoc;
  updateUI();
});

store.on('patch', function(update) {
  debug('patched', update);
  updateUI();
});

function updateUI() {
  $('#app').html(ui(appState));
}

$("#app").on('keyup', '#new-todo', function(e) {
  if (e.keyCode !== 13) return;
  e.preventDefault();

  addTodo();
});

$("#app").on('click', '#add-todo', function(e) {
  addTodo();
});



function addTodo() {
  var title = $('#new-todo').val().trim();
  if (title) {
    var newState = JSON.parse(JSON.stringify(appState));
    newState.todos = newState.todos || [];
    newState.todos.unshift({id: Date.now(), title: title});
    store.update(newState);
  }
}

$("#app").on('click', '.completed', function(e) {
  var id = $(this).parent().attr('data-id');
  var newState = JSON.parse(JSON.stringify(appState));
  newState.todos = (newState.todos || []).filter(function(t) { return t.id != id; });
  store.update(newState);
});
