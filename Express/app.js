var express = require('express');
var app = express();

app.set('view engine', 'pug');

app.get('/', function (req, res) {
   res.send('Hello World');
})

app.get('/index', function (req, res) {
  console.log("Request handler Index");
  res.render('index');
})

app.post('/display', function (req, res) {
  console.log("Request handler Display");
  res.render('display');
})

var server = app.listen(3000, function () {
   var host = server.address().address;
   var port = server.address().port;
   
   console.log("Example app listening at http://%s:%s", host, port);
})