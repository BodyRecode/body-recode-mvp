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
 * location is the direct discriminator (it IS the Fat Map). Age + cycle status
 * are tiebreakers / confidence levers layered on top.
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
export type FatStorage = 'midsection' | 'hips_thighs' | 'all_over' | 'low_tone'
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
  'Insulin-Drift': 'insulin-driven (male-dominant)',
  'Estrogen-Shift': 'oestrogen-driven (female)',
  'Androgen-Decline': 'testosterone-driven (male)',
  'Indeterminate': 'TBD on intake',
}

export const PROFILE_DESCRIPTORS: Record<Profile, string> = {
  'Stress-Stored': 'Managing a lot, holding on. Harder you push, tighter the body holds.',
  'Insulin-Drift': 'Effort going in but insulin signalling has drifted. Storage is full-body, response is suppressed.',
  'Estrogen-Shift': 'Long-arc oestrogen-driven conservation. Slow to shift, but moves once restriction stops and the cycle is respected.',
  'Androgen-Decline': 'Output going up but the testosterone-signalling channel never recovers. Drive and capacity slipping.',
  'Indeterminate': 'Scorecard alone doesn\'t cleanly point at one of the four. The intake will tell us which.',
}

/**
 * Fat-storage location → Fat Map profile. Mirrors the doctrine in the
 * pre-call brief Fat Map section: stomach/waist = cortisol, hips/thighs =
 * oestrogen, full-body softening = insulin, lost tone/drive = androgen.
 */
const STORAGE_PROFILE: Record<FatStorage, Profile> = {
  midsection: 'Stress-Stored',
  hips_thighs: 'Estrogen-Shift',
  all_over: 'Insulin-Drift',
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
