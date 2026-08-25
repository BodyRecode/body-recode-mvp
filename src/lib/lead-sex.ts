/**
 * Pronouns for coach-facing copy about a specific lead or client.
 *
 * The brief and the companion were written when every lead was a woman, so the
 * holds said "don't let her pull you off it" to a hard-coded her. Garv (male,
 * booked 26 Aug 2026) read his own brief back as female. Same root cause as the
 * companion sex gate: content written for the audience the business started
 * with, on a surface that now sees everyone.
 *
 * Keyed on `leads.biological_sex`, which is the only sex field written by the
 * scorecard. Unknown is they/them, which is correct rather than a guess, and
 * unknown is the common case (99 of 130 leads predate the details step).
 */

export type SexKey = 'M' | 'F' | null | undefined

/**
 * The lead's sex, from whichever column actually holds it.
 *
 * `biological_sex` is written by the scorecard's details step and is the key
 * everything else uses. `leads.gender` is a different column written only by
 * the enrol/signup routes, and the two never met - a known live split. For
 * pronouns and for hiding a pattern, either one is better than neither, so
 * biological_sex wins and gender fills in behind it. 6 of the 99 leads with no
 * biological_sex have gender set.
 *
 * Pattern TYPING still uses biological_sex alone. This does not feed it.
 */
export function resolveLeadSex(lead: { biological_sex?: string | null; gender?: string | null }): 'M' | 'F' | null {
  const bio = lead.biological_sex
  if (bio === 'M' || bio === 'F') return bio
  const g = (lead.gender ?? '').toLowerCase()
  if (g === 'male') return 'M'
  if (g === 'female') return 'F'
  return null
}

export type Pronouns = {
  /** she / he / they */
  subject: string
  /** her / him / them */
  object: string
  /** her / his / their */
  possessive: string
  /** She / He / They */
  Subject: string
  /** She's / He's / They're */
  Contracted: string
}

export function pronounsFor(sex: SexKey): Pronouns {
  if (sex === 'M') return { subject: 'he', object: 'him', possessive: 'his', Subject: 'He', Contracted: 'He\'s' }
  if (sex === 'F') return { subject: 'she', object: 'her', possessive: 'her', Subject: 'She', Contracted: 'She\'s' }
  return { subject: 'they', object: 'them', possessive: 'their', Subject: 'They', Contracted: 'They\'re' }
}
