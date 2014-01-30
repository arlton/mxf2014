/* global $ */
$(function(){
  "use strict";
  
  $.stellar();

  $.scrollIt();

  $("#navbar").headroom({
    "tolerance": 5,
    "offset": 205,
    "classes": {
      "initial": "animated",
      "pinned": "slideDown",
      "unpinned": "slideUp"
    }
  });

  var fadeStart = 100 // 100px scroll or less will equiv to 1 opacity
      , fadeUntil = 270 // 200px scroll or more will equiv to 0 opacity
      , fading = $('.fading')
  ;

  $(window).bind('scroll', function(){
      var offset = $(document).scrollTop()
          ,opacity=0
      ;
      if( offset<=fadeStart ){
          opacity=1;
      }else if( offset<=fadeUntil ){
          opacity=1-offset/fadeUntil;
      }
      fading.css('opacity',opacity);
      fading.show(); // Forces parallax to not fuck everything. Dirty.
  });

  $('#nav-wrapper').sticky_div();
});