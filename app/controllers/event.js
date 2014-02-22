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
};