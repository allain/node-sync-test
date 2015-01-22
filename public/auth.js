var Readable = require('stream').Readable;
var util = require('util');

var hello = window.hello = require('hellojs');
var $ = require('jquery');

module.exports = Auth;

util.inherits(Auth, Readable);

function Auth(config) {
  var self = this;
  Readable.call(this, {objectMode: true});

  this._read = function() {};

	$('body').delegate('#google-login', 'click', function(e) {
		hello('google').login();
	});

 	$('body').delegate('#logout', 'click', function(e) {
		hello.logout();
	});

  var auth = {
		auth: JSON.parse(localStorage['auth'] || 'false'),
    profile: JSON.parse(localStorage['profile'] || 'false')
	};

  setTimeout(function() {
		self.push(auth);
	}, 0);

	hello.on('auth.login', function(response){
    auth['auth'] = response;
    localStorage['auth'] = JSON.stringify(response);

		// call user information, for the given network
		hello(response.network).api( '/me' ).then( function(profile) {
			localStorage['profile'] = JSON.stringify(profile);
			auth['profile'] = profile;
			self.push(auth);
		});
	});

	hello.on('auth.logout', function(){
		localStorage['auth'] = 'false'; 
		localStorage['profile'] = 'false'; 
    auth.profile = false;
    auth.auth = false;

		self.push(auth);
	});

  
  hello.init({ 
  	google: config.google 
  }, {redirect_uri:'/redirect.html'});
}

