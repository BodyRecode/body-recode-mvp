/**
 * Standard fluid and potassium gates, and the whole-system referral list.
 *
 * New capability from research pass E1a, 17 September 2026
 * (00_PLAYBOOK/electrolyte_research/2026-09-17_E1a_RESULT_base_and_safety_gates.md,
 * sections 5 and 6).
 *
 * WHY THIS EXISTS AS ONE FILE
 *
 * Before this, every surface that mentioned water, salt or electrolytes wrote
 * its own version of the safety wording, and most of them wrote none. The
 * research pass found the same two gates being needed in a dozen places, so
 * they are written once here and quoted by name everywhere else. When the
 * wording is wrong, it is wrong in exactly one place.
 *
 * WHAT A GATE IS
 *
 * A gate is not a warning added to advice. It REPLACES the advice. When the
 * potassium gate applies, the system does not suggest a lighter potassium
 * product; it stops suggesting potassium products at all. When the fluid gate
 * applies, the system does not lower the daily water target; it stops giving a
 * daily water target.
 *
 * The client-facing strings are quoted verbatim into client copy. They were
 * written to be read by a person with no medical background, and they name the
 * doctor or pharmacist as the decision-maker rather than us.
 */

/** Client-facing wording. Quote verbatim. Do not paraphrase into a softer form. */
export const STANDARD_POTASSIUM_GATE =
  "Don't use potassium salt substitutes ('lite', 'low-sodium' or potassium chloride salts), potassium supplements or high-potassium electrolyte products unless your doctor or pharmacist has approved it. Normal fruit, vegetables and dairy are fine unless your doctor has told you to limit potassium."

/** Client-facing wording. Quote verbatim. */
export const STANDARD_FLUID_GATE =
  "Don't follow a set daily water target. Drink to thirst, plus a planned amount for long or hot sessions agreed with your doctor. Don't start a low-salt or very low-carbohydrate diet, fasting, or big fluid changes without checking with your doctor or pharmacist."

/**
 * Generic medicine names that raise blood potassium (E1a table 5.1). Matched
 * case-insensitively against the medications free text, so brand names that
 * clients actually write are included alongside the generic name.
 */
export const POTASSIUM_GATE_MEDICINES = [
  'perindopril', 'ramipril', 'enalapril', 'lisinopril', 'captopril', 'quinapril', 'trandolapril',
  'candesartan', 'irbesartan', 'telmisartan', 'valsartan', 'losartan', 'olmesartan',
  'aliskiren', 'entresto', 'sacubitril',
  'spironolactone', 'aldactone', 'eplerenone', 'finerenone',
  'amiloride', 'triamterene',
  'heparin', 'enoxaparin', 'clexane',
  'ciclosporin', 'cyclosporin', 'tacrolimus',
  'trimethoprim', 'bactrim', 'pentamidine',
]

/** Conditions where the potassium gate applies regardless of medicines (E1a 5.1, 5.3). */
export const POTASSIUM_GATE_CONDITIONS = [
  'kidney disease', 'kidney failure', 'renal',
  'heart failure',
  'liver disease', 'cirrhosis',
  'adrenal insufficiency', 'addison',
  'high potassium', 'hyperkalaemia', 'hyperkalemia',
]

/**
 * Generic medicine names that lower sodium or change fluid balance (E1a 5.2).
 * The diuretics belong in both lists: they lose potassium through the kidney
 * but are so often prescribed in a combination tablet with a potassium-holding
 * drug that the safe default is to gate both ways.
 */
export const FLUID_GATE_MEDICINES = [
  'hydrochlorothiazide', 'indapamide', 'chlorthalidone', 'chlortalidone',
  'furosemide', 'frusemide', 'lasix', 'bumetanide',
  'sertraline', 'citalopram', 'escitalopram', 'fluoxetine', 'paroxetine',
  'venlafaxine', 'duloxetine', 'desvenlafaxine', 'mirtazapine',
  'carbamazepine', 'oxcarbazepine',
  'lithium',
  'empagliflozin', 'dapagliflozin', 'ertugliflozin', 'jardiance', 'forxiga', 'gliflozin',
  'desmopressin',
]

/** Conditions or history where the fluid gate applies (E1a 5.2, 5.3). */
export const FLUID_GATE_CONDITIONS = [
  'fluid restriction', 'fluid limit',
  'low sodium', 'hyponatraemia', 'hyponatremia',
  'heart failure', 'kidney disease', 'kidney failure', 'renal', 'cirrhosis', 'liver disease',
  'siadh', 'pots',
]

