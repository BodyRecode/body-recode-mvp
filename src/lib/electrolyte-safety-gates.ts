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
  action: 'call-000' | 'gp-soon'
  /** The source E1a cited. */
  source: string
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

export const EMERGENCY_REFERRALS = REFERRALS.filter(r => r.action === 'call-000')
export const GP_REFERRALS = REFERRALS.filter(r => r.action === 'gp-soon')
