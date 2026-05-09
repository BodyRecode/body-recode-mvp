/**
 * Recovery and Regulation doctrine, expressed as code.
 *
 * Every numeric threshold, duration window, and constraint range in this file
 * comes verbatim from a 13D Applied Execution Playbook or the Build Reference.
 * Update both in lockstep.
 *
 * Sources of truth:
 *   ~/Dropbox/01_BODY_RECODE/.../12_Recovery_and_Regulation_System/   (Layer 2)
 *   ~/Dropbox/01_BODY_RECODE/.../13D_Recovery_and_Regulation_Playbooks/ (Layer 3)
 *   ~/Dropbox/01_BODY_RECODE/.../Recovery_and_Regulation_Build_Reference_v1.0.md
 *
 * Doctrine principles encoded here:
 *   - Trigger ≠ Authorisation (12E_02): thresholds detect; the router routes; the state activates.
 *   - Single dominant playbook (13D_15): non-stacking rule.
 *   - Lock-in durations (13D_14): no switch within minimum unless escalation tier rule fires.
 *   - No protocol prescription at Layer 2 (12A): manifests emit constraint envelopes only,
 *     never sleep targets, breathwork, or cold protocols.
 *
 * Layer 2 doctrine forbids us from using these manifests to OPTIMISE recovery.
 * They constrain training and nutrition execution when a state is active. They do not
 * prescribe behaviours.
 */

/* ===========================================================
 * Types
 * =========================================================== */

/**
 * 10 recovery playbooks per 13D_01-12 + 13D_16 (sleep tools is a sub-tool, not a playbook).
 * Each maps 1:1 to a 13D_NN file. Keys must match recovery_states.playbook_id check.
 */
export type RecoveryPlaybookId =
  | 'acute_fatigue'                 // 13D_02
  | 'chronic_recovery_debt'         // 13D_03
  | 'ns_overload'                   // 13D_04
  | 'sleep_disruption'              // 13D_05
  | 'lifestyle_stress_dominant'     // 13D_06
  | 'overreaching_vs_under_recovery' // 13D_07
  | 'post_diet'                     // 13D_08
  | 'post_competition'              // 13D_09
  | 'burnout_return'                // 13D_10
  | 'supportive_only'               // 13D_12 baseline state

/**
 * 13D_15 Integration Principles tier hierarchy. Lower tier number = higher priority.
 * When multiple states could activate, the lowest-tier one wins.
 */
export type RecoveryTier = 1 | 2 | 3 | 4 | 5 | 6

/**
 * 12E_01 permissible adjustment categories. Anything outside these is non-permissible
 * and must escalate, not adjust.
 */
export type PermissibleCategory =
  | 'exposure'            // load / volume / intensity reduction
  | 'timing_sequencing'   // when demand is encountered
  | 'context_environment' // reducing destabilising inputs
  | 'non_permissible_escalate'

/**
 * Numeric range expressed as [min, max]. Both bounds inclusive. The lower bound
 * is the minimum disciplined response; the upper bound is the maximum permitted
 * within doctrine.
 */
export type Range = readonly [number, number]

/**
 * The constraint envelope a playbook applies to training execution while active.
 * Used by the program generator (Phase 3) to clamp the LLM output.
 *
 * Per MSA Integrated Prescription Assembly Rules: recovery directives apply
 * FIRST, then training (if permitted), then nutrition (if permitted). When
 * RRS is active, training progression is locked.
 */
export interface TrainingConstraintManifest {
  /** Load reduction range as percentages (e.g. [10, 25] = 10–25% reduction). */
  loadReductionPct: Range | null
  /** Minimum percentage increase in rest intervals between sets. */
  densityRestIncreasePct: Range | null
  /** Maximum sessions per week while active. null = no cap. */
  sessionsPerWeekCap: number | null
  /** Number of sessions to remove from current weekly schedule. null = no removal. */
  sessionsRemovedPerWeek: Range | null
  /** Maximum session duration as percentage of normal duration. null = no cap. */
  sessionDurationPctCap: number | null
  /** Total training removal window in days (full pause). null = training continues reduced. */
  trainingRemovalDays: Range | null
  /** On reintroduction after a removal, cap on prior session duration (%). null = n/a. */
  reintroductionDurationPctCap: number | null
  /** On reintroduction after a removal, cap on prior load (%). null = n/a. */
  reintroductionLoadPctCap: number | null
  /** Hard prohibition: progression of any kind. */
  progressionLocked: boolean
  /** Hard prohibition: novel stimulus introduction. */
  novelStimulusBlocked: boolean
  /** Hard prohibition: conditioning / capacity work add-ons. */
  conditioningBlocked: boolean
  /** Hard prohibition: testing / output validation sessions. */
  testingBlocked: boolean
}