export interface ElectrolyteGates {
  potassium: boolean
  fluid: boolean
  /** The lowercased terms that triggered each gate, so a coach can see WHY. */
  matched: string[]
}

function hits(haystack: string, needles: string[]): string[] {
  return needles.filter(n => haystack.includes(n))
}

/**
 * Which gates apply, from whatever free text we hold about medicines and
 * conditions. Deliberately generous: a false positive costs a client one
 * cautious paragraph, a false negative costs them a potassium supplement they
 * should not be taking.
 */
export function electrolyteGates(...freeText: (string | null | undefined)[]): ElectrolyteGates {
  const text = freeText.filter(Boolean).join(' \n ').toLowerCase()
  if (!text.trim()) return { potassium: false, fluid: false, matched: [] }
  const kMed = hits(text, POTASSIUM_GATE_MEDICINES)
  const kCond = hits(text, POTASSIUM_GATE_CONDITIONS)
  const fMed = hits(text, FLUID_GATE_MEDICINES)
  const fCond = hits(text, FLUID_GATE_CONDITIONS)
  return {
    potassium: kMed.length > 0 || kCond.length > 0,
    fluid: fMed.length > 0 || fCond.length > 0,
    matched: Array.from(new Set([...kMed, ...kCond, ...fMed, ...fCond])),
  }
}

/** Prompt-ready block. Empty string when neither gate applies, so callers can push it unconditionally. */
export function electrolyteGatePromptBlock(gates: ElectrolyteGates): string {
  if (!gates.potassium && !gates.fluid) return ''
  const out: string[] = ['ELECTROLYTE AND FLUID SAFETY GATES (this client triggers them, apply before anything else you write about water, salt or electrolytes)']
  if (gates.potassium) {
    out.push(`- POTASSIUM GATE ACTIVE. Never suggest potassium salt substitutes, potassium supplements or high-potassium electrolyte products. If the plan needs to say anything about potassium, use this wording: "${STANDARD_POTASSIUM_GATE}"`)
  }
  if (gates.fluid) {
    out.push(`- FLUID GATE ACTIVE. Do NOT give a daily water target, a litre figure, a fasting protocol, a low-salt plan or a very low carbohydrate plan. Use this wording: "${STANDARD_FLUID_GATE}"`)
  }
  out.push(`- Triggered by: ${gates.matched.join(', ')}. This is a screen on free text, so if it has misread the client, the coach overrides it, not the model.`)
  return out.join('\n')
}

/**
 * Australian reference values for total fluid from ALL drinks, not plain water
 * (NHMRC Nutrient Reference Values, quoted in E1a A6). Tea, coffee and milk
 * count. These are references, not targets, and they are suppressed entirely
 * when the fluid gate applies.
 */
export const FLUID_REFERENCE = {
  women: 'about 2 litres of drinks a day, roughly 8 cups',
  men: 'about 2.5 litres of drinks a day, roughly 10 cups',
  pregnant: 'about 2.3 litres of drinks a day',
  breastfeeding: 'about 2.6 litres of drinks a day',
  over60: "thirst is a less reliable signal with age, so drink to a routine through the day rather than waiting to feel thirsty",
  check: "Pale yellow urine is a good sign you're drinking enough.",
} as const

export interface Referral {
  /** What the client reports. */
  trigger: string
  /** Where they go. */
  action: 'call-000' | 'gp-soon' | 'sports-dietitian'
  /** The source the research pass cited. */
  source: string
  /**
   * Who it applies to. 'everyone' is the E1a list. 'training' and 'competitor'
   * came from E1b and only show where they are relevant, so a woman who does
   * not train is not handed a list about shows and diuretics.
   */
  audience?: 'everyone' | 'training' | 'competitor'
}

/**
 * The whole-system referral list (E1a section 6). When any of these is
 * reported, the system STOPS all fluid, sodium, potassium, electrolyte, sauna
 * and heat advice and shows the referral.
 */
