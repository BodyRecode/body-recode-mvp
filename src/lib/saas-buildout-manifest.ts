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
