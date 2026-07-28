# Founding Partner — Actual Process Map
**First contact → live & running. The real operational process, not the marketing version.**
Prepared 2026-06-30. Owner: Kade.

This is what *actually* happens when a new founding-partner coach comes on. The website's "How it works" (Apply → Onboard → Build → Launch → Run) is the 5-step shop window. This is the machine behind it, with the manual/hand-gloved reality flagged honestly.

**Key:** `[K]` Kade · `[P]` Partner · `[S]` System/automation. **NOW** = how it runs for the first partners today. **NEXT** = how it productises once multi-tenancy + contracts are live.

**Two hard truths that shape every stage:**
1. **Doctrine A.** Onboarding does NOT extract their method into the engine. They run BR's doctrine, branded. Onboarding = modality + brand + scorecard + training. (Method-injection = doctrine B, later.)
2. **Multi-tenancy isn't fully built.** `owner_coach_id` + RLS on every client-scoped table is the gate to scaling. The first one or two partners are **hand-gloved** (separate deploy or hand-scoped). Melisa is **pilot zero** — run her to harden this map before pricing the other nine.

---

## Stage 0 — Attract (how they find us)
**Goal:** the right practitioners land on the offer.
- `[K]` Kade's network, gym floor (Melisa), referrals, the Collective site, and later the "Powered by Body Recode" attribution on live partner sites.
- Entry point: the **Apply** CTA on the Collective site → currently a pre-filled email to kade@bodyrecode.au.
- **NOW:** mailto. **NEXT:** a proper `/apply` form (Tally/Typeform or native) that captures the application fields below and creates a lead record.
- **Exit when:** an application lands.

## Stage 1 — Enquiry / Application
**Goal:** capture enough to qualify before spending a call.
- `[P]` submits: name, modality, audience size + type, current tools/site, why now, what they coach.
- `[S]/[K]` auto-response acknowledges + books a discovery call.
- **Assets:** `04_CLIENT_LIFECYCLE/01_enquiry/` (enquiry-form, auto-response-email).
- **Exit when:** application reviewed, call booked or politely declined.

## Stage 2 — Discovery / Qualify call (30 min)
**Goal:** confirm fit. Protect the cap — only ten seats.
- `[K]` runs the call against the site's "for you / not for you" test.
- **Must be true:** a real method, an audience that trusts them, a **supported modality** (strength or yoga today), ready to own not rent.
- **Red flags:** no method (wants us to invent one), price-shopping, wants to dictate every pixel, unsupported modality with no appetite to wait.
- **Modality gate:** if they're Pilates/other, either waitlist them until the pack exists, or scope building that modality first (a bigger commitment).
- **Assets:** `04_CLIENT_LIFECYCLE/02_discovery_call/`.
- **Exit when:** decision — yes / waitlist / no. If yes, move to offer.

## Stage 3 — Offer / Agreement
**Goal:** signed, with the model clear.
- `[K]` presents the tier — **Launch** (configure existing platform) or **Studio** (full build) — and **founding pricing** (setup ~half, locked sub).
- Model stated plainly: **setup + monthly subscription + per active client.** Powered by Body Recode. They run the engine, branded; they approve everything.
- `[P]` signs. **NOW:** one-page founding-partner agreement (pilot-grade). **NEXT:** full IP licence + per-seat contract (currently NOT live — flagged in offer doc §7 guardrails).
- `[P]` pays setup deposit.
- **Assets:** `04_CLIENT_LIFECYCLE/03_quoting/`, `05_LEGAL/`.
- **Exit when:** agreement signed + deposit cleared.

## Stage 4 — Onboard / Scope (the "Onboard you" step)
**Goal:** gather everything needed to stand up their instance. NOT method extraction.
- `[K]+[P]` kickoff working session covering:
  - **Modality confirmation** — strength or yoga; which pack runs their brain.
  - **Branding intake** — name, colours, logo, domain, voice/tone.
  - **Scorecard setup** — BR's scorecard logic, branded; any partner-specific copy.
  - **Audience + first-clients plan** — who their launch cohort is.
  - **Their coaching guidance defaults** — light capture (Stage 00 *lite*) only to set guidance-field defaults, NOT to rebuild the engine.
