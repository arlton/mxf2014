var Event, _, moment;

Event     = require('../models/event');

_         = require('underscore');
moment    = require('moment');

module.exports.controller = function(app) {
  app.get('/register', function(req, res) {
    var eventId;

    if (process.env.ENVIRONMENT === 'Production' 
        && req.headers['X-Forwarded-Proto'] !== 'https') {
      
      // respond with html page
      if (req.accepts('html')) {
        res.render('404', { url: req.url });
        return;
      }
    }

    eventId   = '530396f65e8706f5d4ea6aa7'; // FIXME This should not be hardcoded

    // Get single event from database
    Event.findOne({ _id: eventId }).exec(function(err, eventInfo) {
      if (err) { 
        // We're fucked
        logfmt.error(new Error('Unable to retrieve event: ' + err));
        return callback(err);
      }

      // Update AMASS Event with some dynamicness
      eventInfo.tickets = _.map(eventInfo.tickets, function(ticket) {
        var avail, today, from, to;

        avail = ticket.availability;
        today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);

        if (!avail) {
          ticket.dateSentance = 'Not available';
          return ticket;
        }

        if (avail.range) {
          from = new Date(avail.range.from);
          from.setHours(0);
          from.setMinutes(0);
          from.setSeconds(0);
          from.setMilliseconds(0);

          to = new Date(avail.range.to);
          to.setHours(0);
          to.setMinutes(0);
          to.setSeconds(0);
          to.setMilliseconds(0);

          // Ticket available today or earlier and ends later than today
          if (from <= today && to > today) {
            ticket.dateSentance = 'Ends ' + moment(to).format(eventInfo.settings.dateFormat);
            ticket.isAvailable = true;
          }

          // Ticket available today only (last day included)
          if (today === to) {
            ticket.dateSentance = 'Ends today';
            ticket.isAvailable = true;
          }

          // Ticket starts today or earlier and ends on or past event date FIXME


          // Ticket starts later than today and ends later than the day it starts and is multiple days
          if (from > today && to > today && from !== to) {
            ticket.dateSentance = 'Available from ' + moment(from).format(eventInfo.settings.dateFormat) + 
              ' to ' + moment(to).format(eventInfo.settings.dateFormat);
            ticket.isAvailable = false;
          }

          // Ticket starts later than today and ends later than today and is only for one day
          if (from > today && to > today && from === to) {
            ticket.dateSentance = 'Available only on ' + moment(to).format(eventInfo.settings.dateFormat);
            ticket.isAvailable = false;
          }

          ticket.formattedPrice = '$' + ticket.price.toFixed(2).toString();

          return ticket;
        }
      });

      res.locals = {
        tickets: eventInfo.tickets
      };

      res.render('register');
    });
  });
};