export const REFERRALS: Referral[] = [
  { action: 'call-000', trigger: 'Heat stroke signs: confusion, poor coordination or slurred speech, hot dry or red skin, sweating reduced or stopped, temperature above 40 degrees, seizure, collapse. Or heat exhaustion that is not improving quickly, with vomiting, or when the person cannot drink', source: 'healthdirect; Queensland Health' },
  { action: 'call-000', trigger: 'Possible low blood sodium: headache, nausea, vomiting, confusion, agitation, unusual drowsiness, seizure or breathlessness, especially after drinking a lot during or after exercise, or weight GAIN during exercise. Do not advise more fluid', source: 'Hew-Butler 2015' },
  { action: 'call-000', trigger: 'Palpitations, irregular or slow heartbeat, or fainting, especially alongside vomiting, laxative or fluid tablet use, an eating disorder, kidney disease, or a potassium-raising medicine', source: 'healthdirect; Ben Salem 2014' },
  { action: 'call-000', trigger: 'Adrenal crisis signs in anyone with adrenal insufficiency: sudden abdominal pain, severe dizziness, vomiting, collapse, severe weakness', source: 'healthdirect' },
  { action: 'call-000', trigger: 'Severe dehydration: extreme thirst, fast breathing, fast heart rate, confusion, cold hands and feet, sunken eyes', source: 'healthdirect' },
  { action: 'call-000', trigger: 'Anyone on an SGLT2 inhibitor ("-gliflozin") with nausea, vomiting, abdominal pain or unusual tiredness, even with normal blood sugar', source: 'Australian Diabetes Society 2023' },
  { action: 'call-000', trigger: 'Pregnant, with no urine for more than 8 hours or very dark urine, blood in vomit, vomiting that will not stop, fever or stomach pain', source: 'SOMANZ 2023' },
  { action: 'call-000', trigger: 'Lithium users with tremor, nausea, diarrhoea or unsteadiness', source: 'Malhi 2020; Godden 2024' },
  { action: 'call-000', trigger: 'Chest pain, or breathlessness at rest', source: 'Standard emergency practice' },

  { action: 'gp-soon', trigger: 'Heart failure warning signs: weight gain over 2 kg in 3 days, ankle swelling, more breathlessness', source: 'Queensland Health Chronic Conditions Manual' },
  { action: 'gp-soon', trigger: 'Possible diabetes: very thirsty, passing urine often, blurred vision, frequent infections, slow-healing wounds', source: 'healthdirect' },
  { action: 'gp-soon', trigger: 'Salt craving TOGETHER WITH unexplained weight loss, dizziness on standing, darkening skin or gums, ongoing nausea or abdominal pain, or marked fatigue', source: 'Bornstein 2016' },
  { action: 'gp-soon', trigger: 'Low potassium symptoms: weakness, tiredness, muscle cramps, skipped beats', source: 'healthdirect' },
  { action: 'gp-soon', trigger: 'Dizziness or fainting on standing, especially on blood pressure medicines', source: 'Kukkonen-Harjula 2006' },
  { action: 'gp-soon', trigger: 'Vomiting or diarrhoea: a pharmacy oral rehydration solution, not sports drinks. Same-day medical advice if on an SGLT2 inhibitor, GLP-1 medicine, fluid tablet, ACE inhibitor, sartan or lithium', source: 'Australian Diabetes Society 2023; Lea-Henry 2017' },
  { action: 'gp-soon', trigger: 'Dark urine, or little urine despite drinking', source: 'E1a reasoning' },
  { action: 'gp-soon', trigger: 'Drinking more than about 4 to 5 litres a day without heavy sweating, or feeling unable to stop drinking', source: 'Hew-Butler 2015' },
  { action: 'gp-soon', trigger: 'Any purging, laxative or fluid tablet use for weight. GP plus Butterfly Foundation 1800 33 4673', source: 'Nitsch 2021; Butterfly Foundation' },
  { action: 'gp-soon', trigger: 'A past low sodium, or high or low potassium result, or a doctor-set fluid, salt or potassium limit. Follow the treating team', source: 'healthdirect' },
  { action: 'gp-soon', trigger: 'New, persistent bloating or a growing abdomen, especially with pelvic pain, early fullness or urinary urgency. Bleeding after menopause. Blood in stool', source: 'Goff 2004' },
  { action: 'gp-soon', trigger: 'Drenching night sweats outside the menopause transition, or with fever or weight loss', source: 'E1a reasoning' },
  { action: 'gp-soon', trigger: 'Ankle swelling on a calcium channel blocker, or any new swelling', source: 'NHS Specialist Pharmacy Service' },
  { action: 'gp-soon', trigger: 'Known kidney, heart, liver or adrenal condition, diabetes or POTS: general fluid and salt advice is off, follow the treating team', source: 'E1a section 5.3' },
]

/**
 * Additions from research pass E1b, 19 September 2026. Lifters and physique
 * competitors only. They sit on top of the list above rather than replacing
 * any of it.
 */
