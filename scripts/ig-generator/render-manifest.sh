#!/usr/bin/env bash
# Render every post in a manifest JSON to PNG via render-post.sh.
# Usage: scripts/ig-generator/render-manifest.sh <path-to-manifest.json>
#
# Manifest schema:
#   { _meta: { out_dir: "..." }, posts: [ <post-spec>, ... ] }
# Each <post-spec> matches the render-post.sh stdin schema, EXCEPT `out_dir`
# is inherited from `_meta.out_dir` (per-post `out_dir` overrides if present).

set -euo pipefail

MANIFEST="${1:-}"
if [ -z "$MANIFEST" ] || [ ! -f "$MANIFEST" ]; then
  echo "Usage: $0 <path-to-manifest.json>" >&2
  exit 1
fi

HERE="$(cd "$(dirname "$0")" && pwd)"
RENDER="$HERE/render-post.sh"

DEFAULT_OUT="$(jq -r '._meta.out_dir // empty' "$MANIFEST")"
COUNT="$(jq -r '.posts | length' "$MANIFEST")"

echo "Rendering $COUNT posts → $DEFAULT_OUT"

for i in $(seq 0 $((COUNT - 1))); do
  POST="$(jq ".posts[$i]" "$MANIFEST")"
  SLUG="$(echo "$POST" | jq -r '.slug')"
  POST_OUT="$(echo "$POST" | jq -r --arg d "$DEFAULT_OUT" '.out_dir // $d')"
  # Inject out_dir into the spec we pipe to render-post.sh
  SPEC="$(echo "$POST" | jq --arg d "$POST_OUT" '. + { out_dir: $d }')"
  printf "  [%2d/%2d] %s ... " "$((i+1))" "$COUNT" "$SLUG"
  echo "$SPEC" | "$RENDER" > /dev/null
  echo "ok"
done

echo "Done."
