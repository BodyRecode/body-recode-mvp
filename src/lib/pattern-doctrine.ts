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
 * 25 self-reported answers, the CFFS is 234 intake points plus photographs plus
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

/**
 * What a READ may return: one of the four, or Indeterminate.
 *
 * Fat Map LOCKED v2.2: "Returned when nothing points cleanly at one of the
 * four, and returned by design for a Ready body, because the patterns describe
 * compensation and a Ready body has none to describe." The funnel typing engine
 * has always returned it; until 14 Sep 2026 the read could not, and the database
 * refused it, so an honest "nothing fits" was forced into a label.
 *
 * The MODEL is still four patterns. Indeterminate is a result, not a fifth
 * pattern, so it is deliberately not in CANONICAL_PATTERNS and never appears as
 * a competing read.
 */
export const INDETERMINATE = 'Indeterminate' as const
export type ReadPattern = CanonicalPattern | typeof INDETERMINATE

export function isReadPattern(v: unknown): v is ReadPattern {
  return v === INDETERMINATE || isCanonicalPattern(v)
}

/** Plain words for a coach screen or a prompt. Never shown to a client as "Indeterminate". */
export function readPatternLabel(v: string | null | undefined): string | null {
  if (!v) return null
  return v === INDETERMINATE ? 'No clear pattern yet' : v
}

