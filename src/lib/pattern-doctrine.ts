/**
 * The canonical PATTERN and STATE vocabulary, shared by the funnel and the
 * coaching engine.
 *
 * The two halves of the platform were speaking different languages. The funnel
 * types a pattern rigorously (leads.scorecard_profile, carried into Blueprint /
 * Membership / Extension by resolveBuyerPattern) while the CFFS - which does the
 * deepest read in the system - named zero of the four canonical patterns in its
 * prompt and emitted its interpretation as prose. A client sold on a named
 * pattern through three products quietly lost the label at the moment they
 * became a 1:1 client.
 *
 * DOCTRINE, decided 2026-07-28:
 *
 * Pattern is a READ, not a permanent attribute. It is allowed to change as
 * evidence improves, because the evidence is not comparable: the scorecard is
 * 25 self-reported answers, the CFFS is 221 intake points plus photographs plus
 * measurements plus (when present) blood markers. More evidence wins.
 *
 * Three rules keep that honest rather than chaotic:
 *   1. Reads are VERSIONED, never overwritten. Every read keeps its source and
 *      date, so "what did we think, when, on what evidence" is always
 *      answerable.
 *   2. A change must be JUSTIFIED. The CFFS has to say why it departs from the
 *      incoming read, not merely return a different label. This is also the
 *      thrash guard: without it a regenerated CFFS could return a different
 *      pattern each time and nobody would know which was real.
 *   3. Patterns move at BLOCK BOUNDARIES, not mid-block. A client should never
 *      be relabelled halfway through a training block.
 *
 * Consequence accepted deliberately: the funnel must present a pattern as a
 * first read, not a verdict.
 */

/** The four canonical patterns. Scorecard/doctrine names are authoritative. */
export const CANONICAL_PATTERNS = [
  'Stress-Stored',
  'Insulin-Drift',
  'Estrogen-Shift',
  'Androgen-Decline',
] as const

export type CanonicalPattern = (typeof CANONICAL_PATTERNS)[number]

export function isCanonicalPattern(v: unknown): v is CanonicalPattern {
  return typeof v === 'string' && (CANONICAL_PATTERNS as readonly string[]).includes(v)
}

/** What each pattern means, for the prompt. Kept short: the CFFS reasons, this only names. */
export const PATTERN_DEFINITIONS: Record<CanonicalPattern, string> = {
  'Stress-Stored':
    'Sympathetic load is the organising force. Central and midsection storage, waist changes tracking stress rather than intake, disrupted sleep, appetite and energy swinging with load. Effort goes in, the body holds because it is defending.',
  'Insulin-Drift':
    'Metabolic handling has drifted. Storage follows carbohydrate and meal timing, energy dips post-meal, waist creeps without a matching change in intake, hunger poorly correlated with need.',
  'Estrogen-Shift':
    'A hormonal transition is reorganising distribution. Storage moves toward the midsection from a previously peripheral pattern, thermoregulation and sleep change, and the training response alters despite unchanged behaviour. Peri- and post-menopausal, or a surgical or pharmacological equivalent.',
  'Androgen-Decline':
    'Output and recovery capacity have fallen together. Reduced training tolerance, slower recovery, flattened drive and mood, strength expression declining despite consistent exposure.',
}

/** How certain a read is. Low means the coach should treat it as provisional. */
export const PATTERN_CONFIDENCE = ['low', 'moderate', 'high'] as const
export type PatternConfidence = (typeof PATTERN_CONFIDENCE)[number]

export function isPatternConfidence(v: unknown): v is PatternConfidence {
  return typeof v === 'string' && (PATTERN_CONFIDENCE as readonly string[]).includes(v)
}

/** Where a resolved pattern came from, worst evidence first. */
export const PATTERN_SOURCES = ['scorecard', 'challenge', 'cffs'] as const
export type PatternSource = (typeof PATTERN_SOURCES)[number]

/**
 * Evidence weight. A CFFS read supersedes a funnel read because it is drawn
 * from an order of magnitude more evidence, not because it is newer.
 */
const SOURCE_WEIGHT: Record<PatternSource, number> = {
  scorecard: 1,   // 25 self-reported answers, often low confidence
  challenge: 2,   // confirmed against 14 days of behaviour
  cffs: 3,        // 221 intake points, photos, measurements, blood markers
}

export function supersedes(incoming: PatternSource, existing: PatternSource | null | undefined): boolean {
  if (!existing) return true
  return SOURCE_WEIGHT[incoming] >= SOURCE_WEIGHT[existing]
}

/**
 * Scorecard body state to CFFS body state.
 *
 * These are two vocabularies for the same axis and the relationship existed
 * only in Kade's head. A client told "Depleted" for months was silently
 * relabelled "Remediation" at conversion, with nothing in the schema stating
 * that these are the same finding at different depths.
 */
export const SCORECARD_STATE_TO_CFFS_STATE: Record<string, string> = {
  'Depleted State': 'Remediation',
  'Transitioning State': 'Optimisation',
  'Ready State': 'Post-Optimisation',
}

export function cffsStateForScorecardState(scorecardState: string | null | undefined): string | null {
  if (!scorecardState) return null
  return SCORECARD_STATE_TO_CFFS_STATE[scorecardState.trim()] ?? null
}

/** The prompt block that teaches the CFFS the taxonomy it was never given. */
export function patternTaxonomyPromptSection(incoming?: {
  pattern: string | null
  source: string | null
  confidence: string | null
}): string {
  const definitions = CANONICAL_PATTERNS.map(p => `- ${p}: ${PATTERN_DEFINITIONS[p]}`).join('\n')

  const incomingBlock = incoming?.pattern
    ? `\nINCOMING READ
The funnel already read this client as ${incoming.pattern} (source: ${incoming.source ?? 'unknown'}, confidence: ${incoming.confidence ?? 'unknown'}).
That read came from far less evidence than you hold. You are not bound by it, and you should not defer to it. But if you depart from it you must say why in pattern_rationale, naming the evidence that moved you. If you agree with it, say what in this intake confirms it rather than simply repeating the label.\n`
    : `\nINCOMING READ
None. This client has no prior pattern read, so yours is the first.\n`

  return `PATTERN CLASSIFICATION (required)

Body Recode names four patterns. These are doctrine and the vocabulary is fixed. You must classify this client as exactly one.

${definitions}
${incomingBlock}
Patterns are read, not diagnosed, and they describe how a body is currently organising itself rather than a permanent type. Choose the pattern the convergent evidence best supports. Where two are plausible, choose the one the intake evidence supports most strongly and say in your rationale what would need to be true for the other.

Set pattern_confidence honestly:
- high: multiple independent signal domains converge and nothing meaningful contradicts
- moderate: the read is supported but rests on fewer domains, or one signal cuts against it
- low: the evidence is thin or genuinely split. Say so. A low-confidence read the coach can see is worth far more than false certainty.`
}
