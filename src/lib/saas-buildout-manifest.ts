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

import {
  allStepsIn,
  stepsByStatusIn,
  nextUpStepIn,
  phaseGateReviewIn,
  phaseProgress,
  type StepStatus,
  type Doc,
  type Step,
  type Phase,
} from '@/lib/buildout-types'

// Types live in buildout-types.ts (shared with the Performance Coaching board).
// Re-exported here so existing importers keep their import path unchanged.
export type { StepStatus, Doc, Step, Phase }
export { phaseProgress }

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

const PLATFORM_PHASES: Phase[] = [
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
]

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────


/* ===========================================================
 * The read-as-a-product phases, added 9 Sep 2026.
 *
 * Source: 06_SAAS_PLATFORM_BUILD/2026-09-01_Read_As_A_Product_Roadmap.md
 * and the `body-recode-loop` auto-memory. Every status below was verified
 * against the code on 9 Sep 2026, not taken from a design note — the note
 * claiming a 12-week backstop existed turned out to be wrong.
 * =========================================================== */

const READ_PHASES: Phase[] = [
  {
    id: 1,
    title: 'The read stands alone',
    description: 'Separate the read from Kade’s client records and his login, so somebody else can run it.',
    longDescription: [
      'The engine itself is already clean. The prompt builders import doctrine, plausibility checks and the intake questions, and nothing from programs, nutrition or the portal. The read does not know the coaching app exists.',
      'What it IS tangled in is Kade’s own data and his own session. generate-cffs takes an intake_id and a client_id, reads his intakes, clients, baselines, blood_panels and leads tables, and gates on his coach login. So the read cannot be handed a person it has never met.',
      'None of this phase needs a customer, because what the read is GIVEN is the same whoever buys it. How the read is SHOWN is not, which is why no screens get built here.',
    ],
    order: 1,
    steps: [
      {
        id: 'read-internal-entrypoint',
        title: 'Internal entrypoint for the read',
        description: 'A server-side script can run the CFFS for one client without a browser session.',
        status: 'shipped',
        shippedAt: '2026-09-01',
        effort: 'S',
        commits: ['98dcec87'],
        surfaces: ['src/app/api/generate-cffs/route.ts'],
        notes: 'Sixth and last of the generators to get one, after generate-nutrition and generate-program (30 Aug) then generate-trajectory-reading, suggest-nutrition and suggest-plan (1 Sep). The read mattered most because every other artefact derives from the CFFS, so a failure here was the most expensive to diagnose blind. Auth unchanged on POST.',
      },
      {
        id: 'read-takes-answers-directly',
        title: 'The read takes answers handed to it',
        description: 'Structured answers in, read out. No client_id, no database lookup, no login.',
        status: 'planned',
        effort: 'M',
        blockedBy: undefined,
        surfaces: ['src/app/api/generate-cffs/route.ts', 'src/lib/cffs-prompt.ts'],
        notes: 'THE real separation, and the next thing to build. Today the route returns 400 without both intake_id AND client_id. The existing route should become a thin wrapper that loads from the database and calls the new function, so nothing changes for Kade or his clients.',
      },
      {
        id: 'minimum-question-set',
        title: 'The smallest set of questions that still gives a good read',
        description: 'Decide which of the 230 carry the read, which are enrichment, and what it may say on partial input.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'read-takes-answers-directly',
        notes: 'The intake is 230 questions across 11 sections (call getTotalQuestions(), never quote it) and the ONLY missing-data handling anywhere is one line about absent photos. No other company will put their clients through 230 questions, so this is the gate on both front doors. Design to the tightest constraint (an embedded host with ~20 fields) and the coach and consumer paths come free.',
      },
      {
        id: 'read-usable-by-stranger',
        title: 'The read stands up to a coach who has never read the doctrine',
        description: 'Make the read actionable by someone outside Body Recode, not just by the program engine.',
        status: 'planned',
        effort: 'M',
        notes: 'Today the read hands off to BR’s own generators, which already know the doctrine. In both front doors the coach writes the program themselves. A read that is a perfect input to the generator can be useless to a stranger acting on it on a Tuesday morning. This became answerable on 1 Sep: every door has the same reader, a coach who does not know the system.',
      },
      {
        id: 'watch-data-slot',
        title: 'Leave an empty slot for device data',
        description: 'Shape the input so a time-series channel can arrive later without a rewrite.',
        status: 'planned',
        effort: 'S',
        blockedBy: 'read-takes-answers-directly',
        notes: 'Costs almost nothing now and avoids a retrofit. Do NOT build wearable integration itself: the receiver already exists (readiness-monitor.ts, recovery-ingest.ts) and in door 1 the host app usually already has Apple Health connected and passes the data in. Apple specifically cannot be read server to server, it needs an app on the phone, unlike Whoop, Oura, Garmin and Fitbit.',
      },
    ],
  },
  {
    id: 2,
    title: 'The loop — weekly signal and the re-read',
    description: 'Intake, read, weekly check-in, re-read every 12 weeks. The trigger is time, never block-end.',
    longDescription: [
      'This is the Body Recode product in four steps: initial intake, initial read, weekly check-in, and a re-read every 12 weeks. Everything else is Layer 2.',
      'Kade’s call on 9 Sep 2026: the re-read trigger must be TIME, not coaching. A "block" is Performance Coaching vocabulary. Other coaches write 4-week, 8-week or 12-week blocks or none at all, and software embedding the read has no such concept. The standard is 12 weeks since her last read AND her latest weekly check-in is in. Both halves are Layer 1. Neither mentions a block.',
      'It counts from the last READ, not coaching start and not block start, so the initial read starts the clock and each completed re-read restarts it. Self-perpetuating, identical in every product, and no client is ever more than 12 weeks stale.',
      'A full re-read is NOT a full re-intake. Most of the 230 cannot have changed in 12 weeks, a long form produces careless answers, and it will not get completed. "Full" describes the read, not the form: short re-ask, complete re-interpretation.',
      'Most of the collection half already works. The gap is a single generator that actually updates the read.',
    ],
    order: 2,
    steps: [
      {
        id: 'progress-check-collection',
        title: 'Progress Check collects the re-read inputs',
        description: '24 questions plus required measurements and all three photos, invited automatically.',
        status: 'shipped',
        shippedAt: '2026-08-27',
        effort: 'L',
        surfaces: ['src/lib/progress-check-questions.ts', 'src/lib/progress-check-dispatch.ts', 'src/app/api/submit-progress-check/route.ts'],
        notes: 'Internal spec name is literally "Delta Re-Read". Weight, waist, hips, chest and three photos are REQUIRED with no opt-out; capture travels with the answers as one submission so a client can never end up with answers on file and no photos. It works: it produced BR’s first ever before-and-after (Cristobal, week 8, 29 Aug).',
      },
      {
        id: 'reread-trigger-hole',
        title: 'Fix the trigger hole for coaches without blocks',
        description: 'The block gate is skipped, not deferred, when a client has no block length.',
        status: 'planned',
        effort: 'S',
        surfaces: ['src/lib/progress-check-readiness.ts'],
        notes: 'MUST FIX BEFORE ANY COACH WHO IS NOT KADE USES IT. evaluateProgressCheckReadiness() has exactly two gates, block_not_ended and weekly_checkin_pending, and skips the first entirely when blockFinalWeekStartsAtMs is null. So a coach who does not write fixed-length blocks gets a re-read fired at EVERY weekly check-in with nothing pacing it. That is precisely the coach door 2 exists for. Verified 9 Sep.',
      },
      {
        id: 'reread-time-trigger',
        title: 'Time-based re-read trigger',
        description: '12 weeks since the last read, plus the weekly check-in gate. Replaces block-end.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'reread-trigger-hole',
        surfaces: ['src/lib/progress-check-readiness.ts', 'src/lib/progress-check-dispatch.ts'],
        notes: 'There is NO time gate in the code at all today — the "12-week/84-day backstop" in the design notes was never built (verified 9 Sep, grep for 84 returns nothing). Keep the check-in gate: it is the weekly signal, not a coaching concept, and it exists so the big ask never arrives before the weekly one and displaces it. Drift may pull the re-read earlier since drift is computed from BR’s own signal; 12 weeks is the ceiling, not the schedule.',
      },
      {
        id: 'reread-generator',
        title: 'The re-read generator',
        description: 'Existing read plus new answers, measurements, photos and weekly signal, in; updated read out.',
        status: 'planned',
        effort: 'L',
        blockedBy: 'read-takes-answers-directly',
        notes: 'THE GAP, and the whole job. The Progress Check collects everything needed to update the read and then does not update it — it re-scores body state alongside the original read, and the interpretation written in week one stays as written. Doctrine currently forbids regenerating the CFFS off a Progress Check, which was right at the time but left nothing in its place. Smaller than it sounds, because the hard part (getting a real person to hand over fresh numbers and photos on a schedule) already works.',
      },
      {
        id: 'reread-outputs-changes',
        title: 'The re-read says what changed',
        description: 'Output the delta and what it means, not a fresh document.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'reread-generator',
        notes: 'More useful to a coach than a new read, and more defensible: it shows the system holding a view over time rather than starting again every quarter. This is also the thing that justifies a subscription — a one-off read is a one-off sale.',
      },
      {
        id: 'reread-pause-on-freeze',
        title: 'Pause the clock on a frozen client',
        description: 'A break must not turn into an instantly overdue re-read the day she returns.',
        status: 'planned',
        effort: 'S',
        blockedBy: 'reread-time-trigger',
      },
    ],
  },
  {
    id: 3,
    title: 'Door 2 — the coach’s own screen',
    description: 'A coach with no software runs clients on Body Recode. Mostly subtraction.',
    longDescription: [
      'The first of the two front doors, and the one to build first. A coach with no coaching software of their own runs their clients on BR screens: their client list, the intake, the read, the weekly check-in, the re-read. Nothing else. They write the programs themselves.',
      'This is mostly subtraction. A coach who signs up TODAY lands in Kade’s entire business cockpit — the ads dashboard, the CRM, the content generator, the funnel pages, the booking agent, the SMS pulse — and there is no product tier gating anywhere to hide any of it. tenant.ts carries only a launch/studio commercial tier.',
      'A gym is not a third door. It is this door with an owner layer on top: someone who buys, adds and removes coaches, and sees across all their clients. The coach’s screen is identical either way, so gyms do not multiply the work. One thing to settle early because it turns ugly later: when a coach leaves a gym, does the client’s read go with the coach or stay with the gym?',
    ],
    order: 3,
    steps: [
      {
        id: 'product-tier-gating',
        title: 'Product tier gating',
        description: 'Interpret versus Coach. Hide everything that is Kade’s and not theirs.',
        status: 'planned',
        effort: 'M',
        surfaces: ['src/config/tenant.ts', 'src/app/dashboard/nav.tsx'],
        notes: 'The two tiers exist in the Practitioner Platform docs and NOWHERE in the code. tenant.ts:89 has tier: launch | studio, which is commercial, not product. Verified 9 Sep.',
      },
      {
        id: 'coach-screen',
        title: 'The coach’s screen',
        description: 'Clients, intake, read, weekly check-in, re-read. Nothing else.',
        status: 'planned',
        effort: 'L',
        blockedBy: 'product-tier-gating',
      },
      {
        id: 'first-outside-coach',
        title: 'One real coach, with real clients',
        description: 'The gate. Nothing past this moves until a coach who is not Kade has run the read.',
        status: 'blocked',
        effort: 'M',
        notes: 'BLOCKED ON A NAME, and it is the only thing blocking the whole board. Candidates: Dylan Shields (strength coach, applied 23 Jul, self-scored building, never contacted) or one of the personal trainers Kade stands beside at AF Newstead several times a week. Every previous attempt failed the same way — the Collective was 86% built and got one enquiry in six weeks, because the building happened before anyone had been asked. What is measured is whether the read LANDS, not whether anyone lost weight.',
      },
    ],
  },
]

