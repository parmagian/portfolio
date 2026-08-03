#!/usr/bin/env python3
"""
build-galleries.py — regenerate galleries.html from images/gallery/

Usage:
    python3 tools/build-galleries.py

Scans images/gallery/ for one folder per location, reads each photo's real
dimensions, and lays the photos out as matted prints sized to their natural
aspect ratio. Locations are padded with placeholder tiles (3:2, 2:3, 1:1) so
the page reads as finished while more photographs are still to come.

Captions
--------
Optional. Put a `captions.txt` in a location folder, one line per photo:

    img_0799.jpg | Morning Fog | Rome, 2026

Photos without an entry fall back to "Untitled — Location, Year" so they are
easy to spot. Re-running is safe: captions.txt is the source of truth, so
generated HTML can be thrown away and rebuilt.
"""

import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
GALLERY_DIR = ROOT / "images" / "gallery"
OUT = ROOT / "galleries.html"

MIN_SLOTS = 6          # pad each location up to this many prints
MIN_PLACEHOLDERS = 2   # ...and always leave at least this many open slots
PLACEHOLDER_CYCLE = ["3x2", "2x3", "1x1"]

# Placeholder shape -> (print size class, pairs-well-with-a-neighbour)
PLACEHOLDER_SHAPE = {
    "3x2": ("print--lg", False),
    "2x3": ("print--sq", True),
    "1x1": ("print--sq", True),
}


def dimensions(path):
    """Return (width, height) via macOS sips."""
    out = subprocess.run(
        ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
        capture_output=True, text=True,
    ).stdout
    nums = [int(n) for n in re.findall(r"pixel(?:Width|Height):\s*(\d+)", out)]
    return (nums[0], nums[1]) if len(nums) == 2 else (0, 0)


def size_class(ratio):
    """Map an aspect ratio to a print width class and whether it pairs."""
    if ratio > 1.9:
        return "print--pano", False   # panoramic: full column width
    if ratio > 1.15:
        return "print--lg", False     # landscape
    if ratio > 0.87:
        return "print--sq", True      # square
    return "print--sq", True          # portrait


def title_of(slug):
    return " ".join(w.capitalize() for w in slug.split("-"))


def load_captions(folder):
    """Parse optional captions.txt -> {filename: (title, subtitle)}."""
    f = folder / "captions.txt"
    if not f.exists():
        return {}
    out = {}
    for line in f.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 3:
            out[parts[0]] = (parts[1], parts[2])
        elif len(parts) == 2:
            out[parts[0]] = (parts[1], "")
    return out


def collect():
    """Build {slug: [item, ...]} where each item is a dict describing a print."""
    locations = {}
    for folder in sorted(p for p in GALLERY_DIR.iterdir() if p.is_dir()):
        slug = folder.name
        captions = load_captions(folder)
        items = []

        photos = sorted(
            p for p in folder.iterdir()
            if p.suffix.lower() in {".jpg", ".jpeg", ".png"}
        )
        for photo in photos:
            w, h = dimensions(photo)
            if not w or not h:
                continue
            cls, pairs = size_class(w / h)
            title, subtitle = captions.get(
                photo.name, ("Untitled", f"{title_of(slug)}, Year")
            )
            items.append({
                "kind": "photo",
                "src": f"images/gallery/{slug}/{photo.name}",
                "cls": cls,
                "pairs": pairs,
                "title": title,
                "subtitle": subtitle,
            })

        n_pad = max(MIN_PLACEHOLDERS, MIN_SLOTS - len(items))
        for i in range(n_pad):
            shape = PLACEHOLDER_CYCLE[i % len(PLACEHOLDER_CYCLE)]
            cls, pairs = PLACEHOLDER_SHAPE[shape]
            items.append({
                "kind": "placeholder",
                "src": f"images/placeholders/{shape}.svg",
                "cls": cls,
                "pairs": pairs,
                "shape": shape,
            })

        locations[slug] = items

    # Biggest galleries first; alphabetical among equals so the order is stable.
    def photo_count(slug):
        return sum(1 for it in locations[slug] if it["kind"] == "photo")

    return {
        slug: locations[slug]
        for slug in sorted(locations, key=lambda s: (-photo_count(s), s))
    }