/**
 * The constraint envelope a playbook applies to nutrition execution while active.
 * Per 13D rules nutrition cannot create additional stress when recovery is active.
 */
export interface NutritionConstraintManifest {
  /** Aggressive caloric deficit prohibited. */
  aggressiveDeficitBlocked: boolean
  /** Compensatory restriction in response to reduced training prohibited. */
  reactiveRestrictionBlocked: boolean
  /** Fasting protocols / fuel restriction prohibited. */
  fuelRestrictionBlocked: boolean
  /** Maintain baseline protein intake (cannot drop). */
  proteinFloorRequired: boolean
  /** Maintain carbohydrate support proportional to training. */
  carbohydrateSupportRequired: boolean
}

/**
 * Exit criteria a state must mechanically meet before re-entry to normal execution.
 * Per 12D_03 doctrine: relief is not validation. Multi-day stable markers required.
 */
export interface ExitCriteria {
  /** Minimum consecutive days of stable recovery markers (RSIB ≥3, sessions same/easier). */
  stableRecoveryDaysMin: number | null
  /** Maximum acceptable post-session recovery time in hours. */
  postSessionRecoveryHoursMax: number | null
  /** Minimum consecutive days of sleep stability. */
  sleepStableDaysMin: number | null
  /** Minimum consecutive days of behavioural / emotional consistency. */
  behaviouralStabilityDaysMin: number | null
  /** Free-form additional criteria (e.g. weight stability for post-diet). */
  additionalCriteria: readonly string[]
}

/**
 * Escalation rules per 13D_15 hierarchy. If the state stalls or worsens within
 * the duration window, route to the named higher-tier playbook.
 */
export interface EscalationRule {
  /** Days after entry at which Tier 1 escalation review fires. */
  tier1ReviewDays: number
  /** Days after entry at which Tier 2 escalation fires (auto-route). */
  tier2EscalateDays: number
  /** Where Tier 2 escalation routes. */
  tier2EscalateTo: RecoveryPlaybookId | 'system_review'
  /** Tier 3 = repeated cycling without resolution → mandatory system review. */
  tier3CyclesWithinDays: number
}

/**
 * Per-playbook pattern of triggers required for entry. The router consumes these
 * to make the routing decision (13D_14).
 *
 * Note: thresholds are *necessary* conditions. The router additionally enforces
 * the 13D_14 priority order — even if multiple thresholds match, only the
 * highest-priority playbook activates (single dominant rule, 13D_15).
 */
export interface EntryTriggers {
  /** Minimum onset duration in days (e.g. acute fatigue ≤7 days, chronic >14). */
  onsetDaysMin?: number
  onsetDaysMax?: number
  /** Minimum consecutive RSIB recovery_status ≤2 weeks. */
  rsibLowRecoveryWeeksConsecutive?: number
  /** Minimum consecutive RSIB session_repeatability='harder' weeks. */
  rsibHarderSessionsWeeksConsecutive?: number
  /** RSIB sleep_consistency='severely_inconsistent' triggers regulation check. */
  rsibSeverelySleepInconsistent?: boolean
  /** RSIB sleep_consistency='inconsistent' for N consecutive weeks. */
  rsibSleepInconsistentWeeksConsecutive?: number
  /** Sleep disruption nights threshold (>3 = regulation, ≥2-3 = sleep playbook). */
  sleepDisruptionNightsMin?: number
  /** Behavioural inconsistency days threshold. */
  behaviouralInconsistencyDaysMin?: number
  /** Soreness persistence hours threshold. */
  sorenessPersistenceHoursMin?: number
  /** Declining repeatability sessions threshold. */
  decliningRepeatabilitySessionsMin?: number
  /** Required CFWS Exposure Readiness signal patterns. */
  cfwsRequiresAny?: ReadonlyArray<{ key: 'capacity' | 'schedule' | 'regulation' | 'behaviour'; signal: 'Amber' | 'Red' }>
  /** Required CFWS Exposure Readiness signal patterns (all must be present). */
  cfwsRequiresAll?: ReadonlyArray<{ key: 'capacity' | 'schedule' | 'regulation' | 'behaviour'; signal: 'Amber' | 'Red' }>
  /** Free-form context flag (e.g. 'post_diet_completion'). */
  contextFlags?: readonly string[]
}

/**
 * The full doctrine record for one playbook. Read-only constants only.
 */