/** What each pattern means, for the prompt. Kept short: the CFFS reasons, this only names. */
export const PATTERN_DEFINITIONS: Record<CanonicalPattern, string> = {
  'Stress-Stored':
    'Sympathetic load is the organising force. Storage sits central and ANTERIOR — the front of the midsection and waist — while the limbs stay lean or look leaner. That contrast is how it is read, not a mechanism: no study shows cortisol taking fat off the limbs (see Fat_Map_Definitions_LOCKED v2.2). Waist changes track stress rather than intake, sleep is disrupted, appetite and energy swing with load. Effort goes in, the body holds because it is defending.',
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
  cffs: 3,        // 234 intake points, photos, measurements, blood markers
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

/**
 * Her own answers on the scorecard (or Body Decode / founding page), as stored
 * codes. Added 2026-09-14: the read used to receive only the funnel's pattern
 * NAME, never the answers behind it, so direction of change never reached it.
 */
export interface FunnelAnswers {
  storageDirection?: string | null
  fatStorage?: string | null
  cycleStatus?: string | null
}

export interface IncomingPattern {
  pattern: string | null
  source: string | null
  confidence: string | null
  answers?: FunnelAnswers | null
}

const FUNNEL_STORAGE_WORDS: Record<string, string> = {
  midsection: 'Belly and front of the stomach',
  posterior: 'Lower back, love handles and upper back',
  hips_thighs: 'Hips, thighs and lower body',
  all_over: "Fairly even, she could not pick one spot",
  low_tone: 'Losing muscle tone and definition',
}
const FUNNEL_DIRECTION_WORDS: Record<string, string> = {
  gluteofemoral: 'It has stayed on her hips, thighs and glutes',
  to_middle: 'It used to be hips and thighs, now it is moving to her middle',
  always_central: 'It has always been her middle',
  always_even: 'It has always been fairly even all over',
  unsure: 'She is not sure',
}
const FUNNEL_CYCLE_WORDS: Record<string, string> = {
  regular: 'Regular cycle',
  irregular: 'Irregular cycle',
  perimenopausal: 'Perimenopausal',
  postmenopausal: 'Postmenopausal',
}

/**
 * The block that puts her pre-reveal answers in front of the read. Empty when
 * she gave none. These are the one set of self-reports that are NOT echoes of a
 * pattern description, because she gave them before any result was shown.
 */
export function funnelAnswersBlock(answers?: FunnelAnswers | null): string {
  if (!answers) return ''
  const lines: string[] = []
  const storage = answers.fatStorage ? FUNNEL_STORAGE_WORDS[answers.fatStorage] : null
  const direction = answers.storageDirection ? FUNNEL_DIRECTION_WORDS[answers.storageDirection] : null
  const cycle = answers.cycleStatus ? FUNNEL_CYCLE_WORDS[answers.cycleStatus] : null
  if (storage) lines.push(`Where she tends to store fat: ${storage}`)
  if (direction) lines.push(`How that has changed over the last few years: ${direction}`)
  if (cycle) lines.push(`Cycle, as she selected it: ${cycle} (her own selection; never label her with it, per HORMONAL STATUS INTEGRATION rule 4)`)
  if (lines.length === 0) return ''
  return `
HER OWN SCORECARD ANSWERS, GIVEN BEFORE ANY PATTERN WAS SHOWN TO HER
${lines.join('\n')}
These were answered before she saw any read, so unlike her intake self-report they are not echoes of a pattern description (Interpretation Logic v2.0, rule 5). Weight them as independent reports. Direction of change is read under HORMONAL STATUS INTEGRATION rule 4a. Where one of these disagrees with the same thing answered in the intake, say so in pattern_rationale and let it lower confidence; the scorecard's location options are coarser than the intake's, so a difference in wording alone is not a disagreement. A report is still not a measurement: a plausible tape outranks either for where fat sits now.
`
}

/** The prompt block that teaches the CFFS the taxonomy it was never given. */
export function patternTaxonomyPromptSection(incoming?: IncomingPattern): string {
  const definitions = CANONICAL_PATTERNS.map(p => `- ${p}: ${PATTERN_DEFINITIONS[p]}`).join('\n')

  // A Progress Read passes her PREVIOUS READ, not a funnel read. That is not
  // "far less evidence than you hold", and her answers were not primed by it the
  // way a scorecard reveal primes an intake, so it gets its own framing. Existing
  // callers never pass this source, so the Foundational Read prompt is unchanged.
  if (incoming?.source === 'previous_read') {
    const block = incoming.pattern
      ? `\nPREVIOUS READ\nHer last read typed her as ${incoming.pattern} (confidence: ${incoming.confidence ?? 'unknown'}). You now hold comparable or better evidence, so you are entitled to re-type her. A change must rest on converging evidence from at least two independent sources, never on one shifted answer, and pattern_change must name that evidence. Where the evidence does not converge, hold the previous pattern and say so.\n`
      : `\nPREVIOUS READ\nHer last read named no pattern. Type her on the evidence you now hold.\n`
    return patternSection(definitions, block)
  }

  const incomingBlock = incoming?.pattern
    ? `\nINCOMING READ
The funnel already read this client as ${incoming.pattern} (source: ${incoming.source ?? 'unknown'}, confidence: ${incoming.confidence ?? 'unknown'}).
That read came from far less evidence than you hold. You are not bound by it, and you should not defer to it. But if you depart from it you must say why in pattern_rationale, naming the evidence that moved you. If you agree with it, say what in this intake confirms it rather than simply repeating the label.

AND A SECOND, LESS OBVIOUS PROBLEM WITH IT. The client was very likely shown that read, by name and with a description, before completing this intake. So their self-reported answers here are not independent of it: a person who has been told they store fat under stress will read their own body through that description. This is measurable rather than theoretical. People given a symptom narrative report significant symptom increases during sham exposure with nothing present at all.

Treat agreement between the funnel read and the client's self-report as WEAK confirmation, because the second may be an echo of the first. What is not affected is anything the client could not have known to align: measurements, photographs, blood markers, timing patterns, and the answers whose relevance is not obvious from a pattern description. Weight those normally and lean on them where the two sources agree suspiciously well.\n`
    : `\nINCOMING READ
None. This client has no prior pattern read, so yours is the first.\n`

  return patternSection(definitions, incomingBlock + funnelAnswersBlock(incoming?.answers))
}

function patternSection(definitions: string, incomingBlock: string): string {
  return `PATTERN CLASSIFICATION (required)

Body Recode names four patterns. These are doctrine and the vocabulary is fixed. Classify this client as exactly one of the four, OR as Indeterminate under the rule below.

${definitions}
${incomingBlock}
Patterns are read, not diagnosed, and they describe how a body is currently organising itself rather than a permanent type. Choose the pattern the convergent evidence best supports. Where two are plausible, choose the one the intake evidence supports most strongly and say in your rationale what would need to be true for the other.

INDETERMINATE (Fat Map LOCKED v2.2). Return "Indeterminate" when, and only when, one of these is true:
1. NOTHING POINTS CLEANLY AT ONE OF THE FOUR. No pattern's discriminator converges: the storage signals are scattered or low, and the accompanying signal that decides a pattern (limbs versus middle for Stress-Stored, timing for Insulin-Drift, cycle status and direction of travel for Estrogen-Shift, falling muscle and drive for Androgen-Decline) is absent for every pattern.
2. A READY BODY. Body state is Post-Optimisation. The patterns describe compensation, and a Ready body has none to describe. Return Indeterminate by design, and do not treat this as a gap.
3. THE ONLY SUPPORTED PATTERN IS RULED OUT OR UNCONFIRMED. The evidence converges only on a sex-specific pattern that the sex gate rules out, or that cannot be confirmed because sex at birth is unresolved, and none of the patterns that do apply has real support of its own.
4. TOO LITTLE EVIDENCE TO READ. The questions that carry the discriminators were not answered, so no pattern can be supported from what is present.

Indeterminate is NOT a hedge. If one pattern genuinely leads, even weakly, name it at "low" confidence: low means one pattern leads but the evidence is thin; Indeterminate means nothing leads. Never return Indeterminate to avoid a hard call, and never because two patterns are close (that is a named pattern with a competing read).

When the result is Indeterminate:
- pattern_competing_read names the pattern the evidence LEANS toward, if any, otherwise "None". It is never "Indeterminate".
- pattern_rationale says which of the four conditions above applies and what the evidence does and does not show.
- pattern_watch_for tells the coach the specific evidence that would settle a pattern and where it would come from (a re-measure, photos, a check-in signal, a question not yet answered). For a Ready body, say plainly that no pattern is expected.
- pattern_confidence is how settled the absence of a single pattern is: high for a Ready body or clearly scattered signals, low where a pattern may emerge with more evidence.

Set pattern_confidence honestly:
- high: multiple independent signal domains converge and nothing meaningful contradicts
- moderate: the read is supported but rests on fewer domains, or one signal cuts against it
- low: the evidence is thin or genuinely split. Say so. A low-confidence read the coach can see is worth far more than false certainty.`
}
