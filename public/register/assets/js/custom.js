(function() {
  "use strict";

  var Attendees,  // Attendees object
    Attendee,     // Single attendee object
    attendees,    // Instantiated attendees object

    attendeeTemplateSrc   = document.getElementById('attendee-template').innerHTML,

    // Nodes
    attendeesEl           = document.getElementById('attendees'),
    ticketNumberEl        = document.getElementById('ticket-number'),
    addAttendeeButtonsEl  = document.getElementsByClassName('add-attendee');
  
  Attendees = function() {
    var that;

    that = this;
    that.list = [];

    that.add = function(attendee) {
      attendee.index = that.count();
      that.list.push(attendee);
    };

    that.remove = function(attendee) {
      if (typeof attendee === 'number') {
        attendee = that.list[attendee];
      }

      that.list.splice(attendee.index,1);
      attendee.remove();
    };

    that.serialize = function() {
      var result = [];
      console.log(that.list);
      for (var i = 0; i < that.count(); i++) {
        result.push(that.list[i].attributes);
      }

      return JSON.stringify(result);
    };

    that.count = function() {
      return that.list.length;
    };
  };

  Attendee = function(attributes) {
    var container, that, inputs;

    that = this;

    that.attributes = attributes || {};

    that.attributes.attendeeNumber = attendees.count()+1;

    container = document.createElement('div');
    container.innerHTML = that.template(that.attributes || {});

    inputs = container.getElementsByTagName('input');

    // Bind inputs live
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].onkeyup = function() {
        var thisInput = this;
        that.attributes[thisInput.name] = thisInput.value;
      };
    }

    attendeesEl.appendChild(container);

    that.el = container;

    that.remove = function() {
      that.el.parentNode.removeChild(that.el);
    };
  };

  Attendee.prototype.template = Handlebars.compile(attendeeTemplateSrc);

  // ** INIT
  attendees = new Attendees();
  attendees.add(new Attendee());

  // ** EVENTS
  // Ticket numbers changed
  ticketNumberEl.onkeyup = function() {
    var attendeesCount = attendees.count(),
      ticketsCount = Number(ticketNumberEl.value);

    if (ticketsCount > attendeesCount) {
      for (var i = 0; i < (ticketsCount - attendeesCount); i++) {
        attendees.add(new Attendee());
      }
    } else {
      for (var i = 0; i < (attendeesCount - ticketsCount); i++) {
        attendees.remove(attendees.count()-1);
      }
    }
  };

  function getCost() {
    var cost;

    return cost;
  }
})();