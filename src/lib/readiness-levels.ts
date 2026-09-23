/**
 * The four readiness ratings (capacity, schedule, regulation, behaviour), named.
 *
 * WHY THIS FILE EXISTS. The engine stores these as Green, Amber and Red, and
 * those are traffic-light words sitting on screens beside a locked palette in
 * which amber already means Remediation and red already means a safety gate has
 * fired. Seven coach surfaces were also PAINTING them in those exact colours, so
 * the same amber meant "this is a readiness" in one box and "schedule is a bit
 * awkward" in the box beside it. Kade, 23 Sep 2026: the four ratings were never
 * meant to carry a colour, only a name.
 *
 * THE NAMES ARE ONE IDEA AT THREE STRENGTHS, and the idea is the only question
 * the rating answers: is this thing holding them back, and is it the worst one.
 *   Green — Not limiting
 *   Amber — Limiting
 *   Red   — Main limit
 *
 * A FIRST ATTEMPT USED THE RUBRIC'S OWN WORDS, Clear / Limiting / Binding, and
 * Kade could not read them: "i dont get these and i dont know why the names
 * changed". Binding is a legal word. Language that is precise inside a scoring
 * rubric is not automatically language that works as a label, and nobody should
 * have to be taught a word to read their own dashboard.
 *
 * THE STORED VALUE IS UNCHANGED, deliberately. It is what every rule downstream
 * counts, what the reassessment triggers compare, and what sits on every
 * historical record. Renaming the display is a one-file change; renaming the
 * stored value touches the engine's output contract, the carry-forward rules and
 * every past row, and that is a separate change that has to be proved rather
 * than swept. This is the same shape as the readiness names, which are stored as
 * Remediation and shown to a client as Depleted.
 *
 * SEVERITY IS CARRIED BY WEIGHT, NOT BY HUE, because the palette rule is that
 * colour appears only where it means something and these are not readiness.
 */

export type ReadinessLevelTone = 'quiet' | 'normal' | 'strong'

const NOT_LIMITING = { label: 'Not limiting', tone: 'quiet' as ReadinessLevelTone, meaning: 'Not holding anything back right now.' }
const LIMITING = { label: 'Limiting', tone: 'normal' as ReadinessLevelTone, meaning: 'Holding them back enough to shape how much is asked of them, but it is not the worst one.' }
const MAIN_LIMIT = { label: 'Main limit', tone: 'strong' as ReadinessLevelTone, meaning: 'The one holding everything else back. Until this moves, the other three cannot go far.' }

const LEVELS: Record<string, { label: string; tone: ReadinessLevelTone; meaning: string }> = {
  Green: NOT_LIMITING,
  Amber: LIMITING,
  Red: MAIN_LIMIT,
  // Accepts the names themselves, so a surface can be pointed at either and a
  // future change to what is stored does not break every screen at once.
  'Not limiting': NOT_LIMITING,
  Limiting: LIMITING,
  'Main limit': MAIN_LIMIT,
}

const UNKNOWN = { label: 'Not rated', tone: 'quiet' as ReadinessLevelTone, meaning: 'No rating on record for this domain.' }

/** The word a coach reads in place of the stored Green / Amber / Red. */
export function readinessLevel(value: string | null | undefined) {
  if (!value) return UNKNOWN
  return LEVELS[value] ?? UNKNOWN
}

export function readinessLevelLabel(value: string | null | undefined) {
  return readinessLevel(value).label
}
