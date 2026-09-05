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
  /** Absolute /-prefixed URL to the Body Recode-branded .pdf (share-with-someone version).
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
  id: 0 | 1 | 2 | 3 | 4 | 5 | 6
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
    mdUrl: '/docs/saas-buildout/collective/POWERED_PLATFORM_BUILD_PLAN.md',
    docxUrl: '/docs/saas-buildout/collective/POWERED_PLATFORM_BUILD_PLAN.docx',
    pdfUrl: '/docs/saas-buildout/collective/POWERED_PLATFORM_BUILD_PLAN.pdf',
  },
  {
    title: 'README.md (Collective)',
    description: 'What the Collective is: the powered-platform proposition. The ten-partner cap was dropped 2026-08-18 — it was scarcity framing with no demand behind it.',
    mdUrl: '/docs/saas-buildout/collective/README.md',
    docxUrl: '/docs/saas-buildout/collective/README.docx',
    pdfUrl: '/docs/saas-buildout/collective/README.pdf',
  },
  {
    title: 'PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.md',
    description: 'Step-by-step onboarding runbook for each new tenant. Live-updated with every Phase 2 increment.',
    mdUrl: '/docs/saas-buildout/collective/onboarding/PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.md',
    docxUrl: '/docs/saas-buildout/collective/onboarding/PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.docx',
    pdfUrl: '/docs/saas-buildout/collective/onboarding/PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.pdf',
  },
  {
    title: 'PARTNER_JOURNEY.md',
    description: '8-stage business process (Attract → Run) for Collective Partners.',
    mdUrl: '/docs/saas-buildout/collective/onboarding/PARTNER_JOURNEY.md',
    docxUrl: '/docs/saas-buildout/collective/onboarding/PARTNER_JOURNEY.docx',
    pdfUrl: '/docs/saas-buildout/collective/onboarding/PARTNER_JOURNEY.pdf',
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
        mdUrl: '/docs/saas-buildout/collective/OFFER_ARCHITECTURE.md',
        docxUrl: '/docs/saas-buildout/collective/OFFER_ARCHITECTURE.docx',
        pdfUrl: '/docs/saas-buildout/collective/OFFER_ARCHITECTURE.pdf',
      },
      {
        title: 'Collective Partner Agreement (v0.1 draft)',
        description: 'Commercial contract for Collective Partners. Full agreement covering fees, obligations, term, termination, wind-down. Awaiting legal review.',
        mdUrl: '/docs/saas-buildout/collective/legal/COLLECTIVE_PARTNER_AGREEMENT_v0.1.md',
        docxUrl: '/docs/saas-buildout/collective/legal/COLLECTIVE_PARTNER_AGREEMENT_v0.1.docx',
        pdfUrl: '/docs/saas-buildout/collective/legal/COLLECTIVE_PARTNER_AGREEMENT_v0.1.pdf',
      },
      {
        title: 'IP Licence Deed (v0.1 draft)',
        description: 'Companion licence granting Layer 2 platform + Layer 1 API access. Executed as a deed for 12-year limitation period. Signed together with the Agreement.',
        mdUrl: '/docs/saas-buildout/collective/legal/PARTNER_IP_SUBLICENCE_DEED_v0.1.md',
        docxUrl: '/docs/saas-buildout/collective/legal/PARTNER_IP_SUBLICENCE_DEED_v0.1.docx',
      },
      {
        title: 'Cover note to legal reviewer',
        description: 'What to look for when reviewing the two drafts above. Priority areas + review checklist for Ange.',
        mdUrl: '/docs/saas-buildout/collective/legal/COVER_NOTE_TO_LEGAL.md',
        docxUrl: '/docs/saas-buildout/collective/legal/COVER_NOTE_TO_LEGAL.docx',
        pdfUrl: '/docs/saas-buildout/collective/legal/COVER_NOTE_TO_LEGAL.pdf',
      },
    ],
    longDescription: [
      'Before any code work, lock down the commercial + doctrine shape of the offer. This phase is mostly non-build — it prevents building the wrong thing.',
      'What gets decided here: per-seat pricing (setup / subscription / per-active-client), the founding-partner licence agreement, that partners run BR doctrine branded as theirs (mode A) versus injecting their own method (mode B — reserved for later-stage), and whether the platform can support what partners actually need today (coach onboarding flow existence, manual plan authoring, etc.).',
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
        surfaces: ['~/Dropbox/03_BODY_RECODE_COLLECTIVE/00_PARTNER_PROGRAMME/OFFER_ARCHITECTURE.md'],
      },
      {
        id: 'founding-partner-agreement',
        title: 'Collective legal pack (9 documents)',
        description: 'The full contract chain a partner signs, not just the headline agreement. Discovery: Mutual NDA. Signing: Collective Partner Agreement + Partner IP Sublicence Deed. Upstream: Head Licence Deed (Kade → operating co) + Contractor IP Assignment (inbound copyright). Plus Cover Note, DECISIONS_NEEDED and the IP Protection Map. Chain: Kade owns the IP personally → head licence → operating co → sublicence → partner.',
        status: 'in_progress',
        effort: 'M',
        commits: ['pending'],
        surfaces: [
          '~/Dropbox/03_BODY_RECODE_COLLECTIVE/00_PARTNER_PROGRAMME/legal/ (9 designed docs)',
        ],
        notes: 'Grew from 2 docs to a 9-doc pack. Designed and ready to send to a commercial/IP lawyer (candidate: Oliver) once DECISIONS_NEEDED is filled — that dependency is tracked separately as entity-and-ip-decisions. Build PDFs only via build-sot-pattern-pdf.sh (feedback_sot_pdf_build_system).',
      },
      {
        id: 'entity-and-ip-decisions',
        title: 'Entity + IP decisions the legal pack is waiting on',
        description: 'The blanks in DECISIONS_NEEDED that a lawyer cannot fill for us: incorporate a Pty Ltd (candidate — Studio of Ten Pty Ltd, renamed to a Collective/BR entity), whether to split B2B and B2C entities for liability (accountant call), head-licence terms (exclusivity, royalty, Div 7A), registered Brisbane address, and trade-mark classes + filing.',
        status: 'planned',
        effort: 'M',
        notes: 'THIS IS THE REAL BLOCKER ON THE LEGAL PACK, and it is Kade-and-advisers work, not build work. Currently trading as a sole trader (ABN 90 535 525 708); trade marks NOT started; incorporation open. Every partner signature downstream depends on it, so it gates partner #2 more than any code does. See reference_legal_entity_status.',
      },
      {
        id: 'lock-doctrine-mode-a',
        title: 'Confirm doctrine mode A (locked)',
        description: 'Collective Partners run BR doctrine, branded. No method injection. Mode B reserved for later-stage.',
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
        notes: 'Implication for Phase 4 manual-plan-builder step: not needed for Mode A partners (they opted in to BR engine as the point). Reserved for Mode B later-stage if partners want fully manual.',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  {
    id: 1,
    title: 'Pilot-ready (hand-gloved)',
    description: 'Onboard partner #1 with active support, before the full de-hardcode. NO CANDIDATE — Melisa withdrew 18 Aug.',
    docs: [
      {
        title: 'MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.md',
        description: 'Shape A separate-deploy runbook for Melisa. Step-by-step for the pilot-zero go-live.',
        mdUrl: '/docs/saas-buildout/collective/onboarding/MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.md',
        docxUrl: '/docs/saas-buildout/collective/onboarding/MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.docx',
        pdfUrl: '/docs/saas-buildout/collective/onboarding/MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.pdf',
      },
      {
        title: 'onboarding/README.md',
        description: 'Onboarding folder index — points to the checklist + runbook + partner journey.',
        mdUrl: '/docs/saas-buildout/collective/onboarding/README.md',
        docxUrl: '/docs/saas-buildout/collective/onboarding/README.docx',
        pdfUrl: '/docs/saas-buildout/collective/onboarding/README.pdf',
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
        id: 'collective-site-scorecard',
        title: 'Collective marketing site + Fit Scorecard',
        description: 'How a partner is attracted and qualified before any of the above matters — the Attract and Qualify stages of PARTNER_JOURNEY, built. /collective is the marketing page; /collective/apply is a multi-step Fit Scorecard that scores method, audience, modality and readiness into ready / building / not-yet. Ready books a call at /book; amber and red are captured rather than turned away.',
        status: 'shipped',
        shippedAt: '2026-07-08',
        effort: 'M',
        surfaces: [
          'src/app/collective/{page.tsx, apply/page.tsx, _marketing-html.ts}',
          'src/lib/collective-fit.ts',
          'src/app/api/collective/submit/route.ts',
          'src/lib/collective-eoi-emails.ts + src/lib/collective-ready-coach-sms.ts',
          'sql/collective_applications.sql',
          '03_BODY_RECODE_COLLECTIVE/00_PARTNER_PROGRAMME/COLLECTIVE_FIT_SCORECARD.md',
        ],
        notes: 'Lives under bodyrecode.au, native in body-recode-mvp (moved off studiooften). On submit: applicant confirmation email + coach notify email + ready-tier speed-to-lead SMS to Kade. Coach applications land in collective_applications, deliberately separate from the consumer leads table. OUTSTANDING against this step: the studiooften.com → bodyrecode.au 308 redirect is still unresolved in Vercel (Kade hit a save issue — the field likely wants the bare domain, or it is a Viewer-role permission block).',
      },
      {
        id: 'collective-applications-dashboard',
        title: 'Applications review dashboard',
        description: 'A coach-facing view of collective_applications — who applied, what they scored, what tier they landed in, and what happened next. Today the only notification of an application is an email and an SMS, so the pipeline exists nowhere Kade can actually work it.',
        status: 'planned',
        effort: 'S',
        blockedBy: 'collective-site-scorecard',
        notes: 'Small build, disproportionate value: without it, a partner application that is not actioned from the inbox on the day is effectively lost, and there is no way to see the shape of the funnel (how many ready vs building vs not-yet). Matters more as soon as the Collective is marketed at any volume.',
      },
      {
        id: 'provision-melisa-account',
        title: 'Provision pilot-zero coach account + workspace',
        description: 'Coach row + auth user + initial tenant_config seed. Provisioning CLI at scripts/provision-tenant.ts + partner config at partners/melisa.json (Harmony · Yoga & Meditation). CLI reads config, generates SQL, optionally creates auth.users row, optionally applies via supabase CLI. Idempotent. See partners/README.md. Awaiting: (1) Melisa signs Collective Partner Agreement + IP Licence, (2) fill 4 remaining {{...}} placeholders in melisa.json (last name, photo url, phone, personal IG), (3) `npx tsx --env-file=.env.local scripts/provision-tenant.ts melisa --apply`.',
        status: 'in_progress',
        effort: 'S',
        surfaces: [
          '~/Dropbox/03_BODY_RECODE_COLLECTIVE/00_PARTNER_PROGRAMME/onboarding/MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.md',
          'scripts/provision-tenant.ts',
          'partners/melisa.json',
          'partners/README.md',
        ],
      },
      {
        id: 'melisa-pilot-runbook',
        title: 'Pilot-zero deployment runbook (Shape A)',
        description: 'Separate-deploy runbook drafted. Companion to Phase 2 checklist.',
        status: 'shipped',
        shippedAt: '2026-07-01',
        effort: 'S',
        surfaces: ['~/Dropbox/03_BODY_RECODE_COLLECTIVE/00_PARTNER_PROGRAMME/onboarding/MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.md'],
      },
      {
        id: 'melisa-pilot-live',
        title: 'Partner #1 live on platform (pilot zero)',
        description: 'First real tenant. Hand-gloved with active support. Learn what breaks + tighten Phase 2 for partner #2.',
        status: 'blocked',
        effort: 'M',
        blockedBy: 'provision-melisa-account',
        notes: 'BLOCKED 2026-08-18: no candidate. Melisa (yoga, FP#1 since July) withdrew. The pipeline behind her is one application in six weeks — Dylan Shields, strength, self-scored "building" not "ready", timeline "exploring", and unactioned for 26 days because the applications dashboard was never built. So this is not waiting on engineering; it is waiting on demand. 30-day observation period after live before deciding GO/NO-GO on partner #2. NOTE the yoga modality was built as modality 2 specifically for Melisa and now has no partner behind it — a strength partner needs modality 1, which already ships.',
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
        mdUrl: '/docs/saas-buildout/collective/onboarding/PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.md',
        docxUrl: '/docs/saas-buildout/collective/onboarding/PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.docx',
        pdfUrl: '/docs/saas-buildout/collective/onboarding/PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.pdf',
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
        title: 'Per-tenant Resend API keys (later-stage)',
        description: 'Introduce RESEND_API_KEY_{TENANT_SLUG} + getResendKey(tenantId) helper. Currently all tenants share Kade\'s Resend account.',
        status: 'deferred',
        effort: 'S',
        notes: 'Shared account caps at ~50 verified domains. The Collective is fine; scale later.',
      },
      {
        id: 'edge-cached-tenant-domains',
        title: 'Edge-cached tenant_domains lookup (later-stage)',
        description: 'Replace env-var-parsed CUSTOM_DOMAIN_MAP with edge-cached DB lookup. Removes manual redeploy per new domain.',
        status: 'deferred',
        effort: 'M',
        notes: 'Collective scale (<=30 mappings) is fine with env var. Switch when redeploy friction becomes real.',
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
        notes: 'Templates read from coach()/brand() so Collective partners get their own voice with no rewrite. Shared Twilio account for now.',
      },
      {
        id: 'per-tenant-twilio-subaccounts',
        title: 'Per-tenant Twilio Subaccounts (Collective)',
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
      '(2) Kade\'s billing of partners. Separate integration entirely — Kade\'s Stripe against Kade\'s own SKUs: one-time setup fee + monthly platform subscription + per-active-client metering. This is the Collective licensing revenue.',
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
        title: 'Route every payment path through the tenant context',
        description: 'Every Stripe callsite now resolves its account through tenantStripe() instead of reaching for the platform key directly. Tenant-billed flows route to the partner\'s connected account; Body Recode\'s own products stay on the platform account and are marked as such in code.',
        status: 'shipped',
        shippedAt: '2026-08-17',
        effort: 'L',
        blockedBy: 'stripe-connect-foundation',
        surfaces: [
          'src/lib/tenant-stripe.ts — new tenantStripe() returns {stripe, opts, routedTo}',
          'TENANT-BILLED (14 refactored): scorecard-report/checkout, checkout-by-email, buy-report, blueprint/checkout, extension/checkout, membership/checkout, leads/create-checkout, leads/create-downsell-checkout, leads/send-commencement-fee, lib/send-downsell-offer, lib/subscription-checkout, clients/freeze, payments/generate-link, lib/stripe-sync',
          'PLATFORM-ONLY (3, marked in code): digital-assets/checkout, admin/stripe/backfill, webhooks/stripe',
          'scripts/verify-stripe-routing.ts',
        ],
        notes: 'THE SAFETY PROPERTY, asserted rather than assumed: for a tenant with no Connect account, tenantStripe() returns `opts: undefined`, which makes every refactored call byte-identical to what it was. So this lands as a NO-OP for Body Recode and only activates once a partner completes Connect onboarding — which is why it could ship long before the first partner exists. scripts/verify-stripe-routing.ts asserts exactly that and fails loudly if stripeAccountId ever becomes non-null by accident. TWO THINGS THIS TAUGHT: (1) it is not just checkout creation — anything that later reads or mutates an object created on a connected account (customers, subscriptions, products, prices, payment links) must carry the same options or it looks on the platform account and finds nothing, which is why freeze, payment-link generation and stripe-sync were refactored alongside the checkouts. (2) tenantStripe() MUST be called inside the handler, never at module scope: getTenant() reads a per-request cache populated by prefetchTenant(), so a module-level call resolves every tenant to Body Recode and would route a partner\'s revenue into Kade\'s account. Every callsite had exactly that module-level shape and all of them moved inside their handlers.',
      },
      {
        id: 'stripe-connect-webhooks',
        title: '/api/webhooks/stripe/connect handler',
        description: 'Connected-account events on their own endpoint with their own signing secret. Keeps account status honest, and records what each client actually paid so the 15% is verifiable.',
        status: 'shipped',
        shippedAt: '2026-08-17',
        effort: 'M',
        blockedBy: 'stripe-callsite-refactor',
        surfaces: [
          'src/app/api/webhooks/stripe/connect/route.ts',
          'sql/2026-08-17_partner_charges.sql',
        ],
        notes: 'Separate endpoint on purpose: mixing platform and connected events would mean one signing secret guarding two trust domains and a handler that has to remember whose money each event is. Keeping them apart makes that a property of the URL. TWO JOBS. (1) account.updated keeps tenant_config.licence.stripeAccountStatus honest — a partner can be restricted or finish verification days after onboarding, and without this the platform keeps sending clients to a checkout that cannot take money. Status is read from charges_enabled, not details_submitted, because the latter only means they finished the form. (2) charge.succeeded records what each client actually paid into the new partner_charges table. THIS IS THE ONE THAT MATTERS COMMERCIALLY: the terms are "15% of what each active client pays the coach", and the existing partner_active_client_counts answers how MANY clients were active. Fifteen percent of a headcount is not a number. charge_id is UNIQUE with ignoreDuplicates because Stripe retries webhooks and billing a partner twice for one payment is the worst thing this table could do. ⚠️ KADE MUST DO IN STRIPE: add the endpoint, tick "Listen to events on connected accounts", subscribe to account.updated + charge.succeeded, and set STRIPE_CONNECT_WEBHOOK_SECRET — a DIFFERENT secret from STRIPE_WEBHOOK_SECRET. Until that is set the route returns 500 and logs loudly rather than failing silently, because unrecorded partner revenue is invisible until someone is invoiced wrongly.',
      },
      {
        id: 'partner-billing',
        title: 'Kade\'s billing of partners',
        description: 'V1 shipped: tenant_config.licence.partnerBilling tracks tier + locked prices + Stripe customer/sub; monthly Inngest cron computes Active Client counts per Collective Partner Agreement §1 definition; admin dashboard at /dashboard/settings/partner-billing surfaces what to invoice each month. Auto-invoicing via Stripe API deferred to v2 — Kade invoices manually via Stripe dashboard using the numbers here.',
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
      {
        id: 'api-cost-model',
        title: 'Model API cost per client against per-seat pricing',
        description: 'MEASURED 2026-08-17. A client costs ~$1.18 in Anthropic tokens across their entire coaching lifetime, against $97-194/month of revenue per active client. COGS is not the risk it looked like; development iteration is.',
        status: 'shipped',
        shippedAt: '2026-08-17',
        effort: 'S',
        surfaces: ['scripts/measure-api-cost.ts — re-runnable against live data'],
        notes: 'MEASURED, not estimated: scripts/measure-api-cost.ts counts tokens on REAL stored artefacts and REAL client payloads via Anthropic count_tokens, then multiplies by generation counts observed in the database. Measured against Cristobal (fullest intake on file): client file 3,342 tok re-sent per generation; outputs CFFS 4,189 / program 7,275 / nutrition 7,282 / weekly read 1,251. Lifetime ~135k input + 61k output = **$1.18 per client** at post-1-Sep rates ($0.81 at intro). Against **$97/mo** (online) to **$194/mo** (2x in-person) revenue per active client. At Collective scale (10 partners x 20 clients): $236 one-off to onboard all 200, console $46/mo total, against ~$23k/mo revenue — **COGS 0.2% of revenue**. Even 4x the regenerations is $4.71 a client. THE PRICING IS SAFE; that was the open question and it is now answered. WHAT ACTUALLY DRAINED THE ACCOUNT IN JULY was development iteration (regenerating while building is unbounded and billed identically to production) on top of a balance that had coasted low for six months — not unit economics. So the remaining actions are operational, not commercial: turn on auto-reload + a low-balance alert, and cap the console (already capped at 8 tool turns and 5 web searches). Excluded from the model and worth watching separately: content generation, the co-pilot, retry loops, and ~39 other AI surfaces that fire per coach action rather than per client. METHOD NOTE: the first run picked a reference client whose intake measured 8 tokens and would have understated cost tenfold — `maybeSingle()` returns null when a client has two intake rows. Select by intake completeness, not artefact count.',
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
        mdUrl: '/docs/saas-buildout/collective/modalities/YOGA_DOCTRINE_v1.md',
        docxUrl: '/docs/saas-buildout/collective/modalities/YOGA_DOCTRINE_v1.docx',
        pdfUrl: '/docs/saas-buildout/collective/modalities/YOGA_DOCTRINE_v1.pdf',
      },
      {
        title: 'YOGA_MODALITY_SCOPE.md',
        description: 'Scoping doc for the yoga modality build — what changed between strength and yoga at the Layer 2 prescription surface.',
        mdUrl: '/docs/saas-buildout/collective/modalities/YOGA_MODALITY_SCOPE.md',
        docxUrl: '/docs/saas-buildout/collective/modalities/YOGA_MODALITY_SCOPE.docx',
        pdfUrl: '/docs/saas-buildout/collective/modalities/YOGA_MODALITY_SCOPE.pdf',
      },
    ],
    longDescription: [
      'Phase 4 is later-stage territory. Early Collective Partners run on BR\'s doctrine, mode A — same interpretation engine, same safety floors, their branding on top. That works because the engine is the moat and the branded shell is the product.',
      'In time, partners will start pushing for their OWN doctrine. Mode B — "method injection" — lets a partner\'s method (their thresholds, their preferred exercises, their language) be encoded as doctrine config that the engine consumes. Stage 00 IP Extraction (starting with Kim) is the upstream pipeline: partner walks their method → we structure it → we inject it as config, not code.',
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
        notes: 'Sits alongside /settings/tenants (registry) + /settings/partner-billing (billing). Uses admin (service-role) client for cross-tenant queries; auth still gated by isCoachEmail at the route. Legend chips: filled dot = configured, empty dot = not configured. Cap thresholds: 10 for Launch tier, 30 for Studio tier per Collective Partner Agreement. Refresh link at top re-runs the SSR queries.',
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
        notes: 'Reserved for later. Requires Stage 00 IP-extraction to be mature (Kim as first).',
      },
      {
        id: 'manual-plan-builder',
        title: 'Manual from-scratch plan builder',
        description: 'Only ship if Phase 0 verification finds coaches need to author plans from scratch (not generate-then-edit).',
        status: 'deferred',
        effort: 'M',
        notes: 'Verify item closed 2026-07-05. Verified generate-then-edit is the current path; macro/block manual authoring exists; program-level manual authoring does not. Deferred because the Collective (Mode A) opt in for the BR engine, so manual bypass defeats the purpose. Reserved for Mode B if partners want fully manual.',
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
      'Built ON TOP of what already exists: doctrine prompt builders + canon (its brain), the hardened generators (its hands for drafting), the rationale_summary "At a glance" cards from 2026-07-11 (compact per-client context, so it never re-reads the raw 234-q firehose), and the draft→review→publish + archive flow (its approval + audit rail).',
      'Lives in the dashboard app (= the SaaS foundation), coach-scoped from day one — build once, rides into white-label with no rebuild. Trust mechanisms: it cites the data it draws on, and a thumbs-down "flag for review" loop catches mistakes + doctrine drift (reviewer = Kade now; per-practice lead coach at white-label time).',
      'Design doc: 06_SAAS_PLATFORM_BUILD/02_FEATURE_SPECS/2026-07-12_Coach_Copilot_Conversational_Build_Design.md (v0.2). Phase 1 tutor shipped (global on every page); 2026-07-24 added Plan Review (doctrine-critique of the actual generated plan), advisory plan-generation setup, the flagged-exchanges review page, and Phase 2 draft-a-program (confirm-first: co-pilot proposes a spec via read-only suggest-prescription, coach approves, generator saves a draft). 2026-07-24 also added Phase 3 surgical draft edits (confirm-first refine mode: model proposes a minimal patch, server applies it deterministically to a draft, unnamed parts untouched). Remaining: Phase 4 broaden; add/remove/reorder + whole-day edits + nutrition drafting not yet built. Kade to click-test the full draft → refine → publish loop.',
    ],
    order: 5,
    docs: [
      {
        title: 'Coach Co-Pilot — Build Doc (Phases 1-9)',
        description: 'The whole co-pilot in plain terms: the nine phases (tutor, plan review, draft, refine, roster, nutrition, proactive brief, structural refine, coach memory) plus white-label readiness, how the pieces fit, what is deferred, and status.',
        mdUrl: '/docs/saas-buildout/copilot/COACH_COPILOT_BUILD.md',
        docxUrl: '/docs/saas-buildout/copilot/COACH_COPILOT_BUILD.docx',
        pdfUrl: '/docs/saas-buildout/copilot/COACH_COPILOT_BUILD.pdf',
      },
    ],
    steps: [
      {
        id: 'copilot-tutor',
        title: 'Phase 1 — Doctrine Tutor (read-only) + thumbs-down feedback',
        description: 'Per-client chat panel that explains, teaches, and pressure-tests decisions against doctrine, grounded in the client record and CITING its sources. Read-only (writes nothing). Ships with the thumbs-down "flag for review" loop (reviewer = Kade). The hero capability.',
        status: 'shipped',
        shippedAt: '2026-07-12',
        effort: 'L',
        surfaces: ['src/app/dashboard/clients/[id]/copilot-bubble.tsx (floating launcher) + copilot-panel.tsx (chat body)', 'src/app/api/clients/[id]/copilot/route.ts + flag/route.ts', 'src/lib/copilot-context.ts + copilot-prompt.ts', 'copilot_messages table (sql/2026-07-12_copilot_messages.sql)', '06_SAAS_PLATFORM_BUILD/02_FEATURE_SPECS/2026-07-12_Coach_Copilot_Conversational_Build_Design.md'],
        notes: 'Floating bubble (bottom-right) on the client profile, scoped to that client (Kade chose bubble over inline 2026-07-12). GLOBAL bubble shipped 2026-07-13: the same tutor now rides on every dashboard page (src/components/global-copilot-bubble.tsx + src/app/api/copilot/route.ts, stateless general mode). Neutral brand-glyph avatar ("Aperture"), NOT a coach photo, so it white-labels. Model claude-sonnet-5. Coach-scoped; feeds on rationale_summary cards + current saved artefact state (never a re-derivation). 2026-07-24: max_tokens raised 1600→4096 on both routes (long answers were returning empty with stop_reason=max_tokens). Flagged-exchanges review page shipped 2026-07-24 (see copilot-review step). 2026-08-17 SESSION RESET: both bubbles now start a FRESH conversation on every open. copilot_messages gained session_id (sql/2026-08-17_copilot_session_id.sql); only the current session is replayed to the model and rendered, so a month-old chat can no longer steer today\'s answer or clutter the panel. Rows are still written (Co-Pilot Review + audit trail); pre-existing rows carry session_id NULL and match no live session. The session id doubles as the panel\'s React key so a stale draft/refine proposal cannot survive a close. GET /api/clients/[id]/copilot removed (no history to load).',
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
        title: 'Phase 2 — Draft with me (training program)',
        description: 'The client-scoped co-pilot drafts a training program, confirm-first. "＋ Draft a training program" proposes a full generation spec the coach reviews; an explicit Generate click fires the engine and saves a DRAFT (never auto-published). All doctrine guardrails fire because it routes through the existing generator.',
        status: 'shipped',
        shippedAt: '2026-07-24',
        effort: 'M',
        blockedBy: 'copilot-review',
        surfaces: ['src/app/dashboard/clients/[id]/copilot-panel.tsx (draft-proposal + draft-done cards, proposeDraft/generateDraft)', 'reuses /api/suggest-prescription (read-only input-deriver) + /api/generate-program (existing clamps)', 'src/lib/copilot-prompt.ts (points coach to the draft button)'],
        notes: 'Shipped confirm-first + safe: propose = read-only suggest-prescription (the vetted doctrine input-deriver, so no LLM-guessed client facts); generate = existing /api/generate-program which saves status=draft, is_active=false. Equipment defaults to barbell/dumbbell/bodyweight (matches the form default); block name is coach-editable in the card. No new API route, no autonomous mutation. NOT yet click-tested by Claude (auth-gated) — Kade verifies the full propose→generate→review loop on a real client. Nutrition drafting in-panel not yet built.',
      },
      {
        id: 'copilot-refine',
        title: 'Phase 3 — Refine with surgical edits',
        description: 'Conversational in-place edits to a DRAFT program that change ONLY the named part (one exercise, or the client note) and leave the rest byte-identical. "✎ Refine the draft" in the client panel; confirm-first. Full regeneration on every tweak is explicitly rejected.',
        status: 'shipped',
        shippedAt: '2026-07-24',
        effort: 'L',
        blockedBy: 'copilot-draft',
        surfaces: ['src/lib/program-patch.ts (indexed render + deterministic applyProgramEdits + validateEditOps)', 'src/app/api/clients/[id]/copilot/edit-draft/route.ts (propose + apply)', 'src/app/dashboard/clients/[id]/copilot-panel.tsx (refine-mode composer + edit-proposal/edit-done cards)'],
        notes: 'Model returns a MINIMAL structured patch (update_exercise by day/block/exercise index, or edit_client_note) + a plain summary; server applies it deterministically to a deep copy of sessions so unnamed parts are untouched by construction. Doctrine still binds (refuses phase/gate/injury/safety-breaking edits with empty ops + reason). Add/remove/reorder exercises + whole-day edits NOT yet supported (says so). Only ever edits status=draft. NOT click-tested by Claude (auth-gated) — Kade verifies in the full runthrough.',
      },
      {
        id: 'copilot-broaden',
        title: 'Phase 4 — Broaden (practice-wide)',
        description: 'The everywhere co-pilot bubble answers cross-client questions ("what needs my attention today?", "who is drifting / due to progress?", "state of my roster?") grounded in a live roster snapshot — the SAME ranked triage the Today\'s Focus board uses, plus the doctrine reasoning and next step.',
        status: 'shipped',
        shippedAt: '2026-07-26',
        effort: 'L',
        blockedBy: 'copilot-refine',
        surfaces: ['src/lib/roster-next-actions.ts (computeRosterNextActions — reuses client-next-action.ts)', 'src/lib/copilot-context.ts (buildRosterContext)', 'src/app/api/copilot/route.ts (fetches roster) + copilot-prompt.ts (PRACTICE-WIDE ROSTER block)', 'copilot-starter-questions.ts (My roster) + global-copilot-bubble.tsx (capability)'],
        notes: 'Read-only. General co-pilot route now fetches a compact roster briefing and the prompt reasons over it (group by urgency, cite only what is shown, point to Today\'s Focus for the clickable list, point to a client profile for deep questions). Verified against live DB (9 clients ranked correctly). NOT built: proactive push nudges, coach-style memory, per-practice reviewer setting for white-label. Tech debt: roster-next-actions.ts mirrors today.tsx\'s fetch (dedup deferred — refactoring the live dashboard was out of scope).',
      },
      {
        id: 'copilot-nutrition',
        title: 'Phase 5 — Nutrition parity (draft · refine)',
        description: 'Brings the co-pilot\'s full training-program toolkit to NUTRITION (review already worked). "＋ Draft nutrition" via read-only suggest-nutrition → confirm → generate-nutrition draft; "✎ Refine nutrition" for surgical food/macro edits, confirm-first and draft-only, mirroring the program flow.',
        status: 'shipped',
        shippedAt: '2026-07-27',
        effort: 'M',
        blockedBy: 'copilot-refine',
        surfaces: ['src/app/dashboard/clients/[id]/copilot-panel.tsx (nutrition proposal/done cards; artefact-aware refine composer program|nutrition)', 'src/lib/nutrition-patch.ts (update_food patch + macro recompute via normalizeMealAndDayTotals)', 'src/app/api/clients/[id]/copilot/edit-nutrition/route.ts (propose + apply)', 'reuses /api/suggest-nutrition + /api/generate-nutrition'],
        notes: 'Draft reuses suggest-nutrition (all generate inputs incl. protein anchor / carb demand / meal freq) → generate-nutrition (status=draft, is_active=false, all guardrails). Refine: update_food op applied deterministically, then meal totals + day calorie band RECOMPUTED from foods via the same normaliser the generator uses (no macro desync). Verified recompute in isolation (oats→berries re-summed correctly). NOT yet built: add/remove/reorder foods, add/remove meals — model refuses those with an explanation. NOT click-tested by Claude (auth-gated).',
      },
      {
        id: 'copilot-proactive',
        title: 'Phase 6 — Proactive brief',
        description: 'The everywhere co-pilot bubble stops waiting to be asked: an attention badge (count of clients awaiting the coach) on the launcher, and a one-tap "☀ Morning brief" that narrates who needs attention today and why, grouped by urgency, in the mentor voice.',
        status: 'shipped',
        shippedAt: '2026-07-27',
        effort: 'M',
        blockedBy: 'copilot-broaden',
        surfaces: ['src/app/api/copilot/roster-summary/route.ts (lightweight {awaiting,drifting,total} counts)', 'src/components/global-copilot-bubble.tsx (badge on launcher + Morning brief button)'],
        notes: 'Reuses the Phase 4 roster engine. Badge = count of p<=20 actions, fetched once on mount (layout keeps the bubble mounted across soft nav). Brief = a canned roster prompt through the existing general /api/copilot (already carries the roster snapshot). Read-only. NOT built: scheduled email/Slack digest, per-coach dismissal/snooze. Still-open tech debt: roster-next-actions.ts mirrors today.tsx fetch (dedup deferred).',
      },
      {
        id: 'copilot-refine-full',
        title: 'Phase 7 — Full surgical refine (structure edits)',
        description: 'Refine now covers structural changes for BOTH program and nutrition: add/remove/reorder exercises, whole-day add/remove ("add a fourth day", "drop Wednesday\'s carries", "move the hinge earlier"), and add/remove foods + meals ("drop to 3 meals"). Still confirm-first, still draft-only.',
        status: 'shipped',
        shippedAt: '2026-07-27',
        effort: 'M',
        blockedBy: 'copilot-refine',
        surfaces: ['src/lib/program-patch.ts (add/remove/reorder exercise, add/remove day)', 'src/lib/nutrition-patch.ts (add/remove food, add/remove meal + macro recompute)', 'edit-draft + edit-nutrition route prompts describe the new ops'],
        notes: 'Ops reference ORIGINAL indices, applied in an index-stable order (in-place → reorder → insert → removals DESCENDING → day/meal removals DESC → append). Nutrition recomputes meal totals + day calorie band after. Doctrine still binds (new day cannot exceed frequency ceiling; nutrition change cannot break protein anchor / calorie floor). Verified apply in isolation. Add_day/add_meal take a model-supplied full session/meal. NOT click-tested by Claude.',
      },
      {
        id: 'copilot-memory',
        title: 'Phase 8 — Coach-style memory',
        description: 'The co-pilot remembers how a coach likes to work and honours it as SOFT guidance everywhere (e.g. "favour 4-day splits when gates allow", "keep first blocks to 3 sets", "prefer dairy-free swaps"). Coach-owned free text, edited via a "⚙ Set your coaching preferences" panel in the bubble. Never overrides gates / phase / safety.',
        status: 'shipped',
        shippedAt: '2026-07-27',
        effort: 'L',
        blockedBy: 'copilot-broaden',
        surfaces: ['coach_preferences table (sql/2026-07-27_coach_preferences.sql, RLS coach-only via public.is_coach())', 'GET/PUT /api/copilot/preferences', 'getCoachPreferences() + coachPrefsBlock in copilot-context/copilot-prompt (both prompts)', 'src/components/global-copilot-bubble.tsx (preferences editor)'],
        notes: 'Keyed by coach email (matches isCoachEmail auth); co-pilot routes use service role so RLS just keeps portal clients out. Preferences are EXPLICIT (coach edits them) — no inference. Injected into both the client-scoped and general prompts as soft guidance that yields to doctrine. DEFERRED within this phase: persisting the general (practice-wide) conversation (still stateless, replayed client-side) and extending the flag/review loop to general answers. Verified: build + table round-trip. NOT click-tested by Claude.',
      },
      {
        id: 'copilot-whitelabel',
        title: 'Phase 9 — White-label readiness',
        description: 'The packaging that turns the co-pilot into a licensed capability. Delivered now: tenant-aware coach-facing chrome (the bubble reads "the <Brand> method" via the tenant brand config), on top of the already-neutral Aperture glyph + "Co-Pilot" label. The doctrine stays Body Recode (the licensed IP).',
        status: 'shipped',
        shippedAt: '2026-07-27',
        effort: 'L',
        blockedBy: 'copilot-broaden',
        surfaces: ['src/components/global-copilot-bubble.tsx (brandName prop) + src/app/dashboard/layout.tsx (passes tenantBrand.name)'],
        notes: 'The co-pilot was largely white-label-ready by design (neutral glyph, neutral label, coach_id-scoped data). This phase closes the coach-facing brand hardcode. DEFERRED to the Powered-Platform white-label track (need a 2nd tenant to build/verify — see project_sot_powered_platform_build_plan, project_br_pc_powered_by_strategy): per-practice reviewer ASSIGNMENT for the flagged queue, multi-tenant roster/data scoping, and the strategy call on whether the method NAME in answers rebrands per tenant or stays "powered by Body Recode". Not a rebuild when the time comes — a settings layer.',
      },
      {
        id: 'copilot-coach-guide',
        title: 'Coach training course for the co-pilot',
        description: 'A course at /dashboard/copilot-guide teaching a coach to actually USE the co-pilot to one standard — a lesson per capability, worked walk-throughs, how the flag loop works, and a downloadable branded handout. Distinct from the internal build doc: this is written for the partner, not for us.',
        status: 'shipped',
        shippedAt: '2026-07-30',
        effort: 'M',
        blockedBy: 'copilot-whitelabel',
        surfaces: [
          'src/app/dashboard/copilot-guide/page.tsx (server, tenant-aware via brand())',
          'public/docs/copilot-guide/COACH_COPILOT_GUIDE.{md,docx,pdf}',
          '06_SAAS_PLATFORM_BUILD/02_FEATURE_SPECS/2026-07-30_Coach_Copilot_Guide.md',
        ],
        notes: 'This is the white-label ENABLEMENT surface — the thing that makes "a collective of coaches practising to one standard" survive contact with a coach who is not Kade. Building the capability was never sufficient on its own; a coach who does not know which questions to ask gets none of the value. Nav "Co-Pilot" in the Meta group; linked from the help guide. Also flushed out a real engine bug while writing it: the co-pilot draft flow was calling generate-program WITHOUT plan_block_id, so the program detached from the macro arc, coach guidance was silently discarded, and it produced an RPE-8 Restoration block. Fixed by resolving the block server-side.',
      },
      {
        id: 'copilot-session-reset',
        title: 'Fresh conversation on every open',
        description: 'Opening the co-pilot now starts a new conversation instead of resuming the last one. Previously the client-scoped bubble reloaded every message ever exchanged about that client (up to 200) and replayed the most recent 24 to the model; the global bubble kept its conversation alive across page navigation.',
        status: 'shipped',
        shippedAt: '2026-08-17',
        effort: 'S',
        blockedBy: 'copilot-memory',
        commits: ['f7edf3d0', '0fdb1ea7'],
        surfaces: [
          'sql/2026-08-17_copilot_session_id.sql (copilot_messages.session_id + index)',
          'src/app/dashboard/clients/[id]/copilot-bubble.tsx + copilot-panel.tsx',
          'src/app/api/clients/[id]/copilot/route.ts (history scoped to session; GET removed)',
          'src/components/global-copilot-bubble.tsx',
        ],
        notes: 'Not cosmetic: the old behaviour fed stale conversation back to the model as context, so a question asked weeks ago could shape an unrelated answer today, and it burned tokens doing it. Rows are still written — /dashboard/copilot-review reads them and they remain an audit trail — they are simply no longer reloaded; pre-existing rows carry session_id NULL and match no live session. The session id doubles as the panel React key so a stale draft/refine proposal cannot survive a close. ACCEPTED TRADE-OFF (Kade chose this over a grace window): closing the panel mid-flow discards an open draft proposal. Documented in the help guide. NOT click-tested (auth-gated).',
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  {
    id: 6,
    title: 'Operator Console',
    description: 'A full-page AI chat inside the dashboard that can OPERATE the business, not just talk about it.',
    longDescription: [
      'Kade\'s ask, in his words: build a chat platform inside the dashboard that works the way he works with Claude Code, so that anyone licensing the software can do what he does. "No one will have access to you and vscode like we have our tech set up." It gets its OWN FULL PAGE — full-height conversation, message history, threads — because "i\'m picturing it own page and it needs to look like claude page or chatgpt page... this should be a separate page to the co-pilot button." The Phase 5 bubble stays exactly as it is for in-context help on the page you are already on. This is the room you go to when the work IS the conversation.',
      'ONE DISTINCTION DEFINES THE SCOPE. A session with Claude Code contains two different activities and only one of them ships. OPERATE the business — find the leads who never moved, notice two workflows are double-sending, audit what is actually firing, run a dry run, draft the emails, decide who is eligible — is all reading data, reasoning against doctrine, and triggering things that already exist. That ships to licensees. CHANGE the software — writing modules, adding columns, editing pages, deploying — never ships. A licensee editing the source is a support and liability problem, not a feature.',
      'This is closer than it looks, because the intelligence already exists. Phase 5 shipped a co-pilot that carries the doctrine, reads client data, reviews plans against the standard, drafts, refines, and is coach-scoped and white-label-ready. What it lacks is TOOLS. It can talk; it cannot go and look, or go and do. That gap is function calling. "Which of my leads never moved?" runs a scoped query. "Draft the re-engagement" generates it. "Send it" stages it and requires a human click. Build on top, not from zero.',
      'TWO THINGS WILL BITE. First, tenant scoping on every single tool — a licensee must never read or touch another practice\'s data, and that has to be enforced at the tool layer, not the prompt layer, because a prompt can be talked around. Second, a hard approval gate on anything that sends, charges or deletes: never autonomous, always the dry-run → human reads it → explicit confirm pattern already proven in the dormant reactivation. Cost is the third thing to watch — a console running tool loops all day is materially more expensive per user than a bubble answering the odd question, which is why api-cost-model is a prerequisite rather than a nice-to-have.',
      'The worked example to build against is the dormant reactivation from 12-13 August. A licensee should be able to have that identical conversation: "how many of my leads never moved?" → 84 → "why did they stall?" → "draft them their read" → "show me who\'d get it" → dry run → "send it". Every part of that chain exists already except the tools and the page.',
    ],
    order: 6,
    steps: [
      {
        id: 'console-page',
        title: 'Full-page conversation shell',
        description: 'The page itself: full-height conversation view, message history, multiple threads you can return to. Looks like Claude or ChatGPT, not like a bubble. Separate from the Phase 5 co-pilot, which stays where it is.',
        status: 'shipped',
        shippedAt: '2026-08-17',
        effort: 'M',
        surfaces: [
          'src/app/dashboard/console/page.tsx (server, coach-gated) + console-client.tsx',
          'src/app/api/console/threads/route.ts (list, load, archive)',
          'src/app/dashboard/nav.tsx — top-level "Console", alongside Today and Live',
        ],
        notes: 'Deliberately NOT a widening of the co-pilot bubble. The bubble is for a question about the page you are on; the console is for work that IS the conversation, which needs room and needs to be resumable. Note the tension with copilot-session-reset: the bubble is now deliberately amnesiac, whereas the console keeps durable threads down the left — different surfaces, different memory rules, and that is the point of separating them. Nav placement is top-level rather than under Meta because it is a place you go to work, not a settings page.',
      },
      {
        id: 'console-tenant-scoping',
        title: 'Tenant scoping at the tool layer',
        description: 'Every tool the console can call resolves its own tenant scope server-side and refuses to read or write outside it. Not a prompt instruction — an enforced boundary in the tool implementation.',
        status: 'shipped',
        shippedAt: '2026-08-17',
        effort: 'M',
        blockedBy: 'console-page',
        surfaces: ['src/lib/console/scope.ts — resolveConsoleScope() + scoped()'],
        notes: 'THE ONE THAT CANNOT BE RETROFITTED, and the reason it was built before the tools rather than after. The model chooses WHICH tool and WHAT to look for; it never chooses WHOSE data, and it is never handed a coach id to pass. Scope comes from the session only. Two gates: signed in, then a coach (allowlist OR owns a clients row — mirrors public.is_coach() so route guard and RLS policy agree). Child tables with no coach_id of their own (lead_events, sms_logs, be_workflow_executions) are reached by resolving the scoped parent ids first — slower and correct. The audit rule is greppable: a query on an OWNED table without scoped() is a bug; five derived child queries are expected and documented inline. A sixth is a review item. This also absorbs the multi-tenant scoping that co-pilot Phase 9 deferred for want of a second tenant.',
      },
      {
        id: 'console-tools-read',
        title: 'Read tools — go and look',
        description: 'The first real capability: scoped queries over leads, clients, workflows, sends and events, so the console can answer "which of my leads never moved?", "what is actually firing?", "who stalled and why?" from live data rather than from what it was told.',
        status: 'shipped',
        shippedAt: '2026-08-17',
        effort: 'L',
        blockedBy: 'console-tenant-scoping',
        surfaces: ['src/lib/console/tools-read.ts', 'src/lib/console/prompt.ts', 'src/app/api/console/route.ts (tool loop)'],
        notes: 'Seven tools: count_leads, find_leads, get_lead, find_clients, roster_attention, recent_sends, list_workflows. Two rules the file holds to. (1) NO FREE-FORM SQL — every filter is an enumerated parameter, because a "run this query" tool is exactly what turns a prompt injection into a database read; flexibility is not worth that. (2) SMALL RETURN SHAPES — results are capped at 50 rows, trimmed to the fields that answer the question, and counted rather than enumerated where a count IS the answer, because everything a tool returns is re-read and re-paid for on every later turn. roster_attention reuses computeRosterNextActions (the Today\'s Focus engine) and intersects it with this coach\'s client ids rather than forking a second ranking that could drift from the board. Model tier: AI_MODELS.structural — the coach acts on these answers.',
      },
      {
        id: 'console-tools-action',
        title: 'Action tools — go and do, behind a gate',
        description: 'Triggering things that already exist: work out who is eligible, run the dry run, then stage the send. Anything that sends, charges or deletes stops and waits for an explicit human click.',
        status: 'shipped',
        shippedAt: '2026-08-17',
        effort: 'L',
        blockedBy: 'console-tools-read',
        surfaces: [
          'src/lib/console/tools-action.ts (stage only — contains NO code that sends)',
          'src/app/api/console/actions/[id]/confirm/route.ts (POST executes, DELETE cancels)',
          'console_pending_actions table',
        ],
        notes: 'THE MODEL CAN NEVER COMPLETE AN ACTION, and that is structural rather than instructional: the tool file it can reach contains no sending code at all, so there is no phrasing or injection that produces a send. Staging writes the exact payload that will run, so what the coach approves IS what happens — not a re-derivation a moment later against data that moved. Execution lives only in the confirm route, reached by a human click, behind four checks: is a coach, owns THIS action, still pending (stops a double-click sending twice), not expired (30 min — a list read an hour ago may no longer describe who would receive it). Ownership of every lead id is re-verified at execution time. Two actions shipped: dormant_reactivation (reuses the proven 12-13 Aug eligibility + Inngest sequence) and set_lead_follow_up. Approval card leads with counts and shows exclusions as prominently as recipients — the half people skip and the half that catches a test record.',
      },
      {
        id: 'console-audit-trail',
        title: 'Audit trail of what the console did',
        description: 'A durable record of every tool call, every staged action, who approved it and what it touched — readable per tenant.',
        status: 'shipped',
        shippedAt: '2026-08-17',
        effort: 'S',
        blockedBy: 'console-tools-action',
        surfaces: ['sql/2026-08-17_operator_console.sql — console_threads, console_messages, console_tool_calls, console_pending_actions (all RLS coach-scoped + service_role grants)'],
        notes: 'One row per tool invocation: which tool, what arguments, ok/failed, row count, duration. Failed calls are kept deliberately — a tool that refused is exactly what you want when working out why an answer was wrong. Row COUNTS are stored, not the rows: the transcript already carries what the model was told, and copying client data into a second table multiplies where personal information lives. A failed audit write never blocks the answer but is logged loudly, because a silently missing audit trail is worse than none. The user-facing half is the tool-trace chips under each answer — if the chips are absent, it did not actually check.',
      },
      {
        id: 'console-general-purpose',
        title: 'General-purpose assistant, not a lookup service',
        description: 'The console does anything ChatGPT or Claude could do — write, plan, analyse, research, brainstorm, explain — on top of seeing the practice\'s live data. Adds Anthropic-hosted web search so it is not stuck at its training cutoff, and the brand voice rules so anything it drafts for a lead or client is on-brand.',
        status: 'shipped',
        shippedAt: '2026-08-17',
        effort: 'S',
        blockedBy: 'console-tools-read',
        surfaces: [
          'src/lib/console/prompt.ts (rewritten)',
          'src/app/api/console/route.ts — web_search_20260209 server tool + pause_turn handling',
          'src/lib/console/tools-read.ts — content_context tool',
        ],
        notes: 'SHIPPED AS A FIX, hours after the console went live. Kade opened it, asked for help building client info packs and then a content marketing strategy, and was refused BOTH times: "I don\'t have a tool for drafting." His verdict: "no good". The bug was mine and it was in the prompt, not the model — the first version framed the console as a set of tools and then listed what it could not do, which conflated "I have no tool to look that fact up" (true, worth saying) with "I have no tool to WRITE that" (nonsense — writing, planning and advising need no tool). Kade\'s clarification set the target: "everything a chatgpt or claude ai could do - just not be able to make development changes to system". So the prompt now leads with the work, treats tools as a way to avoid GUESSING rather than as the limit of capability, and states exactly three limits: no development changes, nothing sends without a human click, no other practice\'s data. Added web search (max 5 uses/turn, capped because an unconstrained research loop is the cost driver in project_collective_pricing_vs_api_cost) with pause_turn resume in the loop, and server_tool_use surfaced into the trace chips so a web search is as visible as a database read. Added content_context so drafting builds on the real post calendar and campaigns instead of inventing a plan that collides with what is already scheduled. Brand voice layering (cold / engagement / conversion) and the hard rules (no em dashes, no fitness clichés, no shame framing, single Zoom, Founding Client retired) are now carried in the prompt — a licensed coach has no other way to know the cold-layer rule.',
      },
      {
        id: 'console-calendar-posts-tenancy',
        title: 'Close the calendar_posts tenancy gap',
        description: 'The `calendar_posts` table has no coach_id, so the console\'s content_context tool cannot scope it the way every other read is scoped. Add the column, backfill it, and wrap the query in scoped().',
        status: 'shipped',
        shippedAt: '2026-08-17',
        effort: 'S',
        blockedBy: 'console-general-purpose',
        surfaces: [
          'sql/2026-08-17_calendar_posts_coach_id.sql',
          'src/lib/console/tools-read.ts — contentContext now goes through scoped()',
          'scripts/verify-console-tools.ts — leak assertion + orphan-row check',
        ],
        notes: 'Closed the same day it was raised. coach_id added, all 435 rows backfilled (body_recode 334, personal_brand 73, collective 28 — brand is a sub-axis WITHIN one coach\'s content, coach_id is the tenancy boundary), index on (coach_id, date), and both content_context queries now go through scoped(). THERE ARE NOW NO UNSCOPED CONSOLE READS. Verified: an unknown coach id sees 0 leads, 0 clients and 0 posts, and every row has an owner. ⚠️ ONE THING TO REMOVE AT TENANT #2: the column carries a DEFAULT of the solo coach\'s id. Every calendar_posts insert lives in a hand-run seed script (six of them; no application route writes this table), so a future seed that forgets the column would otherwise produce NULL-owner rows that the scoped read silently SKIPS — a post that exists but is invisible is worse than an error. The migration only installs that default when exactly one coach exists, and the SQL file carries the DROP DEFAULT statement to run when the second practice is onboarded, at which point every seed script must pass coach_id explicitly.',
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
