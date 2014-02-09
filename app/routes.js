var stripe;

stripe = require("stripe")(process.env.STRIPE_API_KEY);

module.exports = (function() {
  var express, app;
  
  express = require('express');
  app = express();

  app.use(express.bodyParser());

  app.get('/api/events', function(req, res) {
    // Get all events from database
  });
  
  app.get('/api/event/:event', function(req, res) {
    // Get single event from database
  });

  app.post('/api/order', function(req, res) {
    res.writeHead(200, {'content-type':'text/html'});
    // Validate cart
    
    // Validate CC info
    
    // Process payment
    

    // Add payment to main object
    
    // Update database
    
    // Show response JSON
    res.write(JSON.stringify(req.body));
    res.end();
  });

  return app;
})();