/**
 * hero.js — Featured-print crossfade + nav scroll behaviour
 *
 * The hero shows one photograph at a time inside the matted frame,
 * slowly crossfading to the next every HOLD_MS milliseconds.
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

  var imgs = Array.prototype.slice.call(frame.querySelectorAll('img'));
  if (imgs.length < 2) return;

  var current = 0;
  setInterval(function () {
    imgs[current].classList.remove('visible');
    current = (current + 1) % imgs.length;
    imgs[current].classList.add('visible');
  }, HOLD_MS);

})();