export interface PlaybookDoctrine {
  id: RecoveryPlaybookId
  /** Maps to a 13D file: e.g. '13D_02'. */
  source: string
  /** Coach-facing display name. */
  name: string
  /** One-sentence purpose from the playbook. */
  purpose: string
  /** 13D_15 tier — lower number = higher priority. */
  tier: RecoveryTier
  /** Permissible adjustment category per 12E_01. */
  permissibleCategory: PermissibleCategory
  /** Lock-in: minimum days a state must be active before any switch (13D_14). */
  minDurationDays: number
  /** Maximum acceptable days before mandatory escalation review. */
  maxDurationDays: number
  /** Trigger thresholds the router checks for entry (one of). */
  entryTriggers: EntryTriggers
  /** Constraint envelope applied to training while active. */
  trainingConstraints: TrainingConstraintManifest
  /** Constraint envelope applied to nutrition while active. */
  nutritionConstraints: NutritionConstraintManifest
  /** Mechanical exit criteria. */
  exitCriteria: ExitCriteria
  /** Escalation rules per 13D_15. */
  escalation: EscalationRule
  /** Explicit prohibitions from the playbook (free text for coach surface). */
  prohibitions: readonly string[]
  /** Common failure modes (13D_11). */
  commonFailures: readonly string[]
}

/* ===========================================================
 * The 10 playbook doctrines
 * =========================================================== */

/** 13D_07 — lightest playbook. Active during productive overreach. Minimal constraint. */
const OVERREACHING: PlaybookDoctrine = {
  id: 'overreaching_vs_under_recovery',
  source: '13D_07',
  name: 'Overreaching (productive)',
  purpose: 'Maintain training exposure during functional overreaching; classify and protect from overcorrection.',
  tier: 4,
  permissibleCategory: 'exposure',
  minDurationDays: 3,
  maxDurationDays: 7,
  entryTriggers: {
    onsetDaysMax: 7,
    sorenessPersistenceHoursMin: 24,
    cfwsRequiresAny: [
      { key: 'capacity', signal: 'Amber' },
    ],
  },
  trainingConstraints: {
    loadReductionPct: [5, 10],
    densityRestIncreasePct: null,
    sessionsPerWeekCap: null,
    sessionsRemovedPerWeek: null,
    sessionDurationPctCap: null,
    trainingRemovalDays: null,
    reintroductionDurationPctCap: null,
    reintroductionLoadPctCap: null,
    progressionLocked: false,   // overreaching can continue with minor temper
    novelStimulusBlocked: true,
    conditioningBlocked: false,
    testingBlocked: true,
  },
  nutritionConstraints: {
    aggressiveDeficitBlocked: true,
    reactiveRestrictionBlocked: true,
    fuelRestrictionBlocked: false,
    proteinFloorRequired: true,
    carbohydrateSupportRequired: true,
  },
  exitCriteria: {
    stableRecoveryDaysMin: 3,
    postSessionRecoveryHoursMax: 72,
    sleepStableDaysMin: null,
    behaviouralStabilityDaysMin: null,
    additionalCriteria: ['Behaviour remains stable across full window'],
  },
  escalation: {
    tier1ReviewDays: 5,
    tier2EscalateDays: 7,
    tier2EscalateTo: 'acute_fatigue',
    tier3CyclesWithinDays: 21,
  },
  prohibitions: [
    'Major load reduction',
    'Training removal',
    'Overcorrection in response to controlled fatigue',
  ],
  commonFailures: [
    'Treating productive overreach as under-recovery (premature pullback)',
    'Treating under-recovery as overreach (continued push into chronic debt)',
  ],
}

