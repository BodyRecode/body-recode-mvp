/**
 * Pattern slug assignment from Day 7 Check-In signal answers.
 *
 * Doctrine: `Fat_Map_Definitions_LOCKED.md` v2.0 (31 Jul 2026) and the four
 * profile documents in `00_PLAYBOOK/fat-map-profiles/`.
 *   - Stress-Stored:    either sex (cortisol)
 *   - Insulin-Drift:    either sex, male-LEANING (insulin) - DB slug 'metabolic-drift'
 *   - Estrogen-Shift:   female only (oestrogen)            - DB slug 'hormonal-shift'
 *   - Androgen-Decline: male only (testosterone)           - DB slug 'system-overload'
 *
 * When the lived-experience answer indicates a gendered pattern that does
 * not apply to the client's biological sex, we redirect to the closest
 * appropriate pattern rather than incorrectly assign:
 *   - Female with 'd' (androgen) -> Estrogen-Shift
 *     (the "slipping despite effort" framing in females typically maps
 *      to perimenopausal oestrogen-driven decline, not androgen decline)
 *   - Male with 'c' (estrogen) -> Stress-Stored
 *     (the "mood shifts / water retention" markers in males usually
 *      reflect cortisol-driven compensation, not oestrogen signalling)
 *   - Unknown gender -> Stress-Stored (universal, safest default)
 */

export type Gender = 'male' | 'female' | 'prefer_not_to_say' | null
export type QuizAnswer = 'a' | 'b' | 'c' | 'd'
export type PatternSlug = 'stress-stored' | 'metabolic-drift' | 'hormonal-shift' | 'system-overload'

/**
 * sq3, the phase-2 discriminator. Asked only of women in the menopausal band.
 * `to_middle` is the phase-2 Estrogen-Shift read: storage migrating away from
 * hips and thighs toward the abdomen.
 */
export type DirectionOfTravel = 'to_middle' | 'same_place' | 'other' | 'unsure'

export type PhaseSignals = {
  cycleStatus?: string | null
  ageBand?: string | null
  directionOfTravel?: DirectionOfTravel | string | null
}

/**
 * Menopausal band, per `03_ESTROGEN_SHIFT.md` §8: for this profile age and cycle
 * status are not tiebreakers, they are INPUTS that set the phase. Mirrors
 * `femaleMenopausal` in `fat-map-profile.ts` so the two engines agree.
 */
export function isMenopausalBand(gender: Gender, cycleStatus?: string | null, ageBand?: string | null): boolean {
  if (gender !== 'female') return false
  return cycleStatus === 'perimenopausal'
    || cycleStatus === 'postmenopausal'
    || ageBand === '45_54'
    || ageBand === '55_plus'
}

export function pickPatternSlug(answer: QuizAnswer, gender: Gender, signals: PhaseSignals = {}): PatternSlug {
  // Phase-2 Estrogen-Shift override (added 2026-08-06).
  //
  // Before this, the Check-In had no phase-2 route at all: the oestrogen option
  // described gluteofemoral storage only, so a woman whose fat was migrating to
  // the middle did not recognise herself in it, picked the post-meal sluggishness
  // option instead, and was typed Insulin-Drift. `03_ESTROGEN_SHIFT.md` §4 names
  // direction of travel as the discriminator, so sq3 now asks it directly rather
  // than the engine guessing around a missing question.
  if (
    signals.directionOfTravel === 'to_middle'
    && isMenopausalBand(gender, signals.cycleStatus, signals.ageBand)
  ) {
    return 'hormonal-shift'
  }

  if (answer === 'a') return 'stress-stored'
  if (answer === 'b') return 'metabolic-drift'

  if (answer === 'c') {
    if (gender === 'female') return 'hormonal-shift'
    return 'stress-stored'
  }

  if (answer === 'd') {
    if (gender === 'male') return 'system-overload'
    if (gender === 'female') return 'hormonal-shift'
    return 'stress-stored'
  }

  return 'stress-stored'
}

/**
 * Translate a legacy letter quiz_result to a slug for rendering compatibility.
 * Used when reading existing data that pre-dates the SQL migration.
 */
export function legacyLetterToSlug(value: string): string {
  switch (value) {
    case 'a': return 'stress-stored'
    case 'b': return 'metabolic-drift'
    case 'c': return 'hormonal-shift'
    case 'd': return 'system-overload'
    default:  return value
  }
}
