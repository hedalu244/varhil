document.addEventListener("DOMContentLoaded", function() {
  $('#draw-svg').drawsvg().drawsvg('animate');
  setTimeout(()=>$('#logo').animate({opacity:1}), 2300);
}
