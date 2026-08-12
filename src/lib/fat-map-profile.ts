/**
 * Fat Map profile typing.
 *
 * Single source of truth for assigning a lead to one of the four Fat Map
 * profiles (the "zones") from their scorecard. Used by both the pre-call brief
 * (coach-facing) and the scorecard submit route (which returns the zone to the
 * lead for the free result reveal).
 *
 * The four zones are gender-keyed in the doctrine:
 *   - Stress-Stored   (cortisol)      — either sex
 *   - Insulin-Drift   (insulin)       — either sex, male-leaning
 *   - Estrogen-Shift  (oestrogen)     — FEMALE only
 *   - Androgen-Decline(testosterone)  — MALE only
 *
 * Sex is the hard gate (it decides which zones are even possible). Fat-storage
 * location LEADS when supplied, but it only narrows the field — three of the four
 * drivers push fat centrally, so location alone misclassifies. The accompanying
 * signal decides: limbs thinning = cortisol, timing = insulin, muscle and drive
 * falling = androgen. Age + cycle status are tiebreakers / confidence levers, and
 * for Estrogen-Shift they set the phase.
 *
 * See 00_PLAYBOOK/Fat_Map_Definitions_LOCKED.md (v2.0, 2026-07-31) and
 * Fat_Map_Research_Review_2026-07-31.md for the evidence behind this.
 *
 * Pure, deterministic. Backward compatible: with no signals supplied it falls
 * back to the original score-pattern logic so legacy leads still type.
 */

export type SectionKey = '01' | '02' | '03' | '04' | '05'
export type SectionScores = Partial<Record<SectionKey, number>>
export type StateName = 'Depleted State' | 'Transitioning State' | 'Ready State'
export type Profile = 'Stress-Stored' | 'Insulin-Drift' | 'Estrogen-Shift' | 'Androgen-Decline' | 'Indeterminate'

export type BiologicalSex = 'M' | 'F'
export type AgeBand = 'under_35' | '35_44' | '45_54' | '55_plus'
export type FatStorage = 'midsection' | 'posterior' | 'hips_thighs' | 'all_over' | 'low_tone'
export type CycleStatus = 'regular' | 'irregular' | 'perimenopausal' | 'postmenopausal'

export interface ProfileSignals {
  sex?: BiologicalSex | null
  ageBand?: AgeBand | null
  fatStorage?: FatStorage | null
  cycleStatus?: CycleStatus | null
}

export interface ProfileResult {
  profile: Profile
  /** 'high' = safe to name the zone to the lead; 'low' = show a softer "points toward" framing. */
  confidence: 'high' | 'low'
}

export const PROFILE_DRIVERS: Record<Profile, string> = {
  'Stress-Stored': 'cortisol-driven',
  'Insulin-Drift': 'insulin-driven (male-leaning)',
  'Estrogen-Shift': 'oestrogen-driven (female)',
  'Androgen-Decline': 'testosterone-driven (male)',
  'Indeterminate': 'TBD on intake',
}

/** Coach-facing descriptors (pre-call brief). Terse, clinical, coach voice. */
export const PROFILE_DESCRIPTORS: Record<Profile, string> = {
  'Stress-Stored': 'Central anterior storage. Front of the midsection fills while the limbs stay lean or thin out, that contrast is the tell. Harder you push, tighter the body holds.',
  'Insulin-Drift': 'Posterior and flank storage, mid-back, lower back, love handles, plus deep abdominal fullness, with the front relatively spared. Afternoon crash and evening cravings are the timing tell.',
  'Estrogen-Shift': 'Oestrogen-driven, and it runs in two phases. Phase 1 holds gluteofemoral (hips, glutes, outer thighs). Phase 2 redistributes centrally as oestrogen falls, lean mass with it. Read the phase before the location.',
  'Androgen-Decline': 'A composition shift, not a storage location. Central fat up, lean mass down, chest filling via aromatisation. Drive, recovery and capacity slipping.',
  'Indeterminate': 'Scorecard alone doesn\'t cleanly point at one of the four. The intake will tell us which.',
}

/**
 * Lead-facing descriptors shown on the free scorecard result reveal. Speak to
 * the person, recognition + named mechanism, stop short of the prescription
 * (that is the $37 report's job). Approved 2026-06-24.
 */
