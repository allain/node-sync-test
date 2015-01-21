// file: client.js
var debug = require('debug')('sync-client');

var fs = require('fs')
var through2 = require('through2').obj;
var emitStream = require('emit-stream');
var SynopsisClient= require('synopsis-client');

var Handlebars = require('handlebars-stream');

var DomDelegate = require('dom-delegate-stream');

var store = window.test = new SynopsisClient('test');
var writable = require('writable');
var mergeStream = require('object-merge-stream');
var $ = require('jquery');

var HtmlPatcherStream = require('html-patcher-stream');

var Auth = require('./auth.js');
var auth = new Auth({
	google: '100706142658-6iaoqf1pak20cso1shbq7slsmrcaeis6.apps.googleusercontent.com'
});

//var appState = mergeStream({depth: 1}); 
var appData = {}
var appState = through2(function(chunk, enc, cb) {
  Object.keys(chunk).forEach(function(key) {
    appData[key] = chunk[key];
       });
  this.push(appData);
  cb();
});

auth.pipe(toProp('auth')).pipe(appState);

function toProp(name) {
  return through2(function(chunk, enc, cb) {
    var doc = {};
    doc[name] = chunk;
    this.push(doc);
		cb();
  });
}
 
store
	.pipe(toProp('global'))
	.pipe(appState);

appState
  .pipe(through2(function(chunk, enc, cb) {
    console.log(chunk);
    this.push(chunk);
    cb();
	}))
	.pipe(Handlebars(fs.readFileSync(__dirname + '/ui.hbs', 'utf8')))
	.pipe(HtmlPatcherStream(document.getElementById('app')));

var app = DomDelegate(document.getElementById('app'));

app.on('keyup', '#global-todos .new-todo').pipe(writable({objectMode: true}, function(e) {
  if (e.keyCode != 13) return;

  e.preventDefault();

  addTodo(store);
}));

app.on('click', '#global-todos .add-todo').pipe(writable({objectMode: true}, function(e) {
  addTodo(store);
}));

function addTodo(store) {
  var title = $('#global-todos .new-todo').val().trim();
  $('.new-todo').val('');
  
  if (title) {
    store.edit(function(state) {
      state.todos = state.todos || [];
      state.todos.unshift({id: Date.now(), title: title});
    });
  }
}

app.on('click', '#global-todos .completed').pipe(writable({objectMode: true}, function(e) {
  var id = e.target.dataset.id;

  store.edit(function(state) {
    state.todos = state.todos.filter(function(t) { return t.id != id; });
  });

  $('.completed').removeAttr('checked');
}));
