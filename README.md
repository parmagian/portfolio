# Gian — Landscape Photography Portfolio

A static portfolio site (plain HTML/CSS/JS, no build step) in a light
fine-art print gallery style.

**Live at <https://parmagian.github.io/portfolio/>**

## Structure

```
index.html          Homepage — featured print hero + selected works
galleries.html      Stub (coming soon)
about.html          Stub (coming soon)
contact.html        Stub (coming soon)
css/style.css       All styles
js/hero.js          Hero crossfade + nav scroll behaviour
images/hero/        Hero slideshow photographs
images/gallery/     Galleries, one folder per location
images/exports/     Working library of web-sized copies (NOT committed)
tools/prepare-images.sh   Resizes full-res photos for the web (macOS sips)
```

## Adding photos

1. Export full-res photos anywhere on your machine.
2. Run `./tools/prepare-images.sh /path/to/that/folder` — web-ready copies
   (2000px long edge, ~300 KB each) land in `images/exports/`, mirroring the
   source folder layout. Originals are never modified.
3. Copy the ones you want to publish into `images/gallery/<location>/`.
   See `images/gallery/README.md` for the naming convention.

`images/exports/` is git-ignored on purpose. It is a staging library to pick
from — committing all of it once put 145 MB into the repository.

**Always publish the resized copies, not the originals.** Full-res files are
8–14 MB each; the resized ones are around 300 KB.

## Publishing updates

```
git add -A && git commit -m "update" && git push
```

The site rebuilds automatically within a minute or so.

### Push troubleshooting

Large pushes from this machine drop repeatedly on standard SSH (port 22) and
on HTTPS, failing with `sideband packet` disconnects or curl `bad record mac`
errors. Two things make it reliable:

- `origin` is set to **SSH over port 443**:
  `ssh://git@ssh.github.com:443/parmagian/portfolio.git`
- Split anything large into commits of roughly 20 MB and push them one at a
  time, retrying on failure.

Keeping image files small is the real fix — it avoids the problem entirely.

## GitHub Pages setup

Already configured: deploy from branch `main`, folder `/ (root)`. The
repository must stay **public** for GitHub Pages on the free plan; making it
private takes the site offline.

A custom domain (e.g. gianphoto.com) can be pointed here later under
**Settings → Pages**.
