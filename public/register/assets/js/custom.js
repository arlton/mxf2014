var AMASS = (function() {
  "use strict";

  var AmassEvent, // Event object
    amassEvent,   // Instantiated event object

    Attendees,    // Attendees object
    Attendee,     // Single attendee object
    attendees,    // Instantiated attendees object

    Cart,         // Cart object
    cart,         // Instantiated cart object

    attendeeTemplateSrc   = document.getElementById('attendee-template').innerHTML,

    // Nodes
    attendeesEl           = document.getElementById('attendees'),
    ticketNumberEl        = document.getElementById('ticket-number'),

    settings = {
      transitions: {}
    },

    _events = {};
  
  Attendees = function() {
    var that, _list;

    that = this;
    _list = [];

    Attendee = function(parent, attributes) {
      var that, container, inputs, removeBtns;

      that = this;

      that.parent = parent;

      that.attributes = attributes || {};

      that.attributes.attendeeNumber = that.parent.count()+1;

      that.attributes.hasRemove = that.attributes.attendeeNumber > 1;

      container = document.createElement('div');
      container.innerHTML = that.template(that.attributes);

      inputs = container.getElementsByTagName('input');
      removeBtns = container.getElementsByClassName('remove');

      // Bind inputs live
      for (var i = 0; i < inputs.length; i++) {
        inputs[i].onkeyup = function() {
          var thisInput = this;
          attributes[thisInput.name] = thisInput.value;
        };
      }

      // Bind remove buttons
      for (var i = 0; i < removeBtns.length; i++) {
        removeBtns[i].onclick = function() {
          that.parent.remove(that);
        };
      }

      attendeesEl.appendChild(container);

      if (typeof settings.transitions.addAttendee === 'function') {
        container.style.display = 'none';

        settings.transitions.addAttendee(container, function() {});
      }

      that.el = container;
    };

    Attendee.prototype.template = Handlebars.compile(attendeeTemplateSrc);

    that.add = function(attributes) {
      attributes = attributes || {};
      attributes.index = that.count();
      _list.push(new Attendee(that, attributes));
    };

    that.remove = function(attendee) {
      if (typeof attendee === 'number') {
        attendee = _list[attendee];
      }

      if (typeof _events.onAttendeeRemove === 'function') {
        _events.onAttendeeRemove(attendee);
      }
      
      _list.splice(attendee.index,1);

      if (typeof settings.transitions.removeAttendee === 'function') {
        settings.transitions.removeAttendee(attendee.el, function() {
          attendee.el.parentNode.removeChild(attendee.el);
        });
      } else {
        attendee.el.parentNode.removeChild(attendee.el);
      }
    };

    that.serialize = function() {
      var result = [];
      for (var i = 0; i < that.count(); i++) {
        result.push(_list[i].attributes);
      }

      return JSON.stringify(result);
    };

    that.count = function() {
      return _list.length;
    };
  };

  Cart = function() {
    var that, _items, _total;

    that = this;

    _items = [];
    _total = 0.00;

    that.addItem = function(item) {
      if (item.id && item.price && item.title) {
        that._items.push(item);
      }

      return (item.id && item.price && item.title);
    };

    that.removeItem = function(item) {
      for (var i = 0; i < _items.length; i++) {
        if (_items[i].id === item.id) {
          _items.splice(i, 1);
          that.updateTotal();
          return _items;
        }
      }
    };

    that.getItems = function() {
      return JSON.parse(JSON.stringify(that._items));
    };

    that.updateTotal = function() {
      var items = that.getItems();
      _total = 0.00;

      for (var i = 0; i < items.length; i++) {
        _total += items[i].price;
      }

      return that.getTotal();
    };

    that.getTotal = function() {
      return _total.toString();
    };

    that.empty = function() {
      _items = [];
      _total = 0.00;
    };
  };

  // ** INIT
  attendees = new Attendees();
  cart = new Cart();

  attendees.add();

  // ** EVENTS
  _events.onAttendeeRemove = function() {
    ticketNumberEl.value = attendees.count();
  };

  // Ticket numbers changed
  ticketNumberEl.onkeyup = function() {
    var attendeesCount = attendees.count(),
      ticketsCount = Number(ticketNumberEl.value);

    if (ticketsCount > attendeesCount) {
      for (var i = 0; i < (ticketsCount - attendeesCount); i++) {
        attendees.add();
      }
    } else {
      for (var i = 0; i < (attendeesCount - ticketsCount); i++) {
        attendees.remove(attendees.count()-1);
      }
    }
  };

  // Expose a few methods so users can make their own magic happen
  return function() {
    var that;

    that = this;

    that.setEvent = function(eventInfo) {
      if (typeof eventInfo === 'object') {
        settings.eventInfo = eventInfo;
      }
    };

    that.setTransitions = function(transitions) {
      if (typeof transitions === 'object') {
        settings.transitions = transitions;
      }
    };

    return that;
  };
})();

// ** EVERYTHING BELOW NOT PART OF OUT OF BOX AMASS CODE
var amass = new AMASS();

amass.setTransitions({
  addAttendee: function(attendeeEl, callback) {
    $(attendeeEl).fadeIn('fast', callback);
  },

  removeAttendee: function(attendeeEl, callback) {
    $(attendeeEl).fadeOut('fast', callback);
  }
});