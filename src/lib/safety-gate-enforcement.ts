/**
 * The safety gates, enforced on the OUTPUT rather than asked for in the prompt.
 *
 * WHY THIS EXISTS (19 September 2026)
 *
 * Research passes E1a and E1b produced hard safety rules, and those rules went
 * into the prompts: never suggest potassium products to someone whose medicines
 * hold potassium, never give a daily water target to someone on a fluid limit,
 * never produce show-week numbers for a physique competitor. A prompt is a
 * request. The model complies almost always, and "almost always" is exactly the
 * standard that stops being good enough the moment somebody else's clients are
 * on the platform and Kade is not reading every plan.
 *
 * This is the other half: a check that reads what the model actually wrote and
 * refuses the plan if it broke a gate. It plugs into the nutrition validator,
 * which already retries and feeds the failure back to the model in words, so a
 * breach costs one retry rather than reaching a client.
 *
 * DESIGN RULES
 *
 * 1. Only HARD gates live here. Anything that is a matter of judgement belongs
 *    in the prompt and in coach review, not in a check that refuses.
 * 2. A check fires only when the gate applies to THIS client. A plan telling a
 *    healthy client to salt their eggs is fine; the same sentence for someone
 *    on spironolactone is not.
 * 3. Every message says what to write instead, because the message is fed back
 *    to the model as its retry instruction.
 * 4. False positives cost one retry. False negatives reach a person. Where the
 *    two trade off, this file prefers the retry.
 */

import { electrolyteGates, type TrainingContext } from './electrolyte-safety-gates'
import { BLOCKED_THYROID_PRODUCTS } from './thyroid-hold'

export interface GateViolation {
  code: string
  message: string
}

/** Matches "2 litres", "2-3L a day", "3000ml daily", "8 glasses of water a day". */
const DAILY_FLUID_TARGET =
  /(\b\d(?:[.,]\d)?\s*(?:to|-|–)?\s*\d?(?:[.,]\d)?\s*(?:litres?|liters?|l)\b|\b\d{3,4}\s*(?:ml|mls)\b|\b\d{1,2}\s*(?:glasses|cups)\b)[^.]{0,40}\b(?:a day|per day|daily|each day)\b/i

const POTASSIUM_PRODUCTS =
  /\b(?:salt substitute|lite salt|low[- ]sodium salt|potassium chloride|potassium supplement|potassium tablet|no salt salt|lo salt)\b/i

const HIGH_POTASSIUM_DRINK = /\b(?:electrolyte|sports drink|rehydration)[^.]{0,60}\bpotassium\b|\bpotassium\b[^.]{0,40}\belectrolyte\b/i

const FASTING_OR_VLC =
  /\b(?:fast(?:ing|ed)?\s+(?:window|protocol|day|for)|intermittent fasting|16[:/]8|20[:/]4|omad|one meal a day|ketogenic|keto diet|very low carb(?:ohydrate)?|zero carb)\b/i

const LOW_SALT_DIET = /\b(?:low[- ]salt|low[- ]sodium|salt[- ]restricted|reduce your salt|cut your salt)\b[^.]{0,30}\b(?:diet|intake|eating)\b/i

// Order-agnostic on purpose: the first draft only matched "salt ... add a
// pinch" and missed "add a pinch of salt", which is how anyone would actually
// write it.
const SALT_LOADING =
  /\b(?:salt|sodium)\b[^.]{0,30}\b(?:load(?:ing)?|increase|add)\b|\b(?:add(?:ing)?|increase|extra|more)\b[^.]{0,30}\b(?:salt|sodium)\b|\bpinch of salt\b/i

/**
 * A deeper deficit, in the shapes a plan actually writes it: a calorie target
 * below what she is eating, a cut, a drop, a reduction, a fasting window.
 */
const DEFICIT_LANGUAGE =
  /\b(?:reduce|reducing|lower|lowering|drop|dropping|cut|cutting|decrease|decreasing|tighten|tightening)\b[^.]{0,40}\b(?:calories?|kcals?|energy|intake|portions?|food)\b|\b(?:calories?|kcals?|energy)\b[^.]{0,30}\b(?:deficit|reduction)\b|\bdeeper\s+deficit\b|\beat(?:ing)?\s+(?:less|fewer)\b/i

