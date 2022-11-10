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

app.set('views', __dirname + '/src');
app.engine('html', engines.ejs);
app.set('view engine', 'html');
app.use(express.json());

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
  res.render('campaigns.html');
});

app.get('/campaigns/created', function (req, res) {
  con.query('select * from campaigns where status="OPEN"', function (err, result) {
    res.render('campaigns_created.html', {result: result});
  });
});

app.get('/campaigns/donated', function (req, res) {
    res.render('campaigns_donated.html');
});


app.post('/donations/add', function (req, res) {
  con.query(`INSERT INTO donations (campaign_id, donated_by, amount) VALUES (${req.body['campaignId']}, '${req.body['donatedBy']}', ${req.body['amount']})`);
  con.query(`UPDATE campaigns SET amount_raised = amount_raised +  ${req.body['amount']} where id=${req.body['campaignId']}`);
  res.sendStatus(200);
});

app.get('/donations', function (req, res) {
  con.query(`SELECT * from donations where campaign_id=${req.query['campaignId']} order by created_on`, function (err, result) {
    res.json(result);
  });
});

app.post('/campaigns/update', function (req, res) {
  states = ["OPEN","CLOSED","EXPIRED"];
  con.query(`UPDATE campaigns SET status='${states[req.body['state']]}' where id=${req.body['campaignId']}`);
  res.sendStatus(200);
});

app.get('/query/campaigns/donated', function (req, res) {
  con.query(`select c.*,d.donated_by,sum(d.amount) as amount_donated from donations d LEFT JOIN campaigns c on d.campaign_id=c.id where d.donated_by='${req.query['donatedBy']}' group by d.campaign_id,d.donated_by`, function (err, result) {
    res.json(result);
  });
});


app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});


