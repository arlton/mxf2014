var db, registrationSchema, Registration;

db = require('../db');

registrationSchema = new db.Schema({
  event: { type: db.Schema.ObjectId, ref: 'Events' },
  
  attendees: [{
    first_name     : { type: String, trim: true },
    last_name      : { type: String, trim: true },
    email_address  : { type: String, trim: true },
    organization   : { type: String, trim: true },
    shirt_size     : { type: String, trim: true },
    ticket         : { type: db.Schema.ObjectId, ref: 'Events' },
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

  promotions: [{ type: db.Schema.ObjectId, ref: 'Events' }]
});

Registration = db.model('Registrations', registrationSchema);

module.exports = Registration;