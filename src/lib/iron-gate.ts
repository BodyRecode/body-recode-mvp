/**
 * Iron: the gate that has to fire before the engine is allowed to read a
 * pattern at all.
 *
 * Research pass I1, 20 September 2026. 49 identifiers verified.
 *
 * WHY THIS IS STRUCTURAL RATHER THAN VERBAL. Our four patterns are exhaustive.
 * An unrecognised cause therefore does not fall through the model, it gets
 * ABSORBED into the nearest pattern, and the nearest pattern for tiredness
 * that sleep does not fix, sessions feeling harder, breathlessness, feeling
 * cold and low mood is regulation and recovery. So the system is not
 * occasionally at risk of reading an iron problem as a recovery problem. As
 * built, it will read EVERY iron problem as a recovery problem, because it has
 * no other category available to it.
 *
 * AND A QUESTIONNAIRE CANNOT SORT IT OUT. No sensitivity, no specificity, no
 * likelihood ratio exists for symptoms against low ferritin, and the
 * guidelines say the test is what separates them. So the design is not
 * "detect". It is REFER, and hold the interpretation until she has been seen.
 *
 * THE NUMBER THAT MATTERS MOST, and the one a coach will get wrong: in the two
 * randomised trials of iron for fatigue in non-anaemic women, the PLACEBO
 * groups reported fatigue falling by 13 per cent and 28.8 per cent. A coaching
 * programme is at least as strong a placebo as a tablet. A woman who feels
 * noticeably better at week four is producing exactly the improvement the
 * placebo arms produced, so HER IMPROVEMENT IS NOT EVIDENCE THAT HER IRON IS
 * FINE and must never be treated as confirming the pattern read.
 *
 * Nor is measured performance a check on her: iron improves reported fatigue
 * without improving measured capacity, so "your numbers look fine" is the
 * expected picture, not an inconsistency to coach out of her.
 */

export type IronTier = 'emergency' | 'same-day' | 'same-week' | 'routine'

export interface IronScreen {
  /** Soaked through in an hour or less, bled more than 8 days, or clots bigger than a 50 cent coin. */
  iq_bleeding?: string
  /** 12 months or more with no period, and any bleeding or spotting since. */
  iq_postmenopausal_bleeding?: string
  /** Blood in stool, black tarry stool, or unintended weight loss. */
  iq_bowel?: string
  /** Chest pain, fainting, breathless at rest, racing heart at rest. */
  iq_cardiac?: string[]
  /** Craving ice or non-food, or restless legs at night. */
  iq_pica_rls?: string[]
  /** Set when she tells us she has seen a doctor. Her word is the only unlock. */
  iq_gp_seen?: string
}

export interface IronFlag {
  open: boolean
  tier: IronTier | null
  /** Her answers, quoted back without labels or ranking. */
  answers: string[]
  /** True when question 4 fired: the only one that stops training outright. */
  stopTraining: boolean
}

const yes = (v: unknown) => typeof v === 'string' && /^yes/i.test(v.trim())
const ticks = (v: unknown) =>
  Array.isArray(v) ? (v as string[]).filter(x => typeof x === 'string' && !/^none of (these|the above)$/i.test(x.trim())) : []

const TIER_ORDER: IronTier[] = ['routine', 'same-week', 'same-day', 'emergency']
const worse = (a: IronTier | null, b: IronTier): IronTier =>
  a === null ? b : TIER_ORDER.indexOf(b) > TIER_ORDER.indexOf(a) ? b : a

/**
 * The highest tier fired by any question governs. The answers NEVER combine
 * into a score, a rank or a probability, and the system never tells her which
 * of her answers is the worrying one.
 */
export function ironFlag(screen: IronScreen | null | undefined): IronFlag {
  if (!screen) return { open: false, tier: null, answers: [], stopTraining: false }
  if (yes(screen.iq_gp_seen)) return { open: false, tier: null, answers: [], stopTraining: false }

  let tier: IronTier | null = null
  const answers: string[] = []

  const cardiac = ticks(screen.iq_cardiac)
  const emergencyCardiac = cardiac.some(c => /chest pain|faint|short of breath|breathless/i.test(c))
  if (cardiac.length > 0) {
    answers.push(...cardiac)
    tier = worse(tier, emergencyCardiac ? 'emergency' : 'same-day')
  }

  if (yes(screen.iq_bleeding)) {
    answers.push('Heavy bleeding in the last 12 months')
    tier = worse(tier, cardiac.length > 0 ? 'emergency' : 'same-week')
  }

  // Overrides all other bleeding logic, whatever else is present.
  if (yes(screen.iq_postmenopausal_bleeding)) {
    answers.push('Bleeding or spotting after 12 months or more without a period')
    tier = worse(tier, 'same-week')
  }

  if (yes(screen.iq_bowel)) {
    answers.push('Blood in stool, black or tarry stool, or unintended weight loss')
    tier = worse(tier, cardiac.length > 0 ? 'same-day' : 'same-week')
  }

  const pica = ticks(screen.iq_pica_rls)
  if (pica.length > 0) {
    answers.push(...pica)
    tier = worse(tier, 'routine')
  }

  return { open: tier !== null, tier, answers, stopTraining: cardiac.length > 0 }
}

