var mongoose, db;

mongoose = require('mongoose');
mongoose.connect(process.env.MONGOHQ_URL);

mongoose.connection.on('error', function(err) {
  return logfmt.error(new Error('Unable to connect: ' + err));
});

mongoose.connection.once('open', function callback () {
  logfmt.log({ 'type': 'database', 'message': 'Connected' });
});

module.exports = mongoose;