var Event, ApiResponse, _, strip, sendgrid;

Event         = require('../models/event');
Registration  = require('../models/registration');

ApiResponse   = require('../utils/apiresponse');
_             = require('underscore');
stripe        = require('stripe')(process.env.STRIPE_API_KEY);
sendgrid      = require('sendgrid')(
  process.env.SENDGRID_USERNAME,
  process.env.SENDGRID_PASSWORD
);

module.exports.controller = function(app) {
  app.post('/api/event/:event_id/order', function(req, res) {
    var apiresponse = new ApiResponse(res);

    Event.findOne({ _id: req.params.event_id }).exec(function(err, eventInfo) {
      var f, registrationData, Cart, cart, saveRegistration;

      if (err) { 
        // We're fucked
        apiresponse.send(404, { 
          'status': 'fail', 
          'message': 'Event not found', 
          'data': { 'event_id': req.params.event_id }
        }); // FIXME am I sure that findOne method would only error when unable to find an event?
        return logfmt.error(new Error('Unable to retrieve event: ' + err )); 
      }

      f = req.body;
      registrationData = {};

      saveRegistration = function(registrationData) {
        var registrationModel;

        registrationModel = new Registration(registrationData);
        registrationModel.save(function(err) {
          if (err) {
            // We're fucked
            apiresponse.send(500, { 
              'status': 'error', 
              'message': 'Unable to store registration details', 
              'data': [err, registrationData]
            });
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
          apiresponse.send(200, { 'status': 'success', 'data': registrationData });
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
          apiresponse.send(400, { 'status': 'fail', 'data': err }); // FIXME data should respond with which parts of the request failed in key/value pairs
          return logfmt.error(new Error('Error processing card: ' + err));
        });
      }
    });
  });
};