export const TRAINING_REFERRALS: Referral[] = [
  { audience: 'training', action: 'call-000', trigger: 'Collapse, confusion, poor coordination or odd behaviour while training in heat. Treat as possible heat stroke and start cooling immediately', source: 'Sports Medicine Australia; Roberts 2023' },
  { audience: 'training', action: 'call-000', trigger: 'Severe muscle pain, swelling or weakness with dark, tea-coloured or cola-coloured urine after a hard, new or heavy-lowering session', source: 'Nye 2021 (PMID 33655999)' },
  { audience: 'competitor', action: 'call-000', trigger: 'Sudden weakness, or being unable to stand or move the limbs, in a competitor, especially around a show, after fluid tablets, or after heavy carbohydrate loading', source: 'Cheung 2014; Lee 2017; Mayr 2012' },
  { audience: 'competitor', action: 'call-000', trigger: 'Palpitations, an irregular or racing heartbeat with dizziness, or chest pain, in a competitor using fluid tablets, insulin, thyroid hormone, clenbuterol or potassium products', source: 'E1b section 8' },
  { audience: 'competitor', action: 'call-000', trigger: 'Unable to keep fluids down during a cut or a carbohydrate load', source: 'E1b section 8' },

  { audience: 'training', action: 'gp-soon', trigger: 'Cramps at rest or at night, or cramps with numbness or lasting weakness', source: 'E1b section 8' },
  { audience: 'training', action: 'gp-soon', trigger: 'Repeated dizziness, faintness or feeling unwell in heat despite sensible drinking', source: 'E1b section 8' },
  { audience: 'competitor', action: 'gp-soon', trigger: 'A heart check before any prep, and particularly for anyone enhanced, professional, or over 35. Sudden cardiac death in male competitors runs at 32.83 per 100,000 athlete-years, mean age at death 34.7', source: 'Vecchiato 2025 (PMID 40393525)' },
  { audience: 'competitor', action: 'gp-soon', trigger: 'Blood tests including electrolytes and kidney function with cystatin C, for anyone using fluid tablets, insulin, thyroid hormone, growth hormone, anabolic steroids, SARMs or clenbuterol, and for any competitor who has never had kidney function checked', source: 'E1b section 8' },
  { audience: 'competitor', action: 'gp-soon', trigger: 'Any competitor using fluid tablets (diuretics), as harm reduction, whatever their federation', source: 'E1b section 8' },
  { audience: 'competitor', action: 'gp-soon', trigger: 'Periods stopped or become irregular in a female competitor', source: 'E1b section 8' },
  { audience: 'competitor', action: 'gp-soon', trigger: 'Suspected overdose of potassium, clenbuterol, thyroid hormone, insulin or fluid tablets: Poisons Information Centre, 13 11 26', source: 'E1b section 8; verify the number on the label before publishing it' },

  { audience: 'competitor', action: 'sports-dietitian', trigger: 'Any show-week or show-day plan, any sweat test, and any competitor asking for sodium or potassium numbers', source: 'Sports Dietitians Australia' },
]

export const EMERGENCY_REFERRALS = REFERRALS.filter(r => r.action === 'call-000')
export const GP_REFERRALS = REFERRALS.filter(r => r.action === 'gp-soon')

/**
 * Referral flags the system can raise on its own, from what the client has
 * already told us.
 *
 * Added 17 September 2026. The referral list above is the full set, most of
 * which depends on something happening later (heat stroke signs, vomiting that
 * will not stop). These are the ones we can see at intake, so they should not
 * wait for a coach to notice them.
 *
 * Scale answers run 0 to 4, and 3 or more is what the rest of the system reads
 * as an elevated signal (see summarizeScaleSection), so that is the threshold
 * used here.
 *
 * NOT A DIAGNOSIS. Every flag says what she reported and who to see. It never
 * names a condition, and the referral wording is fixed rather than written by
 * a model.
 */
export interface ReferralFlag {
  key: 'salt_craving_combined' | 'dizzy_on_standing_on_medicines' | 'treating_team_owns_fluid'
  headline: string
  detail: string
  action: 'gp-soon'
}

const ELEVATED = 3