export const PROFILE_DESCRIPTORS_LEAD: Record<Profile, string> = {
  'Stress-Stored': "You're managing a lot, and your body is holding on because of it. It sits at the front of your middle while your arms and legs stay lean, and the harder you push the tighter it holds.",
  'Insulin-Drift': "You're putting the work in, but your body is storing easily and not responding to it. It tends to settle around the back and sides rather than the front, and the signal that turns effort into change has drifted.",
  // Generic fallback only, used when phase cannot be determined. Prefer
  // leadDescriptor() below, which splits this by phase. See the note there.
  'Estrogen-Shift': "Your body has shifted into a slower, more conservative mode. It's not broken and it's not effort; it responds again once the approach respects what's changed.",
  'Androgen-Decline': "You're still putting the output in, but your drive, recovery and capacity have slipped. The system that turns training into results isn't bouncing back.",
  'Indeterminate': "No single pattern stands out from your answers yet. We'll pin down exactly what's driving your result on your call.",
}


/**
 * Lead-facing descriptor, phase-aware for Estrogen-Shift.
 *
 * Added 2026-08-12. Estrogen-Shift had a single description covering both
 * phases, so it had to be vague enough to fit both and ended up the only one of
 * the four with no physical tell at all. That is backwards: per
 * `03_ESTROGEN_SHIFT.md` §4, phase 1 has the single most distinctive location
 * in the whole map ("if it is hips, glutes and outer thighs, in a woman, it is
 * this"), while phase 2 is where location stops working and direction of travel
 * takes over.
 *
 * The doctrine also says age and cycle status are not tiebreakers here, they are
 * INPUTS that set the phase, and the system already collects both. So there is
 * no reason to speak to a phase-2 woman about hips and thighs when her fat is
 * moving centrally, which is the exact misread the lock warns about:
 *
 *   "a woman in phase 2 who is told she has a hips-and-thighs pattern will not
 *    recognise herself, because her fat is moving to the middle."
 *
 * Every other profile ignores the signals and returns its constant.
 */
export function leadDescriptor(profile: Profile, signals: ProfileSignals = {}): string {
  if (profile !== 'Estrogen-Shift') return PROFILE_DESCRIPTORS_LEAD[profile]

  const { cycleStatus, ageBand } = signals
  const phaseTwo =
    cycleStatus === 'perimenopausal' ||
    cycleStatus === 'postmenopausal' ||
    ageBand === '45_54' ||
    ageBand === '55_plus'

  // Unknown phase: fall back to the movement framing rather than naming a
  // location, because naming the wrong location is the costlier error.
  if (!cycleStatus && !ageBand) return PROFILE_DESCRIPTORS_LEAD['Estrogen-Shift']

  return phaseTwo
    ? "What's changed is where it's going. It used to sit on your hips and thighs and it's started moving to your middle, and muscle tends to go with it. That movement is the signal, more than the place it ends up. It's not broken and it's not effort; it responds again once the approach respects what's changed."
    : "It sits on your hips, glutes and outer thighs. That's the most distinctive place fat sits out of all four patterns, and it's oestrogen doing what it's meant to do. It's not broken and it's not effort; it responds again once the approach respects what's changed."
}

/**
 * Fat-storage location → Fat Map profile.
 *
 * Front belly/stomach = cortisol. Hips/thighs = oestrogen (phase 1).
 * Posterior/flank (mid-back, lower back, love handles) = insulin. Lost
 * tone/drive = androgen.
 *
 * Front vs back is the clean split between the two midsection patterns: the
 * front belly is the cortisol tell, and sparing the front while holding
 * posterior/flank rules Stress-Stored OUT.
 *
 * 'all_over' is deliberately ABSENT from this map. Fat_Map_Definitions_LOCKED
 * v2.0 retires "softening all over" as an insulin signal: generalised surface
 * softness IS superficial subcutaneous fat, the one compartment with no
 * meaningful insulin association (the DEEP abdominal and posterior depots are
 * what track insulin resistance). It is a failure to localise, not a positive
 * finding, so it must never lead the read. Handled separately in
 * typeFatMapProfile below.
 *
 * Until 2026-08-06 it routed here to Insulin-Drift. Every lead who picked it was
 * female and every one was typed into a male-leaning pattern on the weakest
 * signal in the set. See Fat_Map_v2_Alignment_Change_Plan.md.
 */
const STORAGE_PROFILE: Record<Exclude<FatStorage, 'all_over'>, Profile> = {
  midsection: 'Stress-Stored',
  posterior: 'Insulin-Drift',
  hips_thighs: 'Estrogen-Shift',
  low_tone: 'Androgen-Decline',
}

/**
 * Pick the floor (lowest section). When sections tie at the lowest score,
 * fall back to the priority order: Stress > Sleep > Energy > Training > Fat Loss
 * (root-cause hierarchy — stress drives compensation patterns most often).
 *
 * Returns null when no scores are present.
 */