- `[K]` access + accounts setup: domains, Stripe, Resend/email deliverability, 1Password vault.
- **Assets:** `04_CLIENT_LIFECYCLE/04_onboarding/` + `00_ip_extraction/` (now *light* under doctrine A).
- **Exit when:** brand assets, domain, modality, scorecard copy, and accounts are all in hand.

## Stage 5 — Build / Stand up the instance
**Goal:** a live, branded, working platform on their domain.
- `[K]/[S]` provisions the instance.
  - **NOW (hand-gloved):** separate deploy or hand-scoped tenant, because multi-tenant RLS isn't finished. Manual and careful.
  - **NEXT:** `owner_coach_id` provisioning — one click spins a scoped tenant.
- `[K]` applies branding (white-label app + marketing site), configures the **modality pack**, stands up the **branded scorecard funnel**, wires **payments** (Stripe), **email** (Resend + domain), and the **client portal**.
- `[K]` migrates any existing site/clients across.
- **Assets:** `04_CLIENT_LIFECYCLE/05_build/` + `08_BUILD_PATTERNS/` (scaffold, auth, scorecard-funnel, stripe, email patterns).
- **Exit when:** the platform passes the definition-of-done — scorecard fires a report, a client can be created, a plan can be generated and approved, payments work.

## Stage 6 — Train / Load-in
**Goal:** the partner can run their platform unaided.
- `[K]` trains `[P]` on the ops: generating readings, **approving/vetoing** plans (coach-gating), logging sessions, the dashboard, the modality flow.
- `[P]` loads in first clients (existing roster or launch cohort).
- `[K]` hands over the credentials + how-to doc.
- **Assets:** `04_CLIENT_LIFECYCLE/06_launch/handover-doc-template`, training materials.
- **Exit when:** partner has run the full loop once on a real client, with confidence.

## Stage 7 — Launch
**Goal:** the front door opens to their audience.
- `[P]` shares the **scorecard** with their room; `[S]` segments and routes every lead.
- First clients convert and onboard.
- `[K]` on standby for launch-day issues.
- **Assets:** `04_CLIENT_LIFECYCLE/06_launch/launch-checklist`.
- **Exit when:** scorecard is live and the first real lead/client has flowed through.

## Stage 8 — Run / Support / Grow
**Goal:** they run a business; we keep it healthy and expand the relationship.
- `[S]/[K]` hosting, maintenance, support; every upgrade we ship is inherited automatically.
- `[S]` billing: **subscription** monthly + **per active client** as the roster grows.
- `[K]` account-health monitoring (last contact, payment, usage, stagnation).
- **The upsell, post-activation:** once they're live and the scorecard is filling the pipeline → offer the **funnel add-on** (Conversion Funnel = BR Funnel A; Challenge Funnel = BR Funnel B), re-skinned to their brand. DWY or DFY. See offer doc §4b + [[project_sot_funnel_addon_upsell]].
- **Assets:** `04_CLIENT_LIFECYCLE/07_run/` (ongoing-service, renewal, account-health, support-sla).
- **Exit when:** never — this is the recurring relationship. Renewal at the annual mark.

---

## The honest current-state summary
| Gate | State | Blocks |
|---|---|---|
| Multi-tenancy (`owner_coach_id` + RLS) | **Not built** | Scaling past 1–2 hand-gloved partners |
| IP licence + per-seat contract | **Not live** | Full-price selling (pilot runs on a one-pager) |
| Modality packs | strength + yoga **live**; Pilates next | Onboarding non-strength/yoga coaches |
| `/apply` form | **mailto stopgap** | Clean lead capture |
| Scorecard per-partner config | branded BR logic | (works; refine copy per partner) |

**Sequence to de-risk:** Melisa (pilot zero, contra/friendly, hand-gloved) → harden this map → build multi-tenancy + the real contract → then price and onboard the other nine off a repeatable version of this exact process.