export function intakeReferralFlags(
  fatMapResponses: Record<string, unknown> | null | undefined,
  medicationsAndConditions?: string | null,
): ReferralFlag[] {
  const flags: ReferralFlag[] = []
  const score = (id: string): number => {
    const v = fatMapResponses?.[id]
    return typeof v === 'number' ? v : -1
  }

  const craving = score('fm_04')
  const companions: Array<[string, string]> = [
    ['fm_04a', 'weight lost over six months without trying'],
    ['fm_04b', 'dizzy or light-headed on standing'],
    ['fm_04c', 'skin or gums looking darker than usual'],
  ]
  const present = companions.filter(([id]) => score(id) >= ELEVATED).map(([, label]) => label)

  if (craving >= ELEVATED && present.length > 0) {
    flags.push({
      key: 'salt_craving_combined',
      action: 'gp-soon',
      headline: 'Salt craving alongside ' + present.join(' and '),
      detail:
        'Strong salt cravings on their own mean nothing and the read stays quiet about them. Together with ' +
        present.join(' and ') +
        ', it is worth a same-week GP conversation, so raise it with her and say plainly that it is a question for her doctor, not something we can answer. Do not name a condition and do not change her salt intake while she waits.',
    })
  }

  if (score('fm_04b') >= ELEVATED) {
    const gates = electrolyteGates(medicationsAndConditions)
    if (gates.potassium || gates.fluid) {
      flags.push({
        key: 'dizzy_on_standing_on_medicines',
        action: 'gp-soon',
        headline: 'Dizzy on standing, and on a medicine that affects fluid or salt',
        detail:
          'She reports feeling dizzy or light-headed when she stands up, and her medicines include ' +
          gates.matched.join(', ') +
          '. That combination is a GP conversation about the tablets, not a hydration problem to coach around. Sauna and heat work stay off until it is sorted.',
      })
    }
  }

  const gates = electrolyteGates(medicationsAndConditions)
  if (gates.fluid || gates.potassium) {
    flags.push({
      key: 'treating_team_owns_fluid',
      action: 'gp-soon',
      headline: 'Her treating team sets the fluid and salt rules, not us',
      detail:
        'Triggered by: ' +
        gates.matched.join(', ') +
        '. The plans she gets will carry no daily water target and no potassium or electrolyte products. If she asks for a number, the answer is her doctor or pharmacist.',
    })
  }

  return flags
}
export const SPORTS_DIETITIAN_REFERRALS = TRAINING_REFERRALS.filter(r => r.action === 'sports-dietitian')

/**
 * The contest prep rule, from research pass E1b, 19 September 2026.
 *
 * NOTE ON THE WORDS: "peak week" inside Body Recode means the hardest training
 * week of a block, which is an ordinary programming term and is not affected by
 * any of this. THIS rule is about a physique competitor's show week, where the
 * practice is water loading, sodium cutting, carbohydrate loading and often
 * fluid tablets.
 *
 * WHY THE SYSTEM MUST NOT GENERATE THOSE NUMBERS: they do not exist. No trial
 * has measured the visual outcome of water or sodium manipulation at all, the
 * whole carbohydrate loading trial evidence is four men, and the documented
 * harms in this exact population are paralysis, near-fatal potassium
 * disturbance and death. None of the peak week evidence includes women.
 *
 * Written before any contest prep feature is built, deliberately, so that the
 * first person who builds one finds the rule already here.
 */
export const CONTEST_PREP_RULE = `CONTEST PREP HARD RULE. Never generate show-week or show-day numbers for a physique competitor: no carbohydrate loading grams, no water load, no sodium or potassium targets, no backstage formula, and no diuretic or "water tablet" guidance of any kind. There is no evidence base for any of it and the documented harms in competitors are paralysis, dangerous potassium disturbance and death. What you MAY say: rehearse any change two to four weeks out, change one thing at a time, keep records, keep salt and fluid near the client's habitual intake through the final week, and eat on show day what has already been rehearsed. Say plainly that water and sodium manipulation has no efficacy evidence behind it. Then refer: an Accredited Sports Dietitian for any number, and a doctor as well where any drug, medicine or condition is involved. If the client is female, add that none of the published peak week evidence includes women.`

/** Situations where the system refuses to produce any competitor numbers at all. */
export const CONTEST_PREP_REFUSAL_TRIGGERS = [
  'using or planning fluid tablets (diuretics), insulin, thyroid hormone, growth hormone, anabolic steroids, SARMs, clenbuterol or salbutamol',
  'any potassium tablet, powder or salt substitute',
  'a past cramp, collapse, palpitations or confusion around a show or a hard cut',
  'any medicine or condition that triggers the standard fluid or potassium gate',
  'kidney, heart or blood pressure problems, or diabetes',
  'a female competitor asking for show-week numbers, because none of the evidence includes women',
]