def figure_html(item, indent):
    pad = " " * indent
    if item["kind"] == "placeholder":
        return (
            f'{pad}<div class="print {item["cls"]} print--empty">\n'
            f'{pad}  <figure>\n'
            f'{pad}    <img src="{item["src"]}" alt="" aria-hidden="true" />\n'
            f'{pad}    <figcaption>Open slot &middot; {item["shape"].replace("x", ":")}</figcaption>\n'
            f'{pad}  </figure>\n'
            f'{pad}</div>'
        )
    return (
        f'{pad}<div class="print {item["cls"]}">\n'
        f'{pad}  <figure>\n'
        f'{pad}    <img src="{item["src"]}" alt="{item["title"]}" loading="lazy" />\n'
        f'{pad}    <figcaption><em>{item["title"]}</em> {item["subtitle"]}</figcaption>\n'
        f'{pad}  </figure>\n'
        f'{pad}</div>'
    )


def layout(items, indent):
    """Emit prints, pairing consecutive narrow ones side by side."""
    pad = " " * indent
    rows, i = [], 0
    while i < len(items):
        cur = items[i]
        nxt = items[i + 1] if i + 1 < len(items) else None
        if cur["pairs"] and nxt and nxt["pairs"]:
            rows.append(
                f'{pad}<div class="print-pair">\n'
                + figure_html(cur, indent + 2) + "\n"
                + figure_html(nxt, indent + 2) + "\n"
                + f"{pad}</div>"
            )
            i += 2
        else:
            rows.append(figure_html(cur, indent))
            i += 1
    return "\n\n".join(rows)


def build(locations):
    nav_items = "\n".join(
        f'        <li><a href="#{slug}">{title_of(slug)}</a></li>'
        for slug in locations
    )

    sections = []
    for slug, items in locations.items():
        n_photos = sum(1 for it in items if it["kind"] == "photo")
        count = f"{n_photos} photograph{'s' if n_photos != 1 else ''}"
        if n_photos == 0:
            count = "Coming soon"
        sections.append(
            f'    <section class="section gallery-section" id="{slug}">\n'
            f'      <div class="section-heading">\n'
            f'        <h2>{title_of(slug)}</h2>\n'
            f'        <div class="rule"></div>\n'
            f'        <p class="gallery-count">{count}</p>\n'
            f'      </div>\n\n'
            f'      <div class="works">\n\n'
            f'{layout(items, 8)}\n\n'
            f'      </div>\n'
            f'    </section>'
        )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Galleries — Gian Photography</title>
  <meta name="description" content="Landscape photography galleries by location." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>

  <!-- GENERATED FILE — edit captions in images/gallery/<location>/captions.txt
       and re-run: python3 tools/build-galleries.py -->

  <nav class="nav scrolled">
    <a href="index.html" class="nav-logo">Gian</a>
    <ul class="nav-links">
      <li><a href="galleries.html" aria-current="page">Galleries</a></li>
      <li><a href="about.html">About</a></li>
      <li><a href="contact.html">Contact</a></li>
    </ul>
  </nav>

  <main>
    <header class="galleries-header">
      <h1>Galleries</h1>
      <p class="galleries-sub">By location</p>
      <ul class="location-nav">
{nav_items}
      </ul>
    </header>

{chr(10).join(sections)}
  </main>

  <footer class="footer">
    <span class="footer-copy">&copy; 2026 Gian</span>
    <nav class="footer-links" aria-label="Social links">
      <a href="#" aria-label="Instagram">Instagram</a>
      <a href="#" aria-label="500px">500px</a>
    </nav>
  </footer>

  <script src="js/hero.js"></script>
</body>
</html>
"""


def main():
    if not GALLERY_DIR.is_dir():
        sys.exit(f"No gallery directory at {GALLERY_DIR}")
    locations = collect()
    OUT.write_text(build(locations))

    total_photos = sum(
        1 for items in locations.values() for it in items if it["kind"] == "photo"
    )
    total_slots = sum(
        1 for items in locations.values() for it in items if it["kind"] == "placeholder"
    )
    for slug, items in locations.items():
        p = sum(1 for it in items if it["kind"] == "photo")
        h = sum(1 for it in items if it["kind"] == "placeholder")
        print(f"  {slug:<18} {p:>2} photos, {h:>2} open slots")
    print(f"\nWrote {OUT.relative_to(ROOT)} — "
          f"{len(locations)} locations, {total_photos} photos, {total_slots} slots")


if __name__ == "__main__":
    main()
