#!/usr/bin/env bash
# Renders card/card.html to card/card.png (1280x640), the GitHub social preview for thesubtleties/sbtlTV.
# Upload by hand: github.com/thesubtleties/sbtlTV -> Settings -> General -> Social preview -> Edit.
set -euo pipefail
cd "$(dirname "$0")/.."
prof=$(mktemp -d)
chromium --headless=new --no-sandbox --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --user-data-dir="$prof" --window-size=1280,640 --virtual-time-budget=2000 \
  --screenshot="$PWD/card/card.png" "file://$PWD/card/card.html" >/dev/null 2>&1
rm -rf "$prof"
magick card/card.png -strip -quality 92 card/card.png 2>/dev/null || true
ls -la card/card.png
