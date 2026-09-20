/**
 * Bone: what actually builds it in women 35 to 60, and what we may say about it.
 *
 * Research pass B1, 20 September 2026. 88 identifiers verified.
 *
 * WHY THIS EXISTS. We made the hole ourselves. The recovery library told
 * clients a vibration plate offered modest support for bone density; research
 * pass R2 killed that claim, and from then until now, a woman who said bone
 * was her concern got a correct "not the plate" and nothing to do instead.
 *
 * THE THREE THINGS THAT SHAPE EVERYTHING BELOW:
 *
 * 1. The prescription exists and it is not gentle. Heavy barbell work at 80 to
 *    85 per cent of one repetition maximum, five sets of five, twice a week,
 *    with about fifty impacts in the same session, for eight months or longer.
 *    It is the only thing that has reliably added density at the spine.
 *
 * 2. THE AGE GAP IS AS BAD AS THE ONE IN THE RECOVERY LIBRARY. LIFTMOR, the
 *    trial everyone quotes, enrolled women averaging 65 and EXCLUDED anyone
 *    within five years of their final period. Our audience is 35 to 50.
 *    Exactly one trial has run in peri and early post menopausal women: forty
 *    people, a feasibility trial, a small spine benefit and NO HIP BENEFIT.
 *    Every loading number here is an extrapolation downward in age and the
 *    platform says so on screen.
 *
 * 3. NOBODY HAS SHOWN THAT EXERCISE PREVENTS A FRACTURE. Not one exercise
 *    trial has been powered to test it. The percentages in circulation, of the
 *    "a two per cent density gain cuts fracture risk by twenty-eight per cent"
 *    kind, come from DRUG trials. The defensible fracture argument for
 *    training is the falls argument, and that evidence sits in people around
 *    76, not 48.
 *
 * So the claim we are allowed to make is smaller than the industry's: slower
 * loss, plus better strength, balance and function. It is also true.
 */

/** The programme for a woman with nothing identified on her record. */
export const BONE_PROTOCOL_GENERAL = `THE BONE BLOCK, for a woman 35 to 60 with nothing identified on her record.

PHASE 0, weeks 1 to 8, earn the load.
- Resistance twice a week, 30 minutes: a hinge, a squat to a box, a press, a pull. Bodyweight or an empty bar, two to three sets of five to eight. Technique every session.
- Impact three days a week: foot stomping, then heel drops. Start at 20 impacts, build to 50 in bouts of 10.
- Balance three days a week, 10 minutes, hard enough that she wobbles.
- If she is currently sedentary, NO high impact until six to twelve weeks of resistance training are behind her.

PHASE 1, month 3 onward, the bone block.
- Resistance twice a week, 30 to 40 minutes. Same four patterns. FIVE SETS OF FIVE at 80 to 85 per cent of one repetition maximum, after one to two warm-up sets at 50 to 70 per cent. Progress 5 per cent once five by five at 85 per cent is completed.
- Impact in the same session and on off days: 50 multidirectional hops or jumps in bouts of 10. Daily is the target, four days a week works, TWO DAYS A WEEK DOES NOTHING. Land through the whole foot with a soft knee.
- Balance three to four days a week.
- STILL CYCLING (roughly 35 to 45): impact alone raises hip density and is a legitimate start on its own if she will not lift yet.
- PAST HER FINAL PERIOD: impact alone has not worked. The barbell is not optional.

THE REST OF IT.
- Calcium 1,000 mg a day to age 50, 1,300 mg from 51, counted in 250 mg blocks, food first.
- Protein at least 1.0 to 1.2 g per kg of body weight. Higher is not a bone risk.
- Vitamin D: do not test and do not supplement by default. Under 10 minutes of Brisbane sun most days is enough for a fair-skinned person. If she cannot get sun, 1,000 international units. Anything else is her GP's.
- If she is in a deficit, resistance training is NOT optional: it cut hip bone loss during weight loss by about three quarters in the trial that tested it.
- Smoking is the biggest single lifestyle lever. Alcohol matters above about two standard drinks a day. Coffee does not matter.

TIMELINE AND HOW TO JUDGE IT.
- Nothing measurable before six months. Expect eight to twelve. The programmes that ran a full 48 weeks did best.
- Judge the first twelve months on STRENGTH AND FUNCTION, not on a scan: squat and deadlift, sit-to-stand, single-leg balance time.
- Realistic ceiling, stated up front: about 1 to 3 per cent at the spine and about 1 per cent at the hip, relative to not training. Most of it is loss prevented.

SUPERVISION. Supervised for the first eight to twelve weeks for anyone who has never used a barbell. Anything above 75 per cent of one repetition maximum is supervised for technique.`

