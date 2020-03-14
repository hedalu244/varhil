document.addEventListener("DOMContentLoaded", function() {
  $('#draw-svg').drawsvg().drawsvg('animate');
  setTimeout(()=>$('#logo').animate({opacity:1}), 2300);
  //サイト内リンクで来たとき
  if (new URL(document.referrer).hostname === location.hostname){

  }
  //サイト外から来たとき
  else {
  }
  // スクロール禁止
  function forbid_scroll() {
    // PC
    document.addEventListener("mousewheel", scroll_control, { passive: false });
    // スマホ
    document.addEventListener("touchmove", scroll_control, { passive: false });
  }
  // スクロール禁止解除
  function permit_scroll() {
    // PC
    document.removeEventListener("mousewheel", scroll_control, { passive: false });
    // スマホ
    document.removeEventListener('touchmove', scroll_control, { passive: false });
  }

  function scroll_control (event) {
    event.preventDefault();
  }
});
