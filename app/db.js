var db;

db = (function() {
  var that, _mongoose, _eventSchema, _registrationSchema;
  
  that = this;
  _mongoose = require('mongoose');
  _mongoose.connect(process.env.MONGOHQ_URL);

  that.connection = _mongoose.connection;

  that.connection.on('error', function(err) {
    if (err) {
      res.writeHead(500, {'content-type':'application/json'});
      res.write(JSON.stringify({ 'status': 'error', 'message': err }));
      res.end();
      return logfmt.error(new Error('Unable to connect: ' + err));
    }
  });

  that.connection.once('open', function callback () {
    logfmt.log({ 'type': 'database', 'message': 'Connected' });
  });

  _eventSchema = new _mongoose.Schema({
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
        id    : _mongoose.Schema.ObjectId,
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
        id     : _mongoose.Schema.ObjectId,
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

    registrations: [{ type: _mongoose.Schema.ObjectId, ref: 'Registrations' }],

    settings: {
      dateFormat: { type: String, trim: true, default: 'MMMM D, yyyy' }
    }
  });

  _registrationSchema = new _mongoose.Schema({
    event: { type: _mongoose.Schema.ObjectId, ref: 'Events' },
    
    attendees: [{
      first_name     : { type: String, trim: true },
      last_name      : { type: String, trim: true },
      email_address  : { type: String, trim: true },
      organization   : { type: String, trim: true },
      shirt_size     : { type: String, trim: true },
      ticket         : { type: _mongoose.Schema.ObjectId, ref: 'Events' },
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
    },

    promotions: [{ type: _mongoose.Schema.ObjectId, ref: 'Events' }]
  });

  that.models = {
    Event: _mongoose.model('Events', _eventSchema),
    Registration: _mongoose.model('Registrations', _registrationSchema)
  };

  return that;
})();

module.exports = db;