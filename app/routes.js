var Handlebars, stripe, sendgrid, _, Event, Registration, fs, moment;

Handlebars = require('handlebars');
stripe    = require('stripe')(process.env.STRIPE_API_KEY);
sendgrid  = require('sendgrid')(
  process.env.SENDGRID_USERNAME,
  process.env.SENDGRID_PASSWORD
);
_         = require('underscore');
logfmt    = require('logfmt');
fs        = require('fs');
moment    = require('moment');

module.exports = (function() {
  var express, app, hbs, db;
  
  express = require('express');
  app     = express();
  hbs     = require('hbs');
  db      = require('./db');

  app.use(express.bodyParser());

  //** PAGES
  app.get('/', function(req, res) {
    res.render('home');
  });

  app.get('/register', function(req, res) {
    // Get single event from database
    db.models.Event.findOne({ _id: '530396f65e8706f5d4ea6aa7' }).exec(function(err, eventInfo) {
      if (err) { 
        // We're fucked
        return logfmt.error(new Error('Unable to retrieve event: ' + err)); 
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

  //** API
  app.get('/api/events', function(req, res) {
    res.writeHead(200, {'content-type':'application/json'});
    // Get all events from database
    res.end();
  });

  app.get('/api/event/:event_id', function(req, res) {
    // Get single event from database
    db.models.Event.findOne({ _id: req.params.event_id }).exec(function(err, eventInfo) {
      if (err) { 
        // We're fucked
        es.writeHead(404, {'content-type':'application/json'});
        res.write(JSON.stringify({ 
          'status': 'fail', 
          'message': 'Event not found', 
          'data': { 'event_id': req.params.event_id } 
        })); // FIXME am I sure that findOne method would only error when unable to find an event?

        res.end();
        return logfmt.error(new Error('Unable to retrieve event: ' + err)); 
      }

      res.writeHead(200, {'content-type':'application/json'});
      res.write(JSON.stringify(eventInfo));
      res.end();
    });
  });

  app.get('/api/event/:event_id/promo/:code', function(req, res) {
    db.models.Event.findOne({ _id: req.params.event_id }).exec(function(err, eventInfo) {
      if (err) { 
        // We're fucked
        es.writeHead(404, {'content-type':'application/json'});
        res.write(JSON.stringify({ 
          'status': 'fail', 
          'message': 'Event not found', 
          'data': { 'event_id': req.params.event_id } 
        })); // FIXME am I sure that findOne method would only error when unable to find an event?

        res.end();
        return logfmt.error(new Error('Unable to retrieve event: ' + err)); 
      }

      if (eventInfo.promotions && eventInfo.promotions.length > 0) {
        for (var i = 0; i < eventInfo.promotions.length; i++) {
          if (eventInfo.promotions[i].code === req.params.code) { // FIXME add date check
            res.writeHead(200, {'content-type':'application/json'});
            res.write(JSON.stringify({
              'status': 'success',
              'data': eventInfo.promotions[i]
            }));
            res.end();
            return;
          }
        }

        res.writeHead(404, {'content-type':'application/json'});
        res.write(JSON.stringify({
          'status': 'fail',
          'message': 'Promotional code not valid',
          'data': {
            'code': req.params.code
          }
        }));
        res.end();
      }
    });
  });

  app.post('/api/event/:event_id/order', function(req, res) {
    db.models.Event.findOne({ _id: req.params.event_id }).exec(function(err, eventInfo) {
      var f, registrationData, Cart, cart, saveRegistration;

      if (err) { 
        // We're fucked
        res.writeHead(404, {'content-type':'application/json'});
        res.write(JSON.stringify({ 'status': 'fail', 'message': 'Event not found', 'data': { 'event_id': req.params.event_id } })); // FIXME am I sure that findOne method would only error when unable to find an event?
        res.end();
        return logfmt.error(new Error('Unable to retrieve event: ' + err )); 
      }

      f = req.body;
      registrationData = {};

      saveRegistration = function(registrationData) {
        var registrationModel;
        console.log(registrationData);

        registrationModel = new db.models.Registration(registrationData);
        registrationModel.save(function(err) {
          if (err) {
            // We're fucked
            res.writeHead(500, {'content-type':'application/json'});
            res.write(JSON.stringify({ 'status': 'error', 'message': 'Unable to store registration details', 'data': [err, registrationData] }));
            res.end();
            return logfmt.error(new Error('Unable to save registration: ' + err));
          }

          // Send success email
          for (var i = 0; i < registrationData.tickets; i++) {
            registrationData.tickets[i].attendeeNumber = i+1;
          }

          res.render('registration_email', registrationData, function(err, template) {
            if (err) { return logfmt.error(new Error('Error sending registration email')); }
            sendgrid.send({
              to: f.cc.email_address,
              from: 'hello@madebyfew.com',
              subject: 'Made By Few 2014 Registration',
              html: template
            }, function(err, json) {
              if (err) { return logfmt.error(new Error('Error sending registration email')); }
              logfmt.log({ 'type': 'email', 'message': json });
            });
          });
         
          // Show response JSON
          res.writeHead(200, {'content-type':'application/json'});
          res.write(JSON.stringify({ 'status': 'success', 'data': registrationData }));
          res.end();
        });
      };

      Cart = function() {
        var that, _items, _promocodes, _total;

        that = this;
        _items = [];
        _promocodes = [];
        _total = 0.00;

        that.addItem = function(item) {
          _items.push(item);
        };

        that.getItems = function() {
          return JSON.parse(JSON.stringify(_items));
        };

        that.addPromocode = function(promocode) {
          if (typeof promocode === 'string') {
            for (var i = 0; i < eventInfo.promotions.length; i++) {
              if (promocode === eventInfo.promotions[i].code) {
                _promocodes.push(eventInfo.promotions[i]);
                return;
              }
            }
          }

          _promocodes.push(promocode);
        };

        that.getPromocodes = function(promocode) {
          return JSON.parse(JSON.stringify(_promocodes));
        };

        that.getTotal = function(options) {
          var items, promocodes;

          items = that.getItems();
          promocodes = that.getPromocodes();
          _total = 0.00;

          for (var i = 0; i < items.length; i++) {
            _total += items[i].price;
          }

          for (var j = 0; j < promocodes.length; j++) {
            _total = (_total - promocodes[j].amount < 0) ? 0 : _total - promocodes[j].amount;
          }
          
          options = options || {};
          return options.formatted ? '$' + _total.toFixed(2).toString() : _total.toString();
        };

        return that;
      };

      cart = new Cart();

      registrationData.event = req.params.event_id;

      registrationData.customer = {
        name: f.cc.name,
        email_address: f.cc.email_address
      };

      // Attach ticket info to attendees
      for (var i = 0; i < f.attendees.length; i++) {
        for (var j = 0; j < eventInfo.tickets.length; j++) {
          if (f.attendees[i].ticket_id === String(eventInfo.tickets[j]._id)) {
            f.attendees[i].ticket = eventInfo.tickets[j]._id;
            cart.addItem(eventInfo.tickets[j]);
            break;
          }
        }
      }

      if (f.promocode) {
        for (var k = 0; k < f.promocode.length; k++) {
          cart.addPromocode(f.promocode[k]);
        }
      }

      registrationData.attendees = f.attendees;
      registrationData.promotions = _.map(cart.getPromocodes(), function(promocode) {
        return promocode._id;
      });
      registrationData.additional_information = f.additional_information;

      if (cart.getTotal() <= 0) {
        saveRegistration(registrationData);
      } else {
        // Process payment
        stripe.charges.create({
          amount: cart.getTotal()*100, // Stripe charges in cents not dollars. Fuckers.
          currency: 'usd',
          card: f.cc,
          metadata: { 'email': f.cc.email_address }
        }).then(function(charge) {
          logfmt.log({ 'type': 'charge', 'message': 'Successful charge', 'data': charge });

          // Add payment to main object
          charge.card.card_type = charge.card.type; // Get around mongo reserved word issue

          registrationData.payment = charge;
          saveRegistration(registrationData);
        }, function(err) {
          res.writeHead(400, {'content-type':'application/json'});
          res.write(JSON.stringify({ 'status': 'fail', 'data': err })); // FIXME data should respond with which parts of the request failed in key/value pairs
          res.end();
          return logfmt.error(new Error('Error processing card: ' + err));
        });
      }
    });
  });

  return app;
})();