/** 13D_02 — short-term acute fatigue resolution. */
const ACUTE_FATIGUE: PlaybookDoctrine = {
  id: 'acute_fatigue',
  source: '13D_02',
  name: 'Acute Fatigue Resolution',
  purpose: 'Resolve short-duration fatigue arising from recent load exposure without allowing accumulation.',
  tier: 4,
  permissibleCategory: 'exposure',
  minDurationDays: 3,
  maxDurationDays: 10, // hard upper bound per 13D_02
  entryTriggers: {
    onsetDaysMax: 7,
    sorenessPersistenceHoursMin: 72,
    decliningRepeatabilitySessionsMin: 3,
    cfwsRequiresAny: [
      { key: 'capacity', signal: 'Amber' },
      { key: 'capacity', signal: 'Red' },
    ],
  },
  trainingConstraints: {
    loadReductionPct: [10, 25],
    densityRestIncreasePct: [20, 100],
    sessionsPerWeekCap: null,
    sessionsRemovedPerWeek: [0, 1], // 1 fewer session if fatigue persists >72h
    sessionDurationPctCap: null,
    trainingRemovalDays: null,
    reintroductionDurationPctCap: null,
    reintroductionLoadPctCap: null,
    progressionLocked: true,
    novelStimulusBlocked: true,
    conditioningBlocked: true,
    testingBlocked: true,
  },
  nutritionConstraints: {
    aggressiveDeficitBlocked: true,
    reactiveRestrictionBlocked: true,
    fuelRestrictionBlocked: true,
    proteinFloorRequired: true,
    carbohydrateSupportRequired: true,
  },
  exitCriteria: {
    stableRecoveryDaysMin: 3,        // 3 consecutive sessions no escalation
    postSessionRecoveryHoursMax: 48, // soreness resolves within 48h
    sleepStableDaysMin: null,
    behaviouralStabilityDaysMin: null,
    additionalCriteria: [
      'Local soreness resolves within ≤48 hours',
      'Session repeatability restored',
      'No fatigue escalation across 3 consecutive sessions',
    ],
  },
  escalation: {
    tier1ReviewDays: 7,                              // no improvement → chronic
    tier2EscalateDays: 10,                           // worsening or new instability → regulation
    tier2EscalateTo: 'chronic_recovery_debt',
    tier3CyclesWithinDays: 21,                       // recurrent acute cycles → system review
  },
  prohibitions: [
    'Pushing through',
    'Compensatory volume increases',
    'Extra conditioning for reassurance',
    'Daily cold exposure to maintain training output',
    'Modalities used to avoid load reduction',
    'Self-testing to "check readiness"',
  ],
  commonFailures: [
    'Treating chronic state as acute (false reassurance)',
    'Missing the regulation checkpoint (sleep >3 nights, emotional reactivity)',
  ],
}

/** 13D_03 — chronic recovery debt: weeks of unresolved capacity erosion. */
const CHRONIC_RECOVERY_DEBT: PlaybookDoctrine = {
  id: 'chronic_recovery_debt',
  source: '13D_03',
  name: 'Chronic Recovery Debt',
  purpose: 'Halt ongoing accumulation of fatigue, restore baseline recovery capacity, prevent transition into regulation-dominant states.',
  tier: 2,
  permissibleCategory: 'exposure',
  minDurationDays: 14,
  maxDurationDays: 35,  // hard ceiling per 13D_03
  entryTriggers: {
    onsetDaysMin: 14,                              // duration > 14 days
    rsibLowRecoveryWeeksConsecutive: 2,            // recovery score ≤2 for 2 weeks
    cfwsRequiresAny: [
      { key: 'capacity', signal: 'Red' },
    ],
  },
  trainingConstraints: {
    loadReductionPct: [20, 40],
    densityRestIncreasePct: [30, 50],
    sessionsPerWeekCap: null,
    sessionsRemovedPerWeek: [1, 2],
    sessionDurationPctCap: null,
    trainingRemovalDays: null,
    reintroductionDurationPctCap: null,
    reintroductionLoadPctCap: 70,
    progressionLocked: true,
    novelStimulusBlocked: true,
    conditioningBlocked: true,
    testingBlocked: true,
  },
  nutritionConstraints: {
    aggressiveDeficitBlocked: true,
    reactiveRestrictionBlocked: true,
    fuelRestrictionBlocked: true,
    proteinFloorRequired: true,
    carbohydrateSupportRequired: true,
  },
  exitCriteria: {
    stableRecoveryDaysMin: 7,
    postSessionRecoveryHoursMax: 48,
    sleepStableDaysMin: null,
    behaviouralStabilityDaysMin: null,
    additionalCriteria: [
      'Recovery score ≥3 for 7 consecutive days',
      'Stable sessions across full window',
      'On exit: resume at ≤70% prior load, no progression for 14 days',
    ],
  },
  escalation: {
    tier1ReviewDays: 14,
    tier2EscalateDays: 21,
    tier2EscalateTo: 'ns_overload',
    tier3CyclesWithinDays: 60,
  },
  prohibitions: [
    'Treating chronic as acute',
    'Maintaining intensity through reduction window',
    'Using tools instead of reducing load',
    'Early exit before 14-day minimum',
    'Fat loss acceleration',
  ],
  commonFailures: [
    'Restoring training before behaviour is stable',
    'Misclassification as lifestyle stress when CFWS Capacity is Red',
  ],
}

