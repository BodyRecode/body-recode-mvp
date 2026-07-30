/**
 * Training prescription doctrine, expressed as code.
 *
 * The single source of truth for RPE ceilings, set ranges, and frequency
 * caps based on phase × effective training tier. Used to clamp LLM-generated
 * programs to doctrine after Claude returns the JSON.
 *
 * The principle: never trust the LLM for enforcement. Trust it for prose.
 */

export type ProgressionPhase =
  | 'restoration'
  | 'accumulation'
  | 'intensification'
  | 'realization'

export type TrainingAge = 'beginner' | 'intermediate' | 'advanced'

/**
 * Effective tier folds in hormonal support. TRT shifts +1, supraphysiological
 * androgens shift +2. Caps at 'elite'.
 */
export type EffectiveTier = 'beginner' | 'intermediate' | 'advanced' | 'elite'

const TIER_ORDER: EffectiveTier[] = ['beginner', 'intermediate', 'advanced', 'elite']

const SUPRAPHYSIOLOGICAL_KEYWORDS = [
  'anadrol', 'oxandrolone', 'anavar', 'dianabol', 'dbol',
  'trenbolone', 'tren', 'masteron', 'primobolan', 'deca',
  'nandrolone', 'boldenone', 'eq', 'equipoise', 'sustanon',
  'supraphysiological', 'cycle', 'orals',
]
const TRT_KEYWORDS = [
  'trt', 'testosterone enanthate', 'testosterone cypionate',
  'test e', 'test c', 'exogenous test', 'exogenous testosterone',
]

/**
 * Reads the free-text `medications` field on a client and returns the
 * hormonal-class supportive load level. Conservative: only recognises
 * explicit hormonal-class signals. Non-hormonal medications in the same
 * field (beta-blockers, SSRIs, statins, etc.) are ignored here — they
 * don't shift the training tier, only signal interpretation, which is
 * handled in the program prompt MEDICATIONS DOCTRINE section.
 *
 * Robustness (2026-07-20 fix):
 *  - Uses word-boundary matching, not naive substring. Previous naive
 *    `t.includes('eq')` matched inside "requires", "adequate", "request",
 *    "equipment" etc. Any client whose medications field contained one of
 *    those common English words was silently flagged as on an
 *    equipoise/supraphysiological compound. Luke's Week 11 case had
 *    "requires baseline labs" in the text → parser saw "eq" → tier
 *    shifted +2 to advanced, RPE ceilings jumped, coach couldn't force it
 *    back down.
 *  - Sentence-level planned/pending detection. If a hormonal keyword
 *    appears in the same sentence as a planning/negation marker (e.g.
 *    "planned start of X", "no current TRT", "before starting Y"), that
 *    match is treated as documentation of a future/absent intervention
 *    rather than a current one.
 *  - Global "no current medications" opener treated as a hard negation
 *    (returns 'none' regardless of downstream planning documentation).
 */
const PLANNING_MARKERS = /\b(planned|plan(?:s|ning)?\s+to|will\s+start|not\s+yet|not\s+currently|not\s+on\s+any|not\s+started|before\s+starting|preparing\s+to\s+start|pending|awaiting|after\s+bloods|after\s+labs|to\s+be\s+started|to\s+start|previously\s+on|discontinued|off\s+all|considering)\b/

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function matchesKeywordAtWordBoundary(text: string, keywords: readonly string[]): boolean {
  return keywords.some(k => new RegExp(`\\b${escapeRegex(k)}\\b`, 'i').test(text))
}

export function readHormonalLoad(medications: string | null | undefined):
  'none' | 'trt' | 'supraphysiological' {
  if (!medications) return 'none'
  const t = medications.toLowerCase().trim()

  // Hard global negation: coach opened the field with "no current medications"
  // (or similar). Downstream sentences may document PLANNED interventions,
  // but the client is not currently on anything hormonal.
  if (/^(no\s+(current|active|regular)\s+medications?|none\s+current|not\s+currently\s+taking)/i.test(t)) {
    return 'none'
  }

  // Sentence-by-sentence check. A keyword match in a sentence that also
  // contains a planning marker is treated as future/absent, not current.
  const sentences = t.split(/[.!?\n]+/).filter(s => s.trim().length > 0)
  let hasSupra = false
  let hasTrt = false
  for (const s of sentences) {
    if (PLANNING_MARKERS.test(s)) continue
    if (matchesKeywordAtWordBoundary(s, SUPRAPHYSIOLOGICAL_KEYWORDS)) hasSupra = true
    else if (matchesKeywordAtWordBoundary(s, TRT_KEYWORDS)) hasTrt = true
  }
  if (hasSupra) return 'supraphysiological'
  if (hasTrt) return 'trt'
  return 'none'
}

