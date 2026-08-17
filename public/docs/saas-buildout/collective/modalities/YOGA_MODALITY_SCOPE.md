# Yoga Modality - Build Scope
**For body-recode-mvp. Internal spec. June 2026.**

Adds a second movement modality (yoga) to the coaching application so a yoga coach can prescribe in her own discipline, while still backed by the Body Recode interpretation engine.

---

## The core insight (scope reducer)

Under the locked model (engine = diagnosis, coach = prescription, manual authoring, everything coach-gated), **the yoga modality does NOT need an AI program-generation engine for v1.** Build the tooling for a coach to author yoga plans by hand, reuse the reading, and switch off the strength-only constraints. A yoga *generation* engine is a later (B-tier) project.

## Coupling assessment (from the repo)

| Component | Coupling to strength | Implication |
|---|---|---|
| `exercises` table taxonomy | Deep (movement_pattern, mechanical_bias, equipment, axial_loading, grip, tier) | New yoga library/taxonomy needed |
| `program-prompt.ts` generation engine | Deep (Fat Map, RPE, fatigue mgmt, tiers) | Not reused for yoga v1; generation off for yoga |
| `programs → sessions → session_exercises` container | Loose; session_type already has non-strength values; reps/rpe/tempo are text | Reusable / extendable |
| Foundational reading (Layer 1) | Modality-agnostic (body state, recovery, regulation) | Reused as-is |
| Program reading language | Strength-flavoured | Light yoga-variant prompt |
| RRS recovery/regulation floors | Universal | Keep; maps well to yoga intensity gating |
| Fat Map training limits, RPE caps, exercise-library restrictions, axial/grip logic | Strength-only | Disable for yoga modality |

## What to build (v1)

1. **Modality concept.** A `modality` (enum: `strength`, `yoga`) assigned per coach/tenant (and/or per client). Drives which library, prescription schema, constraints and UI are active.
2. **Yoga movement library.** New table/taxonomy. Suggested fields: name, pose_family (standing/seated/supine/prone/balance/inversion/twist/backbend/forward_fold/restorative), target_region, breath_pattern, hold_type (static/dynamic/flow), level, props (block/strap/bolster), contraindications, common transitions. Global library, coach-extendable (mirror the existing exercises RLS).
3. **Modality-aware prescription schema.** Either extend `session_exercises` with yoga fields (hold_seconds, breath_count, side, cue) gated by modality, or a parallel `session_movements` for yoga. Recommend extending with nullable modality-specific columns to reuse the session/program container.
4. **Manual authoring UI.** A yoga sequence builder: pick poses from the yoga library, arrange into a session/sequence, set holds/breath/sides/cues. This is the main UI build, since there is no generation step for yoga. (Confirm whether a from-scratch manual builder already exists for strength to reuse the pattern; if not, this is net-new.)
5. **Constraint sorting.** Tag doctrine constraints universal vs strength-specific. Yoga modality applies RRS recovery/regulation gating (restorative vs active vs power flow by recovery state) and injury contraindications; it does not apply Fat Map training limits, RPE caps, axial/grip fatigue logic, or the strength exercise-library restrictions.
6. **Program-reading yoga variant.** A modality-aware version of the program-reading prompt so the "why this block" language fits a yoga sequence. Small.

## Reused as-is
- Foundational reading, scorecard interpretation, recovery/regulation doctrine, check-ins, portal, coach-gating, the program/session container.

## Effort (rough)
- Modality plumbing: S-M
- Yoga library + taxonomy + seed: M
- Prescription schema extension: S-M
- Manual authoring UI: M-L (the big piece)
- Constraint sorting: M
- Program-reading yoga variant: S
- **Total: a focused few-week project**, not a multi-month doctrine build, because there is no yoga generation engine in v1.

## Build approach
- Build in `body-recode-mvp` on a branch / worktree, isolated from the live app.
- Phase it: (1) modality concept + yoga library, (2) prescription schema + manual authoring UI, (3) constraint sorting + reading variant, (4) wire a yoga test coach end to end.

## Open items to confirm in build
- Does a from-scratch manual program builder exist for strength (reuse), or only generate-then-edit?
- Per-client vs per-coach modality (can one coach run both strength and yoga clients?).
- Later (B): a yoga generation engine (yoga programming doctrine) once you have enough yoga partners to justify it.
