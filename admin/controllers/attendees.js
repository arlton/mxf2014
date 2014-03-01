module.exports.controller = function(admin) {
  admin.get('/attendees', function(req, res) {
    res.render('attendees');
  });
};