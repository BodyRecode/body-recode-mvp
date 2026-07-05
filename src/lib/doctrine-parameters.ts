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
 * Apply the partner's terminology substitutions to a body of text.
 * Case-insensitive replacement, preserves original case of surrounding text.
 * Used as a post-generation filter to enforce partner-preferred wording.
 */
export function applyPartnerTerminology(text: string): string {
  const subs = partnerTerminologySubstitutions()
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
 * Detect if generated content contains any partner-specific banned phrases.
 * Returns the first matched phrase, or null if none. Case-insensitive.
 *
 * Callers should ADD this to their existing platform-wide banned-term check,
 * not replace it. Both platform and partner banned lists apply.
 */
export function findPartnerBannedPhrase(text: string): string | null {
  const banned = partnerBannedPhrases()
  const lower = text.toLowerCase()
  for (const phrase of banned) {
    if (lower.includes(phrase.toLowerCase())) return phrase
  }
  return null
}
