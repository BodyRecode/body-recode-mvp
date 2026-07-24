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

/**
 * A doc bundled into public/docs/saas-buildout/. Both .md (source) and .docx
 * (Word-friendly copy) are served from Vercel — clickable from anywhere, no
 * dev-only endpoint needed. Kept in sync from ~/Dropbox via
 * `scripts/sync-saas-buildout-docs.sh` (run manually when the Dropbox source
 * changes).
 */
export type Doc = {
  title: string
  /** One-line description of what's in it */
  description: string
  /** Absolute /-prefixed URL to the .md (view in browser) */
  mdUrl: string
  /** Absolute /-prefixed URL to the .docx (Word-friendly download) */
  docxUrl: string
  /** Absolute /-prefixed URL to the SOT-branded .pdf (share-with-someone version).
   *  Undefined for SQL files or docs where a designed PDF doesn't apply. */
  pdfUrl?: string
}

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
  id: 0 | 1 | 2 | 3 | 4 | 5
  title: string
  /** One-line summary shown next to the phase title */
  description: string
  /** Multi-paragraph explainer covering WHY this phase exists, WHAT it accomplishes,
   *  WHEN it should be tackled, and the key strategic decisions inside it. Renders
   *  as an expandable "What this phase means" panel on the buildout page. */
  longDescription: string[]
  /** Docs that belong to this phase (bundled to public/docs/saas-buildout/). */
  docs?: Doc[]
  /** Order in which phases should be tackled (matches build plan) */
  order: number
  steps: Step[]
}

/**
 * Docs that span multiple phases (build plan, deployment checklists, etc.).
 * Rendered as a persistent "Reference library" section on the buildout page.
 */
export const CROSS_PHASE_DOCS: Doc[] = [
  {
    title: 'POWERED_PLATFORM_BUILD_PLAN.md',
    description: 'Kade\'s canonical Phase 0-4 build plan. Original strategic scoping — every phase reads from this.',
    mdUrl: '/docs/saas-buildout/founding-ten/POWERED_PLATFORM_BUILD_PLAN.md',
    docxUrl: '/docs/saas-buildout/founding-ten/POWERED_PLATFORM_BUILD_PLAN.docx',
    pdfUrl: '/docs/saas-buildout/founding-ten/POWERED_PLATFORM_BUILD_PLAN.pdf',
  },
  {
    title: 'README.md (Founding Ten)',
    description: 'What SOT is now: the powered-platform proposition, capped at 10 founding partners.',
    mdUrl: '/docs/saas-buildout/founding-ten/README.md',
    docxUrl: '/docs/saas-buildout/founding-ten/README.docx',
    pdfUrl: '/docs/saas-buildout/founding-ten/README.pdf',
  },
  {
    title: 'PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.md',
    description: 'Step-by-step onboarding runbook for each new tenant. Live-updated with every Phase 2 increment.',
    mdUrl: '/docs/saas-buildout/founding-ten/onboarding/PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.md',
    docxUrl: '/docs/saas-buildout/founding-ten/onboarding/PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.docx',
    pdfUrl: '/docs/saas-buildout/founding-ten/onboarding/PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.pdf',
  },
  {
    title: 'PARTNER_JOURNEY.md',
    description: '8-stage business process (Attract → Run) for founding partners.',
    mdUrl: '/docs/saas-buildout/founding-ten/onboarding/PARTNER_JOURNEY.md',
    docxUrl: '/docs/saas-buildout/founding-ten/onboarding/PARTNER_JOURNEY.docx',
    pdfUrl: '/docs/saas-buildout/founding-ten/onboarding/PARTNER_JOURNEY.pdf',
  },
]

