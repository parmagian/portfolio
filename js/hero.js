/**
 * hero.js — Featured-print swipe + nav scroll behaviour
 *
 * Each photograph sits in its own mat, and the whole framed print swipes:
 * every HOLD_MS the current print travels left and fades out while the
 * next arrives from the right.
 *
 * Because the prints are absolutely positioned they contribute no height,
 * so the stage is given one — the height of the TALLEST print. Sizing it to
 * whichever print was showing meant the stage resized on every change,
 * which nudged the prints vertically as they travelled and made the swipe
 * look like it ran on a diagonal. A fixed stage also keeps the page below
 * still between photographs.
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
        sizeStage();   // a newly measured print may be the tallest
      }, { once: true });
    }
  }

  /* Tallest print wins, so the stage never changes size and nothing drifts
     vertically mid-swipe. Prints are laid out even while parked and
     invisible, so every one of them measures correctly here. */
  function sizeStage() {
    var tallest = 0;
    prints.forEach(function (p) {
      if (p.offsetHeight > tallest) tallest = p.offsetHeight;
    });
    if (tallest) stage.style.setProperty('--stage-h', tallest + 'px');
  }

  prints.forEach(shape);

  var current = 0;
  sizeStage();

  // Width changes alter every print's height, so measure them all again.
  window.addEventListener('resize', sizeStage, { passive: true });

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
