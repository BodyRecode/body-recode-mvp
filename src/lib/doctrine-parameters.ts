/**
 * Doctrine parameter accessors.
 *
 * Mode A+ per-tenant tuning surface. All accessors return the parameter value
 * for the current tenant if configured, or a safe default (usually undefined
 * or empty) so consumers can proceed with BR's baseline behaviour.
 *
 * IMPORTANT: doctrine parameters are ADDITIVE. They can extend banned lists,
 * add tone cues, provide additional guidance. They can NEVER override the
 * platform's Hard Safety Floors (RRS clamps, Fat Map limits, injury
 * contraindications, eligibility floors, minimum-calorie floors, banned
 * client-terms from the platform-wide list). Any consumer that reads these
 * MUST apply them in a way that doesn't bypass safety.
 *
 * Wired incrementally: as each generator identifies which parameter it
 * should read, add a call to the relevant accessor here. For v1 the surface
 * is defined and editable but not yet consumed by generators.
 */

import { getTenant } from '@/config/tenant'

/** Optional partner voice-tone cue. Returns undefined if not set. */
export function partnerVoiceTone(): string | undefined {
  const params = getTenant().licence.doctrineParameters
  return params?.voiceTone?.trim() || undefined
}

/** Partner-specific banned phrases. Returns [] if not set. */
export function partnerBannedPhrases(): string[] {
  const params = getTenant().licence.doctrineParameters
  return params?.bannedPhrases?.filter((p) => p.trim().length > 0) ?? []
}

/** Partner-specific terminology substitutions. Returns {} if not set. */
export function partnerTerminologySubstitutions(): Record<string, string> {
  const params = getTenant().licence.doctrineParameters
  return params?.terminologySubstitutions ?? {}
}

/** Additional guidance for weekly check-in feedback prompts. */
export function partnerCheckinCoachingGuidance(): string | undefined {
  const params = getTenant().licence.doctrineParameters
  return params?.checkinCoachingGuidance?.trim() || undefined
}

/** Additional guidance for program generation prompts. */
export function partnerProgramGenerationGuidance(): string | undefined {
  const params = getTenant().licence.doctrineParameters
  return params?.programGenerationGuidance?.trim() || undefined
}

/** Additional guidance for nutrition plan generation prompts. */
export function partnerNutritionGenerationGuidance(): string | undefined {
  const params = getTenant().licence.doctrineParameters
  return params?.nutritionGenerationGuidance?.trim() || undefined
}

/**
 * Pure helper: apply a substitution map to text. Case-insensitive.
 * Substitution keys are iterated in insertion order; the output of one
 * substitution IS visible to subsequent substitutions (a=>b, b=>c on
 * "a" yields "c"). This is intentional so partners can chain rewrites;
 * the save-time validator refuses cycles by other means.
 * Exported for testing; production consumers should call
 * applyPartnerTerminology() which reads the tenant's live subs.
 */
export function applyTerminologyWith(
  text: string,
  subs: Record<string, string>,
): string {
  const keys = Object.keys(subs)
  if (keys.length === 0) return text
  let out = text
  for (const from of keys) {
    const to = subs[from]
    if (!to) continue
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    out = out.replace(new RegExp(escaped, 'gi'), to)
  }
  return out
}

/**
 * Apply the partner's terminology substitutions to a body of text.
 * Case-insensitive replacement, preserves original case of surrounding text.
 * Used as a post-generation filter to enforce partner-preferred wording.
 */
export function applyPartnerTerminology(text: string): string {
  return applyTerminologyWith(text, partnerTerminologySubstitutions())
}

/**
 * Pure helper: return the first banned phrase found in `text`, or null.
 * Case-insensitive substring match, iterates `banned` in given order.
 * Exported for testing.
 */
export function findBannedIn(text: string, banned: string[]): string | null {
  const lower = text.toLowerCase()
  for (const phrase of banned) {
    const trimmed = phrase.trim()
    if (trimmed.length === 0) continue
    if (lower.includes(trimmed.toLowerCase())) return trimmed
  }
  return null
}

/**
 * Detect if generated content contains any partner-specific banned phrases.
 * Returns the first matched phrase, or null if none. Case-insensitive.
 *
 * Callers should ADD this to their existing platform-wide banned-term check,
 * not replace it. Both platform and partner banned lists apply.
 */
export function findPartnerBannedPhrase(text: string): string | null {
  return findBannedIn(text, partnerBannedPhrases())
}
