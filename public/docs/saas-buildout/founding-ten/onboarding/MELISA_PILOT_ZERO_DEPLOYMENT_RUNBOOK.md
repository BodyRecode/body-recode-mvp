# Melisa · Pilot Zero Deployment Runbook

**Status:** LIVE runbook · Substantially updated 2026-07-05 with everything shipped through Wk 27.
**Owner:** Kade.
**Sequencing:** Execute post-launch (Wk 2+ after Mon 13 Jul 2026 BR launch stabilises).

Pilot zero = the first hand-gloved Collective partner deployment. Purpose: prove the deployment shape end-to-end so the runbook can be tightened before onboarding partners #2-#10.

Per [POWERED_PLATFORM_BUILD_PLAN.md](../POWERED_PLATFORM_BUILD_PLAN.md) §4 Phase 1: Melisa was originally scoped to run on a hand-gloved deployment with targeted branding override, before the full de-hardcode. **As of 2026-07-05 that is no longer necessary.** De-hardcode is done, tenant_config is DB-backed with a full editor UI, custom-domain routing is shipped, per-tenant Stripe Connect + Twilio Subaccounts + Mode A+ doctrine tuning all live. Her deployment is now Shape B (single production deployment, multi-tenant), not Shape A (separate deploy).

Two hard truths ([PARTNER_JOURNEY.md](PARTNER_JOURNEY.md)):
1. **Doctrine A + Mode A+ overlay** — she runs BR's doctrine branded as hers, with a partner-tuning overlay (voiceTone, bannedPhrases, terminologySubstitutions, coaching guidance). NOT full method-injection (Mode B).
2. **Multi-tenancy IS now product-ised** — most of the manual work from the original v0 runbook is now handled by the tenant seed SQL + the [Phase 2 Deployment Checklist](PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.md). This runbook is now a companion, not the whole story.

Pre-built starting point: **[../../../01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/sql/2026-07-05_melisa_seed.sql](../../../01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/sql/2026-07-05_melisa_seed.sql)** ships with Founding Ten Launch tier defaults, Yoga modality, and doctrine parameters pre-tuned for a warm/grounded/breath-forward voice. Fill placeholders + run to provision.

---

## 0 · Prerequisites (must be done before starting)

Confirm all before touching code:

- [ ] **Founding Partner Agreement + IP Licence Deed v1.0 signed** — drafts at `../legal/` (v0.1). Awaiting Ange review. Both must be signed together.
- [ ] **Setup fee cleared** — $2,500 Launch tier (Founding Ten locked rate) invoiced + paid via Kade's Stripe
- [ ] Modality confirmed: Yoga (modality 2 — on `feature/yoga-modality` branch; merge to main before Melisa provisioning)
- [ ] Brand pack in hand (name, colours, logo variants light + dark, tagline, voice sample)
- [ ] Domain acquired + DNS access confirmed (her domain)
- [ ] **Melisa's own Stripe account** created — for her clients paying HER via Stripe Connect. Separate from Kade's Stripe.
- [ ] **Kade's Stripe Customer + Subscription for Melisa's platform sub** — for Kade's own billing of Melisa per Agreement §6 ($400/mo Launch tier locked for life). Stripe Customer id + Subscription id captured for licence.partnerBilling.
- [ ] Email domain configured (Resend inbound + DKIM/SPF)
- [ ] 1Password vault created for her credentials
- [ ] BR launch has stabilised (Wk 2+ post 13 Jul launch, no critical incidents)
- [ ] Yoga modality branch merged to main (currently `feature/yoga-modality` per git log)

---

## 1 · Two deployment shapes — pick ONE

Kade's call which shape based on Melisa's scale + urgency.

### Shape A · Separate Vercel project (SIMPLER)
- Fork/branch the `body-recode-mvp` repo → `melisa-platform` (or her chosen slug)
- Separate Vercel project + separate Supabase project (fresh DB)
- Zero risk of cross-contamination with BR data
- Downside: divergent codebase — bug fixes have to be manually forwarded