export function pickFloor(scores: SectionScores): SectionKey | null {
  const priority: SectionKey[] = ['03', '02', '01', '04', '05']
  const present = priority.filter(k => scores[k] != null) as SectionKey[]
  if (present.length === 0) return null

  let lowest = Infinity
  for (const k of present) {
    const v = scores[k]!
    if (v < lowest) lowest = v
  }
  // Among the floor-tied keys, return the highest-priority one.
  for (const k of priority) {
    if (scores[k] != null && scores[k] === lowest) return k
  }
  return present[0]
}

/**
 * Best-guess Fat Map profile from the scorecard score pattern alone. This is
 * the original (sex-blind) logic, preserved verbatim — sex/age/storage refine
 * its output in typeFatMapProfile.
 */
function patternFromScores(
  scores: SectionScores,
  floor: SectionKey | null,
  state: StateName
): ProfileResult {
  const stress = scores['03']
  const sleep = scores['02']
  const energy = scores['01']
  const training = scores['04']
  const fatLoss = scores['05']

  // Ready State by definition means foundations are intact - the Fat Map
  // profiles describe compensation patterns, which Ready bodies don't have.
  if (state === 'Ready State') {
    if (stress === 1) return { profile: 'Stress-Stored', confidence: 'low' }
    return { profile: 'Indeterminate', confidence: 'high' }
  }

  // Without at least one section at 1, the scorecard isn't pointing at any
  // single Fat Map profile.
  const present = Object.values(scores).filter(v => v != null) as number[]
  const hasFloorAtOne = present.some(v => v === 1)
  if (!hasFloorAtOne) {
    return { profile: 'Indeterminate', confidence: 'high' }
  }

  // 1. Stress-dominant.
  if (stress === 1) {
    return { profile: 'Stress-Stored', confidence: 'high' }
  }

  // 2. Nervous-system blown — sleep + energy both compromised.
  if (sleep === 1 && energy != null && energy <= 2) {
    return { profile: 'Androgen-Decline', confidence: 'high' }
  }
  if (energy === 1 && sleep != null && sleep <= 2) {
    return { profile: 'Androgen-Decline', confidence: 'high' }
  }

  // 3. Long-arc hormonal — training and fat loss both stuck, foundations OK.
  if (
    fatLoss != null && training != null && stress != null && sleep != null &&
    fatLoss <= 2 && training <= 2 && (fatLoss === 1 || training === 1) &&
    stress >= 2 && sleep >= 2
  ) {
    return { profile: 'Estrogen-Shift', confidence: 'high' }
  }

  // 4. Insulin-only — fat loss alone is the floor, foundations strong.
  if (
    fatLoss === 1 && stress != null && sleep != null && energy != null && training != null &&
    stress >= 2 && sleep >= 2 && energy >= 2 && training >= 2
  ) {
    return { profile: 'Insulin-Drift', confidence: 'high' }
  }

  // 5. Floor-based soft fallback.
  switch (floor) {
    case '03': return { profile: 'Stress-Stored', confidence: 'low' }
    case '02':
    case '01': return { profile: 'Androgen-Decline', confidence: 'low' }
    case '04': return { profile: 'Estrogen-Shift', confidence: 'low' }
    case '05': return { profile: 'Insulin-Drift', confidence: 'low' }
  }

  return { profile: 'Indeterminate', confidence: 'high' }
}

/**
 * Type a lead into one of the four Fat Map zones, applying the doctrinal
 * gender keying plus age/storage/cycle signals when available.
 */
