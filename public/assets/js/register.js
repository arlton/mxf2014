var AMASS = (function($, DateFormat) {
  "use strict";

  var Attendees,    // Attendees object
    attendees,    // Instantiated attendees object

    Cart,         // Cart object
    cart,         // Instantiated cart object

    attendeeTemplateSrc        = document.getElementById('attendee-template').innerHTML,
    registerSuccessTemplateSrc = document.getElementById('register-success-template').innerHTML,
    promocodeFailureTemplateSrc = document.getElementById('promocode-failure-template').innerHTML,
    promocodeSuccessTemplateSrc = document.getElementById('promocode-success-template').innerHTML,
    ticketsTemplateSrc         = document.getElementById('tickets-template').innerHTML,
    ticketsTemplate            = Handlebars.compile(ticketsTemplateSrc),
    ticketNumbersEl,           // Defined after tickets are pulled from server

    // Nodes
    mainEl                     = document.getElementById('main'),
    attendeesEl                = document.getElementById('attendees'),
    ticketsEl                  = document.getElementById('tickets'),
    amassFormEl                = document.getElementById('amass-form'),
    promocodeSubmitEl          = document.getElementById('test-promocode'),
    promocodeInputEl           = document.getElementById('promocode'),
    promocodeMessagingEl       = document.getElementById('promocode-messaging'),
    totalCostEl                = document.getElementsByClassName('total-cost'),

    settings = {},

    callEvent, 
    _events = {};

  callEvent = function(name, callback, context) {
    var async;

    context = context || this;
    callback = callback || function(){};

    /**
     * Takes an array of functions and waits for them all to return before continuing
     * @param  {Array}   functions
     * @param  {Function} callback  Ends the entire async process and executes callback
     * @return {Object}             If any of the functions return anything, we add it to an object
     */
    async = function(functions, asyncCallback) {
      var _completed, _results;

      _completed = 0;
      _results = [];

      for (var i = 0; i < functions.length; i++) {
        _results.push(functions[i](function() {
          _completed += 1;

          if (_completed === functions.length) {
            asyncCallback(_results);
          }
        }));
      }
    };

    if (typeof _events[name] === 'object' && _events[name].length > 0) {
      return async($.map(_events[name], function(event) {
        return event.bind(context);
      }), callback);
    }

    return callback();
  };

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

      that.el = container;

      callEvent('addAttendee', function(){}, that);
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

      callEvent('removeAttendee', function() {
        attendee.el.parentNode.removeChild(attendee.el);
      }, attendee);
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
      if (item._id && item.price && item.title) {
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
  _events.addAttendee = [];
  _events.addAttendee.push(function(callback) {
    var attendee = this;

    cart.addItem(attendee.attributes.ticket);
    $('input, select', attendee.el).each(function() {
      var $this = $(this);

      if ($this.attr('id')) {
        $(amassFormEl).parsley('addItem', '#' + $this.attr('id'));
      }
    });

    callback();
  });

  _events.removeAttendee = [];
  _events.removeAttendee.push(function(callback) {
    var attendee = this;
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

    callback();
  });

  _events.promocodeSubmit = [];
  _events.promocodeSubmit.push(function(callback) {
    var template, container;

    container = document.createElement('div');

    $.ajax({
      url: '/api/event/' + settings.eventInfo._id + '/promo/' + promocodeInputEl.value,
      type: 'GET',
      dataType: 'json'
    }).done(function(data, textStatus, jqXHR) {
      template = Handlebars.compile(promocodeSuccessTemplateSrc);
      container.innerHTML = template(data);
      promocodeMessagingEl.appendChild(container);
    }).fail(function(jqXHR, textStatus, errorThrown) {
      template = Handlebars.compile(promocodeFailureTemplateSrc);
      promocodeMessagingEl.innerHTML = template(jqXHR.responseJSON);
    }).always(callback);

    callback();
  });

  _events.formSubmit = [];
  _events.formSubmit.push(function(callback) {
    var successTemplate;

    if ($(amassFormEl).parsley('validate')) {
      $.ajax({
        url: '/api/event/' + settings.eventInfo._id + '/order',
        type: 'POST',
        dataType: 'json',
        data: $(amassFormEl).serialize()
      }).done(function(data, textStatus, jqXHR) {
        successTemplate = Handlebars.compile(registerSuccessTemplateSrc);
        mainEl.innerHTML = successTemplate(registerSuccessTemplateSrc);
      }).fail(function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR, jqXHR.responseJSON, textStatus, errorThrown);
      }).always(callback);
    }

    callback();
  });

  promocodeSubmitEl.onclick = function(event) {
    event.preventDefault();
    callEvent('promocodeSubmit');
  };

  amassFormEl.onsubmit = function(event) {
    event.preventDefault();
    callEvent('formSubmit');
  };

  // Expose a few methods so users can make their own magic happen
  return function() {
    var that;

    that = this;

    /**
     * Instantiates the whole Amass event page
     * @param {Object} eventInfo Check schema documentation for more info
     */
    that.setEventDetails = function(eventInfo) {
      if (typeof eventInfo === 'object') {
        settings.eventInfo = eventInfo;
        init();
      }
    };

    /**
     * Allows user to create their own event hooks
     * @param  {String}   eventType Title of event
     * @param  {Function} callback  Function to call when event occurs
     * @return {Boolean}            If event set properly, returns true
     */
    that.on = function(name, action) {
      if (typeof name !== 'string' || typeof action !== 'function') { return; }

      _events[name] = _events[name] || [];
      _events[name].push(action);

      return true;
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

  amass.on('addAttendee', function(callback) {
    var attendeeEl = this.el;
    $(attendeeEl).fadeIn('fast', callback);
  });

  amass.on('removeAttendee', function(callback) {
    var attendeeEl = this.el;
    $(attendeeEl).fadeOut('fast', callback);
  });

  amass.setEventDetails(event);
});