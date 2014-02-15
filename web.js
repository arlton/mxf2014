// web.js
var express, logfmt, port, app;

express  = require("express");
logfmt   = require("logfmt");

port     = Number(process.env.PORT || 5000);
app      = express();

app.set('view engine', 'hbs');

app.use(logfmt.requestLogger());

app.use(express.static('public/'));

app.use('/', require('./app/routes'));

app.listen(port, function() {
  console.log("Listening on " + port);
});