/** What changes when there is a diagnosis. The change is not "lighter". */
export const BONE_PROTOCOL_DIAGNOSED = `WITH OSTEOPENIA OR OSTEOPOROSIS, the change is NOT "go lighter". Under-loading is the more common error in this group. The change is: cleared, supervised, and tiered by fracture risk.

- A GP clears her before any load goes on.
- The first eight to twelve weeks are run by an accredited exercise physiologist or physiotherapist, not by us.
- Resistance STILL goes to 80 to 85 per cent. That is the Australian prescription for this exact population and the only thing that has moved the spine.
- Impact is tiered by fracture risk. Start everyone at moderate and progress only where fracture risk is low and technique is supervised.
- OUT: repeated, sustained or end-range spinal flexion, and flexion or twisting under load. Sit-ups, crunches, weighted round-back lifts, deep seated forward folds.
- IN: teaching the hip hinge. We do not hand her a list of forbidden movements and we never tell her that bending is dangerous.
- Balance is compulsory, four days a week. It is the only part of this with high-certainty evidence attached to a real fracture outcome.
- Calcium and vitamin D are checked before we claim the loading will work.
- Re-scan on the Medicare interval, not sooner: every 24 months for known low bone density.`

/** The referral, verbatim, wherever a trigger fires. */
export const BONE_REFERRAL_SENTENCE =
  'This is outside what we do. We are stopping any increase in your load or impact until your general practitioner has looked at this, and we will pick the programme back up when they tell us to.'

export interface BoneReferralTrigger {
  when: 'same-day' | 'same-week' | 'before-loading'
  trigger: string
}

export const BONE_REFERRAL_TRIGGERS: BoneReferralTrigger[] = [
  { when: 'same-day', trigger: 'On hormone therapy with new calf pain or swelling, chest pain, shortness of breath, sudden severe headache, visual change, one-sided weakness, or new unexpected vaginal bleeding' },

  { when: 'same-week', trigger: 'A stopped, missed or overdue six-monthly bone injection (denosumab), including anything phrased as "taking a break from my bone medication"' },
  { when: 'same-week', trigger: 'New thigh or groin pain on a long-term bisphosphonate or denosumab. Remove impact and lower-body loading on that side' },
  { when: 'same-week', trigger: 'Sudden new mid-back or lower-back pain, worse standing or walking and eased lying down' },
  { when: 'same-week', trigger: 'Height loss, or a newly rounded upper back' },
  { when: 'same-week', trigger: 'Any bone broken from a fall from standing height or less' },
  { when: 'same-week', trigger: 'Repeated falls' },
  { when: 'same-week', trigger: 'Periods stopped before 45, or ovaries removed under 45, with no bone density scan and nobody managing it' },
  { when: 'same-week', trigger: 'No period for four months or more under 45, or twelve months at 40 to 44' },
  { when: 'same-week', trigger: 'Absent periods alongside a deliberate deficit or high training volume. This one also goes to an accredited sports dietitian' },

  { when: 'before-loading', trigger: 'Any bone condition on her record with no clinician involved' },
  { when: 'before-loading', trigger: 'Any fracture in the past twelve months, from any cause' },
  { when: 'before-loading', trigger: 'A known spinal fracture, or more than one past fracture from a minor fall' },
  { when: 'before-loading', trigger: 'Unassessed back pain' },
  { when: 'before-loading', trigger: 'Retinopathy or retinal detachment history, a current hernia, an unrehabilitated shoulder problem, uncontrolled cardiovascular disease, or pelvic floor dysfunction' },
  { when: 'before-loading', trigger: 'Any question about starting, stopping or changing a medicine, including hormone therapy' },
  { when: 'before-loading', trigger: 'Any request to interpret a scan or a T-score' },
  { when: 'before-loading', trigger: 'Invasive dental work coming up while on a bisphosphonate or denosumab' },
]

/** Quoted into the generators. These are refusals, not preferences. */
export const BONE_NEVER_SAY = `BONE: THINGS THE SYSTEM MAY NEVER SAY.
- Never tell anyone to start, stop, delay, skip, reduce, increase or change any medicine, including bone medicines and hormone therapy. Not as a suggestion, not as "some people find".
- Never say training can replace a bone medicine, or that she can come off one because her strength improved.
- Never tell a client her bone density has improved or worsened. Only a repeat scan reported by a specialist can say that.
- Never interpret a scan, a T-score or a Z-score, and never tell her whether she has osteoporosis.
- NEVER ATTACH A FRACTURE-REDUCTION PERCENTAGE TO EXERCISE. No exercise trial has ever been powered to show one, and every percentage in circulation comes from drug trials.
- Never say "this will prevent fractures" or "this will reverse your bone loss". The evidenced claim is slower loss plus better strength, balance and function.
- Never tell a client she is "in menopause" or "has early menopause", at any age.
- Never comment on a hormone dose, brand or route, or say hormone therapy is safer or more dangerous than the bone medicines.
- Never say a vibration plate, walking, swimming, cycling, yoga or Pilates builds bone.
- Never send anyone for a vitamin D test or a bone density scan ourselves, and never suggest a private scan outside the Medicare interval. We say what to ask her GP for.
- Never recommend more than 2,000 international units of vitamin D a day, or a megadose of anything.
- Never run a deficit for a client with absent periods that are not menopausal, a stress fracture history, a known low bone density result, who is underweight, or whose eating feels out of her control.
- Never hand a client a list of forbidden movements in place of teaching her a hip hinge, and never tell her that bending forward is dangerous.
- Never present light drinking as good for bone.`

