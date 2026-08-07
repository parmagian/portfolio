/**
 * hero.js — Featured-print swipe + nav scroll behaviour
 *
 * Each photograph sits in its own mat, and the whole framed print swipes:
 * every HOLD_MS the current print travels left and fades out while the
 * next arrives from the right.
 *
 * Because the prints are absolutely positioned they contribute no height,
 * so the stage is given the height of whichever print is showing, and that
 * height is transitioned — a portrait and a panorama are very different
 * shapes and the page below should settle rather than jump.
 */

(function () {
  'use strict';

  var HOLD_MS = 7000; // time each print stays fully visible

  /* ── Nav: solid background once scrolled past the top ─────── */
  var nav = document.querySelector('.nav');
  if (nav) {
    var check = function () {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', check, { passive: true });
    check();
  }

  /* ── Hero swipe ───────────────────────────────────────────── */
  var stage = document.querySelector('.hero-stage');
  if (!stage) return;

  var prints = Array.prototype.slice.call(stage.querySelectorAll('.hero-print'));
  if (!prints.length) return;

  /* Shape each mat to its own photograph. Until an image has loaded its
     natural size is 0, so the width falls back to the CSS default and is
     corrected once the file arrives. */
  function shape(print) {
    var img = print.querySelector('img');
    if (!img) return;
    if (img.naturalWidth && img.naturalHeight) {
      print.style.setProperty(
        '--ratio', (img.naturalWidth / img.naturalHeight).toFixed(4)
      );
    } else {
      img.addEventListener('load', function () {
        shape(print);
        if (print.classList.contains('visible')) sizeStage(print);
      }, { once: true });
    }
  }

  function sizeStage(print) {
    stage.style.setProperty('--stage-h', print.offsetHeight + 'px');
  }

  prints.forEach(shape);

  var current = 0;
  sizeStage(prints[current]);

  // Width changes alter every print's height, so re-measure the live one.
  window.addEventListener('resize', function () {
    sizeStage(prints[current]);
  }, { passive: true });

  if (prints.length < 2) return;

  /* Swipe duration is read from CSS so the two can't drift apart. */
  function swipeMs() {
    var raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--hero-swipe').trim();
    var n = parseFloat(raw) || 1.35;
    return /ms$/.test(raw) ? n : n * 1000;
  }

  setInterval(function () {
    var outgoing = prints[current];
    current = (current + 1) % prints.length;
    var incoming = prints[current];

    outgoing.classList.remove('visible');
    outgoing.classList.add('leaving');   // travels left, fades out
    incoming.classList.add('visible');   // arrives from the right
    sizeStage(incoming);

    /* Once it has gone, return the outgoing print to the right-hand
       waiting position. Transitions are suppressed for that one frame,
       otherwise it would glide back across the page in full view. The
       offsetWidth read forces the browser to apply the parked position
       before transitions are switched back on. */
    setTimeout(function () {
      outgoing.classList.add('no-transition');
      outgoing.classList.remove('leaving');
      void outgoing.offsetWidth;
      outgoing.classList.remove('no-transition');
    }, swipeMs());
  }, HOLD_MS);

})();
