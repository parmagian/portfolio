/**
 * hero.js — Featured-print swipe + nav scroll behaviour
 *
 * The hero shows one photograph at a time inside the matted frame. Every
 * HOLD_MS the current print drifts leftwards and fades out while the next
 * arrives from the right, so the change reads as a swipe rather than a
 * dissolve happening in one spot.
 */

(function () {
  'use strict';

  var HOLD_MS = 7000; // time each image stays fully visible

  /* ── Nav: solid background once scrolled past the top ─────── */
  var nav = document.querySelector('.nav');
  if (nav) {
    var check = function () {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', check, { passive: true });
    check();
  }

  /* ── Hero crossfade ───────────────────────────────────────── */
  var frame = document.querySelector('.hero-frame');
  if (!frame) return;

  var print = frame.closest('.hero-print') || frame;
  var imgs = Array.prototype.slice.call(frame.querySelectorAll('img'));
  if (!imgs.length) return;

  /* Match the mat to the visible image's shape. If the image hasn't
     loaded yet its natural size is 0, so wait and only apply if it's
     still the one on display. */
  var setRatio = function (img) {
    if (img.naturalWidth && img.naturalHeight) {
      print.style.setProperty('--ratio', (img.naturalWidth / img.naturalHeight).toFixed(4));
    } else {
      img.addEventListener('load', function () {
        if (img.classList.contains('visible')) setRatio(img);
      }, { once: true });
    }
  };

  setRatio(imgs[0]);
  if (imgs.length < 2) return;

  /* How long the swipe runs, read from CSS so the two never drift apart. */
  function swipeMs() {
    var raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--hero-swipe').trim();
    var n = parseFloat(raw) || 1.35;
    return /ms$/.test(raw) ? n : n * 1000;
  }

  var current = 0;

  setInterval(function () {
    var outgoing = imgs[current];
    current = (current + 1) % imgs.length;
    var incoming = imgs[current];

    outgoing.classList.remove('visible');
    outgoing.classList.add('leaving');      // drifts left, fades out
    incoming.classList.add('visible');      // arrives from the right
    setRatio(incoming);

    /* Once it has gone, put the outgoing print back on the right ready for
       its next turn. Transitions are switched off for that one frame,
       otherwise it would slide back across the mat in full view. The
       reflow read is what forces the browser to apply the parked position
       before transitions are allowed again. */
    setTimeout(function () {
      outgoing.classList.add('no-transition');
      outgoing.classList.remove('leaving');
      void outgoing.offsetWidth;            // flush the change
      outgoing.classList.remove('no-transition');
    }, swipeMs());
  }, HOLD_MS);

})();
