/**
 * Supplement Library - canonical seed.
 *
 * Substance-based prescription library with Essential / Enhanced / Elite
 * tiers per substance. Coach assigns the SUBSTANCE per client; the
 * client portal renders all three tiers so the client picks what fits
 * their budget and can upgrade themselves later without asking.
 *
 * Rationale for the three-tier model:
 * - Removes analysis paralysis - client picks a tier, not a product.
 * - Scales with wallet - depleted client starts Essential, executive
 *   goes straight to Elite.
 * - Sets up the Body Recode branded product ladder for phase 2 - when
 *   the branded line launches, it plugs into the Elite tier by default.
 * - Preserves scope of practice - prescribing substances with dosing
 *   is within a Sport & Exercise Scientist's scope for OTC / Listed
 *   complementary medicines. S4/S8 substances stay with Arete Protocol.
 *
 * Doctrine sources for each substance live at
 * `~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/`.
 * Add to that folder as new substances are researched.
 */

export type SupplementCategory =
  | 'foundational'
  | 'sleep_recovery'
  | 'performance_peri_workout'
  | 'gut_digestion'
  | 'cognitive_focus'
  | 'womens_specific'
  | 'mens_specific'
  | 'longevity_inflammation'

export interface SupplementTier {
  label: string
  form: string
  dose: string
  timing: string
  notes: string
  fits_client_profile: string
}

export interface SupplementSubstance {
  slug: string
  name: string
  category: SupplementCategory
  short_description: string
  what_it_does: string
  contraindications: string[]
  safety_notes: string
  coach_doctrine: string
  research_reference: string | null
  tiers: {
    essential: SupplementTier
    enhanced: SupplementTier
    elite: SupplementTier
  }
}

