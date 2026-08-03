/**
 * galleries.js — behaviour for the location bar on galleries.html
 *
 * Three jobs:
 *   1. Drive the jump links, and verify where they actually landed.
 *   2. Flag the bar as stuck, hide it going down, bring it back coming up.
 *   3. Highlight whichever gallery is currently on screen.
 */

(function () {
  'use strict';

  var bar = document.querySelector('.location-nav');
  var sections = Array.prototype.slice.call(
    document.querySelectorAll('.gallery-section')
  );
  if (!bar || !sections.length) return;

  var links = {};
  Array.prototype.forEach.call(bar.querySelectorAll('a'), function (a) {
    links[a.getAttribute('href').slice(1)] = a;
  });

  function cssPx(name, fallback) {
    var raw = getComputedStyle(document.documentElement).getPropertyValue(name);
    return parseInt(raw, 10) || fallback;
  }

  var navH = cssPx('--nav-h', 82);
  var chrome = cssPx('--sticky-chrome', 152);
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var jumping = false;

  /* ── 1. Jump links ────────────────────────────────────────────
     A native anchor jump works out its destination once, at click time. Over
     a long distance the page can still change height on the way — a font
     swapping in, an image decoding, the map sizing itself — and the scroll
     then finishes somewhere else entirely. So the scroll is driven here and
     re-checked once it stops moving, nudging the last few pixels into place.
     Correction is capped so a page that never settles can't loop. */
  function jumpTo(slug) {
    var target = document.getElementById(slug);
    if (!target) return;

    var attempts = 0;
    var quiet = null;

    function offsetNow() {
      return target.getBoundingClientRect().top - chrome;
    }

    function finish() {
      window.removeEventListener('scroll', onScroll);
      var off = offsetNow();

      if (Math.abs(off) > 2 && attempts < 5) {
        attempts++;
        window.scrollBy({ top: off, behavior: 'auto' });
        // Give layout a frame, then look again.
        requestAnimationFrame(watch);
        return;
      }
      jumping = false;
    }

    function onScroll() {
      clearTimeout(quiet);
      quiet = setTimeout(finish, 120);
    }

    function watch() {
      window.addEventListener('scroll', onScroll, { passive: true });
      clearTimeout(quiet);
      // Fires even if no scroll event arrives (already in position).
      quiet = setTimeout(finish, 400);
    }

    jumping = true;
    bar.classList.remove('is-hidden');
    window.scrollTo({
      top: window.pageYOffset + offsetNow(),
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
    watch();
  }

  Array.prototype.forEach.call(bar.querySelectorAll('a'), function (a) {
    a.addEventListener('click', function (e) {
      var slug = a.getAttribute('href').slice(1);
      if (!document.getElementById(slug)) return;   // let the browser handle it
      e.preventDefault();
      if (history.replaceState) history.replaceState(null, '', '#' + slug);
      jumpTo(slug);
    });
  });

  // Arriving with a hash already in the URL gets the same treatment, once
  // images and fonts have had a chance to settle.
  if (location.hash && document.getElementById(location.hash.slice(1))) {
    window.addEventListener('load', function () {
      jumpTo(location.hash.slice(1));
    });
  }

  if (!('IntersectionObserver' in window)) return;

  /* ── 2. Stuck state, and hiding on the way down ───────────────
     A zero-height sentinel above the bar reports when the bar reaches its
     sticky position — steadier than measuring scroll offsets each frame. */
  var sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  bar.parentNode.insertBefore(sentinel, bar);

  new IntersectionObserver(function (entries) {
    bar.classList.toggle('is-stuck', !entries[0].isIntersecting);
  }, { rootMargin: '-' + navH + 'px 0px 0px 0px', threshold: 0 }).observe(sentinel);

  var lastY = window.pageYOffset;
  var THRESHOLD = 6;

  window.addEventListener('scroll', function () {
    var y = window.pageYOffset;
    var delta = y - lastY;

    // A jump is deliberate: keep the bar up, the reader may pick another.
    if (jumping) {
      bar.classList.remove('is-hidden');
      lastY = y;
      return;
    }

    if (Math.abs(delta) < THRESHOLD) return;
    bar.classList.toggle('is-hidden', delta > 0);
    lastY = y;
  }, { passive: true });

  /* ── 3. Active gallery ────────────────────────────────────────
     Sections are checked in document order; the first still crossing the
     band below the chrome is the one being read. */
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

    var active = links[slug];
    if (active && bar.classList.contains('is-stuck')) {
      var barBox = bar.getBoundingClientRect();
      var linkBox = active.getBoundingClientRect();
      if (linkBox.left < barBox.left || linkBox.right > barBox.right) {
        bar.scrollLeft += linkBox.left - barBox.left - 24;
      }
    }
  }

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
