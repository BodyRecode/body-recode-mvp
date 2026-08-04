import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Single source of truth for resolving a buyer's biological PATTERN when they
 * enter the Blueprint / Membership / Extension, so a returning funnel lead is
 * never asked to re-do a read the system already has.
 *
 * Two taxonomies exist and must be reconciled here:
 *   - Canonical / scorecard names:  Stress-Stored, Insulin-Drift,
 *     Estrogen-Shift, Androgen-Decline  (leads.scorecard_profile)
 *   - Blueprint internal slugs:      stress-stored, metabolic-drift,
 *     hormonal-shift, system-overload  (blueprint_enrollments.pattern,
 *     challenge_enrollments.quiz_result)
 * The mapping is doctrine, mirrored from
 * challenge/[token]/body-decode-intake-result.tsx.
 *
 * Pattern READS, best-first:
 *   1. Challenge Day 7-14 quiz_result  — CONFIRMED by 14 days of data.
 *   2. Scorecard scorecard_profile      — PRELIMINARY; only carried when
 *      scorecard_profile_confidence = 'high' (≈a third come back 'low' and
 *      those people genuinely need the fuller assessment).
 *   3. Nothing usable → caller falls back to the in-portal assessment.
 *
 * Identity is anchored on the LEAD, matched by email OR phone, because a buyer
 * can pay under a different email than they used in the funnel (Stripe collects
 * the phone for exactly this cross-match).
 *
 * NB: challenge_enrollments has NO email column — it joins to the lead via
 * lead_id. Querying it by email (as an earlier version did) silently errored
 * and made the whole carry-over a no-op. Always go lead_id.
 */

export const BLUEPRINT_PATTERN_SLUGS = [
  'stress-stored',
  'metabolic-drift',
  'hormonal-shift',
  'system-overload',
] as const
export type BlueprintPatternSlug = (typeof BLUEPRINT_PATTERN_SLUGS)[number]

/** Canonical scorecard/doctrine name → Blueprint internal slug. */
export const CANONICAL_TO_SLUG: Record<string, BlueprintPatternSlug> = {
  'Stress-Stored': 'stress-stored',
  'Insulin-Drift': 'metabolic-drift',
  'Estrogen-Shift': 'hormonal-shift',
  'Androgen-Decline': 'system-overload',
}

function isSlug(v: string): v is BlueprintPatternSlug {
  return (BLUEPRINT_PATTERN_SLUGS as readonly string[]).includes(v)
}

/**
 * Normalise any pattern value to a Blueprint slug. Accepts an existing slug
 * (any case) or a canonical name. Returns null for 'Indeterminate' / unknown /
 * empty — the signal to run the in-portal assessment instead of carrying junk.
 */
export function toBlueprintSlug(value: string | null | undefined): BlueprintPatternSlug | null {
  if (!value) return null
  const trimmed = value.trim()
  if (isSlug(trimmed.toLowerCase())) return trimmed.toLowerCase() as BlueprintPatternSlug
  return CANONICAL_TO_SLUG[trimmed] ?? null
}

export type PatternSource = 'challenge' | 'scorecard'
export interface ResolvedPattern {
  slug: BlueprintPatternSlug | null
  source: PatternSource | null
  leadId: string | null
}

interface LeadRow {
  id: string
  scorecard_profile: string | null
  scorecard_profile_confidence: string | null
}

/**
 * Resolve a buyer's pattern from the best prior read on file, matched by email
 * OR phone. Returns {slug:null} when nothing usable exists (caller → assessment).
 */
export async function resolveBuyerPattern(
  admin: SupabaseClient,
  opts: { email?: string | null; phone?: string | null },
): Promise<ResolvedPattern> {
  const email = opts.email?.trim().toLowerCase() || null
  const phone = opts.phone?.trim() || null

  // Anchor on the lead identity (email first, then phone).
  let lead: LeadRow | null = null
  if (email) {
    const { data } = await admin
      .from('leads')
      .select('id, scorecard_profile, scorecard_profile_confidence')
      .ilike('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
    lead = (data?.[0] as LeadRow) ?? null
  }
  if (!lead && phone) {
    const { data } = await admin
      .from('leads')
      .select('id, scorecard_profile, scorecard_profile_confidence')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
    lead = (data?.[0] as LeadRow) ?? null
  }
  if (!lead) return { slug: null, source: null, leadId: null }

  // 1. Challenge-confirmed pattern (join via lead_id, NOT email).
  const { data: ce } = await admin
    .from('challenge_enrollments')
    .select('quiz_result')
    .eq('lead_id', lead.id)
    .not('quiz_result', 'is', null)
    .order('enrolled_at', { ascending: false })
    .limit(1)
  const challengeSlug = toBlueprintSlug((ce?.[0] as { quiz_result: string | null })?.quiz_result)
  if (challengeSlug) return { slug: challengeSlug, source: 'challenge', leadId: lead.id }

  // 2. High-confidence scorecard pattern (preliminary).
  if ((lead.scorecard_profile_confidence ?? '').toLowerCase() === 'high') {
    const scorecardSlug = toBlueprintSlug(lead.scorecard_profile)
    if (scorecardSlug) return { slug: scorecardSlug, source: 'scorecard', leadId: lead.id }
  }

  return { slug: null, source: null, leadId: lead.id }
}

// ---------------------------------------------------------------------------
// Blueprint fallback assessment
// ---------------------------------------------------------------------------

export type AssessmentSex = 'F' | 'M'

/**
 * Resolve a Blueprint pattern from the in-portal fallback assessment.
 *
 * Only used when resolveBuyerPattern finds nothing to carry over (no Challenge
 * result, no high-confidence scorecard). Mirrors the doctrine in
 * `fat-map-profile.ts` so a buyer who takes this route lands on the same pattern
 * the scorecard would have given them:
 *
 *   - Fat-storage location is the direct discriminator and LEADS when supplied.
 *     The symptom signal is the confirmer, not the decider.
 *   - Sex is a HARD GATE. Estrogen-Shift is female only, Androgen-Decline male
 *     only. A cross-sex answer is remapped rather than assigned impossibly.
 *
 * Ref: 00_PLAYBOOK/Fat_Map_Definitions_LOCKED.md v2.0.
 */
export function resolveAssessmentPattern(input: {
  storage?: string | null
  signal?: string | null
  sex?: AssessmentSex | null
}): string | null {
  const valid = (v?: string | null): string | null =>
    v && (BLUEPRINT_PATTERN_SLUGS as readonly string[]).includes(v) ? v : null
  const storage = valid(input.storage)
  const signal = valid(input.signal)
  if (!storage && !signal) return null

  // Storage leads. Falls back to the symptom signal when storage is absent.
  let resolved = storage ?? signal!

  // Sex gate, mirroring typeFatMapProfile's resolveSex.
  if (input.sex === 'F' && resolved === 'system-overload') {
    // Female low-tone read: oestrogen if anything points lower-body, else cortisol.
    resolved = storage === 'hormonal-shift' || signal === 'hormonal-shift'
      ? 'hormonal-shift'
      : 'stress-stored'
  }
  if (input.sex === 'M' && resolved === 'hormonal-shift') {
    // Male long-arc read: androgen if drive/capacity is also down, else insulin.
    resolved = signal === 'system-overload' ? 'system-overload' : 'metabolic-drift'
  }

  return resolved
}
