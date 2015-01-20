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

var hello = window.hello = require('hellojs');
hello.on('auth auth.login', function(auth){
  // call user information, for the given network
	hello(auth.network).api( '/me' ).then( function(r) {
  	document.getElementById('profile').innerHTML = '<img src="'+ r.thumbnail +'" /> Hey '+r.name + '<a href="#" id="logout">Logout</a>';

    $("#logout").click(function(e) {
      hello.logout();
  	});    
	});
});

hello.init({ 
	google: '100706142658-6iaoqf1pak20cso1shbq7slsmrcaeis6.apps.googleusercontent.com'
}, {redirect_uri:'/redirect.html'});
 
store.pipe(Handlebars(fs.readFileSync(__dirname + '/ui.hbs', 'utf8')))
  .pipe(HtmlPatcherStream(document.getElementById('app')));

var app = DomDelegate(document.getElementById('app'));
app.on('keyup', '#new-todo').pipe(writable({objectMode: true}, function(e) {
  if (e.keyCode != 13) return;

  e.preventDefault();

  addTodo();
}));

app.on('click', '#add-todo').pipe(writable({objectMode: true}, function(e) {
  addTodo();
}));

function addTodo() {
  var title = $('#new-todo').val().trim();
  $('#new-todo').val('');
  
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