/** Shown verbatim. Nothing is generated around it and nothing is added to it. */
export const IRON_REFERRAL_SENTENCE = `Some of your answers are ones we are not able to work around on our own. We are not able to tell you what is causing them and we are not going to try. Please see a general practitioner and ask for a full blood count and iron studies, including ferritin, and a C-reactive protein. Tell them about the answers listed below, because they are the reason we are asking. We do not test, read or interpret blood results.`

export const IRON_TIER_TIMEFRAME: Record<IronTier, string> = {
  emergency: 'Go to an emergency department or call 000 now. Do not wait for an appointment, and do not train until you have been seen.',
  'same-day': 'See a general practitioner today. Do not train until you have been seen.',
  'same-week': 'See a general practitioner this week. Book it before you do anything else on your plan.',
  routine: 'Book a general practitioner appointment in the next couple of weeks, and mention these answers specifically so they apply the right threshold.',
}

/**
 * The exclusion that sits OUTSIDE the four-pattern model and is not subject to
 * it. Quoted into the interpretation prompt.
 */
export const IRON_PATTERN_EXCLUSION = `IRON EXCLUSION, and it sits outside the pattern model rather than inside it.
Where the intake shows unexplained tiredness that sleep does not fix, together with ANY of: reduced exercise tolerance, breathlessness on exertion, feeling cold, hair shedding, or low mood, AND any of the blood-loss answers (heavy periods, bleeding after a year without one, or blood in stool), you must NOT assign a pattern. The referral fires first, and a pattern may be assigned only after the client records that she has seen a doctor about it.

WHY, because the reason changes how you behave: our four patterns are exhaustive, so a cause we do not recognise is not dropped, it is absorbed into the nearest pattern, and the nearest pattern for this cluster is regulation and recovery. Nothing in a questionnaire distinguishes low iron from under-recovery: there is no sensitivity, no specificity and no likelihood ratio for symptoms against ferritin, and the guidelines say the blood test is what separates them.

NEVER treat improvement on the programme as confirmation. In the randomised trials of iron for fatigue in non-anaemic women, the PLACEBO groups reported fatigue falling 13 and 28.8 per cent. A woman who feels better at week four is producing exactly the placebo-sized improvement, and it tells you nothing about her iron. Measured performance is no check either: iron improves reported fatigue without improving measured capacity.

For any postmenopausal woman, or any man, iron deficiency needs a CAUSE FOUND rather than a supplement: about one third have an underlying abnormality, predominantly in the gut.`

/** Refusals, quoted into the generators. */
export const IRON_NEVER_SAY = `IRON: THINGS THE SYSTEM MAY NEVER SAY.
- Never name a condition, including iron deficiency, anaemia, fibroids, endometrial or bowel cancer, or "perimenopause explains this". Not even as possible, likely, suggests or consistent with.
- Never read, score, rank or comment on a blood result, even if she types the number in unprompted. No "your ferritin is low", no "that's within range", no optimal-versus-normal.
- Never present a clinical threshold as applying to her.
- Never give an iron dose, brand, product or schedule, and never tell her to buy iron.
- Never mention Medicare rebates, eligibility or item numbers, or coach her on what to say to get a test covered.
- NEVER REASSURE. No "this is probably nothing", "most women your age get this", "it's very common", "don't panic". Reassurance is the mechanism by which these things get missed.
- Never use diagnosis, treat or cure, and never offer a food as a fix for a flagged answer.
- Never say "you should stop training" as a blanket instruction: it is unsupported and it makes people hide their answers next time.
- NEVER suggest waiting, retesting later, trying the plan first, or coming back in a few weeks. There is no watchful-waiting path in this gate.
- Never rank her answers by how worrying they are, or tell her which one matters most.
- Never tell her to re-time, split, stop or start a prescribed medicine to accommodate iron. That is a pharmacist or prescriber decision.`

/** What we CAN say, client-facing. Food maintains iron; it does not refill it. */
export const IRON_FOOD_WORDING = `Your period is the biggest single thing setting your iron level, bigger than what you eat. An average period costs about 16 mg of iron and a heavy one costs 40 mg or more, while a normal mixed Australian diet gives you back somewhere between about 0.6 and 2 mg a day.

So food maintains iron. Food does not refill it. In the Australian trial that tested this properly, twelve weeks of a deliberately high-iron diet moved ferritin from 8.9 to 11. Twelve weeks of an iron tablet moved it from 9.0 to 24.8, in the same women over the same time. If your iron is already low, that is a conversation with your GP, not a meal plan.

What your plan does: we build around animal protein because iron from meat absorbs at around 15 to 35 per cent and the rest of the meal cannot block it, against 2 to 20 per cent for iron from plants, and because meat on the plate lifts absorption of the plant iron eaten with it. Holding the line is the claim we can make.

What we will not do: we plan to the Australian cap of 455 g a week of cooked lean red meat and we keep processed meat out. The trials that nudged iron used about 732 g a week, well above what Australia says is safe, and we are not going to trade one risk for another and call it iron support.

If your iron is low, keep tea and coffee out of the hour either side of your main iron meals, and put a vitamin C food with plant-iron meals. That is worth doing and it is free. If your iron is fine, none of this is worth reorganising your life for.`