export const SUPPLEMENT_SUBSTANCES: SupplementSubstance[] = [
  {
    slug: 'creatine-monohydrate',
    name: 'Creatine Monohydrate',
    category: 'foundational',
    short_description: 'The single most-evidenced supplement for strength, cognitive performance, and cellular energy.',
    what_it_does: 'Restores muscle phosphocreatine (rapid energy for high-intensity work) and elevates brain phosphocreatine (supports cognition under stress). Monohydrate is the only form with meaningful cognitive evidence - alternative forms (HCL, Kre-Alkalyn, ethyl ester, buffered) have no cognitive trials worth citing.',
    contraindications: [
      'Pre-existing kidney disease (get GP clearance before any protocol above 5g/day)',
      'Pregnancy (limited safety data)',
    ],
    safety_notes: 'Serum creatinine rises with supplementation - this is a substrate effect, not kidney damage. Standard practice: annual bloods (renal panel) for anyone on 10g+ chronic. Divided doses (5g x 2) are better tolerated than a single 10g dose. Long-term safety at 3-5g/day has decades of data. Chronic 10-30g/day safety is extrapolated from short trials, not directly proven long-term.',
    coach_doctrine: 'The dose-response is context-dependent. Chronic 10-20g/day in healthy well-rested young adults produces NO cognitive benefit (Moriarty 2023). But a single 14-25g dose under sleep deprivation rescues cognition within 3-4 hours (Gordji-Nejad 2024). Brain creatine rises only ~10% with supplementation vs ~20% in muscle, so brain-focused protocols warrant higher doses than the muscle-standard 3-5g/day. Direct dose-response in one trial: 10g/day doubled brain phosphocreatine vs 4g/day. Menopausal cognitive-benefit marketing is not yet supported by direct RCT data - frame honestly with those clients (bone, strength, sleep are better arguments).',
    research_reference: '~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/2026-07-21_Creatine_Monohydrate_Cognitive_Research.md',
    tiers: {
      essential: {
        label: 'Essential',
        form: 'Third-party tested creatine monohydrate powder',
        dose: '5g/day',
        timing: 'Any time, with meals slightly better (insulin transports creatine into cells)',
        notes: 'No loading required at this dose. Muscle saturation reached in 3-4 weeks. Any reputable third-party tested brand works.',
        fits_client_profile: 'Everyone. Baseline muscle support plus moderate brain benefit. Decades of safety data at this dose.',
      },
      enhanced: {
        label: 'Enhanced',
        form: 'Creapure or equivalent third-party tested creatine monohydrate',
        dose: '10g/day (split 5g AM + 5g PM with meals)',
        timing: 'Split dose morning and evening, both with meals. Optional loading: 15-20g/day for 5-7 days for faster brain saturation.',
        notes: 'Doubles brain phosphocreatine vs the 4g dose in the one direct dose-response trial we have (Kondo 2016). Add annual bloods (renal panel).',
        fits_client_profile: 'Clients targeting cognitive performance, mental fatigue, older adults, sleep-impacted, vegetarians. Anyone who wants brain-focused benefit beyond baseline.',
      },
      elite: {
        label: 'Elite',
        form: 'Creapure-branded creatine monohydrate',
        dose: '10g/day baseline + acute rescue protocol: single 0.2-0.35g/kg dose (14-25g depending on bodyweight) as needed',
        timing: 'Baseline: split dose morning and evening with meals. Acute rescue: 3-4 hours before the cognitive event (bad sleep night, jet lag, high cognitive demand).',
        notes: 'Matches the full evidence-backed protocol from Gordji-Nejad 2024 (Nature Scientific Reports). Elite tier assumes the client will maintain the baseline plus deploy the rescue protocol situationally. Add annual bloods (renal panel).',
        fits_client_profile: 'Executives, shift workers, high-stress professionals, and anyone wanting the full research-backed protocol. This is Kade\'s personal use case and mirrors the Morning Reset Protocol.',
      },
    },
  },
  {
    slug: 'magnesium',
    name: 'Magnesium',
    category: 'foundational',
    short_description: 'The most defensible foundational supplement for depleted, stressed, poor-sleeping midlife women. Repletion-driven benefits across sleep, mood, glucose and blood pressure.',
    what_it_does: 'Magnesium is a cofactor in over 300 enzymatic reactions. Supplementation shows benefit most reliably where there is a deficit - roughly a third of the population has inadequate intake. Corrects the shortfall driving poor sleep-onset, HPA-axis dysregulation, glucose control drift, and mild-to-moderate blood pressure elevation. Different forms (citrate, bisglycinate, threonate, malate, taurate, oxide) vary mostly on elemental content, GI tolerability, and cost - not on the dramatic form-endpoint claims marketing suggests.',
    contraindications: [
      'Renal impairment (eGFR <30) - risk of hypermagnesaemia; requires clinician oversight',
      'Long-term high-dose without medical supervision if on potassium-sparing diuretics (can raise magnesium levels)',
    ],
    safety_notes: 'Australian NHMRC upper safe supplemental intake is 350mg/day elemental (based on GI tolerance, not systemic toxicity). Doses of 400-500mg elemental in gentle forms (bisglycinate) are used routinely in trials and tolerated by most, but formally exceed the AU UL - frame higher-tier prescriptions as tolerability-guided. First sign of excess is loose stools. Serum magnesium is usually useless as a test (<1% of body magnesium is in serum) - use RBC magnesium if testing. Space away from thyroid meds (4hr), tetracycline/fluoroquinolone antibiotics (2-6hr), and oral bisphosphonates (2hr). Long-term PPI or diuretic use depletes magnesium and often warrants supplementation.',
    coach_doctrine: 'Benefits are REPLETION-DRIVEN. Biggest effects in deficient people; fades toward null in the already-replete. The form-to-endpoint map (threonate for brain, glycinate uniquely for sleep, taurate for heart) is mostly extrapolation from mechanism, not head-to-head human trials. Buy for repletion + dose + tolerability, not for marketed organ-specificity. Threonate is the only form with a specific human cognition signal (industry-funded, unreplicated). Dose ceilings for sleep/stress/mood cluster at 300-400mg elemental - going to 1000mg buys GI distress, not more benefit for those endpoints. Glucose and BP endpoints need HIGHER doses (400-500mg) and LONGER duration (12-24 weeks). Do NOT sell as a cramp cure (Cochrane 2020 says no for idiopathic cramps). No case for pre-workout use - it is a status/recovery tool, not an ergogenic. Best pairing: bisglycinate 300-400mg evening + optional B6 20-30mg for stress endpoint (B6 enhanced the effect in trial data). Perimenopausal cohort is the sweet spot for this substance - low intake + high stress + poor sleep + glucose drift is exactly where magnesium shines.',
    research_reference: '~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/2026-07-22_Magnesium_Sleep_Stress_and_Metabolic_Support.md',
    tiers: {
      essential: {
        label: 'Essential',
        form: 'Bisglycinate (gentlest, sleep-sensitive default) or Citrate (best value, tolerate GI)',
        dose: '300-400mg elemental daily',
        timing: 'Evening, with food',
        notes: 'Covers the foundational case: repletion, sleep-onset, stress, general metabolic support. Any reputable third-party tested brand. Read the label for ELEMENTAL magnesium content (a 1000mg citrate capsule delivers only ~160mg elemental). This tier alone captures most of the real-world benefit for most clients.',
        fits_client_profile: 'Everyone in the depleted-women cohort. Any client wanting a foundational anchor. Default for the primary Body Recode audience.',
      },
      enhanced: {
        label: 'Enhanced',
        form: 'For sleep/stress/HPA path: bisglycinate + optional B6. For glucose/BP path: citrate.',
        dose: 'Sleep/stress path: bisglycinate 300-400mg evening + optional B6 20-30mg. Glucose/BP path: citrate 400-500mg/day split AM+PM.',
        timing: 'Sleep path: 1-2 hours before bed with food. Glucose/BP path: split AM+PM with meals, run for 12-24 weeks minimum (these endpoints need duration).',
        notes: '400-500mg exceeds the 350mg AU NHMRC supplemental UL - tolerability-guided, worth mentioning practitioner awareness. B6 enhanced the stress effect in Noah/Pouteau trials. Reduce dose if loose stools; switch to bisglycinate if citrate is not tolerated.',
        fits_client_profile: 'Clients with a specific target endpoint: sleep issues, perimenopausal HPA dysregulation, insulin resistance, prediabetes, elevated BP, TRT body-comp goals, high-stress professionals.',
      },
      elite: {
        label: 'Elite',
        form: 'Stacked forms: bisglycinate (sleep/HPA) + threonate (cognition), personalised to RBC magnesium',
        dose: 'Bisglycinate 300-400mg elemental evening + threonate 1-2g compound (~145-290mg elemental) morning or split',
        timing: 'Bisglycinate 1-2 hours before bed with food. Threonate morning or split AM+PM (conventionally dosed twice daily).',
        notes: 'Personalise dose to RBC magnesium at baseline; retest 8-12 weeks and adjust. Highest cost and thinnest incremental evidence (especially the threonate arm - industry-funded, unreplicated by independent labs). Position honestly as an optimisation layer, not a foundation. Total elemental Mg from stack may reach 450-700mg - practitioner oversight recommended.',
        fits_client_profile: 'High-performing / high-stress clients wanting the full stack. TRT men optimising sleep + cognition + glucose together. Midlife women with cognitive complaints alongside sleep/stress issues who want the premium cognitive add-on.',
      },
    },
  },
]

export const CATEGORY_LABELS: Record<SupplementCategory, string> = {
  foundational: 'Foundational',
  sleep_recovery: 'Sleep and recovery',
  performance_peri_workout: 'Performance / peri-workout',
  gut_digestion: 'Gut and digestion',
  cognitive_focus: 'Cognitive and focus',
  womens_specific: 'Women-specific',
  mens_specific: 'Men-specific',
  longevity_inflammation: 'Longevity and inflammation',
}

export function substanceBySlug(slug: string): SupplementSubstance | null {
  return SUPPLEMENT_SUBSTANCES.find(s => s.slug === slug) ?? null
}
