var Event, ApiResponse, _;

Event       = require('../models/event');

ApiResponse = require('../utils/apiresponse');
_           = require('underscore');

module.exports.controller = function(app) {
  app.get('/api/event/:event_id', function(req, res) {
    apiresponse = new ApiResponse(res);

    // Get single event from database
    Event.findOne({ _id: req.params.event_id }).exec(function(err, eventInfo) {
      if (err) { 
        // We're fucked
        
        apiresponse.send(404, {
          'status': 'fail', 
          'message': 'Event not found', 
          'data': { 'event_id': req.params.event_id } 
        }); // FIXME am I sure that findOne method would only error when unable to find an event?

        return logfmt.error(new Error('Unable to retrieve event: ' + err)); 
      }

      apiresponse.send(200, eventInfo);
    });
  });

  app.get('/api/event/:event_id/promo/:code', function(req, res) {
    apiresponse = new ApiResponse(res);

    function promotionFail(data) {
      data = data || {};
      apiresponse.send(404, { 
        'status': 'fail', 
        'message': 'Promotional code not valid', 
        'data': data
      });
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

        apiresponse.send(200, {
          'status': 'success',
          'data': promotion
        });
      });
    });
  });
};