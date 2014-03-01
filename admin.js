// web.js
var express, logfmt, port, fs, hbs, path, app;

express  = require('express');
hbs      = require('hbs');
fs       = require('fs');
logfmt   = require('logfmt');
path     = require('path');
app      = express();
port     = Number(process.env.PORT || 5001);

hbs.registerPartials(__dirname + '/admin/views/partials');

app.set('views', __dirname + '/admin/views');
app.set('view engine', 'hbs');

app.use(logfmt.requestLogger());
app.use(express.bodyParser());
app.use(express.compress());
app.use(express.static(path.join(__dirname, 'public')));

fs.readdirSync(__dirname + '/admin/controllers').forEach(function (file) {
  var route;

  if (file.substr(-3) == '.js') {
    route = require(__dirname + '/admin/controllers/' + file);
    route.controller(app);
  }
});

app.listen(port, 'localhost', function() {
  console.log("Listening locally on " + port);
});