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
        status: 'shipped',
        shippedAt: '2026-09-09',
        effort: 'M',
        surfaces: ['src/lib/cffs-read.ts', 'src/app/api/generate-cffs/route.ts'],
        notes: 'SHIPPED 9 Sep 2026. runRead() in src/lib/cffs-read.ts takes structured answers and returns a CFFS: no database, no login, no client id, and no knowledge that a coaching application exists. generate-cffs is now a thin wrapper that gathers the data and calls it — 447 lines down to 310, and it no longer imports Anthropic, the model id, the prompts or the JSON extractor. Only `intake` is required; everything else sharpens the read and its absence is handled by the prompt rules rather than by refusing to run. PROVEN by running it on a person invented in a script with no database row, no client id and no login: full 21-field read in 130s, correctly typed Stress-Stored / Remediation / regulation Red off a high-stress, poor-sleep, late-eating profile. Nothing changed for Kade or his clients.',
      },
      {
        id: 'read-no-clear-pattern',
        title: 'The read can say no single pattern fits',
        description: 'Indeterminate, as the locked Fat Map definitions allow, instead of forcing one of the four at low confidence.',
        status: 'shipped',
        shippedAt: '2026-09-14',
        effort: 'M',
        surfaces: ['src/lib/pattern-doctrine.ts', 'src/lib/cffs-prompt.ts', 'src/lib/cffs-read.ts', 'src/app/api/generate-cffs/route.ts', 'sql/2026-09-14_pattern_indeterminate.sql'],
        notes: 'SHIPPED 14 Sep 2026. Four conditions, from LOCKED v2.2: nothing points cleanly; a Ready (Post-Optimisation) body by design; the only supported pattern is ruled out by the sex gate or unconfirmable because sex at birth is unresolved; the deciding questions unanswered. Explicitly not a hedge: a pattern that leads even weakly is named at low. The competing read becomes the lean. Database rules widened (run and verified), unrecognised pattern values now retried instead of failing the save, the new read is saved BEFORE the old one is archived (a failed save used to leave a client with no active read), the client record takes Indeterminate from the read, coach screens show "No clear pattern yet" and "Leaning toward", and the recovery and supplement prompts are told not to tailor. PROVEN with six real reads: scattered signals, sex unresolved with only Estrogen-Shift signals, and unanswered sections all returned Indeterminate; a clear Estrogen-Shift woman and a stress-heavy intake still named their patterns; a man with Estrogen-Shift-looking answers returned Indeterminate with no ruled-out competing read. Plus one full save end to end on a temporary client. BEFORE: Fat Map LOCKED v2.2 has an Indeterminate result: nothing points cleanly at one of the four, and by design for a Ready body. The funnel typing engine has always returned it; the read never could, and the database refused anything but the four, so an honest "nothing fits" was forced into a label. Matters more under Rey: a read from 30 to 40 questions will fit a clear pattern less often. Needs the database rules, the read rules (including the hormonal mismatch rule, which currently forces a low-confidence pattern), the client record, the coach screens and the two suggestion prompts that print the pattern.',
      },
      {
        id: 'minimum-question-set',
        title: 'The smallest set of questions that still gives a good read',
        description: 'Decide which of the 230 carry the read, which are enrichment, and what it may say on partial input.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'read-takes-answers-directly',
        notes: 'The intake is 234 questions across 11 sections as of 13 Sep 2026 — and this note previously said 230 while telling the reader never to quote the number, which is the whole point of the rule: call getTotalQuestions(). The ONLY missing-data handling anywhere is one line about absent photos. No other company will put their clients through 234 questions, so this is the gate on both front doors. Design to the tightest constraint (an embedded host with ~20 fields) and the coach and consumer paths come free.',
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
        description: 'A coach who writes no fixed-length blocks got a re-read NEVER, silently.',
        status: 'shipped',
        shippedAt: '2026-09-09',
        effort: 'S',
        surfaces: ['src/lib/progress-check-dispatch.ts', 'src/lib/progress-check-readiness.ts'],
        notes: 'SHIPPED 9 Sep, together with the time trigger — they were the same piece of work, because the hole existed BECAUSE there was no time gate. ⚠ CORRECTION to the original note: the failure was the opposite of what was written here. dispatchProgressCheckIfDue() returned early with "no dated active block" BEFORE ever reaching the readiness gate, so a coach without blocks got a Progress Check NEVER — silently, with nothing in any log. (The manual invitation route did skip the block gate as described, but a human is deciding there.) A silent never is worse than a noisy always. Idempotency was keyed on program_id, which does not exist without a block, so it falls back to "none raised in the last 60 days".',
      },
      {
        id: 'reread-time-trigger',
        title: 'Time-based re-read trigger',
        description: '12 weeks since the last read, plus the weekly check-in gate.',
        status: 'shipped',
        shippedAt: '2026-09-09',
        effort: 'M',
        surfaces: ['src/lib/progress-check-readiness.ts', 'src/lib/progress-check-dispatch.ts'],
        notes: 'There is NO time gate in the code at all today — the "12-week/84-day backstop" in the design notes was never built (verified 9 Sep, grep for 84 returns nothing). Keep the check-in gate: it is the weekly signal, not a coaching concept, and it exists so the big ask never arrives before the weekly one and displaces it. Drift may pull the re-read earlier since drift is computed from BR’s own signal; 12 weeks is the ceiling, not the schedule.',
      },
      {
        id: 'progress-check-any-answers',
        title: 'The Progress Check compares whatever answers exist',
        description: 'One comparison engine behind both the coaching form (231 questions) and Rey\'s short re-ask (only what can change).',
        status: 'shipped',
        shippedAt: '2026-09-14',
        effort: 'L',
        surfaces: ['src/lib/answer-comparison.ts', 'src/lib/answer-direction.ts', 'scripts/test-answer-comparison.ts'],
        notes: 'SHIPPED 14 Sep 2026 as the engine only: no form, no storage, not yet read by the Progress Read generator. Deterministic, not an AI call: it decides what the read is PERMITTED to call a change. Sections are the clusters; a cluster moved only when enough comparable items moved the same way, outnumbering the other direction 2 to 1, with a mean shift of 0.4 or more. First answers are never movement, disputes use her correction as the baseline and keep the original, too few re-asked items reads as "not enough overlap" rather than held, items moving 2+ points are always surfaced and flagged WATCH in injury. Needed a direction for every one of the 204 scale questions, because each section mixes good and bad statements on the same scale (drafted from wording, list for Kade to check: 02_FEATURE_SPECS/2026-09-14_Progress_Check_APPENDIX_answer_directions.md; the question audit fails on a missing one). PROVEN: 24 checks including simulated scale drift (one point on 25% of items called a change in 0.09% of sections, 40% drift 0.61%, extreme answers regressing to the mean 0.22%) and real shifts (half a section better by one point caught 84%, six in ten 96%, a third better by two 83%). On the one real client with two intakes two months apart: sleep and stress clearly moved toward capacity, the rest held or mixed, and four injury items jumping 0 to 2 are what forced the large-move surfacing. BEFORE: Added 14 Sep 2026 when the coaching Progress Check spec (231 of 245 intake questions re-asked, answered blind then revealed, disputes kept as their own record, 15 to 20 minutes) met the Rey spec (a ~10 minute re-ask of only what can change, the rest from 12 weeks of real data). Hard-wiring 231 would serve one and not the other. The comparison must work on any overlap between the last answers and the new ones, treat a question with no previous answer as a first answer rather than movement, and read change at the cluster level, not the item. Specs: 02_FEATURE_SPECS/2026-09-13_Progress_Check_Spec.md and the Rey spec section 14.',
      },
      {
        id: 'progress-check-coaching-form',
        title: 'The coaching Progress Check form, near-full and answered blind',
        description: '231 questions, previous answer revealed only after she commits, disputes kept as their own record, save and resume.',
        status: 'shipped',
        shippedAt: '2026-09-14',
        effort: 'L',
        surfaces: ['src/lib/progress-check-v2.ts', 'src/app/progress-check/[token]/progress-check-v2-form.tsx', 'src/app/api/progress-check/save/route.ts', 'src/app/api/submit-progress-check/route.ts', 'src/lib/trajectory-generator.ts', 'sql/2026-09-14_progress_check_v2.sql'],
        notes: 'SHIPPED 14 Sep 2026. What has changed first, then the 231 re-asked questions in intake order (same inputs as the intake, shared component), measurements and photos last, then confirmation. Each old answer hidden until she answers (free text: until she leaves the box), then shown beside the new one; "we didn\'t ask you this last time" for first answers; energy and drive asked "compared with your last read" with nothing to compare. "That old answer wasn\'t right" saves a correction as its own record (progress_check_disputes) and never touches the intake. Saves to the server as she goes and reopens where she stopped. Submit refuses unanswered questions server-side, freezes what she was compared against, runs the two hormonal alerts, and emails the coach what changed, which sections moved, disputes, injury items to watch and a medications difference. Medications are NOT overwritten (tested: the first version did, and "same as before" would have wiped a real list). The Progress Read reads the computed comparison for these checks and the old answers for older ones. Old checks keep the 24-question form (form_version v1). PROVEN in a headless browser at phone width on a temporary client (reveal, dispute, save, reopen, validation, submit gating) and in-process for the submit (12 checks including the intake answer untouched and the email caught). NOT DONE: a Progress Read actually generated from a near-full check, because that needs a real block of weekly syntheses. BEFORE: The coaching front end for the comparison engine, per 02_FEATURE_SPECS/2026-09-13_Progress_Check_Spec.md. Replaces the 24-question form. Must store her answers and her disputes (a dispute never overwrites the old answer), show "we did not ask you this last time" for first answers, carry the two hormonal safety alerts, and ask the four energy/drive questions as "compared with your last read". Rey\'s short re-ask is a separate front end on the same engine.',
      },
      {
        id: 'reread-generator',
        title: 'The re-read generator',
        description: 'Existing read plus new answers, measurements, photos and weekly signal, in; updated read out.',
        status: 'shipped',
        shippedAt: '2026-09-14',
        surfaces: ['src/lib/progress-read.ts', 'src/lib/progress-read-generate.ts', 'src/app/api/generate-progress-read/route.ts', 'src/app/dashboard/clients/[id]/progress-read/page.tsx', 'sql/2026-09-14_progress_reads.sql'],
        effort: 'L',
        blockedBy: 'read-takes-answers-directly',
        notes: 'SHIPPED 14 Sep 2026 as a coach DRAFT (her portal view is progress-read-her-view). runProgressRead in src/lib/progress-read.ts is the Foundational Read run again on everything held now (intake with the Progress Check laid over it, new measurements and photos, weekly syntheses since, latest approved bloods) with the same system prompt and content checks, plus the previous read, the computed comparison, her own words and eight Progress Read rules. Re-derives state, pattern, readiness, constraints and flags. CODE enforces: state at most one step, the sex gate, a pattern change must name its evidence (at least two sources), no internal words in her sections, what_changed_coach present. Own table progress_reads (spec 5), never touches the Foundational Read. The retry machinery moved to src/lib/governed-generation.ts and the read schema to CFFS_OUTPUT_SCHEMA, both proven byte-identical for the Foundational Read. Output ceiling 40,000: on Samantha\'s real data a first attempt used all 24,000 and returned nothing; the stored run used 24,655. PROVEN on a temporary copy of Samantha\'s data end to end (9 checks, Foundational Read untouched) and page rendered at desktop and phone width. BEFORE: THE GAP, and the whole job. The Progress Check collects everything needed to update the read and then does not update it — it re-scores body state alongside the original read, and the interpretation written in week one stays as written. Doctrine currently forbids regenerating the CFFS off a Progress Check, which was right at the time but left nothing in its place. Smaller than it sounds, because the hard part (getting a real person to hand over fresh numbers and photos on a schedule) already works.',
      },
      {
        id: 'reread-outputs-changes',
        title: 'The re-read says what changed',
        description: 'Output the delta and what it means, not a fresh document.',
        status: 'shipped',
        shippedAt: '2026-09-14',
        surfaces: ['src/lib/progress-read.ts', 'src/lib/answer-comparison.ts'],
        effort: 'M',
        blockedBy: 'reread-generator',
        notes: 'SHIPPED 14 Sep 2026 with the generator: what_changed_coach for the coach and for_her.what_has_changed / what_has_held for her, drawn only from cluster verdicts, measurement change, photos, weeklies and bloods; held stated as a finding; no causation. BEFORE: More useful to a coach than a new read, and more defensible: it shows the system holding a view over time rather than starting again every quarter. This is also the thing that justifies a subscription — a one-off read is a one-off sale.',
      },
      {
        id: 'progress-read-her-view',
        title: 'She sees her Progress Read',
        description: 'Publish the shared sections to her portal beside the Foundational Read, notify her, and retire the old block-end re-score.',
        status: 'in_progress',
        effort: 'M',
        blockedBy: 'reread-generator',
        notes: 'PUBLISH, NOTIFY AND HER PAGE SHIPPED 14 Sep 2026: Publish (pre-publish check re-run), Notify (email, logged, stamped), her portal page from for_her only via herProgressReadView, her reads list (current read, Foundational Read becomes her first read) and her home card. Kade said yes to all four spec 7 calls: the four readiness ratings ARE in her view, as one plain sentence each with no colour words (checked in code); a changed pattern is the read learning; a heads-up before the check (SHIPPED same day: daily run, same clock as the check, once per cycle, 11 timing tests, dry run on live clients sent nothing and would reach Razia around 22 Sep); newest read becomes current (progress-read-becomes-current). Proven on a temporary copy: 9 checks (readiness lines, no colour words, no notify before publish, publish, email caught, logged, 8 sections, nothing coach-only reaches her, unpublish) and her page rendered at phone width. REMAINING: retire the tr_ re-score once no v1 checks are in use; her portal home readiness label still reads the old re-score. BEFORE: Spec 4, 5 and 6 steps 6 to 8. The draft already stores for_her, written to her, and the pre-publish check result. Needed: a publish action (coach gate stays), her portal page in the reads area rather than the Training page, the notify email (inventory, automations, help), and retiring the tr_ re-score on programs once v1 checks are gone. Open for Kade (spec 7): whether the four readiness ratings belong in her view (built as coach-visible, not yet in for_her), how a changed pattern is said to her (rule 7 default: the read learning, never the first read being wrong), and whether she gets a nudge before the check arrives.',
      },
      {
        id: 'progress-read-becomes-current',
        title: 'A published Progress Read becomes her current read',
        description: 'Programs, nutrition and the weekly synthesis anchor on the newest read, not the Foundational Read forever.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'progress-read-her-view',
        notes: 'Today everything downstream (weekly synthesis readiness anchor, program and nutrition generators, suggestions) still reads the live Foundational Read, so a Progress Read changes nothing a coach generates next. Spec 3 says v2 re-derives the read; for that to mean anything the newest published read must be what they read. A decision for Kade before building, because it changes what every generator is anchored to.',
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
        description: 'Interpret versus Coach versus owner. Hide everything that is Kade’s and not theirs.',
        status: 'shipped',
        shippedAt: '2026-09-09',
        effort: 'M',
        surfaces: ['src/lib/product-tier.ts', 'src/app/dashboard/layout.tsx', 'src/app/dashboard/nav.tsx', 'src/config/tenant.ts', 'src/lib/tenant-resolver.ts', 'src/middleware.ts'],
        notes: 'SHIPPED 9 Sep 2026, commit 723a2c2a. Three tiers: interpret (the read only), coach (adds Layer 2), owner (adds the business engine; Kade). ENFORCED IN THE DASHBOARD LAYOUT, not just hidden in the nav - every dashboard page renders through that layout so one check covers all of them including pages added later, and nav filtering is presentation only because someone can type a URL. FAILS CLOSED BOTH WAYS: an unclassified path resolves to owner, and a tenant row with no product_tier defaults to interpret, the LOWEST - getting that backwards would hand a new partner Kade’s ads, CRM and revenue on their first login, silently. New tenant_config.product_tier column, run against the live project. The test caught a real leak before it shipped: /dashboard/settings is interpret and the Kade-only admin pages (tenant registry, tenant health, partner billing, both buildout boards) live underneath it - the settings index hid them from the nav but the PAGES were reachable by URL. Pinned explicitly. Verified against 23 paths; Kade unaffected.',
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
        id: 'door2-support-surface',
        title: 'Support for a coach who is not Kade',
        description: 'A way to report that something is broken, and a way for it to reach someone.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'product-tier-gating',
        surfaces: ['src/components/support/support-launcher.tsx', 'src/app/dashboard/support/'],
        notes: 'The support launcher and ticket queue already exist for Kade. It carries over unchanged in principle — any product with users outside your own head needs one. ⚠ But it becomes a DATA-HANDLING SURFACE the moment the user is not the owner: a ticket about a client can carry that client\u2019s health information. So it has to appear in the data processing agreement, the privacy notice has to say support may see it, and any outside ticketing tool is a sub-processor that must be named.',
      },
      {
        id: 'door2-interpretation-copilot',
        title: 'A co-pilot for interpretation questions',
        description: 'Why did it say regulation red. What is driving this pattern. What would change its mind.',
        status: 'planned',
        effort: 'L',
        blockedBy: 'coach-screen',
        notes: 'NOT the existing Coach Co-Pilot, which drafts programs and nutrition plans — those are Layer 2 and a door 2 coach writes their own. This is a different tool wearing the same name: questions about the READ. Do not assume the Layer 2 co-pilot carries across; almost none of what it does is relevant here.',
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
  {
    id: 99,
    title: 'Evidence for door 1',
    description: 'What a platform actually buys. Instrument from the FIRST paying coach, not the twentieth.',
    longDescription: [
      'A platform does not buy a customer count. It buys proof you move the metric it gets paid on, which for a coaching platform is retention: their revenue is subscriptions and churn is the enemy. "Thirty coaches pay me $150 a month" proves some coaches will pay for it standalone. It does NOT prove that embedding it keeps their users subscribed longer, and only the second claim is worth money to them.',
      'So: FIFTEEN COACHES WITH OUTCOME DATA BEATS SIXTY WITHOUT IT. This phase exists because that is a design decision with a deadline. Capture it from the first paying coach or arrive at the platform conversation with a headcount and no argument.',
      'It is also the moat. The doctrine and the constraint layer are an argument, not a barrier — a platform with two engineers can build A read in six months. Proprietary longitudinal outcome data on real clients is what turns the argument into something that cannot be reproduced by writing code.',
      'THE HARD LINE THAT MAKES THIS WORK: sell the read, never the coaching application, to anyone outside Kade’s own practice. A component gets embedded. A competitor gets locked out. This retires the Tier 2 "sell coaches the full coaching app later" idea — it is in direct conflict with door 1, and door 1 is worth more.',
    ],
    order: 4,
    steps: [
      {
        id: 'evidence-did-the-read-land',
        title: 'Did the read land',
        description: 'A structured question to the coach after each read: did this tell you something you would have missed.',
        status: 'planned',
        effort: 'S',
        notes: 'The cheapest and most important of the set. It is the only evidence obtainable from coach ONE, before any client outcome exists, and it is what the first ten conversations are really testing. Free text plus a scale so it can be counted as well as quoted.',
      },
      {
        id: 'evidence-client-retention',
        title: 'Client retention per coach',
        description: 'How long a coach’s clients stay, tracked from the date the read was issued.',
        status: 'planned',
        effort: 'M',
        notes: 'THE metric a platform buys. Needs a start date per client and a definition of churn that does not depend on the coach remembering to mark someone inactive. Meaningless without a pre-read baseline, so capture how long that coach’s clients used to stay at onboarding, before the read is ever run.',
      },
      {
        id: 'evidence-adherence-delta',
        title: 'Adherence before and after',
        description: 'Check-in completion and logging rates, compared against the same clients before the read.',
        status: 'planned',
        effort: 'M',
        notes: 'Second-strongest evidence and already half-collected: the weekly loop records this. What is missing is the comparison and the baseline.',
      },
      {
        id: 'evidence-view',
        title: 'The evidence view',
        description: 'One page that assembles the above into something showable to a platform or an investor.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'evidence-client-retention',
        notes: 'Aggregates only, no client named. Its job is to answer "what happened to the people whose coaches used this" in one screen, computed rather than typed, the same rule as the launch board.',
      },
      {
        id: 'evidence-multi-coach',
        title: 'Owner account across several coaches',
        description: 'A studio owner who buys, adds and removes coaches, and sees across all their clients.',
        status: 'planned',
        effort: 'L',
        blockedBy: 'evidence-view',
        notes: 'A studio with six coaches is structurally a miniature platform: multiple practitioners, one owner account, one bill. Making that work IS the rehearsal for door 1, and three studios is better evidence than thirty solo coaches. Settle before selling one: when a coach leaves the studio, does the client’s read go with the coach or stay with the studio.',
      },
    ],
  },
]

