var db, eventSchema, Event;

db = require('../db');

eventSchema = new db.Schema({
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
      id    : db.Schema.ObjectId,
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
      id     : db.Schema.ObjectId,
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

  registrations: [{ type: db.Schema.ObjectId, ref: 'Registrations' }],

  settings: {
    dateFormat: { type: String, trim: true, default: 'MMMM D, yyyy' }
  }
});

Event = db.model('Events', eventSchema);

module.exports = Event;