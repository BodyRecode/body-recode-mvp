/**
 * Energy requirement: the calculation the nutrition engine never had.
 *
 * Until 2026-07-30 the engine was macro-first in the strict sense. Meals were
 * built from grams-per-kilogram targets and `estimated_calorie_band` was set to
 * whatever those meals summed to, plus or minus 100. Nothing ever asked whether
 * that total suited the person eating it, and the validator said as much:
 * "the coach reviews the daily totals and decides whether the resulting band is
 * appropriate."
 *
 * That was not a design decision. HEIGHT WAS RECORDED NOWHERE, so no BMR
 * equation could run and no requirement could be estimated. The delegation to
 * the coach was a consequence of a missing column.
 *
 * With height captured on the baseline, the calculation is possible. This
 * module does it, and does it transparently: every function returns its own
 * workings so a coach can see how a number was reached and disagree with it.
 *
 * WHAT THIS IS NOT. It does not replace the g/kg floors in
 * nutrition-validation.ts. Those are safety minimums and they still win. An
 * estimate built on a population equation and a judged activity factor is not
 * grounds for under-fuelling a real person, so where the two disagree, the
 * floor holds and the conflict is surfaced.
 */

export type Sex = 'male' | 'female'

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active'

export type EntryState =
  | 'stabilisation'
  | 'training_support'
  | 'high_output_support'
  | 'recovery_reset'

/**
 * Activity multipliers applied to BMR.
 *
 * The descriptions matter more than the numbers. This factor is the single
 * largest source of error in the whole estimate: the gap between 1.55 and 1.70
 * is roughly 300 kcal a day for an average woman, which dwarfs any difference
 * between BMR equations.
 *
 * It must describe the client's WHOLE DAY, not their training. Vicki S has no
 * car and walks or cycles for all transport. Reading her as "moderately active"
 * off three gym sessions a week, while ignoring daily ambulation, understates
 * her by hundreds of calories. Non-exercise activity usually outweighs
 * training, and training frequency alone is a poor proxy for it.
 */
export const ACTIVITY_FACTORS: Record<ActivityLevel, { factor: number; label: string; description: string }> = {
  sedentary: {
    factor: 1.2,
    label: 'Sedentary',
    description: 'Desk work, drives everywhere, little walking, no structured training.',
  },
  lightly_active: {
    factor: 1.375,
    label: 'Lightly active',
    description: 'Desk work with some walking, or 1 to 3 training sessions a week and otherwise still.',
  },
  moderately_active: {
    factor: 1.55,
    label: 'Moderately active',
    description: 'On their feet part of the day, or 3 to 5 sessions a week, or walks and cycles regularly for transport.',
  },
  very_active: {
    factor: 1.725,
    label: 'Very active',
    description: 'Physical job, or 6 or more sessions a week, or high daily ambulation on top of training.',
  },
  extremely_active: {
    factor: 1.9,
    label: 'Extremely active',
    description: 'Manual labour plus training, or an endurance block carrying substantial weekly volume.',
  },
}

/**
 * Energy direction by entry state.
 *
 * Stabilisation sits at maintenance to a very slight deficit ON PURPOSE. Its
 * own doctrine says weight loss there is an emergent outcome of restored sleep
 * and stress regulation, not something to force, and modulation is prohibited.
 * A meaningful deficit in stabilisation would contradict the state.
 *
 * recovery_reset is the only state permitted to sit ABOVE maintenance: a body
 * being pulled out of a hole needs fuel, not restriction.
 */
const STATE_ENERGY_DIRECTION: Record<EntryState, { low: number; high: number; note: string }> = {
  stabilisation: {
    low: 0.90, high: 1.00,
    note: 'Maintenance to a slight deficit. Stabilisation prohibits modulation and treats fat loss as emergent, not forced.',
  },
  training_support: {
    low: 0.85, high: 1.00,
    note: 'Maintenance down to a moderate deficit, set by the goal. Training demand must stay fuelled.',
  },
  high_output_support: {
    low: 0.95, high: 1.10,
    note: 'Maintenance or above. Output at this level cannot be supported from a deficit.',
  },
  recovery_reset: {
    low: 1.00, high: 1.15,
    note: 'At or above maintenance. A body being restored needs fuel; a deficit here deepens the hole.',
  },
}

