/**
 * Which blocks the follow-up (supplementary) intake shows a given client.
 *
 * The follow-up exists to ask an existing client only what was added to the
 * intake after they did theirs. Until 13 Sep 2026 it always asked the same nine
 * medication and diet questions. Hormonal status was then added to the intake,
 * and most existing clients had already done the follow-up, so re-sending it
 * would have made them wade through nine answered questions to reach the new
 * ones. It now works out what each client is missing.
 *
 *   hormonal   shown when the latest intake has no sex_at_birth (the one
 *              hormonal question every client is asked, so its absence means
 *              the section was never answered).
 *   medsDiet   shown when any of the nine is missing, OR when hormonal status
 *              is already answered — a coach re-sending the follow-up to a
 *              fully answered client is doing it to update meds or diet,
 *              which is what the form was for before this.
 *
 * Shared by the page (what to render) and the submit route (what to write), so
 * the server never trusts the browser about which block was on screen.
 */

export const DIET_KEYS = [
  'dietary_restrictions', 'dietary_preferences', 'typical_day_eating',
  'meals_per_day', 'fluid_intake', 'caffeine_intake', 'alcohol_intake',
] as const

export interface SupplementaryBlocks {
  medsDiet: boolean
  hormonal: boolean
}

export function supplementaryBlocks(
  intake: Record<string, unknown> | null | undefined,
  medications: string | null | undefined,
): SupplementaryBlocks {
  const blank = (v: unknown) => typeof v !== 'string' || v.trim() === ''
  const hormonal = blank(intake?.sex_at_birth)
  const medsDietMissing = blank(medications) || DIET_KEYS.some(k => blank(intake?.[k]))
  return { hormonal, medsDiet: medsDietMissing || !hormonal }
}
