/**
 * Pattern slug assignment from Day 7 quiz Q2 answer + gender.
 *
 * Doctrine (Body Recode System Peer Review §8):
 *   - Stress-Stored:    universal (cortisol)
 *   - Insulin-Drift:    male dominant (insulin) - DB slug 'metabolic-drift'
 *   - Estrogen-Shift:   female only (oestrogen)  - DB slug 'hormonal-shift'
 *   - Androgen-Decline: male only (testosterone) - DB slug 'system-overload'
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

export function pickPatternSlug(answer: QuizAnswer, gender: Gender): PatternSlug {
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
