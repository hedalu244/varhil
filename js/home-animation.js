document.addEventListener("DOMContentLoaded", function() {
  //直接来たとき||サイト内リンクで来たとき
  if (document.referrer === "" || new URL(document.referrer).hostname === location.hostname){
    $('#draw-svg').animate({opacity:1}, { duration: 600, easing: 'swing' });
    setTimeout(()=>$('#logo').animate({opacity:1}, { duration: 400, easing: 'swing' }), 200);
    setTimeout(()=>$('#content').animate({opacity:1}, { duration: 400, easing: 'swing' }), 400);
  }
  //サイト外から来たとき
  else {
    forbid_scroll();
    scrollTo(0, 0);
    $("#key-visual").css("margin-top", (window.innerHeight - $("#key-visual").outerHeight()) / 2 + "px");
    $("#draw-svg").css("opacity", 1)

    $('#draw-svg').drawsvg().drawsvg('animate');
    setTimeout(()=>$('#logo').animate({opacity:1}, { duration: 400, easing: 'swing' }), 2300);

    setTimeout($("#key-visual").animate({"margin-top":0}, { duration: 1000, easing: 'swing' }), 3000);
    setTimeout(()=>$('#content').animate({opacity:1}, { duration: 400, easing: 'swing' }), 3000);
    setTimeout(permit_scroll, 3000);
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