/** 13D_04 — nervous system overload: regulation-dominant state. */
const NS_OVERLOAD: PlaybookDoctrine = {
  id: 'ns_overload',
  source: '13D_04',
  name: 'Nervous System Overload',
  purpose: 'Restore behavioural and emotional control, stabilise nervous system function, prevent burnout.',
  tier: 1,  // T1 — overrides everything else per 13D_15
  permissibleCategory: 'context_environment',
  minDurationDays: 7,
  maxDurationDays: 21,
  entryTriggers: {
    sleepDisruptionNightsMin: 4,                   // >3 consecutive nights
    behaviouralInconsistencyDaysMin: 6,            // >5 days
    rsibSeverelySleepInconsistent: true,
    cfwsRequiresAny: [
      { key: 'regulation', signal: 'Red' },
      { key: 'behaviour', signal: 'Red' },
    ],
  },
  trainingConstraints: {
    loadReductionPct: null,
    densityRestIncreasePct: null,
    sessionsPerWeekCap: 3,
    sessionsRemovedPerWeek: null,
    sessionDurationPctCap: 60,         // ≤60% prior duration on reintroduction
    trainingRemovalDays: [3, 7],       // full removal Phase 1
    reintroductionDurationPctCap: 60,
    reintroductionLoadPctCap: 60,
    progressionLocked: true,
    novelStimulusBlocked: true,
    conditioningBlocked: true,
    testingBlocked: true,
  },
  nutritionConstraints: {
    aggressiveDeficitBlocked: true,
    reactiveRestrictionBlocked: true,
    fuelRestrictionBlocked: true,
    proteinFloorRequired: true,
    carbohydrateSupportRequired: true,
  },
  exitCriteria: {
    stableRecoveryDaysMin: 5,
    postSessionRecoveryHoursMax: null,
    sleepStableDaysMin: 5,
    behaviouralStabilityDaysMin: 5,
    additionalCriteria: [
      'Sleep stabilised ≥5 consecutive days',
      'Emotional stability restored',
      'Behaviour consistent ≥5 consecutive days',
      'On exit: conservative reintroduction, no progression 14–21 days',
    ],
  },
  escalation: {
    tier1ReviewDays: 14,
    tier2EscalateDays: 21,
    tier2EscalateTo: 'system_review',
    tier3CyclesWithinDays: 90,
  },
  prohibitions: [
    'Adding stimulation to a dysregulated system',
    'CRS / cold exposure during this state',
    'Early return',
    'Over-discipline narratives',
    'Fat loss attempts',
  ],
  commonFailures: [
    'Treating regulation failure as recovery failure (overload persists)',
    'Returning to training before sleep stabilises',
  ],
}

/** 13D_05 — sleep disruption: pre-regulation stabilisation. */
const SLEEP_DISRUPTION: PlaybookDoctrine = {
  id: 'sleep_disruption',
  source: '13D_05',
  name: 'Sleep Disruption',
  purpose: 'Stabilise sleep patterns before escalation into nervous system overload.',
  tier: 3,
  permissibleCategory: 'context_environment',
  minDurationDays: 5,
  maxDurationDays: 14,
  entryTriggers: {
    sleepDisruptionNightsMin: 2,
    rsibSleepInconsistentWeeksConsecutive: 1,
    cfwsRequiresAny: [
      { key: 'regulation', signal: 'Amber' },
      { key: 'capacity', signal: 'Amber' },
    ],
  },
  trainingConstraints: {
    loadReductionPct: [10, 30],
    densityRestIncreasePct: [20, 30],
    sessionsPerWeekCap: null,
    sessionsRemovedPerWeek: [0, 1],
    sessionDurationPctCap: 75,
    trainingRemovalDays: null,
    reintroductionDurationPctCap: null,
    reintroductionLoadPctCap: null,
    progressionLocked: true,
    novelStimulusBlocked: true,
    conditioningBlocked: true,
    testingBlocked: true,
  },
  nutritionConstraints: {
    aggressiveDeficitBlocked: true,
    reactiveRestrictionBlocked: true,
    fuelRestrictionBlocked: true,
    proteinFloorRequired: true,
    carbohydrateSupportRequired: true,
  },
  exitCriteria: {
    stableRecoveryDaysMin: 3,
    postSessionRecoveryHoursMax: null,
    sleepStableDaysMin: 3, // 3–5 consecutive nights
    behaviouralStabilityDaysMin: null,
    additionalCriteria: [
      'Sleep stabilised for 3–5 consecutive nights',
      'Recovery improving',
      'Session readiness returning',
    ],
  },
  escalation: {
    tier1ReviewDays: 5,
    tier2EscalateDays: 14,
    tier2EscalateTo: 'ns_overload',
    tier3CyclesWithinDays: 30,
  },
  prohibitions: [
    'Ignoring early sleep disruption',
    'Maintaining training intensity',
    'Cold exposure / stimulation use during disruption',
    'Attempting fat loss during disruption',
    'Delaying escalation past 14 days',
  ],
  commonFailures: [
    'Stacking modalities to maintain training output',
    'Misclassification as overreaching when sleep is the dominant signal',
  ],
}

