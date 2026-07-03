#!/bin/bash
# Sync SaaS/white-label buildout docs from ~/Dropbox → public/docs/saas-buildout/
# and regenerate .docx versions via pandoc.
#
# Run manually whenever the Dropbox source has changed and you want the buildout
# page to reflect the new version. The docs listed here are those referenced by
# src/lib/saas-buildout-manifest.ts (per-phase docs + CROSS_PHASE_DOCS).
#
# Requires: pandoc (brew install pandoc).

set -e

SRC="$HOME/Dropbox"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public/docs/saas-buildout"

if ! command -v pandoc >/dev/null 2>&1; then
  echo "pandoc not found. Install with: brew install pandoc"
  exit 1
fi

mkdir -p "$DEST/founding-ten" "$DEST/founding-ten/onboarding" "$DEST/founding-ten/modalities" "$DEST/sql"

# ─── Founding Ten root docs ──────────────────────────────────
for f in POWERED_PLATFORM_BUILD_PLAN OFFER_ARCHITECTURE README; do
  cp "$SRC/03_STUDIO_OF_TEN/00_FOUNDING_TEN/$f.md" "$DEST/founding-ten/$f.md"
done

# ─── Onboarding docs ─────────────────────────────────────────
for f in PHASE_2_TENANT_DEPLOYMENT_CHECKLIST MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK PARTNER_JOURNEY README; do
  cp "$SRC/03_STUDIO_OF_TEN/00_FOUNDING_TEN/onboarding/$f.md" "$DEST/founding-ten/onboarding/$f.md"
done

# ─── Modality docs ───────────────────────────────────────────
for f in YOGA_DOCTRINE_v1 YOGA_MODALITY_SCOPE; do
  cp "$SRC/03_STUDIO_OF_TEN/00_FOUNDING_TEN/modalities/$f.md" "$DEST/founding-ten/modalities/$f.md"
done

# ─── SQL schemas ─────────────────────────────────────────────
cp "$SRC/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/sql/2026-07-01_tenant_config_schema.sql" "$DEST/sql/"
cp "$SRC/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/sql/2026-07-03_tenant_domains_schema.sql" "$DEST/sql/"

# ─── Regenerate .docx via pandoc ─────────────────────────────
echo ""
echo "Generating .docx via pandoc..."
find "$DEST" -type f -name "*.md" | while read f; do
  out="${f%.md}.docx"
  pandoc "$f" -o "$out"
  echo "  ✓ $out"
done

echo ""
echo "Rebuilding SOT-branded PDFs..."
"$(dirname "$0")/build-buildout-pdfs.sh"

echo ""
echo "Done. Commit the changes:"
echo "  git add public/docs/saas-buildout/ && git commit -m 'sync: refresh saas-buildout docs + pdfs'"
