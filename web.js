// web.js
var express = require("express");
var logfmt = require("logfmt");
var app = express();

app.use(logfmt.requestLogger());

app.use(express.static('public/'));
app.use(express.static('public/assets'));
app.use(express.static('public/assets/js'));
app.use(express.static('public/assets/css'));

var port = Number(process.env.PORT || 80);
app.listen(port, function() {
  console.log("Listening on " + port);
});