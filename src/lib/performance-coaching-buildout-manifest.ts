/**
 * PERFORMANCE COACHING buildout manifest — the Layer 2 execution application.
 *
 * The sibling of `saas-buildout-manifest.ts`. Split out 9 Sep 2026 along the
 * Layer 1 / Layer 2 line the whole go-to-market rests on:
 *
 *   Body Recode        = the read as a sellable product (the other board).
 *   Performance Coaching = the application that CONSUMES the read. Programs,
 *                          nutrition, the portal, the coaching loop, and the
 *                          tooling Kade runs his own practice on.
 *
 * Kade's split, 9 Sep 2026. Coach Co-Pilot and the Operator Console moved here
 * from the Body Recode board because they draft and operate Layer 2 artefacts.
 * Both are one-line moves back if that call turns out wrong.
 *
 * MAINTENANCE RULE (from `feedback_ship_checklist`): every commit that ships or
 * changes state on a Layer 2 step MUST update the corresponding entry here in
 * the same commit. Silent drift is not allowed.
 *
 * ⚠ FIRST PASS. The two phases below carry real, verified history. The rest of
 * Layer 2 — the program engine, the nutrition engine, the portal and the weekly
 * coaching loop — has NOT yet been audited into phases. Statuses for those would
 * be inference, and an invented status is worse than an empty board. See the
 * "Not yet audited" phase at the end.
 *
 * Rendering: /dashboard/settings/coaching-buildout
 */

import {
  allStepsIn,
  stepsByStatusIn,
  nextUpStepIn,
  phaseGateReviewIn,
  type StepStatus,
  type Step,
  type Phase,
} from '@/lib/buildout-types'

const COACHING_PHASES: Phase[] = [
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
  {
    id: 99,
    title: 'Not yet audited',
    description: 'The rest of Layer 2. Real work, not yet broken into tracked steps.',
    longDescription: [
      'Placeholder, deliberately. The program engine, the nutrition engine, the client portal and the weekly coaching loop are all substantial built systems with their own history, gaps and banked work. None of it is tracked here yet.',
      'It is left empty on purpose rather than filled with guesses. A board showing invented statuses is worse than a board showing none, because the percentage at the top starts lying and nobody notices.',
      'To populate: audit each area against the code and the auto-memory, then add phases with verified statuses and commit refs the same way the Body Recode board was built.',
    ],
    order: 99,
    steps: [
      {
        id: 'audit-layer-2',
        title: 'Audit Layer 2 into tracked phases',
        description: 'Program engine, nutrition engine, portal, weekly coaching loop.',
        status: 'planned',
        effort: 'L',
        notes: 'Known candidates from auto-memory: the nutrition engine (validation, versioning, meal editor, coach guidance, food swaps, adherence logging, revise-not-regenerate shipped 8 Sep, supplements wired), the program engine (workout logging, coach guidance, RPE creep, parameters mode A+, the block brief fix, the missing conditioning modality), the portal (PortalPageShell, design unification, daily sequences, the bloods guide, the banked sleep log) and the check-in loop (unified weekly check-in, feedback voice, window override). Each needs its status verified in code before it goes on the board.',
      },
    ],
  },
]

/* ===========================================================
 * No-argument helpers, bound to THIS board (Performance Coaching).
 * Implementations live in buildout-types.ts.
 * =========================================================== */

export { COACHING_PHASES as PHASES }

export function allSteps(): Step[] {
  return allStepsIn(COACHING_PHASES)
}

export function stepsByStatus(status: StepStatus): Step[] {
  return stepsByStatusIn(COACHING_PHASES, status)
}

export function nextUpStep(): { phase: Phase; step: Step } | null {
  return nextUpStepIn(COACHING_PHASES)
}

export function phaseGateReview(): Phase | null {
  return phaseGateReviewIn(COACHING_PHASES)
}