/**
 * For the client who bought a vibration plate on our old wording. Written to
 * be said to her directly, without blaming her and without pretending the
 * change did not happen.
 */
export const VIBRATION_PLATE_ANSWER = `We changed our position on this, and here is why.

We used to say a vibration plate offered modest support for bone density. We went back through the evidence and we were wrong to say it, so we took it down.

Here is what is actually there. Fifteen separate systematic reviews have looked at whole-body vibration and bone density in postmenopausal women. Thirteen of the fifteen were rated critically low quality. Where any effect showed up it was about 0.01 g per square centimetre, which is smaller than a bone scan can reliably detect in one person. At the total hip, no review found any benefit at all. And no vibration trial has ever measured whether anybody broke a bone.

What that does not mean. It does not mean your plate is bad for you, and it does not mean you wasted your money. There is no safety problem with it and nothing here says stop using it.

What it does mean. It is not the bone work. If you have ten minutes and you are standing on the plate instead of doing your hops or your lifting, that is the part that costs you.

Where the plate does have a job. If you cannot load yet, because you are deconditioned, recovering, or nervous about a barbell, standing on a plate is a way in. It gets you doing something on your feet, on a schedule. We keep it for exactly that, and we move you off it onto load and impact as soon as you can.`

/** The honesty label that rides with any bone prescription for our audience. */
export const BONE_AGE_GAP_NOTE =
  'SAY THIS ON SCREEN: the loading numbers come from trials in women averaging 63 to 65. The one trial run in women at her age and stage was forty people and found a smaller spine effect and no hip effect at all. We are extrapolating downward in age, and we say so rather than letting the numbers imply otherwise.'

export interface BoneFlag {
  open: boolean
  urgency: 'same-week' | 'before-loading' | null
  reasons: string[]
  /** True when impact alone will not do, because she is past her final period. */
  barbellNotOptional: boolean
}

/**
 * The flag, from what she answered.
 *
 * As with the thyroid screen, this NEVER produces a likelihood or a diagnosis.
 * It decides two things: whether we stop and refer before adding load, and
 * whether impact alone is a legitimate starting programme for her.
 */
export function boneFlagFromScreen(
  screen: Record<string, unknown> | null | undefined,
): BoneFlag {
  const reasons: string[] = []
  let urgency: 'same-week' | 'before-loading' | null = null
  const raise = (why: string, level: 'same-week' | 'before-loading') => {
    reasons.push(why)
    if (level === 'same-week' || urgency === null) urgency = level === 'same-week' ? 'same-week' : (urgency ?? 'before-loading')
  }

  const fracture = String(screen?.bq_fracture ?? '')
  if (/^yes/i.test(fracture)) {
    raise('she has broken a bone from a fall from standing height or a minor knock, which in Australia counts as osteoporosis on its own whatever a scan says, and roughly doubles the risk of the next one', 'same-week')
  }

  const backTicks = Array.isArray(screen?.bq_height_back)
    ? (screen!.bq_height_back as string[]).filter(x => typeof x === 'string' && !/^none of these$/i.test(x.trim()))
    : []
  if (backTicks.length > 0) {
    raise(`she reports ${backTicks.join(', ').toLowerCase()}, which is the pattern that can be a spinal fracture and is the one thing here a coach misses by not asking`, 'same-week')
  }

  const meds = String(screen?.bq_medicines ?? '').toLowerCase()
  if (meds && !/^(no|none|n\/a|nil)\b/.test(meds.trim())) {
    if (/denosumab|prolia|injection/.test(meds)) {
      raise('she is on a six-monthly bone injection, so confirm at every review that it is up to date: a missed or stopped dose is a same-week referral', 'same-week')
    } else {
      raise(`she reports bone, steroid or cancer medicines (${meds.slice(0, 80)}), so a clinician sets the bone plan and we never promise a density outcome from training`, 'before-loading')
    }
  }

  // Early menopause, read from free text without interpreting it.
  const periods = String(screen?.bq_periods_age ?? '')
  const age = periods.match(/\b(3[0-9]|4[0-4])\b/)
  let barbellNotOptional = false
  if (age) {
    raise(`her periods stopped or her ovaries were removed at ${age[1]}, which is before 45 and warrants a GP referral with a bone density scan named explicitly`, 'same-week')
    barbellNotOptional = true
  } else if (/\b(4[5-9]|5[0-9]|6[0-9])\b/.test(periods)) {
    barbellNotOptional = true
  }

  return { open: reasons.length > 0, urgency, reasons, barbellNotOptional }
}
