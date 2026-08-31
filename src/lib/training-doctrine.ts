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
  tier: EffectiveTier,
  /**
   * Programmed endurance sessions in the same week (runs, rides, swims).
   * Above zero, the TARGET drops to this cell's own `min`.
   *
   * The table below maps phase x tier only, which silently assumes lifting is
   * the client's whole training load. That holds for most of the roster and
   * breaks for anyone doing real endurance work. Cristobal exposed it on
   * 2026-08-30: coming out of restoration at 14 sets a session, an accumulation
   * block pushed him to 17 in the same week he added three runs including a
   * long one, so lifting volume rose 20% at the moment total load rose most.
   *
   * Deliberately NOT a new invented number. Moving to the cell's published
   * `min` keeps the decision inside the doctrine's own stated bounds: the table
   * already says 14 is acceptable for accumulation/advanced, and concurrent
   * endurance is precisely the case it is acceptable for. A bespoke reduced
   * floor would be a figure nobody could defend.
   */
  concurrentEnduranceSessions = 0
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
  // Concurrent endurance load: aim at the floor rather than the middle of the
  // range. Max is untouched, so a coach who deliberately writes more is not
  // trimmed harder than before.
  if (concurrentEnduranceSessions > 0) return { min, target: min, max }
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
// 2026-08-31: 'abduction' (3 exercises in the library) was in NEITHER set, so
// hip abduction counted toward neither side and quietly vanished from every
// balance check. 'lower_leg' was handled by a special case at each call site;
// both now live here so there is one definition.
const LOWER_PATTERNS = new Set(['squat', 'hinge', 'lower_leg', 'abduction'])
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
/**
 * Mechanical biases that train HIP EXTENSION, the propulsive action in walking,
 * running, climbing and standing up out of a chair. Distinct from knee-dominant
 * work, which three squat variations in a week will give you plenty of.
 */
const HIP_EXTENSION_BIAS = new Set(['glute_dominant', 'posterior_chain', 'hip_dominant'])

/**
 * Do the week's PRIMARY slots vary, and do they train hip extension?
 *
 * The full-body rule checks each session in isolation, so a week of three
 * quad-dominant squat primaries passed cleanly. Vicki S, 2026-07-30: Leg Press,
 * Dumbbell Goblet Squat and Hack Squat as the three primaries, with no hip
 * extension work anywhere in the block, for a client training to walk 28km.
 * Hip extension is the propulsive action in walking; leaving it out of a
 * walk-preparation block is a programming error that no per-session rule catches.
 *
 * Reports rather than substituting. Swapping a primary rewrites the coach's
 * session intent, and there are legitimate reasons to repeat a pattern.
 */
export function weeklyPrimaryBalance(
  sessions: Session[],
  meta: Map<string, { pattern: string; bias: string }>
): { patterns: string[]; hasHipExtension: boolean; allSamePattern: boolean } {
  const patterns: string[] = []
  let hasHipExtension = false
  for (const session of sessions) {
    for (const block of session.blocks ?? []) {
      if (blockRole(block.block_label) !== 'primary') continue
      for (const ex of block.exercises ?? []) {
        const m = meta.get((ex.exercise_name ?? '').trim().toLowerCase())
        if (!m) continue
        patterns.push(m.pattern)
        if (m.pattern === 'hinge' || HIP_EXTENSION_BIAS.has(m.bias)) hasHipExtension = true
      }
    }
  }
  const known = patterns.filter(Boolean)
  return {
    patterns: known,
    hasHipExtension,
    allSamePattern: known.length > 1 && new Set(known).size === 1,
  }
}

/**
 * Weekly working sets split into upper and lower drivers. Trunk, carry,
 * rotation and locomotion are neither, and are excluded.
 *
 * Exists for the concurrent-endurance case (2026-08-30). Running and cycling
 * are large lower-body loads, so when they sit alongside a lifting block the
 * legs are already the most-trained tissue the client owns and the upper body
 * is what will actually detrain. Cristobal's first concurrent block came out
 * 27 lower against 19 upper on top of three runs, which is backwards.
 *
 * The doctrine rule that follows from it: with endurance declared, the lifting
 * should not ALSO be lower-biased. Upper at least equals lower. Deliberately a
 * parity rule rather than a percentage, because a percentage would be a number
 * neither of us could defend.
 */
/** Is this exercise a lower-body driver? Unmapped names count as not-lower. */
function isLowerEx(
  ex: { exercise_name?: string },
  patternByName?: Map<string, string>
): boolean {
  if (!patternByName) return false
  const pattern = patternByName.get((ex.exercise_name ?? '').trim().toLowerCase())
  if (!pattern) return false
  return LOWER_PATTERNS.has(pattern)
}

