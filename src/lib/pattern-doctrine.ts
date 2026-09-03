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
 * 25 self-reported answers, the CFFS is 230 intake points plus photographs plus
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
    'Sympathetic load is the organising force. Storage sits central and ANTERIOR — the front of the midsection and waist — while the limbs stay lean or thin out. That contrast is the discriminator. Waist changes track stress rather than intake, sleep is disrupted, appetite and energy swing with load. Effort goes in, the body holds because it is defending.',
  'Insulin-Drift':
    'Metabolic handling has drifted. Storage sits POSTERIOR AND FLANK — mid-back, lower back, love handles — plus deep abdominal fullness, with the front relatively spared. The discriminator is timing: afternoon crash, evening cravings, heavy for an hour after eating. Generalised surface softness is not the signal.',
  'Estrogen-Shift':
    'Oestrogen is reorganising distribution, in two phases. Phase 1, oestrogen sufficient: gluteofemoral storage at hips, glutes and outer thighs, with cyclical fluid variation. Phase 2, oestrogen falling: redistribution toward the midsection with lean mass falling alongside, thermoregulation and sleep changing, training response altering despite unchanged behaviour. Read the phase, not just the location. Peri- and post-menopausal, or a surgical or pharmacological equivalent.',
  'Androgen-Decline':
    'A composition shift rather than a storage location. Central fat rises while lean mass falls, the chest fills via aromatisation, and output and recovery capacity fall together. Reduced training tolerance, slower recovery, flattened drive and mood, strength expression declining despite consistent exposure. The discriminator is muscle and drive falling, not fat rising alone.',
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
  cffs: 3,        // 230 intake points, photos, measurements, blood markers
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

/**
 * Progress Read body state to CFFS body state.
 *
 * A THIRD spelling of the same axis. The Progress Read
 * (`trajectory-generator.ts`) re-scores state onto `programs.tr_new_body_state`
 * using the BARE public labels from its `STATE_ORDER`: Depleted / Transitioning
 * / Ready. Note these are NOT the scorecard's labels above, which carry the
 * word "State" ("Depleted State"), so `SCORECARD_STATE_TO_CFFS_STATE` does not
 * match them and returns null.
 *
 * Anything carrying a re-score forward into a generator that reads
 * `body_state_classification` MUST translate first. Feeding "Transitioning"
 * into the program prompt hands the eligibility rules a word they do not
 * define, and the block silently derives the wrong level.
 */
export const PUBLIC_STATE_TO_CFFS_STATE: Record<string, string> = {
  'Depleted': 'Remediation',
  'Transitioning': 'Optimisation',
  'Ready': 'Post-Optimisation',
}

/**
 * Accepts either vocabulary and returns the internal CFFS classification.
 * Returns null for anything unrecognised, so callers can reject rather than
 * pass an unknown state into a prompt.
 */
export function cffsStateForAnyStateLabel(label: string | null | undefined): string | null {
  if (!label) return null
  const trimmed = label.trim()
  if (Object.values(PUBLIC_STATE_TO_CFFS_STATE).includes(trimmed)) return trimmed
  return PUBLIC_STATE_TO_CFFS_STATE[trimmed] ?? SCORECARD_STATE_TO_CFFS_STATE[trimmed] ?? null
}

/**
 * What each body STATE means, for grounding a generator that would otherwise
 * describe the state from the model's own general knowledge. Keyed by the
 * internal classification names (the values `signalPattern` takes in the $37
 * report). Kept short and non-diagnostic; a generator should translate these
 * into plain language, not quote them. Public labels: Remediation = Depleted,
 * Optimisation = Transitioning, Post-Optimisation = Ready.
 */
export const STATE_DEFINITIONS: Record<string, string> = {
  'Remediation':
    'The system is under a load it cannot currently resolve. Recovery capacity is low and the body is protecting rather than adapting, so effort goes in but does not convert into change. The work is to lower the load and rebuild the base before pushing. Effort here is not the missing ingredient.',
  'Optimisation':
    'The system has stabilised and can take real work, but one foundation is the bottleneck holding the rest down. The capacity exists, it is just not fully expressed yet. The work is to lift the single limiting input, and the rest tends to follow it up rather than needing to be forced.',
  'Post-Optimisation':
    'Foundations are intact and the body responds to inputs the way it should. What is in the way is the prescription rather than the biology, the right stimulus or timing or a missing quality. The work is to sharpen and periodise, not to repair.',
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