### Shape B · Shared codebase + tenant-scoped deploy (CLOSER TO PHASE 2)
- Same repo, same Vercel project
- Same Supabase (data isolation via existing coach_id + RLS)
- Middleware routes her subdomain → her tenant context
- No config table yet (that's Phase 2) — her overrides live in an env var or hardcoded fallback file
- Downside: still have to build the middleware resolver (M effort per plan)

**Recommendation for pilot zero: Shape A.** Simplest, zero risk to BR launch stability, lets us learn what to build for Phase 2 without engineering the full multi-tenant path first.

---

## 2 · Provisioning steps (Shape A · separate deploy)

Ordered checklist. Each step is small — do NOT batch. Confirm each before moving to next.

### 2.1 · Fresh Supabase project
- [ ] Create new project in Supabase org (or same org — pick based on billing preference)
- [ ] Run every SQL migration in `~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/sql/` in date order
- [ ] Verify auth.users table exists + RLS is enabled
- [ ] Create Melisa's coach user account manually via Supabase Auth (email + magic link)
- [ ] Note her coach_id UUID (needed for tenant_config seed if Phase 2 is wired)

### 2.2 · Fresh Vercel project
- [ ] Fork `body-recode-mvp` → `melisa-platform` (or her repo name)
- [ ] Switch to yoga modality branch state (merge `feature/yoga-modality` if not yet in main)
- [ ] Create new Vercel project pointing at new repo
- [ ] Connect her custom domain via Vercel (DNS setup per Vercel docs)

### 2.3 · Env vars (Melisa's Vercel project)
Set the following env vars (all differ from BR's):
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — her Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — her Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — her Supabase service role key
- [ ] `RESEND_API_KEY` — her Resend key (from her domain)
- [ ] `STRIPE_SECRET_KEY` — her Stripe key
- [ ] `STRIPE_WEBHOOK_SECRET` — her Stripe webhook secret
- [ ] `NEXT_PUBLIC_APP_URL` — her domain
- [ ] Any BR-specific env vars: set to sensible defaults or leave unset

### 2.4 · Targeted branding override (Phase 1 approach)
Update `src/config/tenant.ts` in HER repo (not BR's) with her values:
- [ ] `brand.name` → her business name
- [ ] `brand.nameWithMark` → her business name (with ™ if trademarked)
- [ ] `brand.tagline` → her tagline
- [ ] `brand.logoUrlLight` → path to her logo (upload to /public/)
- [ ] `brand.logoUrlDark` → dark version of her logo
- [ ] `brand.apexDomain` → her domain
- [ ] `brand.marketingDomain` → https://her-domain
- [ ] `brand.performanceDomain` → same or scorecard subdomain
- [ ] `brand.appDomain` → app.her-domain or same
- [ ] `brand.supportEmail` → info@her-domain
- [ ] `brand.replyToEmail` → her@replies.her-domain (Resend inbound)
- [ ] `brand.fromEmail` → her@send.her-domain (Resend outbound)
- [ ] `brand.accentColor` → her accent hex
- [ ] `coach.*` → all fields with her name, email, photo URL, credentials, IG handles
- [ ] `products.*` → her pricing + product names (or keep BR names under licence per her preference)
- [ ] `licence.tenantId` → her-slug
- [ ] `licence.poweredBy` → true (if agreed) or false (if pure white-label)
- [ ] `modality.id` → `'yoga'`
- [ ] `modality.label` → `'Yoga'`
- [ ] `modality.doctrineMode` → `'A'`

### 2.5 · High-visibility surfaces — targeted overrides (per BUILD_PLAN §4 Phase 1)
Where `src/config/tenant.ts` values aren't consumed yet, do a manual find+replace pass on the highest-visibility user-facing surfaces first:
- [ ] From-email address in all Resend calls (grep `kade@send.bodyrecode.au`)
- [ ] Logo URL in portal header (`src/app/portal/[token]/page.tsx`)
- [ ] Logo URL in scorecard result page
- [ ] Layout metadata: title + description + og:image (`src/app/layout.tsx`)
- [ ] Homepage brand text (`src/app/page.tsx`)
- [ ] Any hardcoded `Body Recode` text visible to end users on public pages

Do NOT try to override every hardcoded string this pass — only what the client and her leads will actually see. The full de-hardcode is Phase 2's L-effort work.

### 2.6 · Email deliverability
- [ ] DNS records set for her domain: SPF, DKIM, DMARC (Resend guide)
- [ ] Test send from her from-email to a fresh inbox (Gmail + Outlook)
- [ ] Verify NOT junking

### 2.7 · Stripe wiring
- [ ] Create her Stripe products matching her offer structure
- [ ] Configure webhook URL: her-domain/api/stripe/webhook
- [ ] Test a $1 charge on a test card → verify reaches her Stripe + fires webhook

### 2.8 · Content seeding
- [ ] Import her brand voice samples into content templates
- [ ] Seed her scorecard funnel (based on BR's — her copy where different)
- [ ] Configure her modality pack settings (yoga doctrine params)
- [ ] Any partner-specific coach guidance defaults on training_plans

---

## 3 · Definition of done (test end-to-end before handoff)

Confirm every one of these works on her live domain:

- [ ] Homepage loads with HER branding (no "Body Recode" visible above the fold)
- [ ] Scorecard funnel: entry → quiz → submit → email report firing correctly
- [ ] Report email: from HER from-address, with HER logo, HER voice
- [ ] Client can sign up via portal → gets welcome email from HER
- [ ] Foundational intake works + generates CFFS + Foundational Reading
- [ ] Coach can approve/publish → client sees in portal
- [ ] Weekly check-in flow works
- [ ] Yoga session logging works (modality 2 features)
- [ ] Payments: test client purchases her Blueprint (or equivalent) → cleared in her Stripe
- [ ] Melisa can log in as coach → sees only her clients (not BR's)
- [ ] Kade (as service_role) still has admin access if needed for support

---

## 4 · Training + handover (Stage 6 in PARTNER_JOURNEY)

Once definition-of-done passes:
- [ ] 1-hour training session: Kade walks Melisa through the dashboard, generate/approve loop, session logging
- [ ] Handoff doc: credentials, how-to-approve-plans, how-to-log-sessions, how-to-add-clients, escalation contacts
- [ ] Load in her first 3-5 clients as a real test
- [ ] Melisa runs 1 full week solo, Kade on standby for launch-day issues

---

## 5 · Rollback plan (if pilot goes sideways)

If Melisa's deployment has critical issues that can't be resolved same-day:
- [ ] Point her domain back to a "coming soon" holding page
- [ ] Refund any client charges made through her platform during the incident
- [ ] Document the failure mode + root cause
- [ ] Rebuild plan with lessons applied

Zero data loss risk since her Supabase is separate from BR's.

---

## 6 · What we're LEARNING from pilot zero

The pilot's real deliverable is a **tightened runbook for partners #2-#10.** Track these observations during the pilot:

- Which manual override steps were most painful? (These are top priorities for Phase 2 automation)
- Which files did we miss on the branding override pass? (Add to the "definitive override list")
- How long did the whole deployment take? (Baseline for pricing + capacity planning)
- What questions did Melisa ask that suggest missing training material?
- What did SHE find confusing about the platform? (UX debt vs BR-native intuition)
- Which BR-specific hardcodes leaked past the override pass? (Feed into de-hardcode Wave 2)

After Melisa is live + stable for 30 days, use these findings to:
1. Update this runbook to v2
2. Prioritise the Phase 2 backlog based on real pain
3. Decide GO/NO-GO for partners #2-#10 onboarding

---

## Related

- [POWERED_PLATFORM_BUILD_PLAN.md](../POWERED_PLATFORM_BUILD_PLAN.md) — the full 4-phase plan this pilot is Phase 1 of
- [PARTNER_JOURNEY.md](PARTNER_JOURNEY.md) — 8-stage partner onboarding process
- [OFFER_ARCHITECTURE.md](../OFFER_ARCHITECTURE.md) — pricing + agreement structure
- [YOGA_DOCTRINE_v1.md](../modalities/YOGA_DOCTRINE_v1.md) — Melisa's modality pack
- `src/config/tenant.ts` (body-recode-mvp repo) — the tenant config scaffold this runbook overrides
- `sql/2026-07-01_tenant_config_schema.sql` (06_SAAS_PLATFORM_BUILD/sql/) — Phase 2 DB migration (post-pilot execution)
