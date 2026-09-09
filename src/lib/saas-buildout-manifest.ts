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
    id: 3,
    title: 'Better inputs — 3D body scanning',
    description: 'Let the read take measured body geometry instead of a tape measure and three photos.',
    longDescription: [
      'NOT blocked by the gate. Every step here except the last can be done today, with no partner, no hardware and nobody\u2019s permission. It sits after door 2 because it should not be done INSTEAD of finding a coach, not because anything is stopping it.',
      'What it fixes. The typing engine does not read measurements at all today \u2014 it types on what she reports about where fat sits, plus age, sex, cycle and section scores. The four measurements taken serve mainly as a sanity check whose job is to tell the read NOT to trust them when a waist was taken at the wrong landmark. So the most objective thing about where fat sits barely touches the typing.',
      'A scan changes two things specifically. It MEASURES the hips-and-thighs versus middle axis rather than asking about it, and that axis is the main separator between Estrogen-Shift and the other three. And it measures REDISTRIBUTION: Estrogen-Shift phase 2 is fat moving from hips and thighs toward the middle, which today is detected by asking her, against a doctrine that warns about telling a woman her fat has moved when she never said so. A scan at week 1 and week 12 measures that movement.',
      'The limit, and it is real. A scan tells you WHERE, never WHY. Stress-Stored and Insulin-Drift both present centrally and geometry cannot separate them; those are distinguished by sleep, stress, cycle, medications, bloods and training response, all of which come from the intake. A scan is a better eye, not a better brain.',
      'Market context (researched 9 Sep 2026): ZOZOFIT is a phone-based consumer scanner, roughly $2.50/mo, with a business tier. Fit3D, Styku and Visbody are the professional kiosks in gyms \u2014 around 400 measurements in under a minute, cloud dashboards, and in Visbody\u2019s case an API. Every one of them MEASURES and none of them INTERPRETS. They also have the gym and coach distribution BR does not, which makes them better door 1 candidates than the workout-builder platforms.',
    ],
    order: 3,
    steps: [
      {
        id: 'scan-baseline-capture',
        title: 'Baseline capture accepts scan measurements',
        description: 'Twelve or so sites instead of four, plus a flag for where the numbers came from.',
        status: 'planned',
        effort: 'S',
        surfaces: ['sql/', 'src/app/api/submit-progress-check/route.ts'],
        notes: 'Route one of three: the coach types the numbers in from whatever scanner they have. Needs no integration, no partner and nobody\u2019s agreement, and it makes a real integration cheap later. The baselines table is already multi-row and the portal already renders "week N re-capture", so the downstream is waiting for it.',
      },
      {
        id: 'scan-plausibility-trust',
        title: 'The plausibility check trusts a scan',
        description: 'Stop second-guessing numbers a machine took.',
        status: 'planned',
        effort: 'S',
        blockedBy: 'scan-baseline-capture',
        surfaces: ['src/lib/anthropometry-plausibility.ts'],
        notes: 'assessAnthropometry() exists to catch bad tape work \u2014 a waist taken at the narrowest point rather than the navel. That branch currently tells the read to distrust its own numbers and set pattern_confidence low. A scan-sourced measurement should skip it. Claimed scan error is 0.15 of an inch.',
      },
      {
        id: 'scan-doctrine',
        title: 'Write the source hierarchy into doctrine',
        description: 'Scan beats tape, tape beats photograph. Scan body-fat percentage beats nothing.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'scan-baseline-capture',
        notes: 'Thinking, not typing, and the part to be most careful about. Extends the existing rule that a tape measure outranks a photograph provided the tape is plausible. ⚠ The scan\u2019s BODY FAT PERCENTAGE stays out of the read entirely \u2014 it is a US Navy regression estimate, not a measurement, and users report it several percent off. Circumferences in, body fat out. Also needs an explicit rule for what happens when measured distribution disagrees with what she reports.',
      },
      {
        id: 'scan-typing-input',
        title: 'The typing engine reads measured distribution',
        description: 'Type on geometry alongside self-report, not self-report alone.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'scan-doctrine',
        surfaces: ['src/lib/fat-map-profile.ts'],
        notes: 'The actual accuracy gain. typeFatMapProfile() currently takes fatStorage and storageDirection as self-reported CATEGORIES. Measured circumferences give the gluteofemoral-versus-central axis directly. ⚠ Do not let clean geometry override messy context \u2014 that is exactly the drift the doctrine exists to stop, and geometry cannot tell Stress-Stored from Insulin-Drift at all.',
      },
      {
        id: 'scan-progress-check',
        title: 'A scan can replace tape and photos in the re-read',
        description: 'Sixty seconds on a phone instead of a tape measure, three photos and a compliance battle.',
        status: 'planned',
        effort: 'M',
        blockedBy: 'scan-baseline-capture',
        notes: 'The step that makes the 12-week re-read actually happen, and it addresses the biggest evidence gap in the business: every baseline held is week 1 and there has been exactly one re-capture in six clients. That is a CAPTURE problem, not an interpretation problem. Scan-to-scan comparison is also far less noisy than tape-at-week-1 against tape-at-week-12.',
      },
      {
        id: 'scan-partner-integration',
        title: 'A real integration with a scanner company',
        description: 'Fit3D, Styku, Visbody or ZOZOFIT Pro send the numbers directly.',
        status: 'planned',
        effort: 'L',
        blockedBy: 'first-outside-coach',
        notes: 'Door 1 shaped, and deliberately last. By the time this is worth starting, everything above means the conversation is about a working product rather than an idea. Do NOT build a scanner \u2014 it is hardware or computer vision, both expensive, and four companies already do it well.',
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
