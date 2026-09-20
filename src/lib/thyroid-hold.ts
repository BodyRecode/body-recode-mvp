/**
 * THYROID_HOLD: the engine must not cut somebody's food while a possible
 * medical cause is unchecked.
 *
 * From research pass T1, 20 September 2026.
 *
 * THE PROBLEM IT SOLVES. Our nutrition engine builds calorie deficits. If a
 * woman's weight will not move because her thyroid is underactive, the
 * engine's natural next move is to cut her further. That is not just a wrong
 * answer, it is a harmful direction, and it is the exact failure this brief
 * was written to prevent.
 *
 * WHY A QUESTIONNAIRE CANNOT SORT THIS OUT. A thirteen-symptom score separated
 * underactive thyroid function from normal function with an area under the
 * curve of 0.91 in younger men and 0.64 in older women. In the half of our
 * audience over fifty that is close to a coin toss, and only three of the
 * thirteen symptoms were more common in the people who had it. So the rule is
 * not "detect it". The rule is REFER, and hold the deficit while we wait.
 *
 * THE HONEST LABEL. This is a SAFETY DEFAULT, not an evidence-based protocol.
 * No trial has compared holding against proceeding. What is evidenced is that
 * thyroid function must be known before a stalled weight or a low
 * triiodothyronine is interpreted as a deficit effect. The strongest argument
 * for holding is not harm, it is MEASUREMENT: deepening the deficit before the
 * blood test shifts the very results the doctor is about to read.
 *
 * Anyone who later asks why this rule exists deserves that answer rather than
 * a claim we cannot support.
 */

export interface ThyroidFlagInput {
  /** Case-finding ticks: past thyroid problem, family history, autoimmune condition, neck lump, amiodarone or lithium, and the rest of the guideline list. */
  caseFindingTicks?: number
  /** Symptoms that CHANGED in the last 12 months. Change is the only framing with published discriminating value. */
  changedSymptomTicks?: number
  /** Pregnant, trying to conceive, breastfeeding, or within 12 months of birth. */
  pregnancyState?: boolean
  /** Taking kelp, iodine, a thyroid support or glandular product, or high-dose selenium. */
  thyroidProductTicks?: number
  /** Tracked: weight falling faster than the prescribed intake predicts AND resting heart rate trending up while load is flat or falling. */
  reverseFlag?: boolean
  /** Set once the client confirms a GP review has happened. The only thing that clears the hold. */
  gpReviewConfirmed?: boolean
}

export interface ThyroidFlag {
  open: boolean
  reasons: string[]
}

/**
 * Deliberately a LOW threshold. A low threshold costs a doctor's appointment.
 * A high one costs a missed case, in a population where the symptom score does
 * not work.
 */
export function thyroidFlag(input: ThyroidFlagInput | null | undefined): ThyroidFlag {
  if (!input) return { open: false, reasons: [] }
  if (input.gpReviewConfirmed) return { open: false, reasons: [] }

  const reasons: string[] = []
  if ((input.caseFindingTicks ?? 0) > 0) reasons.push('she ticked something on the case-finding list that Australian guidelines say warrants a test')
  if ((input.changedSymptomTicks ?? 0) >= 2) reasons.push('two or more things changed for her in the last twelve months')
  if (input.pregnancyState && (input.changedSymptomTicks ?? 0) > 0) reasons.push('pregnancy, trying to conceive, breastfeeding or the first year after birth, alongside a change she reported')
  if ((input.thyroidProductTicks ?? 0) > 0) reasons.push('she is taking kelp, iodine, a thyroid support or glandular product, or high-dose selenium')
  if (input.reverseFlag) reasons.push('her weight is falling faster than her intake predicts while her resting heart rate trends up')

  return { open: reasons.length > 0, reasons }
}

