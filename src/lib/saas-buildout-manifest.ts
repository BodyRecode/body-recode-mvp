/**
 * SaaS / white-label buildout manifest — SOURCE OF TRUTH for platform build state.
 *
 * Kade's already-scoped POWERED_PLATFORM_BUILD_PLAN.md (in Dropbox) is the strategic
 * doc. This file is the operational counterpart: every phase, every step, current
 * status, commit refs, blockers, and gaps — machine-readable so the buildout page
 * can render it and the Today runbook can hook into it.
 *
 * MAINTENANCE RULE (from `feedback_ship_checklist`): every commit that ships or
 * changes state on a SaaS/white-label step MUST update the corresponding entry
 * here in the same commit. Silent drift is not allowed. This is called out in the
 * checklist matrix — treat this file the same as EMAIL_INVENTORY.md.
 *
 * Rendering: /dashboard/settings/platform-buildout reads this + renders a phased
 * checklist. Today runbook aggregator (src/lib/today-runbook.ts) queries it for
 * step gates to surface in the daily action list.
 */

export type StepStatus = 'planned' | 'in_progress' | 'shipped' | 'blocked' | 'deferred'

export type Step = {
  id: string
  title: string
  /** One-sentence what-this-does */
  description: string
  status: StepStatus
  /** ISO date shipped (present only when status === 'shipped') */
  shippedAt?: string
  /** Effort estimate S/M/L, matches build plan sizing */
  effort: 'S' | 'M' | 'L'
  /** Git commit SHAs (short form) that landed this step */
  commits?: string[]
  /** id of a step that must ship first */
  blockedBy?: string
  /** Files or URLs this step touched */
  surfaces?: string[]
  /** Why deferred / current blocker / next-action */
  notes?: string
}

export type Phase = {
  id: 0 | 1 | 2 | 3 | 4
  title: string
  description: string
  /** Order in which phases should be tackled (matches build plan) */
  order: number
  steps: Step[]
}

