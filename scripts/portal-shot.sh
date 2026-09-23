#!/bin/bash
# Screenshot a portal page at a real phone width.
#
#   npm run build && npx next start -p 3100
#   ./scripts/portal-shot.sh /portal/login
#
# Renders through an iframe, because Chrome headless --window-size does not set
# the layout viewport. See scripts/portal-shot/frame.html for why that matters.
#
# Against a BUILD, not the dev server: Tailwind compiles arbitrary values on
# demand, so a long-running dev server serves CSS that never learned the new
# ones and elements render with no background at all.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
PAGE="${1:?usage: portal-shot.sh /portal/<token>/<page> [out.png]}"
PORT="${PORTAL_SHOT_PORT:-3100}"
OUT="${2:-/tmp/portal-shot$(echo "$PAGE" | tr '/' '-').png}"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --allow-file-access-from-files --hide-scrollbars \
  --window-size=430,932 --virtual-time-budget=3500 \
  --screenshot="$OUT" "file://$HERE/portal-shot/frame.html?u=http://localhost:$PORT$PAGE" >/dev/null 2>&1
echo "$OUT"
