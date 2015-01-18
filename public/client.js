// file: client.js
var debug = require('debug')('sync-client');
var fs = require('fs')

var SynopsisClient= require('synopsis-client');

var Handlebars = require('handlebars-stream');

var DomDelegate = require('dom-delegate-stream');

var store = window.test = new SynopsisClient('test');
var writable = require('writable');

var $ = require('jquery');

var HtmlPatcherStream = require('html-patcher-stream');

store.pipe(Handlebars(fs.readFileSync(__dirname + '/ui.hbs', 'utf8')))
  .pipe(HtmlPatcherStream(document.getElementById('app'), '<div></div>'));

var app = DomDelegate(document.getElementById('app'));
app.on('keyup', '#new-todo').pipe(writable({objectMode: true}, function(e, encoding, cb) {
  if (e.keyCode != 13) return;

  e.preventDefault();

  addTodo();
  cb();
}));

app.on('click', '#add-todo').pipe(writable({objectMode: true}, function(e, encoding, cb) {
  addTodo();
  cb();
}));

function addTodo() {
  var title = $('#new-todo').val().trim();
  if (title) {
    store.edit(function(state) {
      state.todos = state.todos || [];
      state.todos.unshift({id: Date.now(), title: title});
    });
  }
}

app.on('click', '.completed').pipe(writable({objectMode: true}, function(e) {
  var id = e.target.dataset.id;

  store.edit(function(state) {
    state.todos = state.todos.filter(function(t) { return t.id != id; });
  });

  $('.completed').removeAttr('checked');
}));
