// web.js
var express, logfmt, port, app, hbs;

express  = require("express");
logfmt   = require("logfmt");

port     = Number(process.env.PORT || 5000);
app      = express();
hbs      = require('hbs');

hbs.registerPartials(__dirname + '/views/partials');
app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');

app.use(logfmt.requestLogger());

app.use(express.static('public/'));

app.use('/', require('./app/routes'));

app.listen(port, function() {
  console.log("Listening on " + port);
});