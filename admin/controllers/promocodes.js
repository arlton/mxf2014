module.exports.controller = function(admin) {
  admin.get('/promocodes', function(req, res) {
    res.render('promocodes');
  });
};