/* Door 1 and the legal clock — both deliberately after the platform phases. */
const LATER_PHASES: Phase[] = [
  {
    id: 8,
    title: 'Door 1 — other people’s software',
    description: 'A coaching platform embeds the read in the product they already sell.',
    longDescription: [
      'The second front door and the destination, but explicitly NOT the first move. Building it before a real coach is using the product is exactly how the Collective went: 86% built, one enquiry in six weeks.',
      'Nothing for this exists today. All 296 routes into the app sit behind Kade’s own login: no external auth, no keys, no rate limiting, no versioning, no sandbox, no integration docs. And the work is not "build an API" — it is building something another company’s engineer can integrate against with Kade not in the room.',
      'The legal architecture, unusually, is already drafted. The Partner IP Sublicence Deed clause 3.2 already says Layer 1 stays wholly Body Recode and is reached only through a tenant-scoped connection, fed into and never built into the licensee’s copy. That was written in July without being called this.',
    ],
    order: 8,
    steps: [
      {
        id: 'external-access',
        title: 'External access for another company',
        description: 'Keys, versioning, an error model, documentation and a sandbox.',
        status: 'planned',
        effort: 'L',
        blockedBy: 'first-outside-coach',
      },
      {
        id: 'ongoing-data-source',
        title: 'Where the ongoing information comes from',
        description: 'BR will not own the weekly check-in in this door.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'first-outside-coach',
        notes: 'Three options: the host app sends what they already collect, BR supplies a short re-check they embed, or it comes off a watch. This is why the wearable question and the re-read question are the same question — a device is the only ongoing input that needs nobody to remember anything.',
      },
      {
        id: 'presentation-split',
        title: 'How much of the read they draw themselves',
        description: 'Fields for their UI, plus one canonical read that Body Recode serves.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'first-outside-coach',
        notes: 'The read includes the sections saying what it does NOT mean, and those are the safety layer. Left to a stranger’s designer they get dropped, and the read quietly becomes a prescription with BR’s name on it. A contract clause cannot police this. Recommendation is the hybrid Stripe and Plaid both landed on.',
      },
    ],
  },
  {
    id: 9,
    title: 'The company and the name',
    description: 'Not development work. Long lead time, blocked by nothing, open since 29 Aug.',
    longDescription: [
      'This sits on the board because it gates every platform and investor conversation and gets worse the longer it waits. Registering a name takes months whenever you begin.',
      'Body Recode is currently Kade personally, ABN 90 535 525 708, with no Pty Ltd, trade marks not started, the engine IP held personally and the head licence undrafted. No software company signs a health data arrangement with a sole trader, and no investor funds a name that is not protected.',
      'Oliver already holds the pack and a "Question 0" about incorporation timing. This is a call and a decision, not a build.',
    ],
    order: 9,
    steps: [
      {
        id: 'oliver-question-zero',
        title: 'Answer Oliver’s Question 0',
        description: 'Incorporate now, or later.',
        status: 'planned',
        effort: 'S',
        notes: 'Sitting in DECISIONS_NEEDED.md in the legal pack. Open since 29 Aug 2026.',
      },
      { id: 'incorporate', title: 'Set the company up', description: 'A Pty Ltd to carry the operating obligations.', status: 'planned', effort: 'M', blockedBy: 'oliver-question-zero' },
      {
        id: 'trade-marks',
        title: 'File the Body Recode name, then the logo',
        description: 'Word mark first. Classes 9, 42, 41, and consider 44.',
        status: 'planned',
        effort: 'M',
        notes: 'NOT STARTED. Run a clearance search before filing. Marks and goodwill clauses in the legal pack currently work on an unregistered basis only.',
      },
      { id: 'head-licence', title: 'Head licence, Kade to the company', description: 'Keeps the IP his personally while the company uses it.', status: 'planned', effort: 'M', blockedBy: 'incorporate' },
      { id: 'health-data-position', title: 'Position on handling health data', description: 'Required before any platform’s security review.', status: 'planned', effort: 'M' },
    ],
  },
]

/**
 * The board, in the order it should be worked. Phase ids and order are assigned
 * by POSITION so inserting a phase never means renumbering by hand.
 *
 * Reads: decide, then the read stands alone, the loop, door 2 (the new
 * go-to-market work) — then the platform phases that make a second coach
 * possible — then door 1 and the legal clock.
 */
export const PHASES: Phase[] = [
  PLATFORM_PHASES[0],
  ...READ_PHASES,
  ...PLATFORM_PHASES.slice(1),
  ...LATER_PHASES,
].map((p, i) => ({ ...p, id: i, order: i }))

/* ===========================================================
 * No-argument helpers, bound to THIS board (Body Recode).
 * Kept so Today + the help guide import exactly what they always did.
 * The implementations live in buildout-types.ts.
 * =========================================================== */

export function allSteps(): Step[] {
  return allStepsIn(PHASES)
}

export function stepsByStatus(status: StepStatus): Step[] {
  return stepsByStatusIn(PHASES, status)
}

export function nextUpStep(): { phase: Phase; step: Step } | null {
  return nextUpStepIn(PHASES)
}

export function phaseGateReview(): Phase | null {
  return phaseGateReviewIn(PHASES)
}
