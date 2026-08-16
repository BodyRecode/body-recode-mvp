/**
 * Single source of truth for client-facing banned terminology.
 *
 * Imported by every client-facing generator (Foundational Reading, Program
 * Reading, Nutrition Reading, Weekly Check-In Coach Feedback, Medications
 * Reading, Blood Panel reading, Trajectory Reading, etc.) and by the
 * backfill audit script that re-validates existing published artefacts
 * against the current ruleset.
 *
 * RULE: any client-facing text fragment that contains one of these terms
 * is a leak. Generators retry up to 3 times on detection; the audit script
 * flags existing rows for regenerate.
 *
 * Added 2026-06-09: extracted from weekly-checkin-feedback-prompt.ts so
 * the same ruleset applies across all generators. Driven by the Ruby-Cate
 * nutrition audit which surfaced that her published Nutrition Reading still
 * contained "mid-arc compression" + "downregulating" + "wired-but-tired" —
 * banned in WCCF for a month but never enforced on NR because each
 * generator carried its own list. The vintage problem.
 *
 * Categories (additions go in the appropriate category, alphabetical
 * within category):
 *
 *   1. Acronyms — internal-only identifiers (CFFS, CFWS, RPE)
 *   2. Internal naming — coach-facing synthesis vocabulary
 *   3. Arc / pattern jargon — Body Recode brand-internal pattern names
 *   4. Clinical / physiological jargon — anything client would not have
 *      seen in their three-state Foundational Reading vocabulary
 *
 * Always allowed (because the client encountered them in their FR):
 *   - The three body state names: Remediation, Optimisation, Post-Optimisation
 *   - The four phases: Stabilisation, Capacity Foundation, Performance
 *     Expression, plus block-specific names
 */

export const BANNED_CLIENT_TERMS: RegExp[] = [
  // 1. Acronyms
  /\bCFFS\b/i,
  /\bCFWS\b/i,
  /\bRPE\b/i,
  /\bRPE creep\b/i,

  // 2. Internal naming
  /\bcoach[- ]facing\b/i,
  /\b(foundational|weekly) synthesis\b/i,
  /\bthe synthesis\b/i,
  /\bspatial patterning\b/i,
  /\b(exposure|capacity|regulation|behaviour|behavior) readiness\b/i,
  /\bdrift advisory\b/i,
  /\breassessment trigger\b/i,
  /\b(signal|readiness) monitor\b/i,
  /\bresolution state\b/i,
  /\bbody state classification\b/i,

  // 3. Arc / pattern jargon (Body Recode brand-internal)
  /\bmid[- ]arc\b/i,
  /\blong[- ]arc\b/i,
  /\bstress[- ]belt\b/i,
  /\bwired[- ]but[- ]tired\b/i,
  /\bmid[- ]arc compression\b/i,

  // 4. Clinical / physiological jargon
  /\b(sympathetic|parasympathetic) dominance\b/i,
  /\bsympathetic (overdrive|activation|load)\b/i,
  /\bfight[- ]or[- ]flight\b/i,
  /\bautonomic\b/i,
  /\bnervous system (overdrive|dysregulation|dysregulated)\b/i,
  /\bhpa axis\b/i,
  /\bcortisol\b/i,
  /\bdownregulation\b/i,
  /\bdownregulate\b/i,
  /\bdownregulating\b/i,
]

export function findLeakedTerms(text: string): string[] {
  if (!text) return []
  const hits: string[] = []
  for (const re of BANNED_CLIENT_TERMS) {
    const match = text.match(re)
    if (match) hits.push(match[0])
  }
  return hits
}

/**
 * Em-dash stripper. Em dashes are an AI-writing tell that Kade rejects on
 * every client-facing surface (see [[feedback_no_em_dashes]]). Lives here
 * alongside findLeakedTerms because every generator that uses one also
 * uses the other.
 *
 * 2026-08-17: absorb the whitespace either side of the dash. The old
 * `/—/g` left `"recovery is 4 — recovering well"` as `"4 ,  recovering well"`
 * (space before the comma, two spaces after), which shipped to clients in
 * check-in responses.
 */
export function stripEmDashes<T>(value: T): T {
  if (typeof value === 'string') return value.replace(/[ \t]*—[ \t]*/g, ', ') as T
  if (Array.isArray(value)) return value.map(stripEmDashes) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripEmDashes(v)])
    ) as T
  }
  return value
}

/**
 * Single-call audit helper used by every client-facing generator.
 *
 * Pass the parsed JSON reading (e.g. `{ cr_where_you_are, cr_what_your_body_is_telling_us, ... }`),
 * an array of the field names to audit, and an optional label for log
 * messages. Returns either:
 *   - { ok: true, cleaned }   — em dashes stripped, no leaks across the named fields
 *   - { ok: false, leaks }    — at least one banned term found; caller decides retry vs error
 *
 * Used by FR / PR / NR / Trajectory / Medications Reading / Blood Panel
 * generators so the same vocabulary discipline applies everywhere. Added
 * 2026-06-09 after the Ruby-Cate nutrition audit surfaced that her NR
 * still contained mid-arc compression + downregulating + wired-but-tired
 * (banned in WCCF for a month, never enforced on NR because each generator
 * carried its own logic, FR/PR/NR had NONE).
 */
export interface AuditSuccess<T> {
  ok: true
  cleaned: T
  leaks: never[]
}
export interface AuditFailure {
  ok: false
  cleaned: null
  leaks: string[]
}
export type AuditResult<T> = AuditSuccess<T> | AuditFailure

export function auditClientReadingFields<T extends Record<string, unknown>>(
  reading: T,
  fieldsToAudit: (keyof T)[],
): AuditResult<T> {
  const cleaned = stripEmDashes(reading)
  const leaks: string[] = []
  for (const field of fieldsToAudit) {
    const value = cleaned[field]
    if (typeof value === 'string') {
      leaks.push(...findLeakedTerms(value))
    }
  }
  if (leaks.length > 0) {
    return { ok: false, cleaned: null, leaks: Array.from(new Set(leaks.map(t => t.toLowerCase()))) }
  }
  return { ok: true, cleaned, leaks: [] }
}
