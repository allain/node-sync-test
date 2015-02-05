// file: client.js
var debug = require('debug')('sync-client');

var fs = require('fs')
var through2 = require('through2').obj;
var emitStream = require('emit-stream');

var SynopsisClient = require('synopsis-client');

var Handlebars = require('handlebars-stream');

var DomDelegate = require('dom-delegate-stream');

var store = new SynopsisClient('test');

var Auth = require('./auth.js');
var auth = new Auth({
  google: '100706142658-6iaoqf1pak20cso1shbq7slsmrcaeis6.apps.googleusercontent.com'
});

var personalStore = new SynopsisClient.Personal('personal');

personalStore.on('bootstrap-error', function(err) {
  if (err.cause === 'session not found') {
    auth.logout();
  }
});

var writable = require('writable');
var toProp = require('make-prop-stream');
var $ = require('jquery');

var HtmlPatcherStream = require('html-patcher-stream');

var appData = {}
var appState = through2(function(chunk, enc, cb) {
  Object.keys(chunk).forEach(function(key) {
    appData[key] = chunk[key];
  });
  this.push(appData);
  cb();
});

auth.pipe(logStream('auth')).pipe(appState);

function logStream(name) {
  return through2(function(chunk, enc, cb) {
    debug((name ? name + ': ' : ''), chunk);
    this.push(chunk);
    cb();
  });
}

store
  .pipe(toProp('global'))
  .pipe(appState);

auth
  .pipe(personalStore)
  .pipe(logStream('personal'))
  .pipe(toProp('personal'))
  .pipe(appState);

appState
  .pipe(logStream('appState'))
  .pipe(Handlebars(fs.readFileSync(__dirname + '/ui.hbs', 'utf8')))
  .pipe(HtmlPatcherStream(document.getElementById('app')));

var app = DomDelegate(document.getElementById('app'));

app.on('keyup', '#global-todos .new-todo').pipe(writable({
  objectMode: true
}, function(e) {
  if (e.keyCode != 13) return;
  e.preventDefault();
  addTodo(store, $('#global-todos .new-todo').val().trim());
}));
app.on('keyup', '#personal-todos .new-todo').pipe(writable({
  objectMode: true
}, function(e) {
  if (e.keyCode != 13) return;
  e.preventDefault();
  addTodo(personalStore, $('#personal-todos .new-todo').val().trim());
}));

app.on('click', '#global-todos .add-todo').pipe(writable({
  objectMode: true
}, function(e) {
  addTodo(store, $('#global-todos .new-todo').val().trim());
}));

app.on('click', '#personal-todos .add-todo').pipe(writable({
  objectMode: true
}, function(e) {
  addTodo(personalStore, $('#personal-todos .new-todo').val().trim());
}));

function addTodo(store, title) {
  $('.new-todo').val('');

  if (title) {
    store.edit(function(state) {
      state.todos = state.todos || [];

      state.todos.unshift({
        id: Date.now(),
        title: title
      });
    });
  }
}

app.on('click', '#personal-todos .completed').pipe(writable({
  objectMode: true
}, function(e) {
  var id = e.target.dataset.id;

  personalStore.edit(function(state) {
    state.todos = state.todos.filter(function(t) {
      return t.id != id;
    });
  });

  $('.completed').removeAttr('checked');
}));

app.on('click', '#global-todos .completed').pipe(writable({
  objectMode: true
}, function(e) {
  var id = e.target.dataset.id;

  store.edit(function(state) {
    state.todos = state.todos.filter(function(t) {
      return t.id != id;
    });
  });

  $('.completed').removeAttr('checked');
}));