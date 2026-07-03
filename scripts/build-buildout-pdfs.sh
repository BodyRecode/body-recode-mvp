#!/bin/bash
# Build SOT-branded PDFs for every SaaS buildout doc in public/docs/saas-buildout/.
#
# Uses the canonical SOT PDF builder at
# ~/Dropbox/03_STUDIO_OF_TEN/_pdf_build/build-sot-pattern-pdf.sh so every buildout
# doc shares the same brand DNA as other SOT client-facing patterns (warm off-
# white background, Inter + JetBrains Mono, electric blue accent, "10" logo
# lockup, category badge, dot-grid + diagonal cover accent).
#
# The SOT builder writes the PDF next to the input .md — so this script runs it
# against the .md copies inside public/docs/saas-buildout/, landing the PDF
# there for direct Vercel serving.
#
# Requires: pandoc, Google Chrome, the SOT _pdf_build folder in Dropbox.
#
# Run manually after sync-saas-buildout-docs.sh, or during initial setup.

set -e

BUILDER="$HOME/Dropbox/03_STUDIO_OF_TEN/_pdf_build/build-sot-pattern-pdf.sh"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
DOCS="$REPO/public/docs/saas-buildout"

if [ ! -x "$BUILDER" ]; then
  echo "SOT PDF builder not found or not executable at: $BUILDER"
  exit 1
fi

# Build one PDF. Args: md-path, Title, Category, Version, Subtitle
build_one() {
  local md="$1"
  local title="$2"
  local category="$3"
  local version="$4"
  local subtitle="$5"
  echo ""
  echo "▶ $md"
  echo "  Title:    $title"
  echo "  Category: $category"
  "$BUILDER" "$md" "$title" "$category" "$version" "$subtitle"
}

# ─── Founding Ten root docs ──────────────────────────────────
build_one \
  "$DOCS/founding-ten/POWERED_PLATFORM_BUILD_PLAN.md" \
  "Powered Platform Build Plan" \
  "Build Plan" \
  "v1.0 · 2026-07" \
  "phase 0 through 4 · the white-label product build"

build_one \
  "$DOCS/founding-ten/OFFER_ARCHITECTURE.md" \
  "Offer Architecture" \
  "Offer" \
  "v1.0 · 2026-07" \
  "founding partner commercial + doctrine shape"

build_one \
  "$DOCS/founding-ten/README.md" \
  "Studio of Ten · Founding Ten" \
  "Overview" \
  "v1.0 · 2026-07" \
  "capped ten founding partners on the powered platform"

# ─── Onboarding docs ─────────────────────────────────────────
build_one \
  "$DOCS/founding-ten/onboarding/PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.md" \
  "Phase 2 Tenant Deployment Checklist" \
  "Onboarding Runbook" \
  "v1.0 · 2026-07" \
  "shape B shared-deploy for partners #2 through #10"

build_one \
  "$DOCS/founding-ten/onboarding/MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.md" \
  "Melisa Pilot Zero Deployment Runbook" \
  "Onboarding Runbook" \
  "v1.0 · 2026-07" \
  "shape A separate-deploy · pilot zero"

build_one \
  "$DOCS/founding-ten/onboarding/PARTNER_JOURNEY.md" \
  "Partner Journey" \
  "Business Process" \
  "v1.0 · 2026-07" \
  "eight stages · attract to run"

build_one \
  "$DOCS/founding-ten/onboarding/README.md" \
  "Onboarding · Index" \
  "Overview" \
  "v1.0 · 2026-07" \
  "onboarding folder contents at a glance"

# ─── Modality docs ───────────────────────────────────────────
build_one \
  "$DOCS/founding-ten/modalities/YOGA_DOCTRINE_v1.md" \
  "Yoga Modality · Doctrine v1" \
  "Doctrine Pack" \
  "v1.0 · 2026-07" \
  "modality 2 · safety constraints + prescription schema"

build_one \
  "$DOCS/founding-ten/modalities/YOGA_MODALITY_SCOPE.md" \
  "Yoga Modality · Build Scope" \
  "Scope Doc" \
  "v1.0 · 2026-07" \
  "what changes between strength and yoga at layer 2"

echo ""
echo "Done. Commit the PDFs:"
echo "  git add public/docs/saas-buildout/ && git commit -m 'build: refresh saas-buildout PDFs'"