export function weeklyUpperLowerBalance(
  sessions: Session[],
  patternByName: Map<string, string>
): { upper: number; lower: number } {
  let upper = 0
  let lower = 0
  for (const session of sessions) {
    for (const block of session.blocks ?? []) {
      if (blockRole(block.block_label) === 'trunk') continue
      for (const ex of block.exercises ?? []) {
        const pattern = patternByName.get((ex.exercise_name ?? '').trim().toLowerCase())
        if (!pattern) continue
        const sets = parseInt(String(ex.sets ?? 0)) || 0
        if (LOWER_PATTERNS.has(pattern)) lower += sets
        else if (UPPER_PATTERNS.has(pattern)) upper += sets
      }
    }
  }
  return { upper, lower }
}

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
/**
 * Upper/lower distribution the coach actually asked for.
 *
 * 2026-08-31. The clamp already enforced RPE and per-session set COUNT, but
 * distribution was only ever reported, and only when concurrent endurance was
 * declared. Greg's Block 2 was regenerated three times asking in the prompt for
 * an upper bias and came back 12/18, then 11/23 — the ask got further from the
 * target each run. Prompt text does not steer this; code has to.
 *
 * Moves sets BETWEEN EXISTING EXERCISES inside each session. It never swaps,
 * adds or removes a movement, so the coach's session intent survives: the
 * exercises chosen stay exactly as generated and only their set counts shift.
 * Session totals are preserved, so this cannot fight the set-count clamp.
 *
 * Guardrails, mirroring the nutrition trimmer:
 *  - never takes an exercise below 1 working set
 *  - moves at most `maxMovePerSession` sets in a session (default 4)
 *  - if it cannot reach the ask inside the cap it stops and reports, rather
 *    than quietly delivering something that looks correct
 *  - a session with no exercise on the receiving side is reported, not forced:
 *    you cannot make a session upper-biased by piling sets on its only press.
 */
/** No single working movement carries more than this. See "SPREAD, DON'T PILE". */
const PER_MOVEMENT_SET_CEILING = 3

export function enforceUpperLowerBias(
  sessions: Session[],
  patternByName: Map<string, string>,
  bias: 'upper' | 'lower',
  maxMovePerSession = 4
): { sessions: Session[]; setsMoved: number; notes: string[] } {
  const cloned: Session[] = JSON.parse(JSON.stringify(sessions))
  const notes: string[] = []
  let setsMoved = 0

  for (const session of cloned) {
    const label = session.day_label ?? 'a session'
    const working: { ex: Exercise; lower: boolean }[] = []
    for (const block of session.blocks ?? []) {
      if (blockRole(block.block_label) === 'trunk') continue
      for (const ex of block.exercises ?? []) {
        const pattern = patternByName.get((ex.exercise_name ?? '').trim().toLowerCase())
        if (!pattern) continue
        const isLower = LOWER_PATTERNS.has(pattern)
        const isUpper = UPPER_PATTERNS.has(pattern)
        if (!isLower && !isUpper) continue
        working.push({ ex, lower: isLower })
      }
    }
    if (working.length === 0) continue

    const give = working.filter(w => (bias === 'upper' ? w.lower : !w.lower))
    const take = working.filter(w => (bias === 'upper' ? !w.lower : w.lower))
    const sideName = bias === 'upper' ? 'upper-body' : 'lower-body'
    const sideArticle = bias === 'upper' ? 'an' : 'a'

    if (take.length === 0) {
      notes.push(
        `${label} has no ${sideName} movement to shift sets into, so its balance was left alone. ` +
        `Piling sets onto a side that is not represented is not a fix; the session needs ${sideArticle} ${sideName} exercise.`
      )
      continue
    }

    const setsOf = (w: { ex: Exercise }) => parseInt(String(w.ex.sets ?? 0)) || 0
    const total = working.reduce((n, w) => n + setsOf(w), 0)
    // Target roughly 60/40 in favour of the declared side.
    const wanted = Math.round(total * 0.6)
    let deficit = wanted - take.reduce((n, w) => n + setsOf(w), 0)
    if (deficit <= 0) continue

    const cap = Math.min(deficit, maxMovePerSession)
    let moved = 0
    // Take from the largest donor first so no single movement is gutted, and
    // never push a receiver past PER_MOVEMENT_SET_CEILING. The doctrine's
    // "SPREAD, DON'T PILE" rule is explicit that no single working movement
    // gets more than 2-3 sets; without this the bias reached its target by
    // stacking one row to 4 sets, which is the exact failure Restoration
    // must avoid.
    while (moved < cap) {
      const donor = give
        .filter(w => setsOf(w) > 1)
        .sort((a, b) => setsOf(b) - setsOf(a))[0]
      const receiver = take
        .filter(w => setsOf(w) < PER_MOVEMENT_SET_CEILING)
        .sort((a, b) => setsOf(a) - setsOf(b))[0]
      if (!donor || !receiver) break
      donor.ex.sets = setsOf(donor) - 1
      receiver.ex.sets = setsOf(receiver) + 1
      moved++
    }
    setsMoved += moved
    deficit -= moved

    if (moved > 0) {
      notes.push(`${label}: moved ${moved} working set${moved === 1 ? '' : 's'} into ${sideName} work for the declared ${bias} bias.`)
    }
    if (deficit > 0) {
      notes.push(
        `${label} is still ${deficit} set${deficit === 1 ? '' : 's'} short of the ${bias} bias after moving the ${moved} allowed. ` +
        `Going further would drop a movement below one working set, push one past ${PER_MOVEMENT_SET_CEILING} sets, or exceed the ${maxMovePerSession}-set-per-session safety cap. The fix is exercise selection, not more set shuffling.`
      )
    }
  }

  return { sessions: cloned, setsMoved, notes }
}

