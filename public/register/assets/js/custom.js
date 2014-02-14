var AMASS = (function($, DateFormat) {
  "use strict";

  var Attendees,    // Attendees object
    attendees,    // Instantiated attendees object

    Cart,         // Cart object
    cart,         // Instantiated cart object

    attendeeTemplateSrc        = document.getElementById('attendee-template').innerHTML,
    registerSuccessTemplateSrc = document.getElementById('register-success-template').innerHTML,
    ticketsTemplateSrc         = document.getElementById('tickets-template').innerHTML,
    ticketsTemplate            = Handlebars.compile(ticketsTemplateSrc),
    ticketNumbersEl,           // Defined after tickets are pulled from server

    // Nodes
    mainEl                     = document.getElementById('main'),
    attendeesEl                = document.getElementById('attendees'),
    ticketsEl                  = document.getElementById('tickets'),
    amassFormEl                = document.getElementById('amass-form'),
    totalCostEl                = document.getElementsByClassName('total-cost'),

    settings = {
      transitions: {}
    },

    _events = {};

  Attendees = function() {
    var that, _list, Attendee;

    that = this;
    _list = [];

    Attendee = function(parent, attributes) {
      var that, container, formTagsEl, inputsEl, selectsEl, removeBtns;

      that = this;

      that.parent = parent;

      that.attributes = attributes;
      that.attributes.attendeeNumber = that.parent.count()+1;

      that.hasRemove = (that.attributes.attendeeNumber > 1);
      that.index = that.parent.count();

      container = document.createElement('div');
      container.innerHTML = that.template(that);

      inputsEl = container.getElementsByTagName('input');
      inputsEl = Array.prototype.slice.call(inputsEl);

      selectsEl = container.getElementsByTagName('select');
      selectsEl = Array.prototype.slice.call(selectsEl);

      formTagsEl = inputsEl.concat(selectsEl);

      removeBtns = container.getElementsByClassName('remove');

      // Bind inputs live
      for (var i = 0; i < formTagsEl.length; i++) {
        formTagsEl[i].onchange = function() {
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
      var attendee = new Attendee(that, attributes || {});
      _list.push(attendee);
      if (typeof _events.onAttendeeAdd === 'function') {
        _events.onAttendeeAdd(attendee);
      }
    };

    that.remove = function(attendee) {
      if (typeof attendee === 'number') {
        attendee = _list[attendee];
      }

      _list.splice(attendee.index,1);

      if (typeof _events.onAttendeeRemove === 'function') {
        _events.onAttendeeRemove(attendee);
      }

      if (typeof settings.transitions.removeAttendee === 'function') {
        settings.transitions.removeAttendee(attendee.el, function() {
          attendee.el.parentNode.removeChild(attendee.el);
        });
      } else {
        attendee.el.parentNode.removeChild(attendee.el);
      }
    };

    that.all = function() {
      var result = [];
      for (var i = 0; i < that.count(); i++) {
        result.push(_list[i].attributes);
      }

      return result;
    };

    that.serialize = function() {
      return JSON.stringify(that.all());
    };

    that.count = function(query) {
      var count;
      if (!query) {
        return _list.length;
      }

      if (typeof query === 'function') {
        count = 0;
        for (var i in _list) {
          if (query(_list[i])) {
            count += 1;
          }
        }

        return count;
      }
    };
  };

  Cart = function() {
    var that, _items, _total;

    that = this;

    _items = [];
    _total = 0.00;

    that.addItem = function(item) {
      if (item.id && item.price && item.title) {
        _items.push(item);
      }

      that.updateTotal();

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
      return JSON.parse(JSON.stringify(_items));
    };

    that.updateTotal = function() {
      var items = that.getItems();
      _total = 0.00;

      for (var i = 0; i < items.length; i++) {
        _total += items[i].price;
      }

      for (var i in totalCostEl) {
        totalCostEl[i].innerHTML = that.getTotal({ formatted: true });
      }

      return that.getTotal();
    };

    that.getTotal = function(options) {
      options = options || {};
      return options.formatted ? '$' + _total.toFixed(2).toString() : _total.toString();
    };

    that.empty = function() {
      _items = [];
      _total = 0.00;
    };
  };

  // ** INIT
  function init() {
    var ticketsContainer;

    // Update AMASS Event with some dynamicness
    settings.eventInfo.tickets = $.map(settings.eventInfo.tickets, function(ticket) {
      var avail, today, from, to;

      avail = ticket.availability;
      today = new Date();
      today.setHours(0);
      today.setMinutes(0);
      today.setSeconds(0);
      today.setMilliseconds(0);

      if (!avail) {
        ticket.dateSentance = 'Not available';
        return ticket;
      }

      if (avail.range) {
        from = new Date(avail.range.from);
        from.setHours(0);
        from.setMinutes(0);
        from.setSeconds(0);
        from.setMilliseconds(0);

        to = new Date(avail.range.to);
        to.setHours(0);
        to.setMinutes(0);
        to.setSeconds(0);
        to.setMilliseconds(0);

        // Ticket available today or earlier and ends later than today
        if (from <= today && to > today) {
          ticket.dateSentance = 'Ends ' + DateFormat.format.date(to, settings.eventInfo.settings.dateFormat);
          ticket.isAvailable = true;
        }

        // Ticket available today only (last day included)
        if (today === to) {
          ticket.dateSentance = 'Ends today';
          ticket.isAvailable = true;
        }

        // Ticket starts today or earlier and ends on or past event date FIXME


        // Ticket starts later than today and ends later than the day it starts and is multiple days
        if (from > today && to > today && from !== to) {
          ticket.dateSentance = 'Available from ' + DateFormat.format.date(from, settings.eventInfo.settings.dateFormat) 
                                  + ' to ' + DateFormat.format.date(to, settings.eventInfo.settings.dateFormat);
          ticket.isAvailable = false;
        }

        // Ticket starts later than today and ends later than today and is only for one day
        if (from > today && to > today && from === to) {
          ticket.dateSentance = 'Available only on ' + DateFormat.format.date(to, settings.eventInfo.settings.dateFormat);
          ticket.isAvailable = false;
        }

        ticket.formattedPrice = '$' + ticket.price.toFixed(2).toString();

        return ticket;
      }
    });

    ticketsContainer = document.createElement('div');
    ticketsContainer.innerHTML = ticketsTemplate(settings.eventInfo);

    ticketNumbersEl = ticketsContainer.getElementsByClassName('ticket-number');

    // Ticket numbers changed
    for (var i in ticketNumbersEl) {
      ticketNumbersEl[i].onblur = function() {
        var attendeesCount = attendees.count(),
          ticket = {},
          ticketsCount = parseInt(this.value),
          ticketId = this.getAttribute('data-ticket-id');

        for (var i in settings.eventInfo.tickets) {
          if (settings.eventInfo.tickets[i]._id === ticketId) {
            ticket = settings.eventInfo.tickets[i];
            break;
          }
        }

        if (ticketsCount > attendeesCount) {
          for (var i = 0; i < (ticketsCount - attendeesCount); i++) {
            attendees.add({ticket: ticket});
          }
        } else {
          for (var i = 0; i < (attendeesCount - ticketsCount); i++) {
            attendees.remove(attendees.count()-1);
          }
        }
      };
    }

    ticketsEl.appendChild(ticketsContainer);

    attendees = new Attendees();
    cart = new Cart();

    // Setup initial validation
    $(amassFormEl).parsley();

    // Artificially adding an early bird ticket. FIXME THIS IS SHITTTTTTTT
    attendees.add({ ticket: settings.eventInfo.tickets[0] });
  };

  // ** EVENTS
  _events.onAttendeeAdd = function(attendee) {
    cart.addItem(attendee.attributes.ticket);
    $('input, select', attendee.el).each(function() {
      var $this = $(this);

      if ($this.attr('id')) {
        $(amassFormEl).parsley('addItem', '#' + $this.attr('id'));
      }
    });
  };

  _events.onAttendeeRemove = function(attendee) {
    for (var i = 0; i < ticketNumbersEl.length; i++) {
      if (ticketNumbersEl[i].getAttribute('data-ticket-id') === attendee.attributes.ticket._id) {
        ticketNumbersEl[i].value = attendees.count(function(attendee) {
          return attendee.attributes.ticket._id === 
            ticketNumbersEl[i].getAttribute('data-ticket-id');
        });
      }
    }

    cart.removeItem(attendee.attributes.ticket);

    $('input, select', attendee.el).each(function() {
      var $this = $(this);

      if ($this.attr('id')) {
        $(amassFormEl).parsley('removeItem', '#' + $this.attr('id'));
      }
    });
  };

  amassFormEl.onsubmit = function(event) {
    var successTemplate;
    event.preventDefault();

    if ($(amassFormEl).parsley('validate')) {
      $.ajax({
        url: '/api/event/' + settings.eventInfo._id + '/order',
        type: 'POST',
        dataType: 'json',
        data: $(amassFormEl).serialize()
      }).done(function(result) {
        successTemplate = Handlebars.compile(registerSuccessTemplateSrc);
        //mainEl.innerHTML = successTemplate(registerSuccessTemplateSrc);
      });
    }
  };

  // Expose a few methods so users can make their own magic happen
  return function() {
    var that;

    that = this;

    that.setEvent = function(eventInfo) {
      if (typeof eventInfo === 'object') {
        settings.eventInfo = eventInfo;
        init();
      }
    };

    that.setTransitions = function(transitions) {
      if (typeof transitions === 'object') {
        settings.transitions = transitions;
      }
    };

    return that;
  };
})(jQuery, DateFormat);

// ** EVERYTHING BELOW NOT PART OF OUT OF BOX AMASS CODE
$.ajax({
  url: '/api/event/52fd903c133ae6bd9fcd2423',
  dataType: 'json'
}).done(function(event) {
  var amass = new AMASS();

  amass.setTransitions({
    addAttendee: function(attendeeEl, callback) {
      $(attendeeEl).fadeIn('fast', callback);
    },

    removeAttendee: function(attendeeEl, callback) {
      $(attendeeEl).fadeOut('fast', callback);
    }
  });

  amass.setEvent(event);
});