/**
 * Effective training tier = base training age, shifted up by hormonal-class
 * signal load read out of the medications text.
 * - none      → unchanged
 * - trt       → +1 step
 * - supra     → +2 steps
 */
export function resolveEffectiveTier(
  trainingAge: TrainingAge,
  medications: string | null | undefined
): EffectiveTier {
  const baseIdx = TIER_ORDER.indexOf(trainingAge)
  const load = readHormonalLoad(medications)
  const shift = load === 'supraphysiological' ? 2 : load === 'trt' ? 1 : 0
  return TIER_ORDER[Math.min(TIER_ORDER.length - 1, baseIdx + shift)]
}

/**
 * RPE ceilings by phase × tier. Primary = main compound load; secondary =
 * supporting lifts; capacity = accessory / movement-quality work.
 */
export function getRPECeilings(
  phase: ProgressionPhase,
  tier: EffectiveTier
): { primary: number; secondary: number; capacity: number } {
  const TABLE: Record<ProgressionPhase, Record<EffectiveTier, [number, number, number]>> = {
    restoration: {
      beginner:     [6, 5, 5],
      intermediate: [7, 6, 6],
      advanced:     [8, 7, 6],
      elite:        [8, 8, 7],
    },
    accumulation: {
      beginner:     [6, 6, 5],
      intermediate: [7, 7, 6],
      advanced:     [8, 7, 7],
      elite:        [9, 8, 7],
    },
    intensification: {
      beginner:     [7, 6, 5],
      intermediate: [8, 7, 6],
      advanced:     [9, 8, 7],
      elite:        [9, 8, 7],
    },
    realization: {
      beginner:     [7, 6, 5],
      intermediate: [8, 7, 6],
      advanced:     [9, 8, 7],
      elite:        [10, 9, 7],
    },
  }
  const [p, s, c] = TABLE[phase][tier]
  return { primary: p, secondary: s, capacity: c }
}

/**
 * Working sets per session by phase × tier. Returns {min, target, max}.
 * Target is what the program should aim for; min is the floor for clamping.
 */
export function getSetsPerSessionRange(
  phase: ProgressionPhase,
  tier: EffectiveTier
): { min: number; target: number; max: number } {
  const TABLE: Record<ProgressionPhase, Record<EffectiveTier, [number, number, number]>> = {
    restoration: {
      beginner:     [6, 8, 9],
      intermediate: [9, 10, 12],
      advanced:     [12, 14, 16],
      elite:        [14, 16, 18],
    },
    accumulation: {
      beginner:     [9, 10, 12],
      intermediate: [12, 14, 16],
      advanced:     [14, 17, 20],
      elite:        [16, 19, 22],
    },
    intensification: {
      beginner:     [9, 10, 12],
      intermediate: [11, 13, 15],
      advanced:     [13, 16, 18],
      elite:        [14, 17, 20],
    },
    realization: {
      beginner:     [9, 10, 12],
      intermediate: [11, 13, 15],
      advanced:     [13, 16, 18],
      elite:        [14, 17, 20],
    },
  }
  const [min, target, max] = TABLE[phase][tier]
  return { min, target, max }
}

interface Exercise {
  exercise_name?: string
  sets?: number | string
  reps?: string
  rpe?: number | null
  rest?: string
  notes?: string
}

interface Block {
  block_label?: string
  exercises?: Exercise[]
}

interface Session {
  day_label?: string
  skeleton?: string
  movement_prep?: string[]
  blocks?: Block[]
}

function blockRole(label: string | undefined): 'primary' | 'secondary' | 'capacity' | 'trunk' {
  if (!label) return 'capacity'
  const l = label.toLowerCase()
  if (/primary|main load|primary load|primary compound/.test(l)) return 'primary'
  if (/secondary|support/.test(l)) return 'secondary'
  if (/trunk|stability|core/.test(l)) return 'trunk'
  return 'capacity'
}

