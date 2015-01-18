var express = require('express');
var app = express();

var browserify = require('browserify-middleware');
app.use('/', browserify('./public', { transform: ['brfs'] }));

app.use(express.static(__dirname + '/public/'));

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

require('synopsis-middleware')(server);

