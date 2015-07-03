var xlsx_api = require('./index');
var express = require('express');
var app = express();

var sheets = [
  "andrew",
  "angel",
  "anya",
  "buffy",
  "cordelia",
  "dawn",
  "demons",
  "drusilla",
  "faith",
  "giles",
  "human",
  "jonathan",
  "Oz",
  "riley",
  "spike",
  "vampires",
  "willow",
  "xander",
  "potentials",
  "allSlayers",
  "totals"
];

xlsx_api(app, {
  sheets: sheets,
  xlsxSource: 'deathDatasets.xlsx',
  dataDir: 'data'
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Service listening at http://%s:%s', host, port);
});
