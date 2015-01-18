// file: client.js
var debug = require('debug')('sync-client');

var SynopsisClient= require('synopsis-client');

var Handlebars = require('handlebars');
var fs = require('fs');
var $ = require('jquery');

var store = window.test = new SynopsisClient('test');

var ui = Handlebars.compile(fs.readFileSync(__dirname + '/ui.hbs', 'utf8'));

var HtmlPatcherStream = require('html-patcher-stream');
var uiPatcher;

store.on('change', function(appState) {
  debug('changed', appState);

  var newHtml = ui(appState);
  console.log(newHtml);
  
  if (uiPatcher) {
    uiPatcher.write(newHtml);
  } else {
    uiPatcher = HtmlPatcherStream(document.getElementById('app'), newHtml);
  }
});

store.on('patch', function(update) {
  debug('patched', update);
});

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
    store.edit(function(state) {
      state.todos = state.todos || [];
      state.todos.unshift({id: Date.now(), title: title});
    });
  }
}

$("#app").on('click', '.completed', function(e) {
  var id = $(this).parent().attr('data-id');
  store.edit(function(state) {
    state.todos = state.todos.filter(function(t) { return t.id != id; });
  });
});