export interface EnergyInputs {
  sex: Sex | null
  ageYears: number | null
  heightCm: number | null
  weightKg: number | null
  activityLevel: ActivityLevel
  entryState: EntryState
}

export interface EnergyEstimate {
  /** Null when an input is missing. A stated gap beats an invented number. */
  bmr: number | null
  tdee: number | null
  targetLow: number | null
  targetHigh: number | null
  activityFactor: number
  /** Plain-language derivation, shown to the coach so the number is arguable. */
  workings: string[]
  /** Inputs that were missing. Non-empty means bmr is null. */
  missing: string[]
}

/**
 * Mifflin-St Jeor. Chosen over Harris-Benedict because it is more accurate in
 * modern populations, and over Katch-McArdle because that needs body fat
 * percentage, which is not captured and would be guessed.
 */
export function estimateBMR(sex: Sex, ageYears: number, heightCm: number, weightKg: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears
  return Math.round(sex === 'male' ? base + 5 : base - 161)
}

export function estimateEnergyRequirement(input: EnergyInputs): EnergyEstimate {
  const { sex, ageYears, heightCm, weightKg, activityLevel, entryState } = input
  const activity = ACTIVITY_FACTORS[activityLevel] ?? ACTIVITY_FACTORS.moderately_active
  const direction = STATE_ENERGY_DIRECTION[entryState] ?? STATE_ENERGY_DIRECTION.stabilisation

  const missing: string[] = []
  if (!sex) missing.push('sex')
  if (ageYears == null) missing.push('age')
  if (heightCm == null) missing.push('height')
  if (weightKg == null) missing.push('bodyweight')

  if (missing.length > 0 || !sex || ageYears == null || heightCm == null || weightKg == null) {
    return {
      bmr: null, tdee: null, targetLow: null, targetHigh: null,
      activityFactor: activity.factor,
      missing,
      workings: [
        `Energy requirement cannot be estimated: ${missing.join(', ')} not recorded.`,
        'Do not guess. Build the plan from the protein anchor and the g/kg floors, and say in the rationale that no energy estimate was possible.',
      ],
    }
  }

  const bmr = estimateBMR(sex, ageYears, heightCm, weightKg)
  const tdee = Math.round(bmr * activity.factor)
  // Round the LOW bound up whenever the state floors at or above maintenance,
  // so rounding to the nearest 10 cannot push a recovery_reset floor below the
  // maintenance figure it is supposed to protect. At TDEE 2052 the old
  // round-to-nearest gave a floor of 2050, which is a deficit in the one state
  // whose entire purpose is not running one.
  const targetLow = direction.low >= 1
    ? Math.ceil(tdee * direction.low / 10) * 10
    : Math.round(tdee * direction.low / 10) * 10
  const targetHigh = Math.round(tdee * direction.high / 10) * 10

  return {
    bmr, tdee, targetLow, targetHigh,
    activityFactor: activity.factor,
    missing: [],
    workings: [
      `BMR (Mifflin-St Jeor, ${sex}, ${ageYears}y, ${heightCm}cm, ${weightKg}kg) = ${bmr} kcal`,
      `TDEE = ${bmr} x ${activity.factor} (${activity.label}: ${activity.description}) = ${tdee} kcal`,
      `Target band = ${Math.round(direction.low * 100)}% to ${Math.round(direction.high * 100)}% of TDEE = ${targetLow} to ${targetHigh} kcal`,
      `${entryState}: ${direction.note}`,
      `Activity factor is the widest source of error here. One step either way moves the target by roughly ${Math.round(bmr * 0.15)} kcal a day.`,
    ],
  }
}

/** Whole years between a date of birth and now. */
export function ageFromDob(dob: string | null | undefined, now: Date = new Date()): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age >= 0 && age < 130 ? age : null
}

/** Intake stores free text ("Female", "male"). Anything else is not guessed. */
export function normaliseSex(raw: string | null | undefined): Sex | null {
  const v = (raw ?? '').trim().toLowerCase()
  if (v.startsWith('f')) return 'female'
  if (v.startsWith('m')) return 'male'
  return null
}
