var express = require('express');
var engines = require('consolidate');
var path = require('path');

var app = express();

app.set('views', __dirname + '/src/views');
app.engine('html', engines.mustache);
app.set('view engine', 'html');

console.log("Printing!");

// data = mysql data

app.use(express.static('src/views'));
// app.use(express.static('../ballot-contract/build/contracts'));
app.get('/', function (req, res) {
  res.render('index.html', data);
});
app.get('/campaigns', function (req, res) {
  res.render('index.html');
});
app.get('/campaigns/created', function (req, res) {
  res.render('campaigns_created.html');
});
app.get('/campaigns/donated', function (req, res) {
  res.render('campaigns_donated.html');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});


