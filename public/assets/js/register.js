/* global Handlebars, jQuery, $, HBS */
var AMASS = (function($) {
  "use strict";

  var Attendees,    // Attendees object
    attendees,    // Instantiated attendees object

    Cart,         // Cart object
    cart,         // Instantiated cart object

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
      var _completed, _results, asyncCount;

      _completed = 0;
      _results = [];
      
      asyncCount = function() {
        _completed += 1;

        if (_completed === functions.length) {
          asyncCallback(_results);
        }
      };

      for (var i = 0; i < functions.length; i++) {
        _results.push(functions[i](asyncCount));
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
      var that, container, formTagsEl, inputsEl, selectsEl, removeBtns,
        bindInput, bindRemove;

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
      bindInput = function() {
        var thisInput = this;
        attributes[thisInput.name] = thisInput.value;
      };

      for (var j = 0; j < formTagsEl.length; j++) {
        formTagsEl[j].onchange = bindInput;
      }

      bindRemove = function() {
        that.parent.remove(that);
      };

      // Bind remove buttons
      for (var k = 0; k < removeBtns.length; k++) {
        removeBtns[k].onclick = bindRemove;
      }

      attendeesEl.appendChild(container);

      that.el = container;

      callEvent('addAttendee', function(){}, that);
    };

    Attendee.prototype.template = Handlebars.partials['attendee'];

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

      for (var j in totalCostEl) {
        totalCostEl[j].innerHTML = that.getTotal({ formatted: true });
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
    var updateTicketNumber;

    ticketNumbersEl = document.getElementById('tickets').getElementsByClassName('ticket-number');

    // Ticket numbers changed
    updateTicketNumber = function() {
      var attendeesCount = attendees.count(),
        ticket = {},
        ticketsCount = parseInt(this.value, 10),
        ticketId = this.getAttribute('data-ticket-id');

      for (var j in settings.eventInfo.tickets) {
        if (settings.eventInfo.tickets[j]._id === ticketId) {
          ticket = settings.eventInfo.tickets[j];
          break;
        }
      }

      if (ticketsCount > attendeesCount) {
        for (var k = 0; k < (ticketsCount - attendeesCount); k++) {
          attendees.add({ticket: ticket});
        }
      } else {
        for (var l = 0; l < (attendeesCount - ticketsCount); l++) {
          attendees.remove(attendees.count()-1);
        }
      }
    };

    for (var i in ticketNumbersEl) {
      ticketNumbersEl[i].onblur = updateTicketNumber;
    }

    attendees = new Attendees();
    cart = new Cart();

    // Setup initial validation
    $(amassFormEl).parsley();

    // Artificially adding an early bird ticket. FIXME THIS IS SHITTTTTTTT
    attendees.add({ ticket: settings.eventInfo.tickets[0] });
  }

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
    var attendee, attendeeFilter;

    attendee = this;

    attendeeFilter = function(attendee) {
      return attendee.attributes.ticket._id === 
        ticketNumbersEl[i].getAttribute('data-ticket-id');
    };

    for (var i = 0; i < ticketNumbersEl.length; i++) {
      if (ticketNumbersEl[i].getAttribute('data-ticket-id') === attendee.attributes.ticket._id) {
        ticketNumbersEl[i].value = attendees.count(attendeeFilter);
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
      container.innerHTML = Handlebars.partials['promosuccess'](data);
      promocodeMessagingEl.appendChild(container);
    }).fail(function(jqXHR, textStatus, errorThrown) {
      promocodeMessagingEl.innerHTML = Handlebars.partials['promofail'](jqXHR.responseJSON);
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
        mainEl.innerHTML = Handlebars.partials['registersuccess']();
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
})(jQuery);

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