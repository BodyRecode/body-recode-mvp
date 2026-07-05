/**
 * Save-time validator for Mode A+ doctrine parameters.
 *
 * The tenant settings editor accepts free-text input. Without this validator
 * a partner could:
 *   - Ban a platform-mandated vocabulary word ("Optimisation", "protein"),
 *     which would then fail the client-facing content audit on every draft
 *     and silently break their pipeline.
 *   - Substitute a protected term ("Optimisation => Peak") which would
 *     rewrite the state name the client already saw in their Foundational
 *     Reading, breaking continuity.
 *   - Add a banned phrase like "the" that matches nearly all output.
 *
 * Runs on POST /api/tenant/update when section='licence' and the patch
 * contains doctrineParameters. Returns the first violation so the coach
 * sees a clear error and can correct it.
 */

/**
 * Client-visible platform vocabulary the partner MUST NOT ban or rewrite.
 * These terms appear in artefacts the client has already read (Foundational
 * Reading state names, Fat Map zone names, nutrition units). Rewriting
 * them mid-programme breaks continuity; banning them fails every audit.
 *
 * Case-insensitive substring match.
 */
const PROTECTED_TERMS: string[] = [
  // The three body states
  'Remediation',
  'Optimisation',
  'Post-Optimisation',
  // The three phase names + variations
  'Stabilisation',
  'Capacity Foundation',
  'Performance Expression',
  // Fat Map zones (canonical pattern names, per reference memory)
  'Insulin-Drift',
  'Stress-Stored',
  'Estrogen-Shift',
  'Androgen-Decline',
  // Nutrition units that the platform mandates by structure
  'protein',
  'carbs',
  'carbohydrate',
  'fat',
  'fats',
  'calorie',
  'kcal',
  'gram',
]

/**
 * Small English-stopword list. A partner banning "the" or "a" would flag
 * essentially every draft. Match a full whole-word banned phrase against
 * this list.
 */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at',
  'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'do', 'does',
  'it', 'this', 'that', 'i', 'you', 'we', 'they',
])

const MIN_BANNED_PHRASE_LEN = 3
const MIN_SUBSTITUTION_FROM_LEN = 2
const MAX_GUIDANCE_LEN = 2000
const MAX_VOICE_TONE_LEN = 200

export type DoctrineParametersPatch = {
  voiceTone?: string
  bannedPhrases?: string[]
  terminologySubstitutions?: Record<string, string>
  checkinCoachingGuidance?: string
  programGenerationGuidance?: string
  nutritionGenerationGuidance?: string
} | null | undefined

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: string }

function containsProtectedTerm(text: string): string | null {
  const lower = text.toLowerCase()
  for (const term of PROTECTED_TERMS) {
    const t = term.toLowerCase()
    const re = new RegExp(`\\b${t.replace(/[-]/g, '[- ]')}\\b`, 'i')
    if (re.test(lower)) return term
  }
  return null
}

export function validateDoctrineParameters(
  patch: DoctrineParametersPatch,
): ValidationResult {
  if (!patch) return { ok: true }

  if (patch.voiceTone !== undefined && patch.voiceTone.length > MAX_VOICE_TONE_LEN) {
    return { ok: false, error: `Voice tone is too long (${patch.voiceTone.length} chars, max ${MAX_VOICE_TONE_LEN}).` }
  }

  for (const field of ['checkinCoachingGuidance', 'programGenerationGuidance', 'nutritionGenerationGuidance'] as const) {
    const val = patch[field]
    if (val !== undefined && val.length > MAX_GUIDANCE_LEN) {
      return { ok: false, error: `${field} is too long (${val.length} chars, max ${MAX_GUIDANCE_LEN}).` }
    }
  }

  if (patch.bannedPhrases) {
    for (const raw of patch.bannedPhrases) {
      const p = raw.trim()
      if (p.length === 0) continue
      if (p.length < MIN_BANNED_PHRASE_LEN) {
        return { ok: false, error: `Banned phrase "${p}" is too short (min ${MIN_BANNED_PHRASE_LEN} chars). Very short phrases match nearly all output.` }
      }
      if (STOPWORDS.has(p.toLowerCase())) {
        return { ok: false, error: `Banned phrase "${p}" is a common English word and would flag most drafts. Choose a more specific phrase.` }
      }
      const protectedHit = containsProtectedTerm(p)
      if (protectedHit) {
        return { ok: false, error: `Banned phrase "${p}" contains the platform-protected term "${protectedHit}". This is a Hard Safety Floor - clients have already seen this term in their Foundational Reading + plans. Banning it would fail every audit.` }
      }
    }
  }

  if (patch.terminologySubstitutions) {
    for (const [rawFrom, rawTo] of Object.entries(patch.terminologySubstitutions)) {
      const from = rawFrom.trim()
      const to = rawTo.trim()
      if (from.length === 0) continue
      if (from.length < MIN_SUBSTITUTION_FROM_LEN) {
        return { ok: false, error: `Substitution "from" value "${from}" is too short (min ${MIN_SUBSTITUTION_FROM_LEN} chars).` }
      }
      if (to.length === 0) {
        return { ok: false, error: `Substitution for "${from}" has an empty replacement. Use a non-empty replacement or remove the entry.` }
      }
      const fromProtected = containsProtectedTerm(from)
      if (fromProtected) {
        return { ok: false, error: `Substitution "from" value "${from}" contains the platform-protected term "${fromProtected}". Rewriting this word mid-programme would break client continuity - they have already seen it in their Foundational Reading.` }
      }
      const toProtected = containsProtectedTerm(to)
      if (toProtected) {
        return { ok: false, error: `Substitution "to" value "${to}" contains the platform-protected term "${toProtected}". Reserved for the platform vocabulary.` }
      }
    }
  }

  return { ok: true }
}