/**
 * SESSION STRUCTURE DOCTRINE — full body is the default, splits are earned.
 *
 * Added 2026-07-29 on Kade's direction: clients start on mostly full-body
 * programs. Before this, nothing in the system decided full-body vs split. The
 * skeleton archetypes govern structure WITHIN a session; the split across the
 * week was left entirely to the model, so two identical beginners could get an
 * upper/lower split and a full-body program from the same inputs.
 *
 * The reasoning, so it is not re-litigated:
 *
 * Early training is limited by movement-pattern EXPOSURE and tissue tolerance,
 * not by per-session volume. At 2-3 sessions a week an upper/lower split trains
 * each pattern roughly once weekly, which is below the frequency that drives
 * motor learning and connective-tissue adaptation. Full body at 3x trains every
 * pattern three times. A split solves a volume problem that a beginner does not
 * have yet, and costs the thing they actually need.
 *
 * It also follows arithmetically from the state model. Remediation caps
 * training at 2-3x/week, so a split is simply wrong there: it cannot deliver
 * adequate frequency per pattern inside the sessions the state permits.
 */
export function requiresFullBodySessions(
  phase: ProgressionPhase,
  tier: EffectiveTier,
  frequency: number | null | undefined
): boolean {
  if (phase === 'restoration') return true
  if (phase === 'accumulation') {
    if (tier === 'beginner' || tier === 'intermediate') return true
    // Advanced and elite may split once frequency can actually support it.
    return (frequency ?? 3) <= 3
  }
  // Intensification and realization are permissioned for split programming.
  return false
}

/**
 * Lower-body DRIVERS. A session without one of these is not full body.
 *
 * `lower_leg` and `abduction` are deliberately NOT here, though both are
 * lower-body patterns. They were added to the library on 2026-07-30 as
 * resilience work, and a session of calf raises and a bench press is not a full
 * body session. The driver has to be a hip or knee pattern carrying real load.
 * Counting resilience work as a driver would let the full-body rule pass on a
 * session that never trains the legs.
 */
const LOWER_PATTERNS = new Set(['squat', 'hinge'])
/** Upper-body drivers. Carry, rotation and locomotion are trunk/whole-body. */
const UPPER_PATTERNS = new Set([
  'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull',
])

/**
 * Does this session train both halves of the body?
 *
 * `patternByName` maps exercise name to its `primary_pattern` from the library.
 * Names the map does not know are ignored rather than counted as absent, so a
 * library gap produces silence instead of a false accusation.
 */
export function sessionIsFullBody(
  session: Session,
  patternByName: Map<string, string>
): { lower: boolean; upper: boolean } {
  let lower = false
  let upper = false
  for (const block of session.blocks ?? []) {
    for (const ex of block.exercises ?? []) {
      const pattern = patternByName.get((ex.exercise_name ?? '').trim().toLowerCase())
      if (!pattern) continue
      if (LOWER_PATTERNS.has(pattern)) lower = true
      if (UPPER_PATTERNS.has(pattern)) upper = true
    }
  }
  return { lower, upper }
}

interface ClampResult {
  sessions: Session[]
  rpeClamps: number
  setsAdded: number
  setsTrimmed: number
  notes: string[]
}

/**
 * Walk every session/block/exercise and clamp values to doctrine. Pure —
 * returns a new sessions array plus a count of clamps applied.
 *
 * Clamping rules:
 * - Per exercise: rpe ≤ doctrine ceiling for its block role.
 * - Per session: total working sets (excluding trunk stability) ≥ floor.
 *   When short, sets are added to Primary blocks first, then Secondary,
 *   then Capacity. Trunk stability is left alone.
 */
