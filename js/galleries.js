/**
 * galleries.js — behaviour for the location bar on galleries.html
 *
 * Two jobs:
 *   1. Flag the location list as stuck once it reaches the fixed nav, so CSS
 *      can collapse it from two wrapped rows to one scrollable line.
 *   2. Highlight whichever gallery is currently on screen, and keep that link
 *      scrolled into view inside the bar.
 */

(function () {
  'use strict';

  var bar = document.querySelector('.location-nav');
  var sections = Array.prototype.slice.call(
    document.querySelectorAll('.gallery-section')
  );
  if (!bar || !sections.length || !('IntersectionObserver' in window)) return;

  var links = {};
  Array.prototype.forEach.call(bar.querySelectorAll('a'), function (a) {
    links[a.getAttribute('href').slice(1)] = a;
  });

  function cssPx(name, fallback) {
    var raw = getComputedStyle(document.documentElement).getPropertyValue(name);
    return parseInt(raw, 10) || fallback;
  }

  var navH = cssPx('--nav-h', 81);
  var chrome = cssPx('--sticky-chrome', 128);

  /* ── 1. Stuck state ───────────────────────────────────────────
     A zero-height sentinel sits directly above the bar. When it passes behind
     the fixed nav, the bar has reached its sticky position — steadier and
     cheaper than measuring scroll offsets every frame. */
  var sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  bar.parentNode.insertBefore(sentinel, bar);

  new IntersectionObserver(function (entries) {
    bar.classList.toggle('is-stuck', !entries[0].isIntersecting);
  }, { rootMargin: '-' + navH + 'px 0px 0px 0px', threshold: 0 }).observe(sentinel);

  /* ── 2. Active gallery ────────────────────────────────────────
     Sections are tracked in document order; the first one still intersecting
     the band below the chrome is the one being read. */
  function markActive(slug) {
    Object.keys(links).forEach(function (key) {
      var isActive = key === slug;
      links[key].classList.toggle('is-active', isActive);
      if (isActive) {
        links[key].setAttribute('aria-current', 'true');
      } else {
        links[key].removeAttribute('aria-current');
      }
    });

    // Keep the highlighted link visible inside the scrollable strip.
    var active = links[slug];
    if (active && bar.classList.contains('is-stuck')) {
      var barBox = bar.getBoundingClientRect();
      var linkBox = active.getBoundingClientRect();
      if (linkBox.left < barBox.left || linkBox.right > barBox.right) {
        bar.scrollLeft += linkBox.left - barBox.left - 24;
      }
    }
  }

  /* ── 3. Hide going down, reveal coming up ────────────────────
     A small threshold stops trackpad jitter from flapping the bar. Following
     a jump link is exempt: that scroll is deliberate, and the reader will
     often want to pick another gallery straight after. */
  var lastY = window.pageYOffset;
  var jumping = false;
  var settleTimer = null;
  var THRESHOLD = 6;

  window.addEventListener('scroll', function () {
    var y = window.pageYOffset;
    var delta = y - lastY;

    /* A jump link holds the bar open until the smooth scroll finishes —
       however far it travels — since the reader will often pick another
       gallery straight after. Scroll-end is inferred from a quiet gap
       rather than a fixed timeout, which a long jump would outlast. */
    if (jumping) {
      bar.classList.remove('is-hidden');
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () {
        jumping = false;
        lastY = window.pageYOffset;
      }, 160);
      lastY = y;
      return;
    }

    if (Math.abs(delta) < THRESHOLD) return;
    bar.classList.toggle('is-hidden', delta > 0);
    lastY = y;
  }, { passive: true });

  Array.prototype.forEach.call(bar.querySelectorAll('a'), function (a) {
    a.addEventListener('click', function () {
      jumping = true;
      bar.classList.remove('is-hidden');
    });
  });

  var onScreen = {};
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { onScreen[e.target.id] = e.isIntersecting; });
    for (var i = 0; i < sections.length; i++) {
      if (onScreen[sections[i].id]) {
        markActive(sections[i].id);
        return;
      }
    }
  }, { rootMargin: '-' + (chrome + 10) + 'px 0px -55% 0px', threshold: 0 });

  sections.forEach(function (s) { spy.observe(s); });

})();
