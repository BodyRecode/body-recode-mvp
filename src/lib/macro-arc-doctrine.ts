import type { ProgressionPhase } from './training-doctrine'

/**
 * Deterministic doctrine clamp for the macro arc.
 *
 * generate-program has clampProgramToDoctrine. suggest-plan had nothing: the
 * model's macro arc went straight to the database unvalidated. Three failures
 * on one client on 2026-07-28 showed why that is not survivable in a
 * white-label system, where there is no Kade reading every arc before it ships:
 *
 *   1. An `intensification` block for a client classified Remediation.
 *   2. A block named "De-emphasis & Taper", objective "reduce training load",
 *      with progression_phase set to `accumulation`. Made twice, which means
 *      the field was being filled rather than reasoned about.
 *   3. Invented event facts ("3-4 hour walk with uneven terrain, intermittent
 *      climbing") for a 28km event the model had no route information about.
 *
 * Prompt instructions do not fix these. A prompt is a request; a clamp is a
 * guarantee. Everything here is enforced in code after generation, and every
 * change is recorded so the coach sees what was altered and why.
 */

export type BodyState = 'Remediation' | 'Optimisation' | 'Post-Optimisation'

export interface MacroBlock {
  position: number
  block_name: string
  progression_phase: string | null
  phase_category: string | null
  phase_objective: string | null
  execution_arc: string | null
  training_goal: string | null
  week_duration: number
  training_frequency: number | null
  notes?: string | null
}

export interface MacroArcClampResult {
  blocks: MacroBlock[]
  /** Human-readable record of every change, surfaced to the coach. */
  notes: string[]
  /** Things a clamp cannot fix, needing the coach's eye. */
  warnings: string[]
}

/** Blocks have no position until they are saved, so fall back to the index. */
function label(b: MacroBlock, i: number): string {
  return String(b.position ?? i + 1)
}

const PHASE_ORDER: ProgressionPhase[] = ['restoration', 'accumulation', 'intensification', 'realization']

/**
 * Which phases a body state permissions.
 *
 * Doctrine: default state is stability, and progression is permissioned, never
 * assumed. A client in Remediation has not earned intensification by virtue of
 * a block having elapsed.
 */
export function allowedPhasesForBodyState(state: string | null | undefined): ProgressionPhase[] {
  switch ((state ?? '').trim()) {
    case 'Remediation':
      return ['restoration', 'accumulation']
    case 'Optimisation':
      return ['restoration', 'accumulation', 'intensification']
    case 'Post-Optimisation':
      return PHASE_ORDER
    default:
      // Unknown or missing state is the conservative case, not the permissive
      // one. No CFFS means no evidence anyone has earned load.
      return ['restoration', 'accumulation']
  }
}

/** Phase-appropriate training goals. Restoration is capacity only, always. */
function allowedGoalsForPhase(phase: ProgressionPhase): string[] {
  switch (phase) {
    case 'restoration':
      return ['capacity']
    case 'accumulation':
      return ['capacity', 'hypertrophy']
    case 'intensification':
      return ['capacity', 'hypertrophy', 'strength']
    case 'realization':
      return ['strength', 'power', 'peaking']
  }
}

/**
 * Words that mean a block is a deload, whatever the model labelled the phase.
 *
 * Deliberately narrow. An earlier version matched "consolidat" and "arrival",
 * which turned an accumulation block called "Aerobic & Lower-Body Capacity
 * Building" into restoration purely because its objective said "consolidate
 * sleep stability". A clamp that fires on the wrong block is worse than no
 * clamp: it corrupts a correct arc while looking authoritative.
 */
const TAPER_SIGNALS = /\b(taper|deload|de-?emphasis|unload|back-?off)\b/i

function looksLikeTaper(b: MacroBlock, isLast: boolean): boolean {
  const haystack = `${b.block_name} ${b.phase_category ?? ''}`
  // Explicit taper language in the NAME or category is decisive anywhere.
  if (TAPER_SIGNALS.test(haystack)) return true
  // An objective that says it reduces load only counts on the final block.
  // Mid-arc blocks legitimately talk about reducing one thing while building
  // another, and that is not a deload.
  if (!isLast) return false
  return /reduce\s+(?:\w+\s+){0,3}(load|volume|frequency)/i.test(b.phase_objective ?? '')
}

/** Claims about an event the system was never told: durations, terrain, elevation. */
const INVENTED_EVENT_CLAIM =
  /\b(\d+\s*[-–—to]+\s*\d+|\d+)\s*(hour|hr)s?\b|\buneven terrain\b|\bintermittent climb|\belevation\b|\bhilly\b|\btrail\b/i

/**
 * Clamp a model-produced macro arc to doctrine.
 *
 * `weeksAvailable` is the window before a dated event, when there is one.
 * Everything is applied deterministically; nothing here asks the model again.
 */
