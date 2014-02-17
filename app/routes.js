var Handlebars, stripe, sendgrid, mongoose, _, Event, Registration, fs, moment;

Handlebars = require('handlebars');
stripe    = require('stripe')(process.env.STRIPE_API_KEY);
sendgrid  = require('sendgrid')(
  process.env.SENDGRID_USERNAME,
  process.env.SENDGRID_PASSWORD
);
mongoose  = require('mongoose');
_         = require('underscore');
logfmt    = require('logfmt');
fs        = require('fs');
moment    = require('moment');

mongoose.connect(process.env.MONGOHQ_URL, function (err, res) {
  var eventSchema, registrationSchema, promotionSchema;

  if (err) {
    res.writeHead(500, {'content-type':'application/json'});
    res.write(JSON.stringify({ 'status': 'error', 'message': err }));
    res.end();
    return logfmt.error(new Error('Unable to connect: ' + err));
  } else {
    logfmt.log({ 'type': 'database', 'message': 'Connected' });
  }

  eventSchema = new mongoose.Schema({
    title    : { type: String, trim: true },
    logo_url : { type: String, trim: true },

    dates: {
      range: {
        from : Date,
        to   : Date
      }
    },

    location: {
      address1    : { type: String, trim: true },
      address2    : { type: String, trim: true },
      city        : { type: String, trim: true },
      state       : { type: String, trim: true },
      zipcode     : { type: String, trim: true },
      zipcodeplus : { type: String, trim: true }
    },

    tickets: [
      {
        id    : mongoose.Schema.ObjectId,
        title : { type: String, trim: true },
        price : Number,
        availability: {
          range: {
            from : Date,
            to   : Date
          }
        }
      }
    ],

    promotions: [
      {
        id     : mongoose.Schema.ObjectId,
        title  : { type: String, trim: true },
        code   : { type: String, trim: true },
        amount : { type: Number },
        availability: {
          range: {
            from : Date,
            to   : Date
          }
        }
      }
    ],

    settings: {
      dateFormat: { type: String, trim: true, default: 'MMMM D, yyyy' }
    }
  });

  registrationSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.ObjectId, ref: 'Events' },
    
    attendees: [{
      first_name     : { type: String, trim: true },
      last_name      : { type: String, trim: true },
      email_address  : { type: String, trim: true },
      organization   : { type: String, trim: true },
      shirt_size     : { type: String, trim: true },
      ticket         : { type: mongoose.Schema.ObjectId, ref: 'Events' },
      title          : { type: String, trim: true },
      twitter_handle : { type: String, trim: true }
    }],

    additional_information: { type: String, trim: true },

    customer: {
      name            : { type: String, trim: true },
      email_address   : { type: String, trim: true },
      address_line1   : { type: String, trim: true },
      address_line2   : { type: String, trim: true },
      address_city    : { type: String, trim: true },
      address_state   : { type: String, trim: true },
      address_zip     : { type: String, trim: true },
      address_country : { type: String, trim: true }
    },

    payment: {
      id       : String,
      object   : String,
      created  : Number,
      livemode : Boolean,
      paid     : Boolean,
      amount   : Number,
      currency : String,
      refunded : Boolean,
      card: {
        id                  : String,
        object              : String,
        last4               : String,
        card_type           : String,
        exp_month           : Number,
        exp_year            : Number,
        fingerprint         : String,
        customer            : String,
        country             : String,
        name                : String,
        address_line1       : String,
        address_line2       : String,
        address_city        : String,
        address_state       : String,
        address_zip         : String,
        address_country     : String,
        cvc_check           : String,
        address_line1_check : String,
        address_zip_check   : String
      },
      captured            : Boolean,
      refunds             : Array,
      balance_transaction : String,
      failure_message     : String,
      failure_code        : String,
      amount_refunded     : Number,
      customer            : String,
      invoice             : String,
      description         : String,
      dispute             : String
    }
  });

  Event = mongoose.model('Events', eventSchema);
  Registration = mongoose.model('Registrations', registrationSchema);
});

module.exports = (function() {
  var express, app, hbs;
  
  express = require('express');
  app     = express();
  hbs     = require('hbs');

  app.use(express.bodyParser());

  //** PAGES
  app.get('/', function(req, res) {
    res.render('home');
  });

  app.get('/register', function(req, res) {
    // Get single event from database
    Event.findOne({ _id: '52fd903c133ae6bd9fcd2423' }).exec(function(err, eventInfo) {
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
    Event.findOne({ _id: req.params.event_id }).exec(function(err, eventInfo) {
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
    Event.findOne({ _id: req.params.event_id }).exec(function(err, eventInfo) {
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
    var f, registrationData, registrationModel, Cart, cart;

    f = req.body;
    registrationData = {};

    Cart = function() {
      var that, _items, _total;

      that = this;
      _items = [];
      _total = 0.00;

      that.addItem = function(item) {
        _items.push(item);
      };

      that.getItems = function() {
        return JSON.parse(JSON.stringify(_items));
      };

      that.getTotal = function() {
        var items;

        items = that.getItems();

        for (var i = 0; i < items.length; i++) {
          _total += items[i].price;
        }

        return Number(_total);
      };

      return that;
    };

    cart = new Cart();

    Event.findOne({ _id: req.params.event_id }).exec(function(err, eventInfo) {
      if (err) { 
        // We're fucked
        res.writeHead(404, {'content-type':'application/json'});
        res.write(JSON.stringify({ 'status': 'fail', 'message': 'Event not found', 'data': { 'event_id': req.params.event_id } })); // FIXME am I sure that findOne method would only error when unable to find an event?
        res.end();
        return logfmt.error(new Error('Unable to retrieve event: ' + err )); 
      }

      registrationData.event = req.params.event_id;

      registrationData.customer = {
        name: f.cc.name,
        email_address: f.cc.email_address
      };

      // Validate cart FIXME

      // Attach ticket info to attendees
      for (var i = 0; i < f.attendees.length; i++) {
        for (var x = 0; x < eventInfo.tickets.length; x++) {
          if (f.attendees[i].ticket_id === String(eventInfo.tickets[x]._id)) {
            f.attendees[i].ticket = eventInfo.tickets[x]._id;
            cart.addItem(eventInfo.tickets[x]);
            break;
          }
        }
      }

      registrationData.attendees = f.attendees;
      registrationData.additional_information = f.additional_information;

      // Process payment
      stripe.charges.create({
        amount: cart.getTotal(),
        currency: 'usd',
        card: f.cc,
        metadata: { 'email': f.cc.email_address }
      }).then(function(charge) {
        logfmt.log({ 'type': 'charge', 'message': 'Successful charge', 'data': charge });

        // Add payment to main object
        charge.card.card_type = charge.card.type; // Get around mongo reserved word issue

        registrationData.payment = charge;

        // Update database
        registrationModel = new Registration(registrationData);

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
      }, function(err) {
        res.writeHead(400, {'content-type':'application/json'});
        res.write(JSON.stringify({ 'status': 'fail', 'data': err })); // FIXME data should respond with which parts of the request failed in key/value pairs
        res.end();
        return logfmt.error(new Error('Error processing card: ' + err));
      });
    });
  });

  return app;
})();