var Event, _;

Event     = require('../models/event');

_         = require('underscore');

module.exports.controller = function(app) {
  app.get('/api/event/:event_id', function(req, res) {
    // Get single event from database
    Event.findOne({ _id: req.params.event_id }).exec(function(err, eventInfo) {
      if (err) { 
        // We're fucked
        res.writeHead(404, {'content-type':'application/json'});
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
    function promotionFail(data) {
      data = data || {};
      res.writeHead(404, {'content-type':'application/json'});
      res.write(JSON.stringify({ 
        'status': 'fail', 
        'message': 'Promotional code not valid', 
        'data': data
      }));
      res.end();
    };

    Event.findOne({ 'promotions.code': req.params.code }, 'promotions.$', function(err, eventInfo) {
      var promotion;

      if (err || !eventInfo) {
        return promotionFail({ 'code': req.params.code });
      }

      promotion = eventInfo.promotions[0];

      Registration.findOne({ 'promotions': promotion._id }, function(err, registration) {
        // Has promotion already been used before?
        if (registration) {
          return promotionFail({ '_id': promotion._id });
        }

        res.writeHead(200, {'content-type':'application/json'});
        res.write(JSON.stringify({
          'status': 'success',
          'data': promotion
        }));
        res.end();
      });
    });
  });
};