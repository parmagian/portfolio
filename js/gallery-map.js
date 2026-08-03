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
    /* Integer zoom only (Leaflet's default). Fractional zoom would fill the
       panel to the pixel, but it scales the tile layer and sub-pixel gaps
       between tiles show up as a faint grid across the map. The panel is
       capped at 1040px, where zoom 2 puts a 1024px-wide world — near enough
       that the ocean-coloured background covers the difference. */
  });

  /* A muted basemap — the photographs should carry the colour, not the map.
     Esri's light grey canvas is used rather than CARTO's because CARTO
     labels places in local languages, which put "亚洲" and "AFRIKA / أفريقيا"
     across the map. Esri splits geography and labels into two layers, so the
     land is drawn first and the English place names sit on top. */
  var esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/';

  /* noWrap keeps a single globe on screen — without it the world repeats
     sideways at the opening zoom and the two clusters read as four.
     bounds stops Leaflet asking for tiles beyond the edges of the world:
     Esri answers those with a grey "Map data not available" image rather
     than a 404, which would otherwise show up alongside the Pacific. */
  var WORLD_TILES = L.latLngBounds([[-85.06, -180], [85.06, 180]]);

  L.tileLayer(esri + 'World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 16,
    noWrap: true,
    bounds: WORLD_TILES
  }).addTo(map);

  L.tileLayer(esri + 'World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
    noWrap: true,
    bounds: WORLD_TILES,
    pane: 'overlayPane'
  }).addTo(map);

  /* Pin size scales gently with the number of photographs, so a big
     collection reads as heavier without dwarfing the single-photo pins. */
  function radiusFor(count) {
    return 15 + Math.min(count, 12) * 1.6;
  }

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
  });

  map.addLayer(layer);

  /* Opening view is the whole world, not a tight frame around the pins.
     Fitting the pins gave a different scale on every screen and zoomed
     awkwardly close whenever the work happened to cluster; the globe reads
     the same everywhere and leaves room for wherever you shoot next.

     The bounds are a thin latitude band rather than the full globe, so it
     is the WIDTH that decides the zoom and the height simply crops. Fitting
     the whole globe instead would size to the shorter dimension and leave
     blank grey down either side of a wide panel. The band is centred a
     little north of the equator, which is where the landmasses are. */
  var WORLD = L.latLngBounds([[6, -179], [46, 179]]);

  // Centre on the work rather than on longitude 0, so that when the panel is
  // too narrow to show the whole world both clusters still sit comfortably
  // inside the visible slice.
  var span = L.latLngBounds(pins.map(function (p) { return [p.lat, p.lon]; }));

  /* fitBounds always rounds the zoom DOWN to the next whole level, which on
     a phone turned 0.55 into 0 and left a 256px world adrift in a 373px
     panel. Rounding to NEAREST instead: a wide panel still lands on 2 (a
     1024px world, near enough to fill it), while a phone rounds up to 1 and
     the world overflows the edges and crops, which looks deliberate.
     Whole zoom levels keep the raster tiles crisp — fractional zoom scales
     the tile layer and leaves faint seams across the map. */
  var WORLD_LON_SPAN = WORLD.getEast() - WORLD.getWest();

  function frameWorld() {
    /* The ideal zoom is worked out here rather than with getBoundsZoom,
       because that method snaps to a whole level internally and so can only
       ever hand back the rounded-down answer we are trying to avoid.
       At zoom z the whole globe is 256 * 2^z pixels wide. */
    var needed = (map.getSize().x / 256) * (360 / WORLD_LON_SPAN);
    var ideal = Math.log(needed) / Math.LN2;
    var z = Math.max(0, Math.round(ideal));

    /* Offsetting the centre towards the photographs only helps when the
       world is wider than the panel and there is something to pan to. Once
       the world fits, an offset centre just drags empty off-world space
       into view on one side, so sit it squarely on the meridian. */
    var worldPx = 256 * Math.pow(2, z);
    var lng = worldPx > map.getSize().x ? span.getCenter().lng : 0;

    map.setMinZoom(0);
    map.setView([26, lng], z, { animate: false });
    map.setMinZoom(z);   // no zooming out into empty grey
  }

  frameWorld();

  // Re-frame on resize, but only if the reader hasn't zoomed in themselves.
  map.on('resize', function () {
    if (map.getZoom() <= map.getMinZoom()) frameWorld();
  });

  window.galleryMap = map;   // handy when tweaking pin positions

  /* Scroll-wheel zoom only once the map has been clicked, so scrolling
     the page over the map doesn't trap the reader. */
  map.on('click', function () { map.scrollWheelZoom.enable(); });
  map.on('mouseout', function () { map.scrollWheelZoom.disable(); });

})();