/** Any named thyroid product, which is blocked whether or not a flag is open. */
const THYROID_PRODUCT = new RegExp('\\b(?:' + BLOCKED_THYROID_PRODUCTS.map(p => p.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|') + ')\\b', 'i')

/** Naming the organ IS an interpretation, and it is outside a coach's scope. */
const THYROID_INTERPRETATION =
  /\b(?:sluggish|slow|underactive|overactive|struggling|tired)\s+thyroid\b|\bthyroid\b[^.]{0,40}\b(?:cause|causing|explains|driving|driven|issue|problem|pattern)\b|\b(?:classic|typical)\b[^.]{0,20}\bthyroid\b|\bthyroid\s+(?:reset|repair|support)\b|\bmetabolism\s+(?:damaged|broken|repair|reset)\b/i

/** Show-week numbers: carbohydrate loading grams, water loads, sodium or potassium milligram targets. */
const CONTEST_NUMBERS = [
  // Any of the three orders a carbohydrate load gets written in: the number
  // first, the word first, or the instruction first ("load 600g carbohydrate").
  /\b\d{3,4}\s*g\b[^.]{0,40}\b(?:carb|carbohydrate)[^.]{0,30}\b(?:load|loading|peak|show)\b/i,
  /\b(?:carb|carbohydrate)[^.]{0,30}\b(?:load|loading)\b[^.]{0,40}\b\d{3,4}\s*g\b/i,
  /\b(?:load|loading|peak week|show day)\b[^.]{0,40}\b\d{3,4}\s*g\b[^.]{0,30}\b(?:carb|carbohydrate)/i,
  /\b\d{3,4}\s*g\b[^.]{0,20}\b(?:carb|carbohydrate)\w*\b[^.]{0,40}\b(?:peak|show|stage|comp)\w*\b/i,
  /\bwater\s+load(?:ing)?\b[^.]{0,40}\b\d/i,
  /\b\d{3,5}\s*mg\b[^.]{0,30}\b(?:sodium|potassium)\b/i,
  /\b(?:sodium|potassium)\b[^.]{0,30}\b\d{3,5}\s*mg\b/i,
  /\b(?:diuretic|water tablet|water pill)s?\b/i,
]

export interface SafetyGateInput {
  /** Everything the client could read, joined. */
  text: string
  /** Free text about medicines and conditions, used to decide which gates apply. */
  medications?: string | null
  /** Training and competition answers, when the client has given them. */
  trainingContext?: TrainingContext | null
  /**
   * True while a possible thyroid cause is unchecked. Added 20 Sep 2026 from
   * research pass T1: the engine must not deepen a deficit before the blood
   * test, because eating less will not fix a medical cause AND because a
   * deficit shifts the very results the doctor is about to read.
   */
  thyroidHold?: boolean
}

/**
 * What the model actually wrote, checked against the gates that apply to this
 * client. An empty array means nothing was breached.
 */
export function findGateViolations(input: SafetyGateInput): GateViolation[] {
  const text = input.text || ''
  if (!text.trim()) return []

  const out: GateViolation[] = []
  const gates = electrolyteGates(input.medications)
  const ctx = input.trainingContext || null
  const meds = (input.medications || '').toLowerCase()

  if (gates.potassium) {
    if (POTASSIUM_PRODUCTS.test(text)) {
      out.push({
        code: 'POTASSIUM_GATE_BREACH',
        message:
          'This client takes a medicine or has a condition that HOLDS potassium, and the plan names a salt substitute, potassium supplement or potassium salt. Remove it entirely. Normal fruit, vegetables and dairy are fine; anything beyond that is their doctor or pharmacist to decide.',
      })
    }
    if (HIGH_POTASSIUM_DRINK.test(text)) {
      out.push({
        code: 'POTASSIUM_DRINK_BREACH',
        message:
          'This client holds potassium, and the plan suggests a potassium-containing electrolyte or rehydration product. Remove it and say plainly that any electrolyte product is a question for their doctor or pharmacist.',
      })
    }
  }

  if (gates.fluid) {
    if (DAILY_FLUID_TARGET.test(text)) {
      out.push({
        code: 'FLUID_GATE_BREACH',
        message:
          'This client is on a medicine or has a history that puts them behind the fluid gate, and the plan states a daily fluid target. Remove every litre, millilitre and glasses-per-day figure. Write instead: drink to thirst, plus a planned amount for long or hot sessions agreed with their doctor.',
      })
    }
    if (LOW_SALT_DIET.test(text) || SALT_LOADING.test(text)) {
      out.push({
        code: 'SALT_CHANGE_BREACH',
        message:
          'This client is behind the fluid gate, and the plan changes their salt intake in one direction or the other. Neither is ours to set. Remove it and refer the decision to their doctor or pharmacist.',
      })
    }
  }

  const onSglt2 = /gliflozin|empagliflozin|dapagliflozin|jardiance|forxiga/.test(meds)
  if (onSglt2 && FASTING_OR_VLC.test(text)) {
    out.push({
      code: 'SGLT2_FASTING_BREACH',
      message:
        'This client takes an SGLT2 inhibitor (a "-gliflozin" medicine) and the plan prescribes fasting, a ketogenic or a very low carbohydrate approach. That combination can produce a dangerous acid build-up even when blood glucose reads normal. Remove it, keep carbohydrate at a normal level, and say the change needs their prescriber.',
    })
  }

  const onLithium = /\blithium\b/.test(meds)
  if (onLithium && (SALT_LOADING.test(text) || LOW_SALT_DIET.test(text) || DAILY_FLUID_TARGET.test(text))) {
    out.push({
      code: 'LITHIUM_SALT_FLUID_BREACH',
      message:
        'This client takes lithium, where a change in salt or fluid changes the level of the medicine in their blood. Remove the target or the salt instruction and say it has to come from their prescriber.',
    })
  }

  // Thyroid products are blocked for everyone, flag or no flag: nine of ten
  // marketed thyroid supplements tested contained real thyroid hormone, and
  // Australia is iodine sufficient, where excess iodine roughly triples the
  // odds of overt underactive thyroid function.
  if (THYROID_PRODUCT.test(text)) {
    out.push({
      code: 'THYROID_PRODUCT_BREACH',
      message:
        'The plan recommends iodine, kelp, seaweed, a thyroid support or glandular product, or high-dose selenium. Remove it. Nine of ten marketed thyroid supplements tested contained real thyroid hormone, Australia is iodine sufficient, and excess iodine is associated with roughly 2.8 times the odds of an underactive thyroid. None of these is ever ours to recommend.',
    })
  }

  if (THYROID_INTERPRETATION.test(text)) {
    out.push({
      code: 'THYROID_INTERPRETATION_BREACH',
      message:
        'The plan names the thyroid as a cause, a pattern or a likelihood. That is an interpretation and it is outside scope. A questionnaire cannot separate these symptoms from under-recovery, a long deficit, low iron or the menopause transition: a thirteen-symptom score performs at 0.64 in older women, close to a coin toss. Remove the attribution entirely. You may say what she reported and that it is worth a doctor looking at. You may not say what it is.',
    })
  }

  if (input.thyroidHold && DEFICIT_LANGUAGE.test(text)) {
    out.push({
      code: 'THYROID_HOLD_BREACH',
      message:
        'This client has a possible medical cause that has not been checked yet, and the plan still cuts her food. Hold her energy target at her current intake: no new deficit, no deepening of an existing one, no fasting window and no food group removed. Eating less will not fix a medical cause, and being in a deficit changes the very blood results her doctor is about to read.',
    })
  }

  const competing = ctx?.tr_competes === 'Yes' || ctx?.tr_competes === 'Thinking about it'
  if (competing) {
    for (const re of CONTEST_NUMBERS) {
      if (re.test(text)) {
        out.push({
          code: 'CONTEST_NUMBERS_BREACH',
          message:
            'This client is preparing for a physique competition and the plan contains show-week numbers: a carbohydrate load, a water load, a sodium or potassium figure, or diuretics. No evidence exists for any of it and the documented harms are paralysis, dangerous potassium disturbance and death. Remove every number of that kind. Say what is known, that rehearsal and changing as little as possible is the only supported approach, and refer to an accredited sports dietitian.',
        })
        break
      }
    }
  }

  return out
}

/** One combined string for the retry instruction fed back to the model. */
export function gateViolationInstruction(violations: GateViolation[]): string {
  if (violations.length === 0) return ''
  return (
    'SAFETY GATE BREACH. The previous attempt broke a hard rule for THIS client. Fix every point below and return the whole plan again:\n' +
    violations.map(v => `- ${v.message}`).join('\n')
  )
}
