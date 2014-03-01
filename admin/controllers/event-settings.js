module.exports.controller = function(admin) {
  admin.get('/event-settings', function(req, res) {
    res.render('event-settings');
  });
};