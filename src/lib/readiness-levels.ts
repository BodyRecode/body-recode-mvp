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
 * THE NAMES ARE NOT INVENTED. They are the rubric's own words for the three
 * levels (src/lib/cffs-prompt.ts):
 *   Green — "no meaningful constraint in this domain. Not excellent, just not limiting."
 *   Amber — "a real constraint is present and would shape how you load this person,
 *            but it is not the binding limit on everything."
 *   Red   — "this domain is the binding constraint. Until it moves, progress in the
 *            others is capped by it."
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

const LEVELS: Record<string, { label: string; tone: ReadinessLevelTone; meaning: string }> = {
  Green: { label: 'Clear', tone: 'quiet', meaning: 'Not limiting anything right now.' },
  Amber: { label: 'Limiting', tone: 'normal', meaning: 'A real constraint that should shape how much is asked, but not the ceiling on everything.' },
  Red: { label: 'Binding', tone: 'strong', meaning: 'The ceiling. Until this moves, progress everywhere else is capped by it.' },
  // Accepts the names themselves, so a surface can be pointed at either and a
  // future change to what is stored does not break every screen at once.
  Clear: { label: 'Clear', tone: 'quiet', meaning: 'Not limiting anything right now.' },
  Limiting: { label: 'Limiting', tone: 'normal', meaning: 'A real constraint that should shape how much is asked, but not the ceiling on everything.' },
  Binding: { label: 'Binding', tone: 'strong', meaning: 'The ceiling. Until this moves, progress everywhere else is capped by it.' },
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
