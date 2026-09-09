/**
 * Shared shape + helpers for the buildout boards.
 *
 * There are TWO boards, split along the Layer 1 / Layer 2 line that the whole
 * go-to-market rests on (see `body-recode-loop` and `post-saas-positioning-br`
 * auto-memory, and 06_SAAS_PLATFORM_BUILD/2026-09-01_Read_As_A_Product_Roadmap.md):
 *
 *   - `saas-buildout-manifest.ts`  — BODY RECODE: the read as a sellable product.
 *     The engine, the loop, the re-read, tenancy, billing, and the two front doors.
 *   - `performance-coaching-buildout-manifest.ts` — PERFORMANCE COACHING: the
 *     execution application that consumes the read. Programs, nutrition, portal,
 *     the coaching loop.
 *
 * Extracted 9 Sep 2026 so both boards share one implementation. The helpers used
 * to close over a module-level PHASES const; they now take the phases explicitly,
 * and each manifest re-exports no-argument versions bound to its own board so
 * existing callers (Today, help guide) keep working unchanged.
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
  /** Widened from a 0-6 union on 9 Sep 2026 so a second board can number its own phases. */
  id: number
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

/* ===========================================================
 * Helpers. Behaviour is unchanged from the original single-board
 * versions; they just take the phases instead of closing over them.
 * =========================================================== */

export function allStepsIn(phases: Phase[]): Step[] {
  return phases.flatMap((p) => p.steps)
}

export function stepsByStatusIn(phases: Phase[], status: StepStatus): Step[] {
  return allStepsIn(phases).filter((s) => s.status === status)
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
export function nextUpStepIn(phases: Phase[]): { phase: Phase; step: Step } | null {
  const inProgress = phases.flatMap((p) => p.steps.map((s) => ({ phase: p, step: s }))).find(
    ({ step }) => step.status === 'in_progress',
  )
  if (inProgress) return inProgress
  for (const phase of phases) {
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
export function phaseGateReviewIn(phases: Phase[]): Phase | null {
  for (let i = 0; i < phases.length - 1; i++) {
    const current = phases[i]
    const next = phases[i + 1]
    const currentDone = current.steps.filter((s) => s.status !== 'deferred').every((s) => s.status === 'shipped')
    const nextStarted = next.steps.some((s) => s.status === 'shipped' || s.status === 'in_progress')
    if (currentDone && !nextStarted) return current
  }
  return null
}

/** Everything the board header needs, in one pass. */
export function boardStats(phases: Phase[]) {
  const total = allStepsIn(phases).length
  const shipped = stepsByStatusIn(phases, 'shipped').length
  const inProgress = stepsByStatusIn(phases, 'in_progress').length
  const planned = stepsByStatusIn(phases, 'planned').length
  const deferred = stepsByStatusIn(phases, 'deferred').length
  const blocked = stepsByStatusIn(phases, 'blocked').length
  const meaningful = total - deferred
  const pct = meaningful === 0 ? 0 : Math.round((shipped / meaningful) * 100)
  return { total, shipped, inProgress, planned, deferred, blocked, meaningful, pct }
}
