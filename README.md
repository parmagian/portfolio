# Gian — Landscape Photography Portfolio

A static portfolio site (plain HTML/CSS/JS, no build step) in a light
fine-art print gallery style.

## Structure

```
index.html          Homepage — featured print hero + selected works
galleries.html      Stub (coming soon)
about.html          Stub (coming soon)
contact.html        Stub (coming soon)
css/style.css       All styles
js/hero.js          Hero crossfade + nav scroll behaviour
images/hero/        Featured hero images
images/gallery/     Selected-works thumbnails
images/exports/     Web-ready exports (filled by tools/prepare-images.sh)
tools/prepare-images.sh   Resizes full-res photos for the web (macOS sips)
```

## Adding photos

1. Export full-res photos anywhere on your machine.
2. Run `./tools/prepare-images.sh /path/to/that/folder`
   — web-ready copies land in `images/exports/`.
3. Reference them from `index.html` (and update captions).

## Publishing to GitHub Pages

One-time setup:

1. Create an empty repo at github.com (e.g. `portfolio`). Don't add a README.
2. In Terminal, from this folder:

   ```
   git remote add origin https://github.com/YOUR_USERNAME/portfolio.git
   git push -u origin main
   ```

3. On GitHub: repo **Settings → Pages → Source: Deploy from a branch**,
   branch `main`, folder `/ (root)`. Save.
4. After a minute the site is live at
   `https://YOUR_USERNAME.github.io/portfolio/`.

Publishing updates afterwards is just:

```
git add -A && git commit -m "update" && git push
```

A custom domain (e.g. gianphoto.com) can be pointed at GitHub Pages later
under the same Settings → Pages screen.
