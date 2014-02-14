var stripe, mongoose, _, Event, Registration;

stripe    = require("stripe")(process.env.STRIPE_API_KEY);
mongoose  = require("mongoose");
_         = require("underscore");
logfmt    = require("logfmt");

mongoose.connect(process.env.MONGOHQ_URL, function (err, res) {
  var eventSchema, registrationSchema;
  if (err) {
    return logfmt.error(new Error('Unable to connect: ' + err));
  } else {
    logfmt.log({ 'type': 'database', 'message': 'Connected' });
  }

  eventSchema = new mongoose.Schema({
    title: { type: String, trim: true },
    logo_url: { type: String, trim: true },

    dates: {
      range: {
        from: Date,
        to: Date
      }
    },

    location: {
      address1: { type: String, trim: true },
      address2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipcode: { type: String, trim: true },
      zipcodeplus: { type: String, trim: true }
    },

    tickets: [
      {
        id: mongoose.Schema.ObjectId,
        title: { type: String, trim: true },
        price: Number,
        availability: {
          range: {
            from: Date,
            to: Date
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
      first_name: { type: String, trim: true },
      last_name: { type: String, trim: true },
      email_address: { type: String, trim: true },
      organization: { type: String, trim: true },
      shirt_size: { type: String, trim: true },
      ticket: { type: mongoose.Schema.ObjectId, ref: 'Events' },
      title: { type: String, trim: true },
      twitter_handle: { type: String, trim: true }
    }],

    additional_info: { type: String },

    payment: {
      id: String,
      object: String,
      created: Number,
      livemode: Boolean,
      paid: Boolean,
      amount: Number,
      currency: String,
      refunded: Boolean,
      card: {
        id: { type: String },
        object: String,
        last4: String,
        card_type: String,
        exp_month: Number,
        exp_year: Number,
        fingerprint: String,
        customer: String,
        country: String,
        name: String,
        address_line1: String,
        address_line2: String,
        address_city: String,
        address_state: String,
        address_zip: String,
        address_country: String,
        cvc_check: String,
        address_line1_check: String,
        address_zip_check: String 
      },
      captured: Boolean,
      refunds: Array,
      balance_transaction: String,
      failure_message: String,
      failure_code: String,
      amount_refunded: Number,
      customer: String,
      invoice: String,
      description: String,
      dispute: String
    }
  });

  Event = mongoose.model('Events', eventSchema);
  Registration = mongoose.model('Registrations', registrationSchema);

  /*
  var amassEvent = new Event({
    title: "Made By Few 2014",
    logo_url: "/register/assets/img/logo.png",
    settings: {
      dateFormat: "MMMM D, yyyy"
    },
    tickets: [
      {
        title: "Early Bird",
        price: 185,
        availability: {
          range: {
            from: "2014-01-01T06:00:00Z",
            to: "2014-06-01T04:59:59Z"
          }
        }
      },
      {
        title: "Regular",
        price: 235,
        availability: {
          range: {
            from: "2014-06-01T05:00:00Z",
            to: "2014-08-23T04:59:59Z"
          }
        }
      }
    ],
    location: {
      address1: "",
      address2: "",
      city: "Little Rock",
      state: "Arkansas",
      zipcode: "",
      zipcodeplus: ""
    },
    dates: {
      range: {
        from: "2014-08-22T05:00:00Z",
        to: "2014-08-24T04:59:59Z"
      }
    }
  });
  amassEvent.save(function(err) {
    console.log('Error?' + err);
  });
  */
});

module.exports = (function() {
  var express, app;
  
  express = require('express');
  app = express();

  app.use(express.bodyParser());

  app.get('/api/events', function(req, res) {
    res.writeHead(200, {'content-type':'text/html'});
    // Get all events from database
    res.end();
  });
  
  app.get('/api/event/:event_id', function(req, res) {
    res.writeHead(200, {'content-type':'text/html'});
    // Get single event from database
    Event.findOne({ _id: req.params.event_id }).exec(function(err, eventInfo) {
      if (err) { 
        // We're fucked
        res.write(JSON.stringify({ 'status': 'error', 'message': err, 'data': eventInfo }));
        res.end();
        return logfmt.error(new Error('Unable to retrieve event: ' + err)); 
      }
      
      res.write(JSON.stringify(eventInfo));
      res.end();
    });
  });

  app.post('/api/event/:event_id/order', function(req, res) {
    var f, registrationData, registrationModel, Cart, cart;
    res.writeHead(200, {'content-type':'text/html'});

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
        res.write(JSON.stringify({ 'status': 'error', 'message': err, 'data': eventInfo }));
        res.end();
        return logfmt.error(new Error('Unable to retrieve event: ' + err )); 
      }

      registrationData.event = req.params.event_id;

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

      // Process payment
      stripe.charges.create({
        amount: cart.getTotal(),
        currency: 'usd',
        card: f.cc
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
            res.write(JSON.stringify({ 'status': 'error', 'message': err, 'registration': registrationData }));
            res.end();
            return logfmt.error(new Error('Unable to save registration: ' + err));
          }

          // Show response JSON
          res.write(JSON.stringify({ 'status': 'success', 'registration': registrationData }));
          res.end();
        });
      }, function(err) {
        res.write(JSON.stringify({ 'status': 'error', 'message': err, 'registration': registrationData }));
        res.end();
        return logfmt.error(new Error('Error processing card: ' + err));
      });
    });
  });

  return app;
})();