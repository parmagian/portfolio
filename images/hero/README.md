# Hero Images

The homepage hero slowly crossfades through these photographs inside a white
mat.

Currently referenced in `index.html`:

```
hero-1.jpg
hero-2.jpg
hero-3.jpg
hero-4.jpg
```

Files `hero-5.jpg` onward sit here unused — they are candidates, not slides.
To put one in rotation, add a matching `<img>` inside `.hero-frame` in
`index.html`.

## Aspect ratios

Any shape works. The white mat resizes itself to match whichever photo is
showing (see `--ratio` in `css/style.css` and `setRatio()` in `js/hero.js`),
so portraits and panoramas are framed correctly rather than letterboxed.
Nothing is ever cropped. Very tall photos are capped at 68% of the viewport
height so they always fit on screen.

## File size matters here

Hero images load immediately on every visit — they are the first thing a
visitor waits for. Use web-sized copies from `images/exports/` (~300 KB),
not full-resolution originals.

The files currently in this folder are originals, several of them 8–14 MB.
Swapping them for resized copies would cut homepage load dramatically.

Recommended specs:
- At least 2000px on the long edge
- JPEG, high quality