/** 13D_06 — lifestyle stress dominant. */
const LIFESTYLE_STRESS: PlaybookDoctrine = {
  id: 'lifestyle_stress_dominant',
  source: '13D_06',
  name: 'Lifestyle Stress Dominant',
  purpose: 'Align training and behaviour to real-world capacity when external stress is the dominant limiting factor.',
  tier: 3,
  permissibleCategory: 'exposure',
  minDurationDays: 7,
  maxDurationDays: 60,  // can persist for extended periods (life stress is chronic)
  entryTriggers: {
    cfwsRequiresAll: [
      { key: 'schedule', signal: 'Amber' },
    ],
    cfwsRequiresAny: [
      { key: 'capacity', signal: 'Amber' },
      { key: 'capacity', signal: 'Red' },
      { key: 'regulation', signal: 'Amber' },
    ],
  },
  trainingConstraints: {
    loadReductionPct: [10, 25],
    densityRestIncreasePct: [20, 40],
    sessionsPerWeekCap: null,
    sessionsRemovedPerWeek: null,
    sessionDurationPctCap: null,
    trainingRemovalDays: null,
    reintroductionDurationPctCap: null,
    reintroductionLoadPctCap: null,
    progressionLocked: true,
    novelStimulusBlocked: true,
    conditioningBlocked: true,
    testingBlocked: true,
  },
  nutritionConstraints: {
    aggressiveDeficitBlocked: true,
    reactiveRestrictionBlocked: true,
    fuelRestrictionBlocked: true,
    proteinFloorRequired: true,
    carbohydrateSupportRequired: true,
  },
  exitCriteria: {
    stableRecoveryDaysMin: 7,
    postSessionRecoveryHoursMax: null,
    sleepStableDaysMin: null,
    behaviouralStabilityDaysMin: 7,
    additionalCriteria: [
      'Consistent recovery across ≥7 days',
      'Stable session repeatability',
      'Behavioural consistency restored',
    ],
  },
  escalation: {
    tier1ReviewDays: 21,
    tier2EscalateDays: 60,
    tier2EscalateTo: 'chronic_recovery_debt',
    tier3CyclesWithinDays: 120,
  },
  prohibitions: [
    'Treating lifestyle stress as a training problem',
    'Increasing training to push through',
    'Overcomplicating routines',
    'Attempting fat loss during high stress',
    'Misclassifying as chronic fatigue',
  ],
  commonFailures: [
    '"You do not reduce life stress, you adjust training to match it." — misapplying training reduction without behavioural simplification',
  ],
}

/** 13D_08 — post-diet stabilisation. */
const POST_DIET: PlaybookDoctrine = {
  id: 'post_diet',
  source: '13D_08',
  name: 'Post-Diet Stabilisation',
  purpose: 'Restore metabolic stability, prevent behavioural rebound, transition out of deficit safely.',
  tier: 5,
  permissibleCategory: 'exposure',
  minDurationDays: 14,
  maxDurationDays: 28,
  entryTriggers: {
    contextFlags: ['post_diet_completion'],
  },
  trainingConstraints: {
    loadReductionPct: [10, 25],
    densityRestIncreasePct: null,
    sessionsPerWeekCap: null,
    sessionsRemovedPerWeek: null,
    sessionDurationPctCap: null,
    trainingRemovalDays: null,
    reintroductionDurationPctCap: null,
    reintroductionLoadPctCap: null,
    progressionLocked: true,
    novelStimulusBlocked: true,
    conditioningBlocked: true,
    testingBlocked: true,
  },
  nutritionConstraints: {
    aggressiveDeficitBlocked: true,
    reactiveRestrictionBlocked: true,
    fuelRestrictionBlocked: true,
    proteinFloorRequired: true,
    carbohydrateSupportRequired: true,
  },
  exitCriteria: {
    stableRecoveryDaysMin: 7,
    postSessionRecoveryHoursMax: null,
    sleepStableDaysMin: null,
    behaviouralStabilityDaysMin: 14,
    additionalCriteria: [
      'Stable intake for 14+ days',
      'Controlled hunger',
      'Stable body weight trend',
      'Behavioural consistency',
    ],
  },
  escalation: {
    tier1ReviewDays: 14,
    tier2EscalateDays: 28,
    tier2EscalateTo: 'ns_overload',
    tier3CyclesWithinDays: 90,
  },
  prohibitions: [
    'Removing structure too early',
    'Treating hunger as signal for free eating',
    'Increasing training to offset eating',
    '"Diet is over" mentality',
  ],
  commonFailures: [
    'Loss of behavioural control during transition',
    'Rebound eating reinstating deficit cycle',
  ],
}

