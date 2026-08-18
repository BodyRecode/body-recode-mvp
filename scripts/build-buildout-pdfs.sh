#!/bin/bash
# Build Body Recode-branded PDFs for every SaaS buildout doc in public/docs/saas-buildout/.
#
# Uses the Body Recode ops PDF builder at
# ~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/_pdf_build/build-br-ops-pdf.sh so every
# buildout doc shares the Body Recode brand DNA (Pure White / Graphite / Signal
# Blue, Helvetica, "BR" logo lockup, category badge, branded cover).
#
# The builder writes the PDF next to the input .md — so this script runs it
# against the .md copies inside public/docs/saas-buildout/, landing the PDF
# there for direct Vercel serving.
#
# Requires: pandoc, Google Chrome, the BR _pdf_build folder in Dropbox.
#
# Run manually after sync-saas-buildout-docs.sh, or during initial setup.

set -e

BUILDER="$HOME/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/_pdf_build/build-br-ops-pdf.sh"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
DOCS="$REPO/public/docs/saas-buildout"

if [ ! -x "$BUILDER" ]; then
  echo "BR PDF builder not found or not executable at: $BUILDER"
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

# ─── Collective root docs ──────────────────────────────────
build_one \
  "$DOCS/collective/POWERED_PLATFORM_BUILD_PLAN.md" \
  "Powered Platform Build Plan" \
  "Build Plan" \
  "v1.0 · 2026-07" \
  "phase 0 through 4 · the white-label product build"

build_one \
  "$DOCS/collective/OFFER_ARCHITECTURE.md" \
  "Offer Architecture" \
  "Offer" \
  "v1.0 · 2026-07" \
  "Collective Partner commercial + doctrine shape"

build_one \
  "$DOCS/collective/README.md" \
  "Body Recode · Collective" \
  "Overview" \
  "v1.0 · 2026-07" \
  "the partner programme on the powered platform"

# ─── Onboarding docs ─────────────────────────────────────────
build_one \
  "$DOCS/collective/onboarding/PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.md" \
  "Phase 2 Tenant Deployment Checklist" \
  "Onboarding Runbook" \
  "v1.0 · 2026-07" \
  "shape B shared-deploy for partners after pilot zero"

build_one \
  "$DOCS/collective/onboarding/MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.md" \
  "Pilot Zero Deployment Runbook" \
  "Onboarding Runbook" \
  "v1.0 · 2026-07" \
  "shape A separate-deploy · pilot zero"

build_one \
  "$DOCS/collective/onboarding/PARTNER_JOURNEY.md" \
  "Partner Journey" \
  "Business Process" \
  "v1.0 · 2026-07" \
  "eight stages · attract to run"

build_one \
  "$DOCS/collective/onboarding/README.md" \
  "Onboarding · Index" \
  "Overview" \
  "v1.0 · 2026-07" \
  "onboarding folder contents at a glance"

# ─── Modality docs ───────────────────────────────────────────
build_one \
  "$DOCS/collective/modalities/YOGA_DOCTRINE_v1.md" \
  "Yoga Modality · Doctrine v1" \
  "Doctrine Pack" \
  "v1.0 · 2026-07" \
  "modality 2 · safety constraints + prescription schema"

build_one \
  "$DOCS/collective/modalities/YOGA_MODALITY_SCOPE.md" \
  "Yoga Modality · Build Scope" \
  "Scope Doc" \
  "v1.0 · 2026-07" \
  "what changes between strength and yoga at layer 2"

# ─── Legal docs ──────────────────────────────────────────────
build_one \
  "$DOCS/collective/legal/README.md" \
  "Collective · Legal Package" \
  "Legal Package" \
  "v0.1 · 2026-07" \
  "package overview + how to use these drafts"

build_one \
  "$DOCS/collective/legal/COVER_NOTE_TO_LEGAL.md" \
  "Cover Note to Legal Reviewer" \
  "Legal Package" \
  "v0.1 · 2026-07" \
  "specific review priorities + areas of concern"

build_one \
  "$DOCS/collective/legal/COLLECTIVE_PARTNER_AGREEMENT_v0.1.md" \
  "Collective Partner Agreement" \
  "Legal Package" \
  "v0.1 · 2026-07" \
  "commercial contract · Collective programme"

build_one \
  "$DOCS/collective/legal/PARTNER_IP_SUBLICENCE_DEED_v0.1.md" \
  "Partner IP Sublicence Deed" \
  "Legal Package" \
  "v0.1 · 2026-08" \
  "companion licence · signed with the agreement"

build_one \
  "$DOCS/collective/legal/MUTUAL_NDA_v0.1.md" \
  "Mutual NDA" \
  "Legal Package" \
  "v0.1 · 2026-08" \
  "discovery stage · before anything is shared"

build_one \
  "$DOCS/collective/legal/HEAD_LICENCE_DEED_v0.1.md" \
  "Head Licence Deed" \
  "Legal Package" \
  "v0.1 · 2026-08" \
  "Kade to operating co · upstream of every sublicence"

build_one \
  "$DOCS/collective/legal/CONTRACTOR_IP_ASSIGNMENT_v0.1.md" \
  "Contractor IP Assignment" \
  "Legal Package" \
  "v0.1 · 2026-08" \
  "inbound copyright · anything built for the platform"

build_one \
  "$DOCS/collective/legal/IP_PROTECTION_MAP.md" \
  "IP Protection Map" \
  "Legal Package" \
  "v0.1 · 2026-08" \
  "what is protected, by what, and where the gaps are"

build_one \
  "$DOCS/collective/legal/DECISIONS_NEEDED.md" \
  "Decisions Needed" \
  "Legal Package" \
  "v0.1 · 2026-08" \
  "the blanks a lawyer cannot fill for you"

echo ""
echo "Done. Commit the PDFs:"
echo "  git add public/docs/saas-buildout/ && git commit -m 'build: refresh saas-buildout PDFs'"
