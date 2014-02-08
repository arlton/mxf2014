// web.js
var express, logfmt, mongoose, port, app;

express  = require("express");
logfmt   = require("logfmt");
mongoose = require("mongoose");
_        = require("underscore");

port     = Number(process.env.PORT || 5000);
app      = express();

app.use(logfmt.requestLogger());

app.use(express.static('public/'));

app.use('/', require('./app/routes'));

mongoose.connect(process.env.MONGOHQ_URL, function (err, res) {
  if (err) {
    console.log ('DB Error: ' + process.env.MONGOHQ_URL + '. ' + err);
  } else {
    console.log ('DB Connected: ' + process.env.MONGOHQ_URL);
  }
});

app.listen(port, function() {
  console.log("Listening on " + port);
});