/** 13D_09 — post-competition (extreme peak) stabilisation. */
const POST_COMPETITION: PlaybookDoctrine = {
  id: 'post_competition',
  source: '13D_09',
  name: 'Post-Competition Stabilisation',
  purpose: 'Restore physiological stability after extreme peak conditions; prevent extreme rebound.',
  tier: 5,
  permissibleCategory: 'exposure',
  minDurationDays: 21,
  maxDurationDays: 42,
  entryTriggers: {
    contextFlags: ['post_competition_completion', 'physique_peak_completion'],
  },
  trainingConstraints: {
    loadReductionPct: null,
    densityRestIncreasePct: null,
    sessionsPerWeekCap: 3,
    sessionsRemovedPerWeek: null,
    sessionDurationPctCap: null,
    trainingRemovalDays: [1, 7],   // Phase 1 minimal/no training
    reintroductionDurationPctCap: 60,
    reintroductionLoadPctCap: 60,
    progressionLocked: true,
    novelStimulusBlocked: true,
    conditioningBlocked: true,
    testingBlocked: true,
  },
  nutritionConstraints: {
    aggressiveDeficitBlocked: true,
    reactiveRestrictionBlocked: true,
    fuelRestrictionBlocked: true,
    proteinFloorRequired: true,
    carbohydrateSupportRequired: true,
  },
  exitCriteria: {
    stableRecoveryDaysMin: 14,
    postSessionRecoveryHoursMax: null,
    sleepStableDaysMin: null,
    behaviouralStabilityDaysMin: 14,
    additionalCriteria: [
      'Stable intake',
      'Controlled hunger',
      'Behavioural consistency',
      'Stabilised body weight trend',
    ],
  },
  escalation: {
    tier1ReviewDays: 28,
    tier2EscalateDays: 42,
    tier2EscalateTo: 'burnout_return',
    tier3CyclesWithinDays: 180,
  },
  prohibitions: [
    'Immediate loss of structure',
    'Celebratory binge eating',
    'Training to offset food',
    'Identity collapse post-event',
  ],
  commonFailures: [
    '"More extreme the peak, the stricter the exit must be" — under-applying constraint',
    'Returning to peak conditioning before stabilisation complete',
  ],
}

/** 13D_10 — burnout return: phased re-entry. */
const BURNOUT_RETURN: PlaybookDoctrine = {
  id: 'burnout_return',
  source: '13D_10',
  name: 'Burnout Return',
  purpose: 'Rebuild trust, stability, and capacity after prolonged system shutdown.',
  tier: 2,
  permissibleCategory: 'context_environment',
  minDurationDays: 28, // multi-week phased process
  maxDurationDays: 90,
  entryTriggers: {
    contextFlags: ['confirmed_burnout', 'post_ns_overload_extended'],
  },
  trainingConstraints: {
    loadReductionPct: null,
    densityRestIncreasePct: null,
    sessionsPerWeekCap: 2,         // 1–2 sessions per week in Phase 2
    sessionsRemovedPerWeek: null,
    sessionDurationPctCap: null,
    trainingRemovalDays: null,     // Phase 1 may remove entirely; Phase 2 onwards reintroduces
    reintroductionDurationPctCap: 60,
    reintroductionLoadPctCap: 60,
    progressionLocked: true,
    novelStimulusBlocked: true,
    conditioningBlocked: true,
    testingBlocked: true,
  },
  nutritionConstraints: {
    aggressiveDeficitBlocked: true,
    reactiveRestrictionBlocked: true,
    fuelRestrictionBlocked: true,
    proteinFloorRequired: true,
    carbohydrateSupportRequired: true,
  },
  exitCriteria: {
    stableRecoveryDaysMin: 28,
    postSessionRecoveryHoursMax: null,
    sleepStableDaysMin: 14,
    behaviouralStabilityDaysMin: 28,
    additionalCriteria: [
      'Stable behaviour over multiple weeks',
      'Consistent training tolerance',
      'No avoidance patterns',
      'Emotional stability',
    ],
  },
  escalation: {
    tier1ReviewDays: 28,
    tier2EscalateDays: 90,
    tier2EscalateTo: 'system_review',
    tier3CyclesWithinDays: 180,
  },
  prohibitions: [
    'Reintroducing intensity too early',
    'Chasing progress too quickly',
    'Treating burnout as fatigue',
    'Ignoring behavioural avoidance signals',
  ],
  commonFailures: [
    'Skipping Phase 1 stabilisation',
    'Rebuilding capacity before rebuilding trust',
  ],
}

