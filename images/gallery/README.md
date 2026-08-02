# Gallery Images

Photos are organised into one folder per location. Each folder becomes a
gallery on the site.

```
images/gallery/
  santa-clara/
  saratoga/
  san-francisco/
  deschutes-river/
  ashland/
  rome/
  lake-como/
  cinque-terre/
```

## Folder naming

Lowercase, words separated by hyphens, no spaces — folder names end up in
URLs, and spaces become `%20`. The display title is derived from the folder
name, so `lake-como` shows on the site as "Lake Como".

To add a new location, make a new folder here and drop photos in. Tell
Claude (or edit `galleries.html`) so the new gallery gets linked up.

## Which files to put here

Use the **web-sized** copies, not full-resolution originals.

`images/exports/` holds a resized copy (2000px long edge, ~300 KB) of every
photo you've run through `tools/prepare-images.sh`. That folder is a working
library — it is deliberately not committed to git. Copy the ones you want
into the location folder here.

Full-res originals are 8–14 MB each. A few dozen of those will bloat the
repository and make pushing fail.

Recommended per gallery: 8–15 photos. Small, tightly edited galleries read
as a body of work; large ones read as an unedited dump.

## Aspect ratios

Photos are never cropped. Each is displayed at its natural shape inside a
white mat, so portrait, landscape, square and panoramic all work as-is.

## The old gallery-1…6.jpg files

Those are byte-identical duplicates of `images/hero/hero-1…6.jpg` and are
still referenced by `index.html`. They will be removed once the homepage is
rewired to pull from these location folders.