export const PHASES: Phase[] = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 0,
    title: 'Decide & verify',
    description: 'Non-build. Lock the offer + verify what already exists.',
    order: 0,
    steps: [
      {
        id: 'lock-pricing',
        title: 'Lock per-seat pricing',
        description: 'Setup fee + platform subscription + per-active-client meter.',
        status: 'shipped',
        shippedAt: '2026-07-01',
        effort: 'S',
        surfaces: ['~/Dropbox/03_STUDIO_OF_TEN/00_FOUNDING_TEN/OFFER_ARCHITECTURE.md'],
      },
      {
        id: 'founding-partner-agreement',
        title: 'One-page founding-partner agreement + IP licence',
        description: 'Legal doc. Blocks nothing but should exist before partner #1 signs.',
        status: 'planned',
        effort: 'S',
        notes: 'Needs legal/Ange input. Not blocking Melisa pilot which is a hand-gloved test.',
      },
      {
        id: 'lock-doctrine-mode-a',
        title: 'Confirm doctrine mode A (locked)',
        description: 'Founding partners run BR doctrine, branded. No method injection. Mode B reserved for post-Founding-Ten.',
        status: 'shipped',
        shippedAt: '2026-07-01',
        effort: 'S',
        surfaces: ['project_sot_powered_platform_build_plan (memory)'],
      },
      {
        id: 'verify-coach-onboarding-flow',
        title: 'Verify coach onboarding: exists or net-new?',
        description: 'Determine if we need to build a coach signup flow or extend existing.',
        status: 'shipped',
        shippedAt: '2026-07-01',
        effort: 'S',
        notes: 'Verified: no dedicated new-coach signup existed. Built `/signup` in Phase 2.',
      },
      {
        id: 'verify-manual-plan-authoring',
        title: 'Verify manual plan authoring: from scratch or generate-then-edit?',
        description: 'Impacts whether coaches without our engine can author plans.',
        status: 'planned',
        effort: 'S',
        notes: 'Still open. Not blocking pilot zero but blocks any partner who wants to bring their own doctrine.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  {
    id: 1,
    title: 'Pilot-ready (hand-gloved)',
    description: 'Onboard partner #1 (Melisa) with targeted branding override before the full de-hardcode.',
    order: 1,
    steps: [
      {
        id: 'provision-melisa-account',
        title: 'Manually provision Melisa coach account + workspace',
        description: 'Coach row + auth user + initial tenant_config seed.',
        status: 'planned',
        effort: 'S',
        surfaces: ['~/Dropbox/03_STUDIO_OF_TEN/00_FOUNDING_TEN/onboarding/MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.md'],
      },
      {
        id: 'melisa-pilot-runbook',
        title: 'Melisa pilot-zero deployment runbook (Shape A)',
        description: 'Separate-deploy runbook drafted. Companion to Phase 2 checklist.',
        status: 'shipped',
        shippedAt: '2026-07-01',
        effort: 'S',
        surfaces: ['~/Dropbox/03_STUDIO_OF_TEN/00_FOUNDING_TEN/onboarding/MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.md'],
      },
      {
        id: 'melisa-pilot-live',
        title: 'Melisa live on platform (pilot zero)',
        description: 'First real tenant. Hand-gloved with active support. Learn what breaks + tighten Phase 2 for partner #2.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'provision-melisa-account',
        notes: '30-day observation period after live before deciding GO/NO-GO on partner #2.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  {
    id: 2,
    title: 'Product-ready',
    description: 'Repeatable via tenant_config DB row + resolver. Self-serve-ish onboarding.',
    order: 2,
    steps: [
      {
        id: 'tenant-config-schema',
        title: 'tenant_config table',
        description: 'JSONB brand/coach/products/licence/modality columns. RLS by coach_id.',
        status: 'shipped',
        shippedAt: '2026-07-02',
        effort: 'S',
        commits: ['cc7d05c6'],
        surfaces: ['~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/sql/2026-07-01_tenant_config_schema.sql'],
      },
      {
        id: 'tenant-resolver-middleware',
        title: 'Tenant resolver + middleware',
        description: 'resolveTenantIdFromHost + prefetchTenant + feature-flagged getTenant().',
        status: 'shipped',
        shippedAt: '2026-07-02',
        effort: 'M',
        commits: ['239655d0', '213c109d'],
        surfaces: ['src/lib/tenant-resolver.ts', 'src/middleware.ts', 'src/config/tenant.ts'],
      },
      {
        id: 'tenant-settings-ui',
        title: 'Coach settings UI + admin registry + signup',
        description: '/dashboard/settings/tenant + /dashboard/settings/tenants + /signup.',
        status: 'shipped',
        shippedAt: '2026-07-02',
        effort: 'M',
        commits: ['86372a33', '07119254', 'f31a990e', '851091e3'],
        surfaces: ['src/app/dashboard/settings/tenant/', 'src/app/dashboard/settings/tenants/', 'src/app/signup/'],
      },
      {
        id: 'test-scripts',
        title: 'Test scripts (unit + Melisa end-to-end)',
        description: '22 unit tests on resolver + loader + cache. Full pipeline test with cleanup.',
        status: 'shipped',
        shippedAt: '2026-07-02',
        effort: 'S',
        surfaces: ['scripts/test-tenant-pipeline.ts', 'scripts/test-melisa-full-pipeline.ts'],
      },
      {
        id: 'brand-de-hardcode-surgical',
        title: 'Surgical brand de-hardcode',
        description: '4 tenant-illusion-breaking sites (dashboard header, payment-success, client portal, approve-checkin) route through brand().',
        status: 'shipped',
        shippedAt: '2026-07-03',
        effort: 'S',
        commits: ['c8bc00bc'],
      },
      {
        id: 'brand-de-hardcode-full',
        title: 'Full de-hardcode pass (Option B)',
        description: 'AST codemod 278 mutations across 100 files. Kade-only dashboards + help guide skipped.',
        status: 'shipped',
        shippedAt: '2026-07-03',
        effort: 'L',
        commits: ['6e854bc1', 'b51abc89'],
        surfaces: ['scripts/codemods/tenant-de-hardcode.ts'],
      },
      {
        id: 'brand-de-hardcode-compound-strings',
        title: 'Compound brand-string pass',
        description: '"Body Recode Performance Coaching", "Body Recode Playbook", etc. Needs per-string decisions on product-name vs tenant-swappable.',
        status: 'deferred',
        effort: 'M',
        notes: 'Blocks partner #2 nothing-visible-says-BR aspiration but not pilot zero. Do per-string manually rather than a codemod.',
      },
      {
        id: 'custom-domain-support',
        title: 'Custom domain routing + admin UI',
        description: 'tenant_domains table + NEXT_PUBLIC_TENANT_DOMAIN_MAP env-var resolver + CRUD API + settings UI.',
        status: 'shipped',
        shippedAt: '2026-07-03',
        effort: 'M',
        commits: ['22f3acf9'],
        surfaces: [
          '~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/sql/2026-07-03_tenant_domains_schema.sql',
          'src/app/api/tenant/domains/route.ts',
          'src/app/dashboard/settings/tenant/domains-section.tsx',
        ],
      },
      {
        id: 'resend-wiring',
        title: 'Per-tenant Resend from-address wiring',
        description: 'fromCoach(), fromBrand(), COACH_BCC all read brand()/coach(). All 115 send sites route through helpers.',
        status: 'shipped',
        shippedAt: '2026-07-03',
        effort: 'M',
        surfaces: ['src/lib/email-shell.ts'],
        notes: 'Manual DNS setup per tenant is documented in Phase 2 deployment checklist step 6.',
      },
      {
        id: 'per-tenant-resend-api-keys',
        title: 'Per-tenant Resend API keys (post-Founding-Ten)',
        description: 'Introduce RESEND_API_KEY_{TENANT_SLUG} + getResendKey(tenantId) helper. Currently all tenants share Kade\'s Resend account.',
        status: 'deferred',
        effort: 'S',
        notes: 'Shared account caps at ~50 verified domains. Founding-Ten is fine; scale later.',
      },
      {
        id: 'edge-cached-tenant-domains',
        title: 'Edge-cached tenant_domains lookup (post-Founding-Ten)',
        description: 'Replace env-var-parsed CUSTOM_DOMAIN_MAP with edge-cached DB lookup. Removes manual redeploy per new domain.',
        status: 'deferred',
        effort: 'M',
        notes: 'Founding-Ten scale (<=30 mappings) is fine with env var. Switch when redeploy friction becomes real.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  {
    id: 3,
    title: 'Billing',
    description: 'Per-tenant Stripe (tenant\'s clients pay tenant) + Kade\'s billing of partners.',
    order: 3,
    steps: [
      {
        id: 'stripe-connect-foundation',
        title: 'Stripe Connect foundation',
        description: 'tenant_config.licence gains stripeAccountId + stripeAccountStatus. Onboard/callback endpoints. UI section.',
        status: 'shipped',
        shippedAt: '2026-07-03',
        effort: 'M',
        commits: ['17da8ffd'],
        surfaces: [
          'src/lib/tenant-stripe.ts',
          'src/app/api/tenant/stripe/onboard/route.ts',
          'src/app/api/tenant/stripe/callback/route.ts',
          'src/app/dashboard/settings/tenant/stripe-section.tsx',
        ],
      },
      {
        id: 'stripe-callsite-refactor',
        title: 'Refactor 15 checkout callsites to use tenantStripeContext()',
        description: 'Per-callsite decision: platform-billed (BR content) vs tenant-billed (tenant product). Bolt-on store stays platform; commencement fees route to tenant.',
        status: 'planned',
        effort: 'L',
        blockedBy: 'stripe-connect-foundation',
        notes: 'Each callsite needs a per-flow decision. Do incrementally as tenants come online with specific paying products.',
      },
      {
        id: 'stripe-connect-webhooks',
        title: '/api/webhooks/stripe/connect handler',
        description: 'Handles Connect account events (account.updated, charge.succeeded on connected accounts).',
        status: 'planned',
        effort: 'M',
        blockedBy: 'stripe-callsite-refactor',
        notes: 'Existing /api/webhooks/stripe unchanged. Connect events come in on a separate endpoint.',
      },
      {
        id: 'partner-billing',
        title: 'Kade\'s billing of partners',
        description: 'Setup + platform subscription + per-active-client metering. Uses Kade\'s Stripe account, not tenants\'.',
        status: 'planned',
        effort: 'M',
        notes: 'Separate integration entirely from tenant-Connect flow. Kade\'s Stripe against Kade\'s own SKUs.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  {
    id: 4,
    title: 'Scale & doctrine mode B',
    description: 'Per-tenant doctrine parameters. Method-injection pipeline. Modality axis.',
    order: 4,
    steps: [
      {
        id: 'yoga-modality',
        title: 'Yoga modality pack',
        description: 'Second modality: yoga movement library + prescription schema + weekly reviews.',
        status: 'shipped',
        shippedAt: '2026-06-15',
        effort: 'L',
        notes: 'Built on `feature/yoga-modality` branch. NOT merged to main yet — merge when a yoga-modality partner signs.',
      },
      {
        id: 'doctrine-parameters',
        title: 'Per-tenant doctrine parameters (Mode A+)',
        description: 'Middle ground: tenant can tune tone + thresholds without full method injection.',
        status: 'planned',
        effort: 'M',
      },
      {
        id: 'doctrine-mode-b',
        title: 'Doctrine mode B: method-injection pipeline',
        description: 'IP-extraction to doctrine config. Each partner\'s method injected into the engine.',
        status: 'planned',
        effort: 'L',
        notes: 'Reserved for after the Founding-Ten. Requires Stage 00 IP-extraction to be mature (Kim as first).',
      },
      {
        id: 'manual-plan-builder',
        title: 'Manual from-scratch plan builder',
        description: 'Only ship if Phase 0 verification finds coaches need to author plans from scratch (not generate-then-edit).',
        status: 'planned',
        effort: 'M',
        blockedBy: 'verify-manual-plan-authoring',
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export function allSteps(): Step[] {
  return PHASES.flatMap((p) => p.steps)
}

export function stepsByStatus(status: StepStatus): Step[] {
  return allSteps().filter((s) => s.status === status)
}

export function phaseProgress(phase: Phase): { shipped: number; total: number; pct: number } {
  const total = phase.steps.length
  // "deferred" doesn't count against progress — it's a decision to skip, not an incomplete blocker
  const meaningfulTotal = phase.steps.filter((s) => s.status !== 'deferred').length
  const shipped = phase.steps.filter((s) => s.status === 'shipped').length
  const pct = meaningfulTotal === 0 ? 0 : Math.round((shipped / meaningfulTotal) * 100)
  return { shipped, total, pct }
}

/**
 * "What's next?" — the highest-priority actionable step. Returns the first
 * in_progress step, else the first planned step in the earliest unfinished phase.
 */
export function nextUpStep(): { phase: Phase; step: Step } | null {
  const inProgress = PHASES.flatMap((p) => p.steps.map((s) => ({ phase: p, step: s }))).find(
    ({ step }) => step.status === 'in_progress',
  )
  if (inProgress) return inProgress
  for (const phase of PHASES) {
    const planned = phase.steps.find((s) => s.status === 'planned' && !s.blockedBy)
    if (planned) return { phase, step: planned }
  }
  return null
}

/**
 * Any phase where all non-deferred steps have shipped is a "gate" — a moment to
 * pause + review before committing to the next phase's cost. Returns the latest
 * completed phase if the next phase hasn't started (has zero shipped or in_progress steps).
 */
export function phaseGateReview(): Phase | null {
  for (let i = 0; i < PHASES.length - 1; i++) {
    const current = PHASES[i]
    const next = PHASES[i + 1]
    const currentDone = current.steps.filter((s) => s.status !== 'deferred').every((s) => s.status === 'shipped')
    const nextStarted = next.steps.some((s) => s.status === 'shipped' || s.status === 'in_progress')
    if (currentDone && !nextStarted) return current
  }
  return null
}