/** What the generators are told while the flag is open. Quoted into the prompt verbatim. */
export const THYROID_HOLD_RULE = `THYROID HOLD ACTIVE. A possible medical cause for this client's symptoms has not been checked yet, and the engine must not build around it.
1. Energy target stays at her CURRENT intake. No new deficit, no deepening of an existing deficit, no reduction of any macronutrient floor.
2. No new restriction of a food group, no fasting window, and no refeed or reverse-diet protocol framed as a metabolic fix.
3. No supplement recommendation of any kind while the flag is open. Iodine, kelp, seaweed, thyroid support, glandular products and high-dose selenium are blocked permanently, flag or no flag: nine of ten marketed thyroid supplements tested contained real thyroid hormone, and Australia is iodine sufficient.
4. Training continues at her current load. Progression increments are frozen.
5. Produce NO interpretation of why. You may not name the thyroid, may not give a likelihood, a score or a pattern, and may not say "this looks thyroid-driven". A questionnaire cannot separate these symptoms from under-recovery, a long deficit, low iron or the menopause transition, and the research that tested exactly this found symptom questionnaires perform close to chance in women in this age range.
6. If she is pregnant, trying to conceive, breastfeeding or within twelve months of birth, generate NO energy deficit at all, flag or no flag.`

/** What the client reads. Fixed wording: nothing is generated around it. */
export const THYROID_HOLD_CLIENT_TEXT = `We have paused the eating targets in your plan. Not because something is wrong with you, but because we should not build an eating plan around a possible medical cause, and we are not allowed to. Keep training as you are. Keep eating as you are. Get the test, then come back and we will rebuild the plan around the answer.`

/** The referral, verbatim. Nothing is generated around this either. */
export const THYROID_REFERRAL_TEXT = `Some of your answers are ones Australian guidelines say a doctor should look into with a blood test. Please book with your general practitioner, take this page with you, and ask whether thyroid function tests are appropriate for you. In Australia your GP orders this as "thyroid function tests", and the laboratory decides which hormones to add.

We are not telling you anything about your thyroid, and we cannot. A questionnaire cannot separate these symptoms from under-recovery, a long deficit, low iron or the menopause transition, and research that tested exactly this found symptom questionnaires perform close to chance in women in your age range. That is why we are sending you rather than guessing.

One blood test rarely explains tiredness on its own, so ask your GP to look at the whole picture rather than one test. A normal result does not mean nothing is going on and it is not a reason to stop asking.

Your training stays as it is. We will not lower your food intake until you have been seen, because eating less will not fix a medical cause and being in a deficit can change the very results your GP is about to read.`

export const THYROID_REFERRAL_URGENT_OPENING = `See your general practitioner within the next few days, not in a few weeks, and tell the receptionist these symptoms when you book. Do not continue this program until you have been seen.`

export const THYROID_REFERRAL_EMERGENCY_OPENING = `Stop and get help now. Call 000 or go to your nearest emergency department. Do not wait for a GP appointment.`

/**
 * Products that are never recommended, flag or no flag.
 * Nine of ten marketed thyroid support supplements tested contained real
 * triiodothyronine. Australia is iodine sufficient, and excess iodine carries
 * roughly 2.8 times the odds of overt underactive thyroid function.
 */
export const BLOCKED_THYROID_PRODUCTS = [
  'iodine',
  'kelp',
  'seaweed',
  'bladderwrack',
  'thyroid support',
  'thyroid complex',
  'glandular',
  'desiccated thyroid',
  'armour thyroid',
  'high-dose selenium',
]

/**
 * The flag, derived from what she actually answered on the intake.
 *
 * "None of these" is a real answer and must not be counted as a tick, which is
 * the sort of thing that silently turns a low threshold into every client.
 */
export function thyroidFlagFromScreen(
  screen: Record<string, unknown> | null | undefined,
  opts?: { pregnancyState?: boolean; reverseFlag?: boolean; gpReviewConfirmed?: boolean },
): ThyroidFlag {
  const ticks = (key: string): number => {
    const v = screen?.[key]
    if (!Array.isArray(v)) return 0
    return v.filter(x => typeof x === 'string' && !/^none of these$/i.test(x.trim())).length
  }
  return thyroidFlag({
    caseFindingTicks: ticks('tq_history'),
    changedSymptomTicks: ticks('tq_changed'),
    thyroidProductTicks: (screen?.tq_products as string[] | undefined ?? []).filter(
      x => typeof x === 'string' && /kelp|seaweed|iodine|thyroid support|glandular|natural thyroid|selenium/i.test(x),
    ).length,
    pregnancyState: opts?.pregnancyState,
    reverseFlag: opts?.reverseFlag,
    gpReviewConfirmed: opts?.gpReviewConfirmed,
  })
}
