var db, Registrations;

db = require('../db');
Registrations = require('../models/registrations');

module.exports.controller = function(admin) {
  admin.get('/attendees', function(req, res) {
  	Registrations.find().exec(function(err, registrations) {
  		for (var i = 0; i < registrations.length; i++) {
  			for (var x = 0; x < registrations[i].attendees.length; x++) {
  				registrations[i].attendees[x].twitter_handle = registrations[i].attendees[x].twitter_handle.replace('@', '');
  			}
  		}
		res.render('attendees', { registrations: registrations });
  	});
  });
};