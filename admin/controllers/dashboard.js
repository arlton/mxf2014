module.exports.controller = function(admin) {
  admin.get('/', function(req, res) {
    res.render('dashboard');
  });
};