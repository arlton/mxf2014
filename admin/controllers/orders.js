module.exports.controller = function(admin) {
  admin.get('/orders', function(req, res) {
    res.render('orders');
  });
};