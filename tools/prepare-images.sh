#!/bin/bash
# ============================================================
# prepare-images.sh — resize full-res photos for the web
#
# Uses `sips`, which is built into macOS (no installs needed).
#
# Usage:
#   ./tools/prepare-images.sh /path/to/your/full-res-folder
#
# What it does:
#   - Walks every .jpg/.jpeg/.png in the source folder (recursively)
#   - Resizes each so the longest side is MAX_PX (default 2000px)
#   - Saves web-ready JPEGs into images/exports/, mirroring subfolders
#   - Skips files already exported (safe to re-run)
#
# Result: images/exports/ is a local staging library (~0.5 MB per photo)
# to pick published photos from. It is git-ignored — copy the ones you
# want into images/gallery/<location>/. Your originals stay untouched.
# ============================================================

set -euo pipefail

MAX_PX=2000
QUALITY=high   # sips formatOptions: low | normal | high | best

SRC="${1:-}"
if [ -z "$SRC" ] || [ ! -d "$SRC" ]; then
  echo "Usage: $0 /path/to/full-res-photos"
  exit 1
fi

DEST="$(cd "$(dirname "$0")/.." && pwd)/images/exports"
mkdir -p "$DEST"

count=0
skipped=0

find "$SRC" \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -type f | while read -r file; do
  rel="${file#"$SRC"/}"
  out="$DEST/${rel%.*}.jpg"

  if [ -f "$out" ]; then
    skipped=$((skipped + 1))
    continue
  fi

  mkdir -p "$(dirname "$out")"
  sips --resampleHeightWidthMax "$MAX_PX" \
       --setProperty format jpeg \
       --setProperty formatOptions "$QUALITY" \
       "$file" --out "$out" > /dev/null
  count=$((count + 1))
  echo "exported: $rel"
done

echo "Done. Web-ready copies are in images/exports/"