export const PHASES: Phase[] = [
  // ─────────────────────────────────────────────────────────────
  {
    id: 0,
    title: 'Decide & verify',
    description: 'Non-build. Lock the offer + verify what already exists.',
    docs: [
      {
        title: 'OFFER_ARCHITECTURE.md',
        description: 'The canonical founding-partner offer: setup fee + monthly subscription + per-active-client meter. Locked commercially.',
        mdUrl: '/docs/saas-buildout/founding-ten/OFFER_ARCHITECTURE.md',
        docxUrl: '/docs/saas-buildout/founding-ten/OFFER_ARCHITECTURE.docx',
        pdfUrl: '/docs/saas-buildout/founding-ten/OFFER_ARCHITECTURE.pdf',
      },
      {
        title: 'Founding Partner Agreement (v0.1 draft)',
        description: 'Commercial contract for Founding Ten partners. Full agreement covering fees, obligations, term, termination, wind-down. Awaiting legal review.',
        mdUrl: '/docs/saas-buildout/founding-ten/legal/FOUNDING_PARTNER_AGREEMENT_v0.1.md',
        docxUrl: '/docs/saas-buildout/founding-ten/legal/FOUNDING_PARTNER_AGREEMENT_v0.1.docx',
        pdfUrl: '/docs/saas-buildout/founding-ten/legal/FOUNDING_PARTNER_AGREEMENT_v0.1.pdf',
      },
      {
        title: 'IP Licence Deed (v0.1 draft)',
        description: 'Companion licence granting Layer 2 platform + Layer 1 API access. Executed as a deed for 12-year limitation period. Signed together with the Agreement.',
        mdUrl: '/docs/saas-buildout/founding-ten/legal/IP_LICENCE_DEED_v0.1.md',
        docxUrl: '/docs/saas-buildout/founding-ten/legal/IP_LICENCE_DEED_v0.1.docx',
        pdfUrl: '/docs/saas-buildout/founding-ten/legal/IP_LICENCE_DEED_v0.1.pdf',
      },
      {
        title: 'Cover note to legal reviewer',
        description: 'What to look for when reviewing the two drafts above. Priority areas + review checklist for Ange.',
        mdUrl: '/docs/saas-buildout/founding-ten/legal/COVER_NOTE_TO_LEGAL.md',
        docxUrl: '/docs/saas-buildout/founding-ten/legal/COVER_NOTE_TO_LEGAL.docx',
        pdfUrl: '/docs/saas-buildout/founding-ten/legal/COVER_NOTE_TO_LEGAL.pdf',
      },
    ],
    longDescription: [
      'Before any code work, lock down the commercial + doctrine shape of the offer. This phase is mostly non-build — it prevents building the wrong thing.',
      'What gets decided here: per-seat pricing (setup / subscription / per-active-client), the founding-partner licence agreement, that partners run BR doctrine branded as theirs (mode A) versus injecting their own method (mode B — reserved for post-Founding-Ten), and whether the platform can support what partners actually need today (coach onboarding flow existence, manual plan authoring, etc.).',
      'The output of Phase 0 is a signed one-pager + a punch list of unknowns to verify against the codebase. Wrong answers here compound expensively downstream.',
    ],
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
        title: 'Founding Partner Agreement + IP Licence Deed',
        description: 'Commercial contract + companion IP licence for the Founding Ten programme. Two documents that must be signed together. Drafts complete at v0.1, awaiting legal review.',
        status: 'in_progress',
        effort: 'S',
        commits: ['pending'],
        surfaces: [
          '~/Dropbox/03_STUDIO_OF_TEN/00_FOUNDING_TEN/legal/README.md',
          '~/Dropbox/03_STUDIO_OF_TEN/00_FOUNDING_TEN/legal/COVER_NOTE_TO_LEGAL.md',
          '~/Dropbox/03_STUDIO_OF_TEN/00_FOUNDING_TEN/legal/FOUNDING_PARTNER_AGREEMENT_v0.1.md',
          '~/Dropbox/03_STUDIO_OF_TEN/00_FOUNDING_TEN/legal/IP_LICENCE_DEED_v0.1.md',
        ],
        notes: 'v0.1 drafts ready 2026-07-05. Next: send package to Ange for legal review. Expected turnaround ~5 business days. Then Kade reviews redline + we produce v1.0.',
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
        description: 'Verified 2026-07-05: macro plans + blocks CAN be authored from scratch (MacroPlanEditor). Programs + nutrition plans are generate-then-edit only. No from-scratch program builder exists; coach can edit any generated session.',
        status: 'shipped',
        shippedAt: '2026-07-05',
        effort: 'S',
        surfaces: [
          'src/app/api/plan/route.ts',
          'src/app/dashboard/clients/[id]/plan/macro-plan-editor.tsx',
          'src/app/dashboard/clients/[id]/program/generate/form.tsx',
          'src/app/dashboard/clients/[id]/nutrition/generate/',
        ],
        notes: 'Implication for Phase 4 manual-plan-builder step: not needed for Mode A partners (they opted in to BR engine as the point). Reserved for Mode B post-Founding-Ten if partners want fully manual.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  {
    id: 1,
    title: 'Pilot-ready (hand-gloved)',
    description: 'Onboard partner #1 (Melisa) with targeted branding override before the full de-hardcode.',
    docs: [
      {
        title: 'MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.md',
        description: 'Shape A separate-deploy runbook for Melisa. Step-by-step for the pilot-zero go-live.',
        mdUrl: '/docs/saas-buildout/founding-ten/onboarding/MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.md',
        docxUrl: '/docs/saas-buildout/founding-ten/onboarding/MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.docx',
        pdfUrl: '/docs/saas-buildout/founding-ten/onboarding/MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.pdf',
      },
      {
        title: 'onboarding/README.md',
        description: 'Onboarding folder index — points to the checklist + runbook + partner journey.',
        mdUrl: '/docs/saas-buildout/founding-ten/onboarding/README.md',
        docxUrl: '/docs/saas-buildout/founding-ten/onboarding/README.docx',
        pdfUrl: '/docs/saas-buildout/founding-ten/onboarding/README.pdf',
      },
    ],
    longDescription: [
      'The point of Phase 1 is to onboard ONE partner (Melisa) with active support, without waiting for the whole multi-tenant product to be shippable. Because every meaningful table already has coach_id + RLS (Phase 3 of the original build plan §3), a single coach can go live on their own subdomain with a targeted branding override well before the full de-hardcode is done.',
      'Melisa is "pilot zero" — treated as a controlled experiment, not a repeatable product. What we learn from her (which manual steps hurt, which fields should have better defaults, what her clients notice first) tightens the Phase 2 deployment checklist for partners #2-#10.',
      'Shape A vs Shape B: Melisa can either get a separate Vercel deploy (Shape A — isolated, faster to reason about) or share the single multi-tenant deploy (Shape B — the eventual scale pattern). Pilot zero can start on Shape A and migrate to Shape B once the shared deploy path is battle-tested.',
      'This phase ends when Melisa has been live + stable for 30 days AND we make a GO/NO-GO decision on partner #2.',
    ],
    order: 1,
    steps: [
      {
        id: 'provision-melisa-account',
        title: 'Provision Melisa coach account + workspace',
        description: 'Coach row + auth user + initial tenant_config seed. Provisioning CLI at scripts/provision-tenant.ts + partner config at partners/melisa.json (Harmony · Yoga & Meditation). CLI reads config, generates SQL, optionally creates auth.users row, optionally applies via supabase CLI. Idempotent. See partners/README.md. Awaiting: (1) Melisa signs Founding Partner Agreement + IP Licence, (2) fill 4 remaining {{...}} placeholders in melisa.json (last name, photo url, phone, personal IG), (3) `npx tsx --env-file=.env.local scripts/provision-tenant.ts melisa --apply`.',
        status: 'in_progress',
        effort: 'S',
        surfaces: [
          '~/Dropbox/03_STUDIO_OF_TEN/00_FOUNDING_TEN/onboarding/MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.md',
          'scripts/provision-tenant.ts',
          'partners/melisa.json',
          'partners/README.md',
        ],
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
    docs: [
      {
        title: 'tenant_config schema (SQL)',
        description: 'The Phase 2 tenant_config table. JSONB brand/coach/products/licence/modality columns + RLS by coach_id.',
        mdUrl: '/docs/saas-buildout/sql/2026-07-01_tenant_config_schema.sql',
        docxUrl: '/docs/saas-buildout/sql/2026-07-01_tenant_config_schema.sql',
      },
      {
        title: 'tenant_domains schema (SQL)',
        description: 'The Phase 2 custom-domain routing table + normalisation trigger + single-primary enforcement.',
        mdUrl: '/docs/saas-buildout/sql/2026-07-03_tenant_domains_schema.sql',
        docxUrl: '/docs/saas-buildout/sql/2026-07-03_tenant_domains_schema.sql',
      },
      {
        title: 'PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.md',
        description: 'Full step-by-step for onboarding a new tenant. Ship logs at the top; discipline is to keep it fresh with each Phase 2 increment.',
        mdUrl: '/docs/saas-buildout/founding-ten/onboarding/PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.md',
        docxUrl: '/docs/saas-buildout/founding-ten/onboarding/PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.docx',
        pdfUrl: '/docs/saas-buildout/founding-ten/onboarding/PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.pdf',
      },
    ],
    longDescription: [
      'Phase 2 turns "one hand-gloved partner" (Phase 1) into "a repeatable product." The multi-tenant scaffold — one DB row per tenant, a resolver that maps a request host to a tenant, a settings UI so each coach can edit their own brand — is what makes partner #2 possible without a bespoke deploy.',
      'The mountain in this phase is the de-hardcode: ~230 files historically say "Body Recode" and "kade@bodyrecode.au" as literal strings baked into JSX, email templates, and hard-coded URLs. Codemod-driven refactoring routes them all through brand() / coach() helpers so the tenant config drives what a client sees.',
      'The other three product-ready pillars: (a) custom-domain routing — a tenant on their own domain, not a subdomain; (b) per-tenant email from-address wiring — emails come from THEIR address, not Kade\'s; (c) tenant-editable configuration UI at /dashboard/settings/tenant so a coach can update their own brand without SQL.',
      'Phase 2 does NOT include billing (Phase 3) or per-tenant doctrine (Phase 4). It\'s brand shell + surfaces only.',
    ],
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
      {
        id: 'speed-to-lead-sms',
        title: 'Speed-to-lead SMS pipeline',
        description: 'Contact-within-60s SMS on scorecard + challenge + waitlist triggers. Consent-checked, frequency-capped, AEST window-aware, audit-logged. Templates are tenant-aware via coach()/brand().',
        status: 'shipped',
        shippedAt: '2026-07-03',
        effort: 'M',
        commits: ['283e0932', '6df4da3c', 'a52c2afc'],
        surfaces: [
          '~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/sql/2026-07-03_speed_to_lead_sms_schema.sql',
          '~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/SMS_INVENTORY.md',
          'src/lib/sms-send-window.ts',
          'src/lib/speed-to-lead-sms.ts',
          'src/lib/sms-templates.ts',
          'src/app/api/webhooks/twilio/inbound/route.ts',
          'src/app/dashboard/sms/page.tsx',
        ],
        notes: 'Templates read from coach()/brand() so SOT partners get their own voice with no rewrite. Shared Twilio account for now.',
      },
      {
        id: 'per-tenant-twilio-subaccounts',
        title: 'Per-tenant Twilio Subaccounts (Founding Ten)',
        description: 'sendSms() now routes through licence.twilioSubaccountSid + licence.twilioMessagingServiceSid if set. Falls back to platform Twilio if not. Tenant onboarding creates a Subaccount, provisions AU number, adds SIDs to their tenant_config row.',
        status: 'shipped',
        shippedAt: '2026-07-05',
        effort: 'S',
        commits: ['pending'],
        surfaces: [
          'src/lib/twilio.ts',
          'src/config/tenant.ts',
        ],
        notes: 'BR path unchanged (both SIDs null, falls back to platform Twilio). Inbound webhook routing still shared - tenant identification via AccountSid in Twilio POST body is a follow-up refinement.',
      },
      {
        id: 'purchase-and-noshow-sms-triggers',
        title: 'Purchase + no-show SMS triggers',
        description: 'Report purchase SMS fires from Stripe webhook (scorecard_report type). No-show SMS fires from send-booking-confirmation, Inngest sleeps until scheduled + 30 min then sends if lead status is still zoom_1_booked.',
        status: 'shipped',
        shippedAt: '2026-07-05',
        effort: 'S',
        commits: ['pending'],
        surfaces: [
          'src/app/api/webhooks/stripe/route.ts',
          'src/app/api/leads/[id]/send-booking-confirmation/route.ts',
          'src/lib/inngest-functions.ts',
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  {
    id: 3,
    title: 'Billing',
    description: 'Per-tenant Stripe (tenant\'s clients pay tenant) + Kade\'s billing of partners.',
    longDescription: [
      'Phase 3 handles TWO separate money flows that were both hand-waved in earlier phases.',
      '(1) Tenant\'s clients pay the tenant. Uses Stripe Connect Standard accounts — each tenant onboards their own Stripe, their customers pay them directly via Direct Charges, Stripe deposits into their bank. The platform takes an application fee on top. This is what makes the offer "run your own coaching business on our engine" rather than "run your business through Kade\'s Stripe."',
      '(2) Kade\'s billing of partners. Separate integration entirely — Kade\'s Stripe against Kade\'s own SKUs: one-time setup fee + monthly platform subscription + per-active-client metering. This is the SOT licensing revenue.',
      'The heavy lifting inside Phase 3 is the callsite refactor. 15+ existing checkout endpoints currently pass process.env.STRIPE_SECRET_KEY directly. Each has to be updated to consult tenantStripeContext() — but each also needs a per-flow decision: is this charge platform-billed (bolt-on store — BR IP) or tenant-billed (a coach\'s coaching commencement fee — the tenant\'s product)? No universal rule; needs a per-callsite call.',
      'Phase 3 does not block Melisa\'s pilot — she can start on the platform without accepting Stripe payments and Kade can invoice her directly during pilot zero.',
    ],
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
        description: 'Per-callsite decision: platform-billed (BR content) vs tenant-billed (tenant product). Bolt-on store stays platform; commencement fees route to tenant. Pattern established 2026-07-05 via createTenantAwareCheckoutSession helper + one representative callsite refactored (send-commencement-fee). Remaining 14 callsites deferred to post-Funnel B launch (Mon 13 Jul).',
        status: 'in_progress',
        effort: 'L',
        blockedBy: 'stripe-connect-foundation',
        commits: ['pending'],
        notes: 'Pattern documented in src/lib/tenant-stripe.ts (see file docstring for per-callsite decision matrix). Full refactor is risky pre-launch — 14 callsites include the entire Funnel B checkout path that must not break on Mon 13 Jul.',
        surfaces: [
          'src/lib/tenant-stripe.ts',
          'src/app/api/clients/[id]/send-commencement-fee/route.ts',
        ],
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
        description: 'V1 shipped: tenant_config.licence.partnerBilling tracks tier + locked prices + Stripe customer/sub; monthly Inngest cron computes Active Client counts per Founding Partner Agreement §1 definition; admin dashboard at /dashboard/settings/partner-billing surfaces what to invoice each month. Auto-invoicing via Stripe API deferred to v2 — Kade invoices manually via Stripe dashboard using the numbers here.',
        status: 'shipped',
        shippedAt: '2026-07-05',
        effort: 'S',
        commits: ['pending'],
        surfaces: [
          '~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/sql/2026-07-05_partner_billing_schema.sql',
          'src/lib/partner-billing.ts',
          'src/app/dashboard/settings/partner-billing/page.tsx',
          'scripts/test-partner-billing.ts',
        ],
        notes: 'Auto-invoicing via Stripe API is v2 (create Product/Price at partnership commencement + attach subscription + monthly usage record + mark-billed action). Hardened 2026-07-07: extracted pure countDistinctActiveClients + nextMonthStartIso helpers from computeActiveClientCount, added 23-assertion test suite (`npm run test:partner-billing`) covering month boundary math, year rollover, distinct-set dedup, null/empty-string client_id handling, case-sensitivity. The union-set counter is the money-critical path; DB-touching wrapper untouched.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  {
    id: 4,
    title: 'Scale & doctrine mode B',
    description: 'Per-tenant doctrine parameters. Method-injection pipeline. Modality axis.',
    docs: [
      {
        title: 'YOGA_DOCTRINE_v1.md',
        description: 'Complete doctrine pack for the yoga modality — universal safety constraints, prescription schema, exercise vocabulary.',
        mdUrl: '/docs/saas-buildout/founding-ten/modalities/YOGA_DOCTRINE_v1.md',
        docxUrl: '/docs/saas-buildout/founding-ten/modalities/YOGA_DOCTRINE_v1.docx',
        pdfUrl: '/docs/saas-buildout/founding-ten/modalities/YOGA_DOCTRINE_v1.pdf',
      },
      {
        title: 'YOGA_MODALITY_SCOPE.md',
        description: 'Scoping doc for the yoga modality build — what changed between strength and yoga at the Layer 2 prescription surface.',
        mdUrl: '/docs/saas-buildout/founding-ten/modalities/YOGA_MODALITY_SCOPE.md',
        docxUrl: '/docs/saas-buildout/founding-ten/modalities/YOGA_MODALITY_SCOPE.docx',
        pdfUrl: '/docs/saas-buildout/founding-ten/modalities/YOGA_MODALITY_SCOPE.pdf',
      },
    ],
    longDescription: [
      'Phase 4 is post-Founding-Ten territory. The first ten partners run on BR\'s doctrine, mode A — same interpretation engine, same safety floors, their branding on top. That works because the engine is the moat and the branded shell is the product.',
      'Post-ten, partners will start pushing for their OWN doctrine. Mode B — "method injection" — lets a partner\'s method (their thresholds, their preferred exercises, their language) be encoded as doctrine config that the engine consumes. Stage 00 IP Extraction (starting with Kim) is the upstream pipeline: partner walks their method → we structure it → we inject it as config, not code.',
      'The modality axis is a related-but-separate concept. Modality = strength training vs yoga vs breathwork. Different exercise libraries, different prescription schemas, different safety constraints. Yoga modality is already built on a feature branch — merges when a yoga-modality partner signs.',
      'Phase 4 also finishes anything Phase 0 flagged as blocking. If verification found coaches need manual plan authoring (not just generate-then-edit), that plan builder ships here.',
      'This phase is deliberately fuzzy right now — its shape depends on what pilot zero and the first few partners teach us.',
    ],
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
        id: 'conditioning-modality',
        title: 'Conditioning / cardio modality',
        description: 'Prescribe conditioning/cardio (running, energy-system work: type, days, duration, intensity, progression). Higher priority: closes a live gap — the strength engine prescribes NO conditioning, so a client\'s scaled running currently has nowhere to be prescribed (surfaced via Cristobal 2026-07-12).',
        status: 'planned',
        effort: 'L',
        notes: 'KEY: unlike yoga/pilates, cardio must integrate CONCURRENTLY with strength — prescribed alongside the lifting program, shown in the same program + portal. Not just a modality picker; a conditioning layer that composes with strength. See project_modality_roadmap. Interim: running Rx in the program client_note.',
      },
      {
        id: 'pilates-modality',
        title: 'Pilates modality pack',
        description: 'Fourth modality (after strength/yoga/cardio): Pilates movement vocabulary + prescription schema + safety constraints. Same shape as the yoga pack.',
        status: 'planned',
        effort: 'L',
        notes: 'See project_modality_roadmap.',
      },
      {
        id: 'doctrine-parameters',
        title: 'Per-tenant doctrine parameters (Mode A+)',
        description: 'Surface + storage + editor + all SIX client-facing generator consumers shipped. tenant_config.licence.doctrineParameters extends with voiceTone, bannedPhrases, terminologySubstitutions, checkinCoachingGuidance, programGenerationGuidance, nutritionGenerationGuidance. Consumers wired: weekly check-in feedback, nutrition-reading, program-reading, foundational-reading, trajectory-reading, medications-reading. Blood-panel Research Lens is coach-only, doesn\'t need Mode A+.',
        status: 'shipped',
        shippedAt: '2026-07-05',
        effort: 'S',
        commits: ['7f3bae5a', 'a6386b9f', '6ce8b90a', '5617ae74', 'pending'],
        surfaces: [
          'src/config/tenant.ts',
          'src/lib/doctrine-parameters.ts',
          'src/app/dashboard/settings/tenant/doctrine-parameters-section.tsx',
          'src/lib/weekly-checkin-feedback-prompt.ts',
          'src/lib/weekly-checkin-feedback-generate.ts',
          'src/lib/client-nutrition-reading-prompt.ts',
          'src/app/api/generate-nutrition-reading/route.ts',
          'src/lib/client-program-reading-prompt.ts',
          'src/app/api/generate-program-reading/route.ts',
          'src/lib/client-reading-prompt.ts',
          'src/app/api/generate-client-reading/route.ts',
          'src/lib/client-trajectory-reading-prompt.ts',
          'src/app/api/generate-trajectory-reading/route.ts',
          'src/lib/medications-analysis-prompt.ts',
          'src/app/api/clients/[id]/medications/reading/generate/route.ts',
        ],
        notes: 'All six client-facing generators now Mode A+ aware. Pattern: prompt has renderPartnerTuningSection() before OUTPUT FORMAT (empty for BR); route audit adds partner banned check + applyPartnerTerminology on cleaned output. Retry-loop routes (nutrition + program + foundational + medications) feed partner leaks into existing platform-audit retry. Single-pass routes (trajectory) return 500 on either kind of leak. Coach-facing surfaces (Medications Analysis, Research Lens) intentionally NOT Mode A+ - they are internal.',
      },
      {
        id: 'doctrine-parameters-validator',
        title: 'Mode A+ save-time input validator',
        description: 'Validator runs on POST /api/tenant/update when the patch includes doctrineParameters. Blocks partners from setting configs that would silently break their content pipeline: banning platform-mandated state names (Optimisation, Remediation, Post-Optimisation) or Fat Map zone names (Insulin-Drift, Stress-Stored, Estrogen-Shift, Androgen-Decline) or nutrition units (protein/carbs/fat/kcal); substituting into or out of those same protected terms; adding banned phrases shorter than 3 chars or common stopwords like "the" that would flag most drafts; oversized guidance blocks. Ships with 22-assertion test suite. Returns first-violation error to the editor UI with the specific reason.',
        status: 'shipped',
        shippedAt: '2026-07-05',
        effort: 'S',
        commits: ['pending'],
        surfaces: [
          'src/lib/doctrine-parameters-validator.ts',
          'src/app/api/tenant/update/route.ts',
          'scripts/test-doctrine-parameters-validator.ts',
          'scripts/test-doctrine-parameters-runtime.ts',
        ],
        notes: 'Runs BEFORE the DB write. Additive - layers over the platform Hard Safety Floors. Two test suites via `npm run test:doctrine-params`: (a) 22 save-time validator assertions, (b) 21 runtime helper assertions covering applyTerminologyWith + findBannedIn (regex-escape, chained subs, substring-vs-word-boundary, case-insensitive, empty-to-skip). Runtime helpers are on the hot path - called on every FR/PR/NR/MR/TR/WCCF draft. Refactored applyPartnerTerminology + findPartnerBannedPhrase to delegate to pure test hooks so tests don`t require mocking getTenant().',
      },
      {
        id: 'tenants-health-dashboard',
        title: 'Kade-only tenants health dashboard',
        description: 'One-row-per-tenant overview at /dashboard/settings/tenants-health showing load-bearing provisioning + activity signals: coach last_sign_in_at (yellows after 14d idle), active clients vs tier cap (yellow at 80%, red at 100%), subscription status, Stripe Connect status, Twilio configured, custom domain wired, Mode A+ fields set (X of 6). Four top-strip roll-up stats. Built for the moment partners #2+ arrive and eyeballing them one-at-a-time stops working. Kade-only via isCoachEmail gate at route level.',
        status: 'shipped',
        shippedAt: '2026-07-07',
        effort: 'S',
        commits: ['pending'],
        surfaces: [
          'src/app/dashboard/settings/tenants-health/page.tsx',
          'src/app/dashboard/settings/page.tsx',
        ],
        notes: 'Sits alongside /settings/tenants (registry) + /settings/partner-billing (billing). Uses admin (service-role) client for cross-tenant queries; auth still gated by isCoachEmail at the route. Legend chips: filled dot = configured, empty dot = not configured. Cap thresholds: 10 for Launch tier, 30 for Studio tier per Founding Ten Agreement. Refresh link at top re-runs the SSR queries.',
      },
      {
        id: 'partner-getting-started',
        title: 'Tenant-scoped Getting Started checklist',
        description: 'The first thing a fresh partner sees when they log in. Reads their current tenant_config + ambient signals (student count on their coach_id, weekly-checkin count) and shows a 7-step checklist: (1) Brand shell, (2) Voice + coaching guidance, (3) Stripe Connect onboarding, (4) SMS number, (5) Custom domain, (6) First student invited, (7) First check-in reviewed. Each step shows done/not-done + a "Open the settings" link. Steps that Kade handles show "Kade to complete" instead. Progress bar at top uses the tenant\'s own accent colour. Reminder about Hard Safety Floors + IP Licence 4.1(h) at the footer.',
        status: 'shipped',
        shippedAt: '2026-07-07',
        effort: 'S',
        commits: ['pending'],
        surfaces: [
          'src/app/dashboard/getting-started/page.tsx',
          'src/app/dashboard/nav.tsx',
        ],
        notes: 'Linked from nav under META (`Setup`). BR (Kade) tenant always reads as fully done - the page becomes a no-op for the base tenant. For a fresh partner (Melisa on day one), every step is open. Deep-links to /dashboard/settings/tenant + /dashboard/coaching for the tune-and-invite motion.',
      },
      {
        id: 'doctrine-parameters-live-preview',
        title: 'Mode A+ live-LLM preview add-on',
        description: 'Complements the deterministic preview with a "Generate a real sample" button. Runs ONE Anthropic call using the coach\'s current form values as tuning, applied to a fixed stub weekly check-in (Sarah, Week 3). Returns interpretation / reframe / next_focus fields with terminology substitutions applied. Panel shows generated fields + latency + tokens + platform-audit + partner-audit + subs-applied. Costs ~$0.001/click (Haiku, ~1500 in + ~500 out). Fixed stub so two clicks with different tunings show the effect cleanly.',
        status: 'shipped',
        shippedAt: '2026-07-07',
        effort: 'S',
        commits: ['pending'],
        surfaces: [
          'src/lib/doctrine-parameters-live-preview.ts',
          'src/app/api/tenant/doctrine-parameters/preview/live/route.ts',
          'src/app/dashboard/settings/tenant/doctrine-parameters-section.tsx',
        ],
        notes: 'Runs the same validator as the save + deterministic preview endpoints; invalid configs return 400 without spending an API call. Coach-authenticated only. Complements not replaces the deterministic preview - the coach can click one, both, or neither. Fixed-stub design keeps previews comparable across tuning iterations.',
      },
      {
        id: 'doctrine-parameters-presets-preview',
        title: 'Mode A+ presets + deterministic preview',
        description: 'Onboarding-time UX layer over the doctrine-parameters editor. Four preset shapes (Yoga breath-forward, Powerlifting blunt, Corporate wellness, Rehab gentle) that partners can load as a starting point instead of an empty form. Every preset is validator-clean by test. Adds a "Preview" button that renders the per-generator PARTNER TUNING system-prompt block + a terminology-substitution demo + a banned-phrase-hit demo, without spending an Anthropic API call. Deterministic, free, fast. Powers Melisa\'s onboarding: pick "Yoga breath-forward", preview to see the shape, tune, save.',
        status: 'shipped',
        shippedAt: '2026-07-05',
        effort: 'S',
        commits: ['pending'],
        surfaces: [
          'src/lib/doctrine-parameters-presets.ts',
          'src/lib/doctrine-parameters-preview.ts',
          'src/app/api/tenant/doctrine-parameters/preview/route.ts',
          'src/app/dashboard/settings/tenant/doctrine-parameters-section.tsx',
          'scripts/test-doctrine-parameters-presets-and-preview.ts',
        ],
        notes: 'Preview endpoint runs the same validator as the save endpoint, so a config that would fail to save also fails to preview with the exact save-time error (fast feedback loop before Save is clicked). 28 new assertions in `npm run test:doctrine-params`, running total 71 pass. Live-LLM preview (real generation with tuning applied) is a queued future add-on; deterministic preview covers 90% of "what does my config do" without cost.',
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
        status: 'deferred',
        effort: 'M',
        notes: 'Verify item closed 2026-07-05. Verified generate-then-edit is the current path; macro/block manual authoring exists; program-level manual authoring does not. Deferred because Founding Ten (Mode A) opt in for the BR engine, so manual bypass defeats the purpose. Reserved for Mode B if partners want fully manual.',
      },
    ],
  },
  {
    id: 5,
    title: 'Coach Co-Pilot',
    description: 'Conversational doctrine tutor (+ later: draft & refine plans). The white-label differentiator: every coach practising to one standard.',
    longDescription: [
      'A doctrine-trained co-pilot the coach talks with, on a specific client, that has read that client\'s record and can explain, teach, and pressure-test coaching decisions against the Body Recode doctrine — with the coach always the final approver.',
      'Reframed 2026-07-12 to DOCTRINE TUTOR FIRST, drafting second. The engine already drafts plans one-shot; the unique value of a conversation is teaching and alignment ("why is she in Remediation? talk me out of progressing him"). That is what lets a good-but-not-Kade coach reach Kade-level decisions — the literal white-label thesis of "a collective of coaches practising to one standard". So the tutor is the moat; drafting/refining are bonuses layered on once trust is earned.',
      'Built ON TOP of what already exists: doctrine prompt builders + canon (its brain), the hardened generators (its hands for drafting), the rationale_summary "At a glance" cards from 2026-07-11 (compact per-client context, so it never re-reads the raw 221-q firehose), and the draft→review→publish + archive flow (its approval + audit rail).',
      'Lives in the dashboard app (= the SaaS foundation), coach-scoped from day one — build once, rides into white-label with no rebuild. Trust mechanisms: it cites the data it draws on, and a thumbs-down "flag for review" loop catches mistakes + doctrine drift (reviewer = Kade now; per-practice lead coach at white-label time).',
      'Design doc: 06_SAAS_PLATFORM_BUILD/02_FEATURE_SPECS/2026-07-12_Coach_Copilot_Conversational_Build_Design.md (v0.2). Phase 1 tutor shipped (global on every page); 2026-07-24 added Plan Review (doctrine-critique of the actual generated plan) + advisory plan-generation setup + the flagged-exchanges review page. Remaining: the data-mutating phases (co-pilot calls the generator as a tool; surgical in-place edits) — deferred until they can be click-tested alongside Kade.',
    ],
    order: 5,
    steps: [
      {
        id: 'copilot-tutor',
        title: 'Phase 1 — Doctrine Tutor (read-only) + thumbs-down feedback',
        description: 'Per-client chat panel that explains, teaches, and pressure-tests decisions against doctrine, grounded in the client record and CITING its sources. Read-only (writes nothing). Ships with the thumbs-down "flag for review" loop (reviewer = Kade). The hero capability.',
        status: 'shipped',
        shippedAt: '2026-07-12',
        effort: 'L',
        surfaces: ['src/app/dashboard/clients/[id]/copilot-bubble.tsx (floating launcher) + copilot-panel.tsx (chat body)', 'src/app/api/clients/[id]/copilot/route.ts + flag/route.ts', 'src/lib/copilot-context.ts + copilot-prompt.ts', 'copilot_messages table (sql/2026-07-12_copilot_messages.sql)', '06_SAAS_PLATFORM_BUILD/02_FEATURE_SPECS/2026-07-12_Coach_Copilot_Conversational_Build_Design.md'],
        notes: 'Floating bubble (bottom-right) on the client profile, scoped to that client (Kade chose bubble over inline 2026-07-12). GLOBAL bubble shipped 2026-07-13: the same tutor now rides on every dashboard page (src/components/global-copilot-bubble.tsx + src/app/api/copilot/route.ts, stateless general mode). Neutral brand-glyph avatar ("Aperture"), NOT a coach photo, so it white-labels. Model claude-sonnet-5. Coach-scoped; feeds on rationale_summary cards + current saved artefact state (never a re-derivation). 2026-07-24: max_tokens raised 1600→4096 on both routes (long answers were returning empty with stop_reason=max_tokens). Flagged-exchanges review page shipped 2026-07-24 (see copilot-review step).',
      },
      {
        id: 'copilot-review',
        title: 'Plan Review — doctrine-critique of the generated plan',
        description: 'The tutor reads the ACTUAL prescribed training sessions (day/block/exercise, sets/reps/RPE) and nutrition (meals + macro targets) and critiques them against doctrine: phase fit, gate compliance, lane integrity (no calorie Rx in the training arc; protein anchor honoured), RPE/volume sanity, injury/equipment constraints, meal count vs appetite suppression. Flags the exact part + doctrine broken + fix. This is the capability that lets a not-yet-expert coach reach the one standard by catching the slips Kade would catch. Read-only.',
        status: 'shipped',
        shippedAt: '2026-07-24',
        effort: 'M',
        blockedBy: 'copilot-tutor',
        surfaces: ['src/lib/copilot-context.ts (fmtSessions + fmtMeals — full plan detail)', 'src/lib/copilot-prompt.ts (REVIEWING A PLAN AGAINST DOCTRINE mode)'],
        notes: 'The priority next-build identified 2026-07-12 (the "review this generated plan, flag what is off" capability). Also shipped alongside: advisory plan-generation SETUP (the tutor recommends each Generate Program field value + a coach-guidance steer), human-in-loop, no DB mutation — answers "what do I put in these fields?".',
      },
      {
        id: 'copilot-draft',
        title: 'Phase 2 — Draft with me (co-pilot calls the generator)',
        description: 'Chat can propose an artefact (start with the training program) by calling the existing generators as tools; output is a draft the coach reviews, never auto-saved or client-sent. All doctrine guardrails still fire because it routes through the engine.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'copilot-review',
        notes: 'First drafting target = training program. The ADVISORY half shipped 2026-07-24 (tutor recommends the generation setup; coach clicks Generate). This step is now specifically the DATA-MUTATING half: the co-pilot triggers the generate itself. Deferred until it can be click-tested alongside Kade (auth-gated; mutates live client drafts) — do not ship unattended.',
      },
      {
        id: 'copilot-refine',
        title: 'Phase 3 — Refine with surgical edits',
        description: 'Conversational in-place edits that change ONLY the named part (one exercise, one day, one macro, one paragraph) and leave the rest of the draft untouched. Full regeneration on every tweak is explicitly rejected — it would silently change the rest and feel broken.',
        status: 'planned',
        effort: 'L',
        blockedBy: 'copilot-draft',
        notes: 'Data-mutating (edits a saved draft). Like Phase 2 draft, deferred until it can be click-tested alongside Kade — do not ship unattended.',
      },
      {
        id: 'copilot-broaden',
        title: 'Phase 4 — Broaden (practice-wide + proactive)',
        description: 'Practice-wide questions, proactive cross-client triage ("3 clients hit a readiness gate this week"), coach-style memory within doctrine bounds, and the per-practice reviewer setting for the flag-for-review queue at white-label.',
        status: 'planned',
        effort: 'L',
        blockedBy: 'copilot-refine',
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
