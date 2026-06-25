/**
 * Yoga prescription doctrine, expressed as code. Modality pack: yoga.
 *
 * Parallel to training-doctrine.ts (strength). Same principle:
 * never trust the LLM for enforcement, trust it for prose. The generator
 * proposes a sequence; the functions here clamp it to what is safe and
 * coherent for the client's recovery state and contraindications.
 *
 * v1 is authored from general yoga programming knowledge. A domain expert
 * (e.g. Melisa) deepens it later without changing this interface.
 *
 * It reuses the universal Recovery & Regulation System (RRS) levels rather
 * than inventing a new state model, so the body-state reading transfers
 * straight from the strength modality.
 */

export type YogaIntensity = 'restorative' | 'gentle' | 'moderate' | 'strong'

const INTENSITY_ORDER: YogaIntensity[] = ['restorative', 'gentle', 'moderate', 'strong']

/** RRS execution levels (shared with the strength engine). */
export type RRSLevel = 0 | 1 | 2 | 3 | 4

/**
 * Map the client's recovery state to the strongest practice we will allow.
 * This is a hard ceiling: coach guidance and the generator may go gentler,
 * never stronger.
 *
 *   Level 0-1  protective / instability   -> restorative only
 *   Level 2    stabilisation              -> gentle
 *   Level 3    standard execution         -> moderate
 *   Level 4    advanced, sustained stable -> strong
 */
export function intensityCeilingForState(level: RRSLevel): YogaIntensity {
  switch (level) {
    case 0:
    case 1:
      return 'restorative'
    case 2:
      return 'gentle'
    case 3:
      return 'moderate'
    case 4:
      return 'strong'
  }
}

export function intensityAtOrBelow(a: YogaIntensity, ceiling: YogaIntensity): boolean {
  return INTENSITY_ORDER.indexOf(a) <= INTENSITY_ORDER.indexOf(ceiling)
}

/**
 * Hard safety floor: remove any pose whose contraindications intersect the
 * client's. Mirrors the strength engine's injury-contraindication floor that
 * coach guidance may not override.
 */
export function filterContraindicated<T extends { contraindications: string[] }>(
  poses: T[],
  clientContraindications: string[],
): T[] {
  const flags = new Set(clientContraindications.map((c) => c.toLowerCase().trim()))
  if (flags.size === 0) return poses
  return poses.filter(
    (p) => !p.contraindications.some((c) => flags.has(c.toLowerCase().trim())),
  )
}

/** Families that must be neutralised by a counterpose before moving on. */
const NEEDS_COUNTERPOSE: ReadonlySet<string> = new Set(['backbend', 'twist', 'inversion'])

export function needsCounterpose(family: string): boolean {
  return NEEDS_COUNTERPOSE.has(family)
}

/**
 * The practice arc. A session is a bell curve of intensity: settle, warm,
 * build to a peak appropriate to the ceiling, then come down and rest.
 * Returned as ordered segments with a rough share of total time, so the
 * generator fills each segment from the library.
 */
export interface PracticeSegment {
  key: string
  label: string
  /** rough proportion of total practice time */
  share: number
  /** families that belong in this segment */
  families: string[]
}

export function practiceArc(ceiling: YogaIntensity): PracticeSegment[] {
  // Restorative practice is mostly stillness and breath; strong practice
  // earns a real peak. Everything ends in rest.
  if (ceiling === 'restorative') {
    return [
      { key: 'center', label: 'Centering & breath', share: 0.2, families: ['pranayama'] },
      { key: 'open', label: 'Gentle opening', share: 0.3, families: ['supine', 'kneeling', 'restorative'] },
      { key: 'hold', label: 'Supported holds', share: 0.35, families: ['restorative', 'forward_fold', 'twist'] },
      { key: 'rest', label: 'Rest', share: 0.15, families: ['restorative'] },
    ]
  }
  if (ceiling === 'gentle') {
    return [
      { key: 'center', label: 'Centering & breath', share: 0.15, families: ['pranayama'] },
      { key: 'warm', label: 'Warm-up', share: 0.25, families: ['kneeling', 'supine', 'seated'] },
      { key: 'move', label: 'Gentle movement', share: 0.3, families: ['standing', 'forward_fold', 'side_bend'] },
      { key: 'cool', label: 'Cooldown & twist', share: 0.18, families: ['twist', 'seated'] },
      { key: 'rest', label: 'Rest', share: 0.12, families: ['restorative'] },
    ]
  }
  // moderate / strong
  return [
    { key: 'center', label: 'Centering & breath', share: 0.1, families: ['pranayama'] },
    { key: 'warm', label: 'Warm-up', share: 0.18, families: ['kneeling', 'sun_salutation'] },
    { key: 'build', label: 'Standing & flow', share: 0.27, families: ['sun_salutation', 'standing', 'balance'] },
    { key: 'peak', label: 'Peak', share: 0.17, families: ['backbend', 'balance', 'inversion', 'core'] },
    { key: 'counter', label: 'Counterpose & unwind', share: 0.16, families: ['forward_fold', 'twist'] },
    { key: 'rest', label: 'Rest', share: 0.12, families: ['restorative'] },
  ]
}

/**
 * The prose doctrine handed to the generator. Enforcement still lives in the
 * functions above; this steers the model's choices within those bounds.
 */