export function clampProgramToDoctrine(
  sessions: Session[],
  phase: ProgressionPhase,
  tier: EffectiveTier,
  /**
   * Exercise name (lowercased) to primary_pattern, for the full-body check.
   * Omitted = the check is skipped rather than guessed at.
   */
  patternByName?: Map<string, string>,
  /** Exercise name (lowercased) to pattern AND mechanical bias, for the weekly balance check. */
  exerciseMeta?: Map<string, { pattern: string; bias: string }>,
  /** Programmed endurance sessions in the same week. See getSetsPerSessionRange. */
  concurrentEnduranceSessions = 0
): ClampResult {
  const ceilings = getRPECeilings(phase, tier)
  const range = getSetsPerSessionRange(phase, tier, concurrentEnduranceSessions)
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
          // With endurance in the week, take the cut from lower-body work
          // first: running already loads those patterns, the upper body is
          // what detrains. Two passes so lower is exhausted before upper.
          const exercises = block.exercises ?? []
          const passes = concurrentEnduranceSessions > 0
            ? [exercises.filter(e => isLowerEx(e, patternByName)), exercises.filter(e => !isLowerEx(e, patternByName))]
            : [exercises]
          for (const pass of passes) {
            if (over <= 0) break
            for (const ex of pass) {
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
          // Mirror of the trim bias: added volume lands on upper-body work
          // first when endurance already covers the legs.
          const exercisesA = block.exercises ?? []
          const passesA = concurrentEnduranceSessions > 0
            ? [exercisesA.filter(e => !isLowerEx(e, patternByName)), exercisesA.filter(e => isLowerEx(e, patternByName))]
            : [exercisesA]
          for (const pass of passesA) {
            if (remaining <= 0) break
            for (const ex of pass) {
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

  // ── The week's primaries must vary, and must include hip extension ─────────
  // Concurrent-endurance parity advisory. Running already loads the legs, so
  // the lifting should not ALSO be lower-biased. Reported rather than forced:
  // mechanically trimming to parity could gut a block that is deliberately
  // leg-focused for a reason the doctrine cannot see.
  // 2026-08-31: this used to run ONLY when endurance was declared, so a block
  // with no endurance was never checked for balance at all. Greg's Block 2 came
  // back 12 upper / 18 lower and nothing said a word. The endurance case gets a
  // sharper warning because running already loads the legs, but every block is
  // now measured.
  if (patternByName) {
    const bal = weeklyUpperLowerBalance(cloned, patternByName)
    if (bal.lower > bal.upper * 1.5 && bal.upper > 0) {
      notes.push(
        concurrentEnduranceSessions > 0
          ? `Concurrent endurance (${concurrentEnduranceSessions} sessions/week): lifting is still lower-biased ` +
            `(${bal.lower} lower vs ${bal.upper} upper working sets). Running already loads those patterns; ` +
            `the upper body is what detrains. Consider moving sets from squat and hinge into pressing and pulling.`
          : `Weekly balance: this block is lower-biased (${bal.lower} lower vs ${bal.upper} upper working sets). ` +
            `Full-body blocks should not sit this far from parity unless that is deliberate.`
      )
    } else if (bal.upper === 0 && bal.lower > 0) {
      notes.push(`Weekly balance: no recognised upper-body working sets in the whole block (${bal.lower} lower).`)
    }
  }

  if (exerciseMeta && cloned.length > 1) {
    const bal = weeklyPrimaryBalance(cloned, exerciseMeta)
    if (bal.allSamePattern) {
      notes.push(
        `Weekly balance: every primary this week is the same pattern (${bal.patterns[0]}). ` +
        `Vary the primary across sessions so the week trains more than one movement.`
      )
    }
    if (bal.patterns.length > 1 && !bal.hasHipExtension) {
      notes.push(
        `Weekly balance: no primary trains hip extension (no hinge pattern and no ` +
        `glute or posterior-chain bias). Primaries were ${bal.patterns.join(', ')}. ` +
        `Hip extension is the propulsive action in walking and standing up; a week ` +
        `without it is knee-dominant by omission rather than by choice.`
      )
    }
  }

  notes.unshift(`${rpeClamps} RPE values adjusted to doctrine ceiling (${tier} ${phase}: primary ${ceilings.primary}, secondary ${ceilings.secondary}, capacity ${ceilings.capacity}).`)
  }

  return { sessions: cloned, rpeClamps, setsAdded, setsTrimmed, notes }
}
