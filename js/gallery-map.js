/**
 * gallery-map.js — the location map on galleries.html
 *
 * Reads pin data emitted by tools/build-galleries.py into the
 * #gallery-pins JSON block, drops a marker per location sized by how many
 * photographs it holds, and scrolls to that gallery when a pin is chosen.
 *
 * Coordinates come from each photo's GPS metadata, or from
 * images/gallery/locations.txt where that metadata was stripped.
 */

(function () {
  'use strict';

  var el = document.getElementById('gallery-map');
  var data = document.getElementById('gallery-pins');
  if (!el || !data || typeof L === 'undefined') return;

  var pins;
  try {
    pins = JSON.parse(data.textContent);
  } catch (e) {
    return;
  }
  if (!pins.length) return;

  var map = L.map(el, {
    scrollWheelZoom: false,   // enabled on click, so the page still scrolls
    zoomControl: true,
    attributionControl: true
  });

  /* A muted basemap — the photographs should carry the colour, not the map. */
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
      'contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  /* Pin size scales gently with the number of photographs, so a big
     collection reads as heavier without dwarfing the single-photo pins. */
  function radiusFor(count) {
    return 15 + Math.min(count, 12) * 1.6;
  }

  var markers = [];

  /* Nearby locations collapse into one pin until you zoom in — otherwise
     the four Bay Area galleries land on top of each other at world view.
     Falls back to plain markers if the plugin fails to load. */
  var clustered = typeof L.markerClusterGroup === 'function';
  var layer = clustered
    ? L.markerClusterGroup({
        maxClusterRadius: 44,
        showCoverageOnHover: false,
        spiderfyDistanceMultiplier: 1.4,
        iconCreateFunction: function (cluster) {
          var total = cluster.getAllChildMarkers().reduce(function (sum, m) {
            return sum + (m.options.photoCount || 0);
          }, 0);
          var size = radiusFor(total) + 6;
          return L.divIcon({
            className: 'map-pin-wrap',
            html: '<span class="map-pin map-pin--cluster" style="width:' + size +
                  'px;height:' + size + 'px">' + total + '</span>',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2]
          });
        }
      })
    : L.layerGroup();

  pins.forEach(function (pin) {
    var size = radiusFor(pin.count);
    var icon = L.divIcon({
      className: 'map-pin-wrap',
      html:
        '<span class="map-pin" style="width:' + size + 'px;height:' + size + 'px">' +
        (pin.count || '') + '</span>',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });

    var marker = L.marker([pin.lat, pin.lon], {
      icon: icon,
      title: pin.name,
      alt: pin.name + ', ' + pin.count + ' photographs',
      riseOnHover: true,
      photoCount: pin.count
    });
    layer.addLayer(marker);

    marker.bindTooltip(
      pin.name + ' &middot; ' + pin.count +
        (pin.count === 1 ? ' photograph' : ' photographs'),
      { direction: 'top', offset: [0, -size / 2], className: 'map-tooltip' }
    );

    marker.on('click', function () {
      var target = document.getElementById(pin.slug);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    markers.push(marker);
  });

  map.addLayer(layer);

  /* Frame every pin. padding keeps markers off the very edge; maxZoom stops
     a lone pin zooming to street level. */
  var bounds = L.featureGroup(markers).getBounds();
  map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });

  window.galleryMap = map;   // handy when tweaking pin positions

  /* Scroll-wheel zoom only once the map has been clicked, so scrolling
     the page over the map doesn't trap the reader. */
  map.on('click', function () { map.scrollWheelZoom.enable(); });
  map.on('mouseout', function () { map.scrollWheelZoom.disable(); });

})();
