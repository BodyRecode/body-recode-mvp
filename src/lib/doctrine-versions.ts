/**
 * Doctrine version constants — single source of truth.
 *
 * Every AI-generated artefact stamps the doctrine version that produced it
 * onto its DB row. The dashboard compares the stamp against the current
 * value in this file and shows a "Generated under v[OLD]; current v[NEW] -
 * Regenerate recommended" pill when stale.
 *
 * BUMP THE VERSION when you ship a change to the relevant generator that
 * materially affects what gets written to the client. Examples that warrant
 * a bump:
 *   - Prompt rubric changes (e.g. the 2026-06-08 weekly-checkin-feedback
 *     trajectory-arc + quote-language rules)
 *   - Banned-jargon regex expansion (e.g. the 2026-06-09 sweep that added
 *     downregulate/downregulating)
 *   - New required output fields
 *   - Validator math fixes (substitution equivalence, macro arithmetic)
 *
 * Versioning convention: YYYY-MM-DD.N (date + ordinal within day).
 *
 * Added 2026-06-09 (item D in the licensee-readiness plan).
 */

export const DOCTRINE_VERSIONS = {
  // Foundational Synthesis (coach-facing CFFS body of work)
  cffs: '2026-06-09.1',

  // Foundational Reading (client-facing translation of the CFFS)
  foundational_reading: '2026-06-09.1',

  // Program (training plan structure + rationale)
  program: '2026-06-09.1',

  // Program Reading (client-facing translation of the active block)
  program_reading: '2026-06-09.1',

  // Nutrition Plan + Nutrition Reading. The plan was previously stamped
  // via NUTRITION_DOCTRINE_VERSION in nutrition-validation.ts (2026-05-26.4
  // series). Now consolidated here as the single source of truth.
  nutrition_plan: '2026-06-09.1',
  nutrition_reading: '2026-06-09.1',

  // Trajectory Reading (block-end client reading reading the SEQUENCE
  // of weekly syntheses across a completed block).
  trajectory_reading: '2026-06-09.1',

  // Weekly Check-In Coach Feedback (manual + auto pipeline). Driven by
  // the 2026-06-08 prompt rubric tightening — trajectory-arc, quote-language,
  // CFFS-risk-vs-current-signal reframe cross-check, strength-prohibition,
  // self-audit. This version stamp is what tells the dashboard which
  // feedback was generated under those rules.
  weekly_checkin_feedback: '2026-06-09.1',

  // Medications Analysis (coach JSON) + Medications Reading (client prose)
  medications_analysis: '2026-06-09.1',
  medications_reading: '2026-06-09.1',

  // Blood Panel reading + research-lens analysis
  blood_panel_reading: '2026-06-09.1',
  blood_panel_analysis: '2026-06-09.1',
} as const

export type DoctrineKey = keyof typeof DOCTRINE_VERSIONS

/**
 * Is the stored doctrine_version for an artefact stale compared to the
 * current constant? Returns true when stored is null OR doesn't match the
 * current value. The dashboard uses this to decide whether to show the
 * amber "Regenerate recommended" pill.
 */
export function isDoctrineStale(stored: string | null | undefined, key: DoctrineKey): boolean {
  if (!stored) return true
  return stored !== DOCTRINE_VERSIONS[key]
}
