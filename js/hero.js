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

  var current = 0;
  setInterval(function () {
    imgs[current].classList.remove('visible');
    current = (current + 1) % imgs.length;
    imgs[current].classList.add('visible');
    setRatio(imgs[current]);
  }, HOLD_MS);

})();
