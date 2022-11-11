var express = require('express');
var engines = require('consolidate');
var mysql = require('mysql');

var app = express();

app.set('views', __dirname + '/src/views');
app.engine('html', engines.ejs);
app.set('view engine', 'html');
app.use(express.json());
app.use(express.static('src'));
app.use(express.static('../donation-contract/build/contracts'));

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

app.get('/', function (req, res) {
  res.redirect("/campaigns")
});

// Rendering Pages
app.get('/campaigns', function (req, res) {
  res.render('campaigns.html');
});

app.get('/mycampaigns', function (req, res) {
  res.render('campaigns_created.html');
});


app.get('/campaigns/donated', function (req, res) {
  res.render('campaigns_donated.html');
});


// DB Queries
app.get('/query/campaigns/open', function (req, res) {
  con.query('select * from campaigns where status="OPEN"', function (err, result) {
    res.json(result);
  });
});

app.post('/query/campaigns/add', function (req, res) {
  con.query(`INSERT INTO campaigns (id, created_by, status, vendor, description, target, deposit, amount_raised) VALUES ('${req.body['campaignID']}','${req.body['created_by']}','OPEN','${req.body['vendor']}','${req.body['description']}', '${req.body['amountRequired']}','${req.body['deposit']}','0')`);
  res.sendStatus(200);
});

app.post('query/campaigns/update', function (req, res) {
  states = ["OPEN","CLOSED","EXPIRED"];
  con.query(`UPDATE campaigns SET status='${states[req.body['state']]}' where id=${req.body['campaignId']}`);
  res.sendStatus(200);
});

app.get('/query/campaigns/donated', function (req, res) {
  con.query(`select c.*,d.donated_by,sum(d.amount) as amount_donated from donations d LEFT JOIN campaigns c on d.campaign_id=c.id where d.donated_by='${req.query['donatedBy']}' group by d.campaign_id,d.donated_by`, function (err, result) {
    res.json(result);
  });
});

app.get('/query/campaigns/created', function (req, res) {
  con.query(`select * from campaigns where created_by='${req.query['createdBy']}'`, function (err, result) {
    res.json(result);
  });
});

app.post('query/donations/add', function (req, res) {
  con.query(`INSERT INTO donations (campaign_id, donated_by, amount) VALUES (${req.body['campaignId']}, '${req.body['donatedBy']}', ${req.body['amount']})`);
  con.query(`UPDATE campaigns SET amount_raised = amount_raised +  ${req.body['amount']} where id=${req.body['campaignId']}`);
  res.sendStatus(200);
});

app.get('query/donations', function (req, res) {
  con.query(`SELECT * from donations where campaign_id=${req.query['campaignId']} order by created_on`, function (err, result) {
    res.json(result);
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