export function clampMacroArcToDoctrine(
  input: MacroBlock[],
  opts: {
    bodyState?: string | null
    weeksAvailable?: number | null
    /** Facts we actually hold about the event, e.g. "28km". Absent = we know nothing. */
    knownEventFacts?: string | null
  } = {}
): MacroArcClampResult {
  const blocks: MacroBlock[] = JSON.parse(JSON.stringify(input))
  const notes: string[] = []
  const warnings: string[] = []

  const allowed = allowedPhasesForBodyState(opts.bodyState)
  const highestAllowed = allowed[allowed.length - 1]
  const hasDatedEvent = typeof opts.weeksAvailable === 'number' && opts.weeksAvailable > 0

  blocks.sort((a, b) => a.position - b.position)

  // ── 1. Phase must be permissioned by body state ────────────────────────────
  for (const b of blocks) {
    const phase = (b.progression_phase ?? '').toLowerCase() as ProgressionPhase
    if (!PHASE_ORDER.includes(phase)) {
      b.progression_phase = 'restoration'
      notes.push(`Block ${label(b, blocks.indexOf(b))}: phase "${b.progression_phase}" was not a recognised phase, set to restoration.`)
      continue
    }
    if (!allowed.includes(phase)) {
      b.progression_phase = highestAllowed
      notes.push(
        `Block ${label(b, blocks.indexOf(b))} ("${b.block_name}"): ${phase} is not permissioned for a client in ` +
        `${opts.bodyState ?? 'an unknown state'}. Clamped to ${highestAllowed}. ` +
        `Progression is permissioned, never assumed.`
      )
    }
  }

  // ── 2. A taper block is restoration, whatever it was labelled ──────────────
  blocks.forEach((b, i) => {
    if (!looksLikeTaper(b, i === blocks.length - 1)) return
    if ((b.progression_phase ?? '').toLowerCase() !== 'restoration') {
      const was = b.progression_phase
      b.progression_phase = 'restoration'
      notes.push(
        `Block ${label(b, i)} ("${b.block_name}") reads as a deload but was labelled ${was}. ` +
        `Set to restoration. A block that reduces load is restoration by definition.`
      )
    }
  })

  // ── 3. The last block before a dated event must be a real taper ────────────
  if (hasDatedEvent && blocks.length > 0) {
    const last = blocks[blocks.length - 1]
    if ((last.progression_phase ?? '').toLowerCase() !== 'restoration') {
      const was = last.progression_phase
      last.progression_phase = 'restoration'
      last.training_goal = 'capacity'
      notes.push(
        `Block ${label(last, blocks.length - 1)} is the final block before the event but was ${was}. ` +
        `Set to restoration/capacity. Peaking into a fixed date is a programming error.`
      )
    }
    if (last.week_duration < 2) {
      warnings.push(
        `The taper is only ${last.week_duration} week(s). For an endurance event, two weeks of ` +
        `reducing load is usually the minimum. Consider extending it.`
      )
    }
  }

  // ── 4. Training goal must be phase-appropriate ─────────────────────────────
  for (const b of blocks) {
    const phase = (b.progression_phase ?? 'restoration').toLowerCase() as ProgressionPhase
    const goals = allowedGoalsForPhase(phase)
    const goal = (b.training_goal ?? '').toLowerCase()
    if (goal && !goals.includes(goal)) {
      b.training_goal = goals[0]
      notes.push(
        `Block ${label(b, blocks.indexOf(b))}: goal "${goal}" is not appropriate for ${phase}. Set to ${goals[0]}.`
      )
    }
  }

  // ── 5. Phase order never regresses mid-arc (a final taper is the exception) ─
  let highestSeen = -1
  blocks.forEach((b, i) => {
    const isLast = i === blocks.length - 1
    const idx = PHASE_ORDER.indexOf((b.progression_phase ?? 'restoration').toLowerCase() as ProgressionPhase)
    if (isLast && hasDatedEvent) return // the taper is meant to step back
    if (idx < highestSeen) {
      warnings.push(
        `Block ${label(b, blocks.indexOf(b))} steps back from ${PHASE_ORDER[highestSeen]} to ${PHASE_ORDER[idx]} ` +
        `mid-arc. Intentional deloads are fine, but check this is deliberate.`
      )
    }
    highestSeen = Math.max(highestSeen, idx)
  })

  // ── 6. The arc must fit the window ─────────────────────────────────────────
  if (hasDatedEvent) {
    const total = blocks.reduce((sum, b) => sum + (b.week_duration || 0), 0)
    const target = opts.weeksAvailable as number
    if (total !== target) {
      const diff = target - total
      const last = blocks[blocks.length - 1]
      last.week_duration = Math.max(1, last.week_duration + diff)
      notes.push(
        `Arc totalled ${total} weeks against a ${target}-week window. ` +
        `Adjusted block ${last.position} by ${diff > 0 ? '+' : ''}${diff} week(s) so the plan lands on the event.`
      )
    }
  }

  // ── 7. Do not invent facts about the event ─────────────────────────────────
  // A clamp cannot rewrite prose safely, so this warns rather than edits. The
  // coach is the right person to correct a claim about their own client's event.
  if (!opts.knownEventFacts) {
    for (const b of blocks) {
      const text = `${b.phase_objective ?? ''} ${b.notes ?? ''}`
      if (INVENTED_EVENT_CLAIM.test(text)) {
        warnings.push(
          `Block ${label(b, blocks.indexOf(b))} states specifics about the event (duration, terrain or elevation) ` +
          `that were never supplied to the system. Verify or remove before this reaches the client.`
        )
      }
    }
  }

  return { blocks, notes, warnings }
}
