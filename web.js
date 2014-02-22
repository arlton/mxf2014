// web.js
var express, logfmt, port, fs, hbs, path, app;

express  = require('express');
hbs      = require('hbs');
fs       = require('fs');
logfmt   = require('logfmt');
path     = require('path');
app      = express();
port     = Number(process.env.PORT || 5000);

hbs.registerPartials(__dirname + '/app/views/partials');

app.set('views', __dirname + '/app/views');
app.set('view engine', 'hbs');

app.use(logfmt.requestLogger());
app.use(express.bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

fs.readdirSync('./app/controllers').forEach(function (file) {
  var route;

  if (file.substr(-3) == '.js') {
    route = require('./app/controllers/' + file);
    route.controller(app);
  }
});

app.listen(port, function() {
  console.log("Listening on " + port);
});