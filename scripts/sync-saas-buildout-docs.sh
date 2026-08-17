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

mkdir -p "$DEST/collective" "$DEST/collective/onboarding" "$DEST/collective/modalities" "$DEST/collective/legal" "$DEST/sql"

# ─── Collective root docs ──────────────────────────────────
for f in POWERED_PLATFORM_BUILD_PLAN OFFER_ARCHITECTURE README; do
  cp "$SRC/03_BODY_RECODE_COLLECTIVE/00_PARTNER_PROGRAMME/$f.md" "$DEST/collective/$f.md"
done

# ─── Onboarding docs ─────────────────────────────────────────
for f in PHASE_2_TENANT_DEPLOYMENT_CHECKLIST MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK PARTNER_JOURNEY README; do
  cp "$SRC/03_BODY_RECODE_COLLECTIVE/00_PARTNER_PROGRAMME/onboarding/$f.md" "$DEST/collective/onboarding/$f.md"
done

# ─── Modality docs ───────────────────────────────────────────
for f in YOGA_DOCTRINE_v1 YOGA_MODALITY_SCOPE; do
  cp "$SRC/03_BODY_RECODE_COLLECTIVE/00_PARTNER_PROGRAMME/modalities/$f.md" "$DEST/collective/modalities/$f.md"
done

# ─── Legal docs (Collective agreement + IP licence) ────────
for f in README COVER_NOTE_TO_LEGAL DECISIONS_NEEDED IP_PROTECTION_MAP MUTUAL_NDA_v0.1 \
         COLLECTIVE_PARTNER_AGREEMENT_v0.1 PARTNER_IP_SUBLICENCE_DEED_v0.1 \
         HEAD_LICENCE_DEED_v0.1 CONTRACTOR_IP_ASSIGNMENT_v0.1; do
  cp "$SRC/03_BODY_RECODE_COLLECTIVE/00_PARTNER_PROGRAMME/legal/$f.md" "$DEST/collective/legal/$f.md"
done

# ─── SQL schemas ─────────────────────────────────────────────
cp "$SRC/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/sql/2026-07-01_tenant_config_schema.sql" "$DEST/sql/"
cp "$SRC/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/sql/2026-07-03_tenant_domains_schema.sql" "$DEST/sql/"

# ─── Coach Co-Pilot build doc (Phases 1-9) ──────────────────
mkdir -p "$DEST/copilot"
CP="$SRC/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/02_FEATURE_SPECS/2026-07-27_Coach_Copilot_Build_Phases_1-9"
cp "$CP.md"  "$DEST/copilot/COACH_COPILOT_BUILD.md"
cp "$CP.pdf" "$DEST/copilot/COACH_COPILOT_BUILD.pdf"   # BR-branded (built via build-br-ops-pdf.sh); .docx regenerated below

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
