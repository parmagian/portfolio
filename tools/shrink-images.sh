#!/bin/bash
# ============================================================
# shrink-images.sh — bring oversized images in a folder down to
# web size, keeping a copy of each original outside the repo.
#
# Usage:
#   ./tools/shrink-images.sh images/hero
#   ./tools/shrink-images.sh images/gallery
#   ./tools/shrink-images.sh images/gallery/rome
#
# Safe to run as often as you like:
#   - Anything already at or below MAX_PX and MAX_BYTES is skipped, so
#     re-running never re-compresses a photo or degrades it. A photo that
#     is small in pixels but still over MAX_BYTES is re-compressed without
#     resizing (otherwise the pre-push check rejects it).
#   - An original is archived only if nothing is archived under that
#     name yet, so a second run can't replace a full-size original
#     with the shrunken version. (That mistake cost real originals
#     once — hence the check.)
#   - The resize is written to a temporary file and only swapped in
#     once it succeeds, so an interrupted run leaves the photo intact.
# ============================================================

set -euo pipefail

MAX_PX=2000
MAX_BYTES=$((2 * 1024 * 1024))   # 2 MB — must match tools/hooks/pre-push
REPO="$(cd "$(dirname "$0")/.." && pwd)"

# Originals live inside the repo but are git-ignored (see .gitignore).
# Keeping them here means the archive travels with the project rather than
# sitting in a separate folder that is easy to lose track of.
ARCHIVE_ROOT="$REPO/originals"

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <folder-or-image> [more...]   e.g. $0 images/hero" >&2
  exit 1
fi

# Accepts folders or individual files, so the pre-commit hook can hand it
# exactly the images being committed rather than rescanning everything.
LIST=$(mktemp)
trap 'rm -f "$LIST"' EXIT

for arg in "$@"; do
  path="$REPO/${arg#"$REPO"/}"
  if [ -d "$path" ]; then
    find "$path" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) \
      -print0 >> "$LIST"
  elif [ -f "$path" ]; then
    printf '%s\0' "$path" >> "$LIST"
  else
    echo "  ?  no such file or folder: $arg" >&2
  fi
done

shrunk=0; skipped=0; freed=0

while IFS= read -r -d '' f; do
  rel="${f#"$REPO"/}"

  # Captured via $( ) rather than `read`: awk emits no trailing newline, and
  # under `set -e` a read that ends at EOF would abort the whole script.
  dims=$(sips -g pixelWidth -g pixelHeight "$f" 2>/dev/null |
         awk '/pixelWidth|pixelHeight/{printf "%s ", $2}')
  w=$(printf '%s' "$dims" | awk '{print $1}')
  h=$(printf '%s' "$dims" | awk '{print $2}')
  if [ -z "$w" ] || [ -z "$h" ]; then
    echo "  ?  $rel — could not read dimensions, skipping"
    continue
  fi

  long=$w; [ "$h" -gt "$w" ] && long=$h
  before=$(stat -f%z "$f")
  if [ "$long" -le "$MAX_PX" ] && [ "$before" -le "$MAX_BYTES" ]; then
    skipped=$((skipped + 1))
    continue
  fi

  # Only resample when the pixels are actually too big — never upscale.
  resize=()
  [ "$long" -gt "$MAX_PX" ] && resize=(--resampleHeightWidthMax "$MAX_PX")

  # Archive the original — but never on top of something already there.
  archive="$ARCHIVE_ROOT/$rel"
  mkdir -p "$(dirname "$archive")"
  if [ -e "$archive" ]; then
    echo "  =  $rel — already archived, leaving that copy alone"
  else
    cp -p "$f" "$archive"
  fi

  tmp="$f.shrinking"
  if sips ${resize[@]+"${resize[@]}"} \
          --setProperty format jpeg \
          --setProperty formatOptions high \
          "$f" --out "$tmp" > /dev/null 2>&1 && [ -s "$tmp" ]; then
    mv "$tmp" "$f"
    after=$(stat -f%z "$f")
    freed=$((freed + before - after))
    shrunk=$((shrunk + 1))
    printf "  ->  %-34s %7s -> %7s\n" "$rel" \
      "$(echo "$before" | awk '{printf "%.1fMB", $1/1048576}')" \
      "$(echo "$after"  | awk '{printf "%.0fKB", $1/1024}')"
  else
    rm -f "$tmp"
    echo "  !!  $rel — resize failed, original untouched"
  fi
done < "$LIST"

echo
echo "shrunk $shrunk, already web-sized $skipped"
echo "saved $(echo "$freed" | awk '{printf "%.1f MB", $1/1048576}')"
[ "$shrunk" -gt 0 ] && echo "originals archived under $ARCHIVE_ROOT"

exit 0