/** 13D_12 — supportive only: baseline state when no playbook is active but tools may be in use. */
const SUPPORTIVE_ONLY: PlaybookDoctrine = {
  id: 'supportive_only',
  source: '13D_12',
  name: 'Supportive Recovery (baseline)',
  purpose: 'Permitted use of supportive tools when no recovery playbook is active. PRS / SRM allowed; CRS only when system stable.',
  tier: 6,
  permissibleCategory: 'context_environment',
  minDurationDays: 0, // ambient state, no lock-in
  maxDurationDays: 9999,
  entryTriggers: {
    // No automatic entry; manually flagged by coach
  },
  trainingConstraints: {
    loadReductionPct: null,
    densityRestIncreasePct: null,
    sessionsPerWeekCap: null,
    sessionsRemovedPerWeek: null,
    sessionDurationPctCap: null,
    trainingRemovalDays: null,
    reintroductionDurationPctCap: null,
    reintroductionLoadPctCap: null,
    progressionLocked: false,
    novelStimulusBlocked: false,
    conditioningBlocked: false,
    testingBlocked: false,
  },
  nutritionConstraints: {
    aggressiveDeficitBlocked: false,
    reactiveRestrictionBlocked: false,
    fuelRestrictionBlocked: false,
    proteinFloorRequired: false,
    carbohydrateSupportRequired: false,
  },
  exitCriteria: {
    stableRecoveryDaysMin: null,
    postSessionRecoveryHoursMax: null,
    sleepStableDaysMin: null,
    behaviouralStabilityDaysMin: null,
    additionalCriteria: [],
  },
  escalation: {
    tier1ReviewDays: 9999,
    tier2EscalateDays: 9999,
    tier2EscalateTo: 'system_review',
    tier3CyclesWithinDays: 9999,
  },
  prohibitions: [
    'Using PRS/SRM/CRS to replace primary load reduction (per 13D_12)',
    'Recovery theatre — stacking modalities to maintain output',
    'CRS while any other recovery playbook is active',
  ],
  commonFailures: [
    'Tool dependency forming over time',
    'Stimulation use to mask early fatigue',
  ],
}

/* ===========================================================
 * Registry — single source of truth
 * =========================================================== */

export const RECOVERY_PLAYBOOKS: Readonly<Record<RecoveryPlaybookId, PlaybookDoctrine>> = Object.freeze({
  ns_overload: NS_OVERLOAD,
  chronic_recovery_debt: CHRONIC_RECOVERY_DEBT,
  burnout_return: BURNOUT_RETURN,
  sleep_disruption: SLEEP_DISRUPTION,
  lifestyle_stress_dominant: LIFESTYLE_STRESS,
  overreaching_vs_under_recovery: OVERREACHING,
  acute_fatigue: ACUTE_FATIGUE,
  post_diet: POST_DIET,
  post_competition: POST_COMPETITION,
  supportive_only: SUPPORTIVE_ONLY,
})

/**
 * 13D_15 hierarchy ordered tier 1 → 6. Used by router to pick single dominant
 * when multiple thresholds match. Never reorder without doctrine review.
 */
export const PLAYBOOK_PRIORITY_ORDER: readonly RecoveryPlaybookId[] = Object.freeze([
  'ns_overload',                  // T1
  'burnout_return',               // T2
  'chronic_recovery_debt',        // T2
  'sleep_disruption',             // T3
  'lifestyle_stress_dominant',    // T3
  'overreaching_vs_under_recovery', // T4
  'acute_fatigue',                // T4
  'post_diet',                    // T5
  'post_competition',             // T5
  'supportive_only',              // T6
])

export function getPlaybook(id: RecoveryPlaybookId): PlaybookDoctrine {
  return RECOVERY_PLAYBOOKS[id]
}

/**
 * 12E_01 — only these adjustment categories are permissible at Layer 2.
 * Anything else is non-permissible → escalate, do not adjust.
 */
export const PERMISSIBLE_CATEGORIES_DESCRIPTION: Record<PermissibleCategory, string> = {
  exposure: 'Adjustments to exposure that reduce immediate strain (load, volume, intensity).',
  timing_sequencing: 'Adjustments to when demand is encountered.',
  context_environment: 'Adjustments to context or environment that reduce destabilising inputs.',
  non_permissible_escalate: 'Outside permissible bounds — escalate, do not adjust.',
}
