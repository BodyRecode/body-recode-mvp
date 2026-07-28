## What it is

The Coach Co-Pilot is a doctrine-trained assistant the coach **talks with**. It rides on every page of the dashboard as a floating bubble, and on a client's profile it reads that client's full file. Its job is to hold every coach to one standard: explain the reasoning, pressure-test decisions, catch what the engine got wrong, and — with the coach always approving — draft and refine the actual plans.

The thesis is the white-label promise made real: *a collective of coaches practising to one standard*. A good-but-not-expert coach, with the co-pilot beside them, reaches the same call an expert would. That is the moat.

Two principles run through all nine phases:

- **Coach is the approver.** Nothing the co-pilot produces reaches a client on its own. Everything it drafts or edits is a **draft** the coach reviews and publishes.
- **Doctrine binds.** The co-pilot never overrides a client's readiness gates, phase order, injury constraints, or safety — not for a coach's instruction, not for a coach's saved preference.

Everything below is **live on `main`** as of 2026-07-27.

---

## The nine phases

### Phase 1 — Doctrine tutor
The hero capability. A read-only mentor the coach talks with, grounded in the client's file and citing what it draws on. It explains a read ("why did the synthesis land her in Remediation?"), teaches the rule behind a call, and pressure-tests the coach ("doctrine says hold — talk me out of progressing him"). It rides on **every** dashboard page (the global bubble), scoped to a client on their profile. A quiet thumbs-down flags any answer that drifts from doctrine into a review queue (**Clients → Co-Pilot Review**), so drift is caught before it spreads.

### Phase 2 — Plan Review
The capability that lets a not-yet-expert coach reach the standard. The co-pilot reads the **actual generated plan** — every session, exercise, set/rep/RPE, and every meal and macro — and critiques it against doctrine: phase fit, gate compliance, lane integrity (no calorie target hiding in a training plan; the protein anchor honoured), volume sanity, injury and equipment fit. It names the exact part that is off, the doctrine it breaks, and the fix. This is the "catch what the engine got wrong" pass.

### Phase 3 — Draft a program
"＋ Draft a program" proposes a full generation spec — phase, goal, frequency, duration, training age, movement competency — each with its reason, using the same vetted doctrine engine the Suggest flow uses (so it never guesses facts about the client). The coach reviews and edits the block name, then taps Generate. It saves a **draft** with all engine clamps applied. Nothing is published.

### Phase 4 — Refine a program
"✎ Refine program" — the coach describes one change ("swap the barbell squat for a hip thrust", "drop the bench to 3 sets"). The co-pilot proposes a **minimal, surgical patch**, shows exactly what will change, and on Apply changes **only** that part, leaving the rest of the draft byte-for-byte identical. No full re-roll, so nothing silently shifts.

### Phase 5 — Practice-wide roster awareness
On any non-client page, the co-pilot has a live read on the **whole roster**. Ask "what needs my attention today?", "who's drifting or hit a gate this week?", "who's due to progress?" and it answers from the same ranking as the Today's Focus board — but adds the doctrine reason and the next step in the mentor voice. For a deep single-client question it points the coach to open that profile.

### Phase 6 — Nutrition parity
Everything the co-pilot does for training, now for **nutrition**: draft a nutrition plan (via the vetted nutrition engine), and refine it surgically ("swap the oats for berries", "drop to 3 meals"). When a food changes, the meal totals and the day's calorie band are **re-summed from the foods** automatically, so a swap can never desync the macros. It flags any change that would break the protein anchor, the calorie floor, or a dietary restriction.

### Phase 7 — Proactive brief
The co-pilot stops waiting to be asked. The bubble shows a **badge** with how many clients are awaiting the coach, and a one-tap **"☀ Morning brief"** narrates the roster back: who needs attention today, why, and the single next step, grouped by urgency. The difference between a search box and a coach who has already looked.

### Phase 8 — Full surgical refine
Refine now handles the **structural** changes coaches actually ask for, for both program and nutrition — not just tweaks: add / remove / reorder an exercise, drop or add a whole day, add or remove foods and whole meals. Still confirm-first, still draft-only. A new day can't push past the frequency the phase and gates allow; a nutrition change can't break the protein anchor or calorie floor.

### Phase 9 — Coach-style memory
The co-pilot remembers **how a coach likes to work**. In a "⚙ Set your coaching preferences" panel the coach writes their own guidance ("favour 4-day splits when the gates allow", "keep first blocks to 3 sets", "prefer dairy-free swaps"), and the co-pilot honours it everywhere as **soft guidance**. It shapes defaults and tone; it never overrides a client's gates, phase, or safety. Explicit and coach-owned — the co-pilot never infers or assumes.

### Plus — White-label readiness
The coach-facing chrome is tenant-branded (the bubble reads "the *[Brand]* method" from the tenant config). The mark and label were already brand-neutral, and the doctrine stays Body Recode — the licensed engine. So the co-pilot is brand-ready by design; only the deeper multi-tenant packaging (per-practice reviewer, multi-tenant scoping) waits on the broader white-label track.

---

## How the pieces fit

- **The tutor** reasons over a compact, current picture of the client — the "at a glance" synthesis cards plus the actual saved plan — never a re-derivation, so it can't contradict the record.
- **Drafting** never invents client facts: it calls the same vetted "suggest" engines the Suggest flow uses to derive the inputs, then the real generators (which apply every doctrine clamp) to produce the draft.
- **Refining** is a deterministic patch applied server-side to a deep copy of the draft. The model proposes *what* to change by exact position; the code applies it so nothing else moves. Nutrition re-sums its macros from the foods with the same normaliser the generator uses.
- **The roster brief** reuses the exact ranking engine behind the Today's Focus board, so the co-pilot never contradicts the board.
- **Coach memory** is a small, coach-owned note read as soft guidance into every prompt, always yielding to doctrine.

Every write is a draft the coach publishes. Every co-pilot surface is coach-scoped, so it rides into white-label without a rebuild.

---

## What is deliberately deferred

- **General-chat persistence** — the practice-wide conversation is still per-session (replayed in the browser), not stored across sessions.
- **Multi-tenant white-label internals** — per-practice reviewer assignment for the flagged queue, per-tenant data scoping, and the decision on whether the method name in *answers* rebrands per tenant or stays "powered by Body Recode". These need a second tenant to build and verify, and belong to the Powered-Platform white-label track.
- **Engineering note** — the roster ranking is currently mirrored from the Today's Focus board rather than shared from one function; to be reconciled when that dashboard can be re-verified end to end.

---

## Status

All nine phases are **live on `main`** (2026-07-27), each typechecked and built clean, with the coach-memory database table applied to production. The deterministic logic — patch apply, macro recompute, the preferences round-trip, roster ranking — was verified in isolation. The end-to-end click-through (auth-gated) is the coach's to confirm: on a real client, draft a plan, refine one thing, set a preference, and tap the morning brief.