export function clampProgramToDoctrine(
  sessions: Session[],
  phase: ProgressionPhase,
  tier: EffectiveTier,
  /**
   * Exercise name (lowercased) to primary_pattern, for the full-body check.
   * Omitted = the check is skipped rather than guessed at.
   */
  patternByName?: Map<string, string>
): ClampResult {
  const ceilings = getRPECeilings(phase, tier)
  const range = getSetsPerSessionRange(phase, tier)
  const cloned: Session[] = JSON.parse(JSON.stringify(sessions))
  const notes: string[] = []
  let rpeClamps = 0
  let setsAdded = 0
  let setsTrimmed = 0

  for (const session of cloned) {
    let workingSets = 0
    for (const block of session.blocks ?? []) {
      const role = blockRole(block.block_label)
      const ceiling =
        role === 'primary' ? ceilings.primary
        : role === 'secondary' ? ceilings.secondary
        : ceilings.capacity
      for (const ex of block.exercises ?? []) {
        if (typeof ex.rpe === 'number' && ex.rpe < ceiling) {
          // bump up to ceiling for advanced tiers; the doctrine puts the
          // floor at the ceiling minus 1 for hormonal+advanced cases.
          if (tier === 'advanced' || tier === 'elite') {
            ex.rpe = ceiling
            rpeClamps++
          }
        } else if (typeof ex.rpe === 'number' && ex.rpe > ceiling) {
          ex.rpe = ceiling
          rpeClamps++
        }
        if (role !== 'trunk') {
          workingSets += parseInt(String(ex.sets ?? 0)) || 0
        }
      }
    }

    if (workingSets > range.max) {
      // Over the doctrine ceiling: trim toward target. This enforces the max
      // the doctrine already defines but the clamp never applied (it only ever
      // added sets). Remove from Accessory first, then Secondary, then Primary
      // (protect the primary stimulus), and never drop a movement below 1 set.
      let over = workingSets - range.target
      for (const role of ['capacity', 'secondary', 'primary'] as const) {
        if (over <= 0) break
        for (const block of session.blocks ?? []) {
          if (over <= 0) break
          if (blockRole(block.block_label) !== role) continue
          for (const ex of block.exercises ?? []) {
            if (over <= 0) break
            const cur = parseInt(String(ex.sets ?? 0)) || 0
            if (cur <= 1) continue
            const cut = Math.min(cur - 1, over)
            ex.sets = cur - cut
            over -= cut
            setsTrimmed += cut
          }
        }
      }
      notes.push(`${session.day_label ?? 'session'}: trimmed working sets toward the ${phase} target of ${range.target} (was over the ${tier} ceiling of ${range.max}).`)
    } else if (workingSets < range.target) {
      // Bump session sets up to the floor if short. Add to Primary first,
      // then Secondary, then Capacity. Bias toward target, not minimum.
      const need = range.target - workingSets
      let remaining = need
      for (const role of ['primary', 'secondary', 'capacity'] as const) {
        if (remaining <= 0) break
        for (const block of session.blocks ?? []) {
          if (remaining <= 0) break
          if (blockRole(block.block_label) !== role) continue
          for (const ex of block.exercises ?? []) {
            if (remaining <= 0) break
            const cur = parseInt(String(ex.sets ?? 0)) || 0
            // Add up to 2 sets per exercise per pass to spread the load.
            const add = Math.min(2, remaining)
            ex.sets = cur + add
            remaining -= add
            setsAdded += add
          }
        }
      }
      if (remaining < need) {
        notes.push(`${session.day_label ?? 'session'}: added ${need - remaining} working sets to reach doctrine floor of ${range.target}.`)
      }
    }
  }

  if (rpeClamps > 0) {
    // ── Full body is the default; splits are earned ────────────────────────────
  // Swapping an exercise automatically would silently rewrite the coach's
  // session intent, so this reports rather than edits. The prompt asks; this
  // is the check that the ask was honoured.
  if (patternByName && requiresFullBodySessions(phase, tier, cloned.length)) {
    const partial: string[] = []
    for (const session of cloned) {
      const { lower, upper } = sessionIsFullBody(session, patternByName)
      if (lower && upper) continue
      const missing = !lower && !upper ? 'no recognised lower or upper driver'
        : !lower ? 'no lower-body driver (squat or hinge)'
        : 'no upper-body driver (push or pull)'
      partial.push(`${session.day_label ?? 'a session'} has ${missing}`)
    }
    if (partial.length > 0) {
      notes.push(
        `Full-body check: ${partial.join('; ')}. ` +
        `${phase} at ${tier} should be full body every session, because pattern ` +
        `frequency matters more than per-session volume at this stage. Review before sending.`
      )
    }
  }

  notes.unshift(`${rpeClamps} RPE values adjusted to doctrine ceiling (${tier} ${phase}: primary ${ceilings.primary}, secondary ${ceilings.secondary}, capacity ${ceilings.capacity}).`)
  }

  return { sessions: cloned, rpeClamps, setsAdded, setsTrimmed, notes }
}
