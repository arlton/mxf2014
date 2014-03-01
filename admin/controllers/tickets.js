module.exports.controller = function(admin) {
  admin.get('/tickets', function(req, res) {
    res.render('tickets');
  });
};