export function typeFatMapProfile(
  scores: SectionScores,
  state: StateName,
  signals: ProfileSignals = {}
): ProfileResult {
  const { sex, ageBand, fatStorage, cycleStatus } = signals
  const floor = pickFloor(scores)
  const pattern = patternFromScores(scores, floor, state)

  // Ready foundations: no compensation zone to name, regardless of storage.
  if (state === 'Ready State') {
    return pattern
  }

  const femaleMenopausal =
    sex === 'F' &&
    (cycleStatus === 'perimenopausal' || cycleStatus === 'postmenopausal' ||
      ageBand === '45_54' || ageBand === '55_plus')

  // Resolve a profile against biological sex. The two hard-gated zones
  // (Estrogen-Shift female-only, Androgen-Decline male-only) remap to the
  // sex-appropriate equivalent rather than being assigned impossibly.
  const resolveSex = (p: Profile): Profile => {
    if (sex === 'F' && p === 'Androgen-Decline') {
      // Female nervous-system / low-tone read: oestrogen if menopausal-band or
      // lower-body storage, otherwise the sex-neutral cortisol read.
      return femaleMenopausal || fatStorage === 'hips_thighs' ? 'Estrogen-Shift' : 'Stress-Stored'
    }
    if (sex === 'M' && p === 'Estrogen-Shift') {
      // Male long-arc fat-loss resistance: androgen if the recovery channel is
      // also down, otherwise insulin.
      const sleep = scores['02']; const energy = scores['01']
      const recoveryDown = (sleep != null && sleep <= 1) || (energy != null && energy <= 1)
      return recoveryDown ? 'Androgen-Decline' : 'Insulin-Drift'
    }
    return p
  }

  // 'all_over' is an admitted failure to localise, not a storage signal, and v2.0
  // explicitly retires it as an insulin tell. It must not lead the read.
  //
  //   - A woman in the menopausal band reporting generalised/even distribution is
  //     reading as phase-2 Estrogen-Shift: redistribution away from hips and
  //     thighs toward the middle. Low confidence, because "all over" is not a
  //     positive statement of central movement — confirm direction of travel.
  //   - Everyone else falls through to the score pattern as if no storage answer
  //     had been given, with confidence CAPPED at low. The cap matters: any
  //     Depleted lead with every section at the floor has stress at 1 by
  //     definition and would otherwise return Stress-Stored at high confidence,
  //     swapping one confident wrong answer for another.
  if (fatStorage === 'all_over') {
    if (femaleMenopausal) {
      return { profile: 'Estrogen-Shift', confidence: 'low' }
    }
    const resolvedNoStorage = resolveSex(pattern.profile)
    // Indeterminate keeps high confidence — it is a definite "nothing points
    // cleanly", not a weak guess.
    if (resolvedNoStorage === 'Indeterminate') {
      return { profile: resolvedNoStorage, confidence: 'high' }
    }
    return { profile: resolvedNoStorage, confidence: 'low' }
  }

  // Storage is the direct Fat Map signal — it leads when supplied.
  if (fatStorage) {
    const storageProfile = resolveSex(STORAGE_PROFILE[fatStorage])
    const patternProfile = resolveSex(pattern.profile)

    // Direct signal + symptom pattern agree → name it with confidence.
    if (storageProfile === patternProfile) {
      return { profile: storageProfile, confidence: 'high' }
    }
    // Menopausal-band woman whose storage reads oestrogen → high even if the
    // coarse score pattern points elsewhere.
    if (storageProfile === 'Estrogen-Shift' && femaleMenopausal) {
      return { profile: storageProfile, confidence: 'high' }
    }
    // Storage and pattern diverge → trust the direct read but mark it
    // provisional (lead sees the softer "points toward" framing).
    return { profile: storageProfile, confidence: 'low' }
  }

  // No storage signal (legacy leads): fall back to the score pattern, resolved
  // against sex. Cross-sex inference drops confidence.
  const resolved = resolveSex(pattern.profile)
  if (resolved === 'Estrogen-Shift' && femaleMenopausal) {
    return { profile: resolved, confidence: 'high' }
  }
  const confidence = resolved === pattern.profile ? pattern.confidence : 'low'
  return { profile: resolved, confidence }
}

/**
 * Pattern-definition safety text (added 2026-08-11).
 *
 * The four pattern names (Stress-Stored, Insulin-Drift, Estrogen-Shift,
 * Androgen-Decline) can be read as claims about a person's actual hormone
 * levels, which would be a physiological/diagnostic claim. We keep the locked
 * names but neutralise the risk two ways:
 *   - PATTERN_DEFINITION_NOTE: a client-facing footer rendered wherever a
 *     pattern name is shown to a client/lead.
 *   - PATTERN_HORMONE_GUARDRAIL: a prompt rule injected into every
 *     client-facing generator that writes pattern content, so the model never
 *     states or implies a measured hormone level.
 */
export const PATTERN_DEFINITION_NOTE =
  'These name an observed pattern of where the body stores and how it signals. They describe how the body is behaving, not a measurement of hormone levels.'

export const PATTERN_HORMONE_GUARDRAIL =
  'PATTERN NAMES ARE NOT HORMONE MEASUREMENTS. Stress-Stored, Insulin-Drift, Estrogen-Shift and Androgen-Decline name an OBSERVED storage-and-signal pattern, never a measured hormone level. Never state, imply, estimate, or predict the client\'s actual hormone levels. Do NOT say a hormone (oestrogen, testosterone, cortisol, insulin, or any other) is low, high, declining, elevated, deficient, or give any value or direction for it. Describe the pattern and the observable signals that point to it, not the hormone quantity. This is a non-diagnostic read.'