/* Door 1 and the legal clock — both deliberately after the platform phases. */
const LATER_PHASES: Phase[] = [
  {
    id: 3,
    title: 'Better inputs — the where, and the why',
    description: 'Accept richer inputs from any source, never require any of them.',
    longDescription: [
      'THE RULE: the read works today on her answers alone and that never changes. Every measurement is enrichment. The moment a machine becomes necessary, a barrier has been put in front of BR\u2019s own front door. Same rule as wearables.',
      'What changes in the data: measurements stop being four fixed columns (weight, waist, hips, chest) and become a LIST, where each entry holds what was measured, the number, and WHERE IT CAME FROM. That last field is the whole trick — adding a new machine later is one more label, not a rebuild. Build it once, not once per vendor.',
      'Why it matters for typing: typeFatMapProfile() reads NO measurements today. It types on what she REPORTS about where fat sits, plus age, sex, cycle and section scores. The four numbers taken feed a sanity check whose main job is to tell the read NOT to trust them. So the most objective thing about where fat sits barely touches the typing.',
      'THE DOCTRINE IS A COMPETENCE MAP, NOT A RANKING. Each source is authoritative for some things and must stay silent on others. DEXA: android/gynoid ratio, visceral vs subcutaneous, regional lean, bone — the reference, but too costly and too infrequent for change. InBody/Evolt: segmental lean, fluid distribution (ECW/TBW), trend on the SAME machine — never absolute fat %, never across machines. 3D scan: shape and shape-change only, it cannot tell muscle from fat. Tape: gross circumference if plausible. Photo: last resort.',
      '⚠ MORE PRECISE DOES NOT MEAN MORE IMPORTANT. Every one of these says WHERE, none says WHY. Stress-Stored and Insulin-Drift both present centrally and no geometry separates them; the why comes from sleep, stress, cycle, medications and training response. A printout covered in decimal places is the strongest version of the anchoring temptation the doctrine exists to resist.',
      'TWO HALVES. The machines above all answer WHERE — where fat sits, how much muscle, what shape. None of them answers WHY. The second half of this phase is the WHY inputs: cycle phase, glucose, measured metabolic rate, grip strength, blood pressure and an apnoea screen. Several cost nothing and need no device. ⚠ DELIBERATELY REJECTED: genetic testing and gut microbiome panels — expensive, weak for anything BR concludes, and they would cost credibility with the exact clinicians reviewing the work.',
      'Market, researched 9 Sep 2026: DEXA reports android/gynoid ratio as standard (~0.8 healthy for women) — the exact axis the typing engine currently gets from self-report — plus visceral separated from subcutaneous, regional lean and bone density. Evolt 360 is in Anytime Fitness and every Fitness First (4 scans/yr included), 40+ metrics, registered medical device in AU. InBody gives segmental lean and the ECW/TBW fluid ratio (healthy 0.360-0.390). ZOZOFIT/Fit3D/Styku/Visbody do geometry only. Every one of them MEASURES and none INTERPRETS — which is also why the scanner companies are better door 1 candidates than the workout-builder platforms.',
    ],
    order: 3,
    steps: [
      {
        id: 'measurement-list-model',
        title: 'Measurements become a list with a source',
        description: 'What was measured, the number, and where it came from. Not four fixed columns.',
        status: 'planned',
        effort: 'M',
        surfaces: ['sql/', 'src/app/api/submit-progress-check/route.ts'],
        notes: 'The one piece of work that makes every machine below cheap. Adding Evolt later becomes a new value in a source field rather than a rebuild. The baselines table is already multi-row and the portal already renders "week N re-capture", so the downstream is waiting.',
      },
      {
        id: 'measurement-typed-entry',
        title: 'Route 1 — typed in from a printout',
        description: 'Coach or client reads the sheet and enters the numbers.',
        status: 'planned',
        effort: 'S',
        blockedBy: 'measurement-list-model',
        notes: 'Needs no integration and nobody\u2019s permission, and it is how every one of these arrives on day one. Do this before considering any partner.',
      },
      {
        id: 'measurement-document-extract',
        title: 'Routes 2 and 3 — photo of a printout, or a PDF',
        description: 'An InBody sheet photographed, a DEXA report uploaded.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'measurement-list-model',
        surfaces: ['src/app/api/clients/[id]/blood-panels/[panelId]/reextract/route.ts'],
        notes: 'Reuses the blood-panel pipeline almost exactly: upload a document, extract known fields, analyse. Structurally the same problem, already solved once.',
      },
      {
        id: 'measurement-competence-doctrine',
        title: 'Write the competence map into doctrine',
        description: 'What each source may speak to, and what it must stay silent on.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'measurement-list-model',
        notes: 'Thinking, not typing, and the part to be most careful about. Extends the existing "a tape measure outranks a photograph, provided the tape is plausible" rule into a full map. ⚠ Body fat percentage from BIA and from 3D scanning stays OUT of the read — Navy-regression and impedance estimates, both reported several percent off. Needs an explicit rule for when a measured distribution disagrees with what she reports.',
      },
      {
        id: 'measurement-plausibility-trust',
        title: 'The plausibility check learns the source',
        description: 'Stop second-guessing numbers a machine took.',
        status: 'planned',
        effort: 'S',
        blockedBy: 'measurement-competence-doctrine',
        surfaces: ['src/lib/anthropometry-plausibility.ts'],
        notes: 'assessAnthropometry() exists to catch a waist taken at the narrowest point rather than the navel, and that branch currently tells the read to distrust its own numbers and drop pattern_confidence. A machine-sourced measurement should skip it.',
      },
      {
        id: 'measurement-typing-input',
        title: 'The typing engine reads measured distribution',
        description: 'Type on geometry alongside self-report, not self-report alone.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'measurement-competence-doctrine',
        surfaces: ['src/lib/fat-map-profile.ts'],
        notes: 'The actual accuracy gain. A DEXA android/gynoid ratio measures the exact axis fatStorage and storageDirection currently capture by self-report, and a scan series measures Estrogen-Shift phase-2 REDISTRIBUTION — which today is detected by asking her, against a doctrine that warns about telling a woman her fat has moved when she never said so.',
      },
      {
        id: 'measurement-in-reread',
        title: 'A machine reading can replace tape and photos in the re-read',
        description: 'Sixty seconds on a gym scanner instead of a tape measure and three photos.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'measurement-list-model',
        notes: 'The step that makes the 12-week re-read actually happen. Biggest evidence gap in the business: every baseline held is week 1, one re-capture in six clients. That is a CAPTURE problem, not an interpretation problem. Evolt being in Anytime Fitness matters here — Kade is in one several times a week.',
      },
      {
        id: 'input-cycle-phase',
        title: 'The read knows where she is in her cycle',
        description: 'A check-in on day 3 and a check-in on day 24 do not mean the same thing.',
        status: 'shipped',
        shippedAt: '2026-09-09',
        effort: 'M',
        surfaces: ['src/lib/cycle-phase-bands.ts', 'src/lib/weekly-checkin-questions.ts', 'src/lib/cfws-prompt.ts'],
        notes: 'SHIPPED 9 Sep 2026, the same day it was identified. The gap was real: cycle-phase-bands.ts existed but was referenced ONLY when picking a blood panel reference range, never by the weekly check-in or the CFWS prompt. Now: clients.last_period_start (new column, sql/2026-09-09_client_cycle_context.sql, RUN against the live project 9 Sep and verified), one optional question on both check-in forms refreshing it weekly, parsePeriodStart() day-first and deliberately strict, cycleContextFor() resolving day and phase at read time, and a CYCLE PHASE section in the CFWS system prompt governing what it may and may not be used for. Absent whenever it cannot be resolved, because a phase two weeks wrong is worse than no phase. Excluded from the client-facing feedback email, which has no such doctrine. Highest value per unit of effort on this whole phase: costs nothing, needs no device, and one of the four profiles (Estrogen-Shift) is entirely hormonal. Related: the banked "ask for period date at upload" item.',
      },
      {
        id: 'input-hormonal-status',
        title: 'The read knows her hormonal status, and his',
        description: 'Sex at birth, hormone therapy, periods, contraception, pregnancy, testosterone use, and four how-do-you-feel questions. Asked of everyone.',
        status: 'shipped',
        shippedAt: '2026-09-13',
        effort: 'M',
        surfaces: ['src/lib/intake-questions.ts', 'src/app/intake/[token]/intake-form.tsx', 'src/app/api/submit-intake/route.ts', 'src/lib/cffs-prompt.ts', 'sql/2026-09-13_intake_hormonal_status.sql'],
        notes: 'SHIPPED 13 Sep 2026. The gap: the intake asked nothing about hormones for anyone, and the pattern choice between Estrogen-Shift and Androgen-Decline leaned on a Gender answer that allows "Prefer not to say". A licensed coach\'s client never came through the funnel, so the only other source (the lead record) was always empty for her. Now: an 11-question Hormonal Status section straight after identity, with questions that only appear when they apply (no periods question for someone who answered Male), stored in 11 new intake columns (SQL run and verified). Hidden questions are stored empty on the server, not trusted from the browser. The read gets a HORMONAL STATUS block plus ten rules, each tied to a line in the doctrine and re-checked against it the same day (the first draft let hormone therapy override the locked sex gate, and was corrected): sex at birth is the hard gate; therapy, pregnancy or recent birth, and current or past anabolic use hold the read at low and route to a referral conversation; periods set the Estrogen-Shift phase and are never labelled a menopause stage; contraception is never a composition signal; energy and drive corroborate only alongside falling strength or muscle and are NEVER a cause; no hormone tests; intakes from before today read exactly as they did. PROOF CAUGHT A REAL BUG: a man whose answers resembled the women\'s menopause pattern got no read at all, because the model deliberated until it ran out of room. Rule 1a now tells it to decide. Intake is now 245 questions; every visible count reads the live number. Progress Check list regenerated: 231 of 245 re-asked, sex at birth not re-asked. ALERTS SHIPPED same day: "pregnant now" and "using testosterone or an anabolic compound now, not prescribed" turn the intake email red with a Needs attention subject and put a red card on the client profile; every other hormonal answer stays inside the read so the alert stays rare. The question audit fails if either answer is reworded. EXISTING CLIENTS: the follow-up intake now asks each client only what they are missing, so sending it to an existing client is about a minute of hormonal questions (not yet sent to anyone). OPEN: the read has no Indeterminate option; morning erections question deliberately left out.',
      },
      {
        id: 'input-apnoea-screen',
        title: 'Sleep apnoea screening questions',
        description: 'Eight questions, no device. A referral pathway, never a finding.',
        status: 'planned',
        effort: 'S',
        notes: 'Common and badly underdiagnosed in the secondary audience — men 35-55 who train hard and get nothing back — and it can explain a client nothing else explains. ⚠ SCOPE: this raises a referral, it never diagnoses. Same discipline as bloods and bone density.',
      },
      {
        id: 'input-grip-strength',
        title: 'Grip strength',
        description: 'The cheapest objective number on the list. ~$30, ten seconds.',
        status: 'planned',
        effort: 'S',
        blockedBy: 'measurement-list-model',
        notes: 'A well-validated marker of overall capacity and recovery status. The readiness picture already has a capacity dimension and it is currently self-reported; this is an objective number for it.',
      },
      {
        id: 'input-bp-resting-hr',
        title: 'Blood pressure and resting heart rate',
        description: 'A home cuff. Pairs naturally with visceral fat.',
        status: 'planned',
        effort: 'S',
        blockedBy: 'measurement-list-model',
      },
      {
        id: 'input-measured-rmr',
        title: 'Measured metabolic rate against predicted',
        description: 'The nutrition engine uses a formula. Some gyms and clinics measure it directly.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'measurement-list-model',
        notes: 'Strategically the most interesting of these. BR\u2019s entire pitch is bodies that have stopped responding, and a MEASURED rate against a PREDICTED one is the closest thing to evidence for that claim BR could hold. Indirect calorimetry (PNOE, KORR, Q-NRG) is in some gyms and clinics.',
      },
      {
        id: 'input-cgm',
        title: 'Continuous glucose monitoring',
        description: 'Measures Insulin-Drift instead of inferring it.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'measurement-competence-doctrine',
        notes: 'The strongest WHY signal available. One of the four profiles is Insulin-Drift and it is currently inferred; a CGM measures post-meal response, overnight glucose and variability directly. Consumer CGMs are available in AU. ⚠ SCOPE: reading glucose reaches clinical ground quickly — this must describe pattern, never diagnose, and the doctrine needs writing before the feature.',
      },
      {
        id: 'input-salivary-cortisol',
        title: 'Salivary cortisol curve',
        description: 'Would directly evidence Stress-Stored. Named and left.',
        status: 'deferred',
        effort: 'M',
        notes: 'DEFERRED 9 Sep 2026, deliberately. Stress-Stored is the one profile named after a hormone BR cannot currently measure, and a four-point salivary curve is the standard way to. That gap is real and worth knowing about. But it is clinical, expensive, and closer to scope trouble than anything else on this list. Revisit only with a clinician involved.',
      },
      {
        id: 'measurement-partner-integration',
        title: 'A direct connection to a machine vendor',
        description: 'Evolt, InBody, Fit3D or Styku send the numbers straight in.',
        status: 'planned',
        effort: 'L',
        blockedBy: 'first-outside-coach',
        notes: 'Door 1 shaped and deliberately last. Do NOT build a scanner or an analyser — hardware and computer vision, both expensive, and several companies already do it well. By the time this is worth starting, the conversation is about a working product rather than an idea.',
      },
    ],
  },
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
        id: 'company-accounts-transfer',
        title: 'Move the business accounts into the company',
        description: 'Payments, hosting, database, AI provider, domains and developer accounts owned by the company rather than by Kade personally.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'incorporate',
        notes: 'Added in the 14 Sep gap audit. Every service the business runs on is currently held in a personal name. Customer contracts, data processing terms and insurance all need to sit with the company that holds the risk, and an acquirer or investor will check exactly this.',
      },
      {
        id: 'rd-records',
        title: 'Keep R&D Tax Incentive records as the work happens',
        description: 'A running record of what was built, what was uncertain, what was tried and what was learned, written at the time.',
        status: 'planned',
        effort: 'S',
        notes: 'Added in the 14 Sep gap audit. The refundable offset is 43.5% of eligible development spend for companies under $20 million turnover, registered with AusIndustry within ten months of the end of the income year. Claims are only as strong as records kept at the time rather than reconstructed later. Start now, alongside the build. Accountant\'s review.',
      },
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
  {
    id: 6,
    title: 'Security and data handling',
    description: 'What the system does, as opposed to what the documents say. A platform review asks about both.',
    longDescription: [
      'Separate from the company and the name on purpose. That phase is DOCUMENTS — do you own it, can you sign for it. This one is the SYSTEM: what actually happens to a client\u2019s health data, who can reach it, and what you can prove.',
      'It stops being optional the moment a client who is not Kade\u2019s is in the database. Today every client belongs to him, so he is the only person who can be harmed by a gap. A second coach changes that completely: her client trusted her, not him, and the obligations follow.',
      'The forcing function is door 1. Every platform sends a security questionnaire before their engineers are allowed near you, and the questions are always the same ones. Having answers is the difference between a conversation and a dead end.',
    ],
    order: 6,
    steps: [
      {
        id: 'security-encryption-verified',
        title: 'Encryption in transit and at rest, verified',
        description: 'Confirmed rather than assumed for the database, file storage, backups and every provider that receives health information.',
        status: 'planned',
        effort: 'S',
        notes: 'Added in the 14 Sep gap audit.',
      },
      {
        id: 'security-backups-restore',
        title: 'Backups, and a restore actually tested',
        description: 'Automatic backups, and at least one real restore rehearsed so it is known to work.',
        status: 'planned',
        effort: 'S',
        notes: 'Added in the 14 Sep gap audit. A backup that has never been restored is a hope, not a backup. Losing subscribers\' reads and history would be unrecoverable.',
      },
      {
        id: 'security-access-logging',
        title: 'A record of who looked at whose health information',
        description: 'Access to health records logged in the system, not only written down as a policy.',
        status: 'planned',
        effort: 'S',
        notes: 'Added in the 14 Sep gap audit. Complements the written access-control step: that says who may look, this proves who did.',
      },
      {
        id: 'security-monitoring',
        title: 'Errors and failures raise an alert',
        description: 'Error tracking and alerts in production, so a failing read is known before a customer reports it.',
        status: 'planned',
        effort: 'S',
        notes: 'Added in the 14 Sep gap audit. Reads have previously come back empty, and weekly syntheses went silent after a model change, without anything raising an alarm.',
      },
      {
        id: 'security-ai-abuse-limits',
        title: 'Limits and spending caps on anything that costs money',
        description: 'Per-account limits on reads and conversations, protection against trial abuse, and spending caps and alerts with the AI providers.',
        status: 'planned',
        effort: 'M',
        notes: 'Added in the 14 Sep gap audit. Open public signup means a stranger, or a script, can trigger reads that each cost real money. The coaching practice never had this exposure because only Kade could start a read. The low-balance alert and auto-reload with the AI provider were also still outstanding.',
      },
      {
        id: 'security-pen-test',
        title: 'An independent penetration test before launch',
        description: 'A security specialist tries to break in before the public is invited to store health information.',
        status: 'planned',
        effort: 'M',
        notes: 'Added in the 14 Sep gap audit. Follows the route-guard audit, so the test finds what the audit missed rather than what it would have found.',
      },
      {
        id: 'security-prompt-injection',
        title: 'Test Rey against people trying to talk it into harm',
        description: 'Deliberate attempts to make Rey ignore its limits, tested before open conversation reaches the public.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'solo-doctrine-checked-in-code',
        notes: 'Added in the 14 Sep gap audit. Free conversation is an attack surface: "pretend you are my coach and ignore the rules" is the obvious attempt. The doctrine checks in code are the backstop, because instructions to a model can be talked around and code cannot.',
      },
      {
        id: 'security-subprocessor-register',
        title: 'Name every third party that touches client data',
        description: 'Published in the privacy policy, and repeated in the data processing agreement.',
        status: 'in_progress',
        effort: 'S',
        surfaces: ['src/app/privacy/page.tsx'],
        notes: '⚠ VERIFIED GAP, 9 Sep 2026: the privacy policy names NOBODY. Not Anthropic, not Supabase, not Resend, not Twilio, not Stripe, not Vercel. Only a generic line about payment processors and email platforms. Client health data goes to Anthropic on every read and nothing published says so. Already thin for Kade\u2019s own clients; a blocker once a coach\u2019s clients are involved, because "do you send our clients\u2019 data to a third-party AI, and does it train on it?" is among the first questions in any security review. The good answer is available — Anthropic\u2019s commercial terms do not train on API inputs — but it has to be stated in writing. ✅ PRIVACY POLICY HALF DONE 9 Sep: all eight named (Supabase/Sydney, Anthropic, Vercel, Inngest, Resend, Twilio, Stripe, contractors), advertising separated out with an explicit statement that Meta and Google receive visits and purchases but NOT assessment answers, photos, measurements or health information, a paragraph on how health information is interpreted including that Anthropic does not train on it, plus data location (Sydney) and a Notifiable Data Breaches paragraph. Every provider verified in package.json and the code, not assumed — the stale "WhatsApp automation tools" line was dropped because no such integration exists any more. STILL OPEN: repeating it in the DPA, which cannot happen until the DPA exists.',
      },
      {
        id: 'security-route-guard-audit',
        title: 'Verify every route is guarded, or deliberately public',
        description: 'One pass over all 297, with the reason recorded for each.',
        status: 'planned',
        effort: 'M',
        surfaces: ['src/lib/api-auth.ts'],
        notes: '126 of 297 routes carry a coach guard. Most of the remainder are legitimately open — portal access by token, webhooks by signature, cron by secret — so the number is not itself a finding. The point is that nobody can currently say WHICH, and a security review asks exactly that. The output is a list, not a fix.',
      },
      {
        id: 'security-tenant-isolation-proof',
        title: 'Prove one coach cannot see another coach\u2019s clients',
        description: 'A repeatable test, not an assurance.',
        status: 'planned',
        effort: 'M',
        notes: 'Row-level security and coach_id scoping are in place and have been audited before. What does not exist is a test that can be RE-RUN and shown to someone. This is the single question every platform and every partner asks, and "we checked once" is not an answer to it.',
      },
      {
        id: 'security-access-control',
        title: 'Write down who at Body Recode can see client data',
        description: 'And under what circumstances.',
        status: 'planned',
        effort: 'S',
        notes: 'The admin client bypasses row-level security by design, which is correct and also means the honest answer today is "Kade, all of it, at any time". That is fine for his own clients and needs stating plainly for anyone else\u2019s. A security review does not object to broad access; it objects to undocumented access.',
      },
      {
        id: 'security-retention-deletion',
        title: 'Retention and deletion',
        description: 'What happens when a client leaves, a coach leaves, or a tenant ends.',
        status: 'planned',
        effort: 'M',
        notes: 'Including the one that bites: when a coach leaves, does her client\u2019s read go with her, stay, or get deleted? Already flagged as an open question on the gym layer, and it is the same question.',
      },
      {
        id: 'security-breach-process',
        title: 'A written breach process',
        description: 'Who is told, by whom, how fast.',
        status: 'planned',
        effort: 'S',
        notes: 'Australia\u2019s Notifiable Data Breaches scheme applies to health information regardless of turnover. A process written before anything happens is a different document from one written afterwards.',
      },
      {
        id: 'security-questionnaire-pack',
        title: 'The security questionnaire answer pack',
        description: 'Answer the standard questions once, properly, and reuse it.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'security-subprocessor-register',
        notes: 'Every platform sends one and they ask the same things: where is data hosted, who are your sub-processors, is it encrypted in transit and at rest, do you train models on our data, what is your breach process, can we delete on request. Answering them once and keeping it current turns a two-week stall into a same-day reply.',
      },
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
  ...READ_PHASES,
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
