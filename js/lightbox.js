/**
 * lightbox.js — click a gallery print to view it large.
 *
 * ← / → step through the photos of that same location (wrapping round),
 * × or Esc or a click on the dark backdrop closes. Clicking the photo
 * itself zooms in 2× around that spot; moving the pointer pans, and a
 * second click zooms back out. Built on the native
 * <dialog>, which supplies Esc-to-close and keeps keyboard focus inside.
 */

(function () {
  'use strict';

  var imgs = Array.prototype.slice.call(
    document.querySelectorAll('.gallery-section .print img')
  );
  if (!imgs.length || !window.HTMLDialogElement) return;

  var box = document.createElement('dialog');
  box.className = 'lightbox';
  box.setAttribute('aria-label', 'Photo viewer');
  box.innerHTML =
    '<header class="lb-head"><h2 class="lb-title"></h2><p class="lb-count"></p></header>' +
    '<figure><img alt="" /><figcaption></figcaption></figure>' +
    '<button type="button" class="lb-btn lb-prev" aria-label="Previous photo">&larr;</button>' +
    '<button type="button" class="lb-btn lb-close" aria-label="Close">&times;</button>' +
    '<button type="button" class="lb-btn lb-next" aria-label="Next photo">&rarr;</button>';
  document.body.appendChild(box);

  var big = box.querySelector('img');
  var cap = box.querySelector('figcaption');
  var title = box.querySelector('.lb-title');
  var count = box.querySelector('.lb-count');
  var set = [];
  var i = 0;

  /* ── Zoom ─────────────────────────────────────────────────────
     The photo scales about a transform-origin that follows the pointer.
     Measuring against the UNzoomed box (saved at zoom-in) means pointing
     at the left edge of where the photo was shows its left edge, and so
     on, so the whole picture can be reached by moving the pointer. */
  var ZOOM = 2;
  var home = null;

  function aim(e) {
    var fx = Math.min(1, Math.max(0, (e.clientX - home.left) / home.width));
    var fy = Math.min(1, Math.max(0, (e.clientY - home.top) / home.height));
    big.style.transformOrigin = (fx * 100) + '% ' + (fy * 100) + '%';
  }

  function unzoom() {
    home = null;
    box.classList.remove('zoomed');
  }

  big.addEventListener('click', function (e) {
    if (home) { unzoom(); return; }
    home = big.getBoundingClientRect();
    aim(e);
    box.style.setProperty('--zoom', ZOOM);
    box.classList.add('zoomed');
  });

  box.addEventListener('pointermove', function (e) { if (home) aim(e); });
  box.addEventListener('close', unzoom);

  function show(n) {
    unzoom();
    i = (n + set.length) % set.length;
    var src = set[i];
    big.src = src.currentSrc || src.src;
    big.alt = src.alt;
    count.textContent = (i + 1) + ' / ' + set.length;
    var fc = src.closest('figure').querySelector('figcaption');
    cap.replaceChildren.apply(cap, fc ? [].map.call(fc.childNodes, function (n) {
      return n.cloneNode(true);
    }) : []);
  }

  function open(img) {
    var section = img.closest('.gallery-section');
    set = Array.prototype.slice.call(section.querySelectorAll('.print img'));
    title.textContent = section.querySelector('h2').textContent;
    box.setAttribute('aria-label', title.textContent + ' photographs');
    box.classList.toggle('single', set.length < 2);
    show(set.indexOf(img));
    box.showModal();
  }

  imgs.forEach(function (img) {
    var print = img.closest('.print');
    print.tabIndex = 0;
    print.setAttribute('role', 'button');
    print.setAttribute('aria-label', 'View ' + (img.alt || 'photograph') + ' larger');
    print.addEventListener('click', function () { open(img); });
    print.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); }
    });
  });

  box.querySelector('.lb-prev').addEventListener('click', function () { show(i - 1); });
  box.querySelector('.lb-next').addEventListener('click', function () { show(i + 1); });
  box.querySelector('.lb-close').addEventListener('click', function () { box.close(); });

  // The dialog fills the screen, so a click that lands on it directly
  // (not on the photo or a button) is a click on the dark backdrop.
  box.addEventListener('click', function (e) { if (e.target === box) box.close(); });

  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
})();
