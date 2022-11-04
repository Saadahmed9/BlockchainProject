var express = require('express');
var engines = require('consolidate');
var path = require('path');
var mysql = require('mysql');
// const Web3 = require('web3');
// const { callbackify } = require('util');

// console.log(Web3.givenProvider);
// var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));

// console.log(web3.eth.accounts[0]);
var app = express();

app.set('views', __dirname + '/src/views');
app.engine('html', engines.ejs);
app.set('view engine', 'html');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "donations"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});


// data = mysql data

app.use(express.static('src'));
app.use(express.static('../donation-contract/build/contracts'));
app.get('/', function (req, res) {
  // con.query('select * from campaigns', function (err, result) {
  //   res.render('index.html', {sample: 'sample'});
  // });
  res.render('hello.html', {name: 'Sai Kiran'});
});

app.get('/campaigns/open', function (req, res) {
  // return "Hel";
  con.query('select * from campaigns where status="OPEN"', function (err, result) {
    res.json(result);
  });
});

app.get('/campaigns', function (req, res) {
  con.query('select * from campaigns where status="OPEN"', function (err, result) {
    res.render('campaigns.html', {result: result});
  });
});

app.get('/campaigns/created', function (req, res) {
  con.query('select * from campaigns where status="OPEN"', function (err, result) {
    res.render('campaigns_created.html', {result: result});
  });
});
app.get('/campaigns/donated', function (req, res) {
  con.query('select * from campaigns where status="OPEN"', function (err, result) {
    res.render('campaigns_donated.html', {result: result});
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});