export const YOGA_GENERATION_DOCTRINE = `
YOGA PROGRAMMING DOCTRINE (v1)

You are sequencing a single yoga practice for one client, in their coach's voice.
You propose the shape; hard limits are enforced in code after you respond.

STATE FIRST
- The client's recovery state sets the strongest practice allowed (the ceiling).
- A depleted or dysregulated client gets restorative or gentle practice: long
  supported holds, breath, floor work. No strong balances, deep backbends or
  inversions, regardless of what they ask for.
- A stable, well-recovered client can be built toward a peak.

THE ARC
- Every practice is a bell curve: settle and breathe, warm the body, build to a
  peak appropriate to the ceiling, counterpose, then rest. Always end in stillness.
- Warm the spine before any backbend. Never follow a deep backbend directly with a
  deep forward fold; pass through neutral.

SEQUENCING RULES
- After a backbend, twist or inversion, give a counterpose before moving on.
- Anything done on one side is done on the other. Keep the practice symmetrical.
- Build complexity gradually. Do not open with the hardest shape.
- Link breath to movement in flowing segments; lengthen holds in still ones.

SAFETY
- Respect every client contraindication. Offer a prop or a gentler variant rather
  than omitting an opening entirely where it is safe to do so.
- Inversions are contraindication-sensitive (blood pressure, neck, eyes,
  pregnancy). Only include them at moderate/strong ceilings and never against a flag.

VOICE
- Plain, warm, specific. Name the breath. No diagnoses, no medical claims, no em dashes.
`.trim()

// ---------------------------------------------------------------------------
// Generated-sequence shape + post-LLM clamp (enforcement, not prose).
// ---------------------------------------------------------------------------

export interface YogaPoseRef {
  name: string
  side?: 'left' | 'right' | 'both'
  hold_seconds?: number
  breaths?: number
  cue?: string
}

export interface YogaSequenceSegment {
  key: string
  label: string
  poses: YogaPoseRef[]
}

export interface YogaSequence {
  practice_name: string
  intention: string
  segments: YogaSequenceSegment[]
  summary?: string
}

/** One practice within a block (the weekly template repeats with progression). */
export interface YogaPractice {
  day_label: string
  intention?: string
  segments: YogaSequenceSegment[]
}

/** A multi-week yoga block, parallel to a strength training block. Stored in
 *  the shared programs columns (block_name, prescription_rationale,
 *  weekly_pattern_summary, progression_notes, sessions). */
export interface YogaBlock {
  block_name: string
  rationale: string
  weekly_structure: string
  progression: string
  practices: YogaPractice[]
}

/** Clamp every practice in a block: allowed poses only, symmetry, closing rest. */
export function clampYogaBlock(
  block: YogaBlock,
  allowedPoseNames: Iterable<string>,
): { block: YogaBlock; notes: string[] } {
  const notes: string[] = []
  const practices = (block.practices ?? []).map((pr) => {
    const { sequence, notes: n } = clampYogaSequence(
      { practice_name: pr.day_label, intention: pr.intention ?? '', segments: pr.segments },
      allowedPoseNames,
    )
    notes.push(...n)
    return { day_label: pr.day_label, intention: pr.intention, segments: sequence.segments }
  })
  return { block: { ...block, practices }, notes }
}

/**
 * Clamp the generated sequence to the hard floor. The generator may only use
 * poses from the allowed set (the library already filtered by intensity
 * ceiling and contraindications), so any pose outside it is dropped. We also
 * enforce bilateral symmetry and a closing rest. Soft issues are returned as
 * notes rather than silently changed.
 */
/** Normalise a pose name for tolerant matching: lowercase, drop any
 * parenthetical (e.g. an appended Sanskrit name), collapse whitespace. */
function normaliseName(n: string): string {
  return (n ?? '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function clampYogaSequence(
  sequence: YogaSequence,
  allowedPoseNames: Iterable<string>,
): { sequence: YogaSequence; notes: string[] } {
  // Map normalised name -> canonical library name, so a fuzzy model output
  // ("Child's Pose (Balasana)") resolves to the canonical name and is kept.
  const canonical = new Map<string, string>()
  for (const n of allowedPoseNames) canonical.set(normaliseName(n), n)
  const notes: string[] = []

  const segments: YogaSequenceSegment[] = []
  for (const seg of sequence.segments ?? []) {
    const kept: YogaPoseRef[] = []
    for (const pose of seg.poses ?? []) {
      const match = canonical.get(normaliseName(pose.name))
      if (!match) {
        notes.push(`Removed "${pose.name}" (outside allowed library for this state).`)
        continue
      }
      kept.push({ ...pose, name: match })
    }
    // Bilateral symmetry: a one-sided pose must be balanced by its mirror.
    // Only add a mirror when neither neighbour is already the matching side,
    // so an existing left/right pair is left alone.
    const balanced: YogaPoseRef[] = []
    for (let i = 0; i < kept.length; i++) {
      const pose = kept[i]
      balanced.push(pose)
      if (pose.side === 'left' || pose.side === 'right') {
        const mirror = pose.side === 'left' ? 'right' : 'left'
        const prev = kept[i - 1]
        const next = kept[i + 1]
        const pairedWithPrev = prev && prev.name === pose.name && prev.side === mirror
        const pairedWithNext = next && next.name === pose.name && next.side === mirror
        if (!pairedWithPrev && !pairedWithNext) {
          balanced.push({ ...pose, side: mirror })
          notes.push(`Added the ${mirror} side of "${pose.name}" for symmetry.`)
        }
      }
    }
    if (balanced.length > 0) segments.push({ ...seg, poses: balanced })
  }

  // Always end in stillness.
  const last = segments[segments.length - 1]
  if (!last || last.key !== 'rest') {
    notes.push('Practice did not close with rest; a closing rest should be added.')
  }

  return { sequence: { ...sequence, segments }, notes }
}
