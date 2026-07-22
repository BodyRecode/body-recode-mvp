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
  {
    slug: 'vitamin-d3-k2',
    name: 'Vitamin D3 + K2',
    category: 'foundational',
    short_description: 'Deficiency-correction tool, not a disease-prevention drug. Real wins in the genuinely deficient (a large slice of the depleted-women cohort); most beyond-bone marketing is oversold. K2 is a defensible adjunct for calcium partitioning, not a required safety buffer.',
    what_it_does: 'D3 (cholecalciferol) corrects serum 25(OH)D deficiency at roughly 10 nmol/L per 1000 IU per day in normal-weight adults, plateauing at 8-12 weeks. Response is blunted 2-2.5x by obesity, larger in the older and more deficient. K2 (MK-7) carboxylates osteocalcin (calcium into bone) and matrix Gla protein (calcium out of arteries). Physiological rationale for pairing K2 with higher-dose D3 is calcium partitioning, though hard outcome trials for K2 are not established.',
    contraindications: [
      'Warfarin / coumarin anticoagulants (K2 antagonises them) - refer to GP before adding K2. DOACs/apixaban not affected the same way but still flag',
      'Sarcoidosis / granulomatous disease (dysregulated vitamin D activation)',
      'Primary hyperparathyroidism',
      'Known hypercalcaemia',
      'Recurrent kidney stones or CKD (medical oversight required)',
      'Thiazide diuretic use (calcium interaction, medical oversight)',
    ],
    safety_notes: 'Australian NHMRC UL is 4000 IU/day D3 - deliberately conservative. Doses above 4000 IU/day should be blood-test-guided and reviewed. Overt toxicity generally requires sustained intake >10,000 IU/day and/or 25(OH)D pushed above 125-150 nmol/L. Ceiling target 125 nmol/L; hard stop 150 nmol/L. Hypercalcaemia at 3200-4000 IU/day for >=6 months is rare (~4 extra cases per 1000). The kidney stone signal in the literature came from calcium+D combinations, not D3 alone. NEVER program single annual or 6-monthly megadoses - the 500,000 IU annual bolus RCT raised falls by 15% and fractures by 26%. Daily is safest; weekly/monthly acceptable. Retest 25(OH)D at 8-12 weeks (levels plateau by 3 months) before concluding a dose failed.',
    coach_doctrine: 'Lead with correcting deficiency, NOT curing disease. VITAL, D2d, and D-Health mega-trials all showed NO reduction in cancer, cardiovascular events, diabetes, fractures, depression, or mortality in the already-replete. The real, modest benefits sit in the deficient: autoimmune incidence (VITAL, HR 0.78 - requires sustained intake), falls in older/deficient (800-1000 IU/day, 22% reduction), respiratory infections in the deficient (attenuated in 2024-25 update). D3 > D2 decisively - always use cholecalciferol. K2 is optional and rational, NOT obligatory - the "K2 buffers D3" story is mechanistically plausible but no outcome trial shows physiologic D3 doses cause calcification that K2 prevents. K2 flagship vascular RCT was negative (aortic valve calcification). DO NOT sell D3 as a testosterone booster in TRT/performance men - the only positive androgen signal was in obese men undergoing weight loss. Perimenopausal midlife women are the sweet spot: indoor lives + sun avoidance + age-related synthesis decline + oestrogen-driven bone loss = the classic "sun-rich country, D-poor woman" pattern. Australian winter/spring insufficiency runs 40-67% in women depending on region. Response rule: 10 nmol/L per 1000 IU, halve for obese, plateau at 8-12 weeks. Take with the largest/fattiest meal (biggest absorption lever).',
    research_reference: '~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/2026-07-22_Vitamin_D3_K2_Deficiency_Correction.md',
    tiers: {
      essential: {
        label: 'Essential',
        form: 'D3 (cholecalciferol) softgel or oil-based drops. Never D2.',
        dose: '2000-4000 IU/day D3',
        timing: 'With the largest / fattiest meal of the day (biggest absorption lever)',
        notes: 'No blood test required for low-risk clients. Fully within the AU NHMRC 4000 IU/day UL and aligned with 2024 Endocrine Society empiric-dosing guidance. Ensure dietary magnesium is adequate (magnesium is a cofactor for D metabolism). Any reputable third-party tested brand.',
        fits_client_profile: 'General clients, low-risk, maintenance or mild-insufficiency correction. Cheapest working option.',
      },
      enhanced: {
        label: 'Enhanced',
        form: 'D3 softgel + separate MK-7 (K2) capsule + magnesium glycinate',
        dose: 'D3 4000-5000 IU/day + MK-7 90-180 mcg/day + magnesium glycinate 200-400 mg elemental',
        timing: 'D3 + K2 with the largest meal (both fat-soluble). Magnesium in the evening.',
        notes: '5000 IU exceeds the AU NHMRC 4000 IU/day UL - flag as tolerability-guided and worth checking bloods. Screen out warfarin/coumarin anticoagulants before adding K2. Rationale is the perimenopausal bone-and-artery use case: D3 to correct/optimise, K2 to support calcium partitioning (bone in, arteries out). Hold 25(OH)D below 125 nmol/L.',
        fits_client_profile: 'At-risk / perimenopausal clients wanting the bone+vascular story. Autoimmune-leaning clients (VITAL autoimmune signal requires sustained intake). Higher-BMI clients needing higher correction dose. Anyone wanting the light monitoring touch.',
      },
      elite: {
        label: 'Elite',
        form: 'Personalised D3 (blood-test-guided) + MK-7 180 mcg + magnesium glycinate + boron',
        dose: 'D3 blood-test-guided to target 100-125 nmol/L (10 nmol/L per 1000 IU rule; 2-2.5x for obese) + MK-7 180 mcg/day + magnesium glycinate 200-400 mg + boron ~3 mg/day',
        timing: 'D3 + K2 + boron with largest meal. Magnesium evening. Retest 25(OH)D at 8-12 weeks after starting or dose change; then annual monitoring at end-of-winter (seasonal trough).',
        notes: 'Doses >4000 IU/day are test-guided, time-limited, and reviewed. Hold 25(OH)D at 75-125 nmol/L (aim 100-125). Ceiling 125 nmol/L; hard stop 150 nmol/L. Medical oversight mandatory if warfarin, CKD/stones, hypercalcaemia, sarcoidosis, hyperparathyroidism, or thiazides. Boron modestly influences D metabolism - thin evidence, low risk, positioned as nice-to-have not a core claim.',
        fits_client_profile: 'High-risk deficiency profiles (winter Tasmania, higher-melanin skin, chronic indoor workers). Performance clients wanting personalisation. TRT men (for substrate / general health only - NOT promised a testosterone rise). Anyone wanting the full target-and-hold protocol.',
      },
    },
  },
  {
    slug: 'omega-3-epa-dha',
    name: 'Omega-3 (EPA + DHA)',
    category: 'foundational',
    short_description: 'Foundational marine fatty acid stack. Most adults are underdosed (typical Omega-3 Index ~4-5% vs 8% cardioprotective target). Modest but reliable effects on triglycerides, blood pressure, inflammation and mood at adequate doses.',
    what_it_does: 'Long-chain omega-3s (EPA, DHA) incorporate into cell membranes, shift eicosanoid signalling toward resolution of inflammation, lower triglycerides and blood pressure, and support mood (via EPA-derived mediators) and brain structure (via DHA). Endpoint effects are dose- and ratio-dependent: EPA drives mood/inflammation/cardiac; DHA drives structural/cognitive/pregnancy endpoints. Chronic Omega-3 Index (%EPA+DHA in RBC membranes) is the best individual-response biomarker; target >8%.',
    contraindications: [
      'Atrial fibrillation history or palpitations - AF signal at >1.5g/day in high-CV-risk clients (OR 1.48). Refer before higher doses',
      'Anticoagulant medication (warfarin, DOACs) - theoretical bleeding-time interaction at high dose. GP oversight required',
      'Established cardiovascular disease requiring pharmacotherapy - refer for prescription icosapent ethyl consideration, not OTC',
      'Pregnancy / lactation - refer to GP/midwife (dosing is defensible but outside solo S&ES prescribing)',
    ],
    safety_notes: 'FDA cap: no more than 3g/day total EPA+DHA (including up to 2g from supplements). Above 3g requires medical decision. AF risk is dose-dependent and concentrated in high-CV-risk clients: 1000 mg/day increased AF risk ~12%, 1800-4000 mg/day increased it ~50% in high-risk patients, whereas dietary/moderate intake (600-700 mg/day) is associated with LOWER AF risk. For clients with any cardiac risk, keep <=1.5g/day or refer. Oxidation is under-appreciated: 30-40% of shelf products exceed TOTOX 26. Prefer TOTOX <26 (ideally <10), IFOS 5-star certification, opaque packaging, tocopherol/rosemary added, cool storage. Bin any oil with strong fishy odour/burps - rancid oil loses potency and may be pro-oxidant. LDL-C can rise modestly at low doses or with DHA-predominant formulas.',
    coach_doctrine: 'Most adults are underdosed. Typical Western Omega-3 Index is 4-5%; cardioprotective target is >8%. Sub-1g/day products (majority on shelves) are below threshold for measurable benefits beyond basic sufficiency. Dose matters more than brand hype. RATIO is the single most useful practical lever: EPA >=60% for mood/depression (Sublette threshold, one of the most reproduced findings), DHA-weighted for pregnancy/cognitive rationale. FORM matters at equal dose: rTG (re-esterified triglyceride) > TG > EE (ethyl ester) for absorption; EE requires fat to absorb properly. The "omega-3 failed" narrative from VITAL was wrong dose (0.84g) in the wrong population (unselected healthy). REDUCE-IT (4g pure EPA, high-risk statin patients) cut events ~25%. Both true. Softer endpoints (TG, BP, CRP) move reliably with dose; event reduction is where trials diverge. DO NOT sell as a testosterone booster (irrelevant), an antidepressant (adjunct only, refer for clinical depression), or a magic bullet. Frame as a foundational nutrient with modest, dose-dependent effects. IFOS-certified is the simplest quality proxy. Consistency > timing (membrane build-up is slow). Retest Omega-3 Index at 8-12 weeks minimum. Perimenopausal cohort is sweet spot (overlapping CV + mood + cognitive concerns on a typically low-fish background). AF caution is most relevant for older TRT men.',
    research_reference: '~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/2026-07-22_Omega_3_EPA_DHA_Cardiovascular_Mood_Inflammation.md',
    tiers: {
      essential: {
        label: 'Essential',
        form: 'IFOS-certified fish oil, TG or rTG form. Vegan alternative: algae oil (DHA-primary).',
        dose: '1-2g/day combined EPA+DHA (READ THE ACTIVES on the label - a "1000mg fish oil" cap is often only ~300mg EPA+DHA)',
        timing: 'With a fat-containing meal (non-negotiable for EE, still helpful for TG/rTG)',
        notes: 'Foundational sufficiency. Corrects the near-universal Western deficit. Nudges Omega-3 Index toward 6-8%. Any reputable IFOS-certified brand. ~1:1 EPA:DHA ratio is fine; lean EPA-heavy if mood is a stated concern.',
        fits_client_profile: 'General clients as foundational nutrient. Default for the majority. Anyone with low fish intake (2 or fewer servings per week).',
      },
      enhanced: {
        label: 'Enhanced',
        form: 'Higher-quality rTG (re-esterified triglyceride), IFOS-certified. Or algae oil if vegan/pregnancy pathway.',
        dose: '2-3g/day combined EPA+DHA, ratio matched to goal',
        timing: 'With largest fat-containing meal. Split doses if GI intolerance or reflux/fish-burps.',
        notes: 'Ratio matters at this tier. Mood/inflammation/recovery path: EPA-predominant (>=60% EPA), targeting 1-2g EPA. Cognitive/vegan/pregnancy-planning path: DHA-weighted (algae acceptable). Reliable TG/BP/CRP movement. Consider baseline Omega-3 Index test to personalise.',
        fits_client_profile: 'Perimenopausal women wanting the CV + mood + cognitive stack. Athletes in hard training blocks (recovery + cardiovascular). TRT men (with AF-history check first). Mood-support clients (adjunct to GP care). High inflammatory load.',
      },
      elite: {
        label: 'Elite',
        form: 'Pharmaceutical-grade rTG or high-EPA formula, Omega-3 Index-guided',
        dose: '3-4g/day combined EPA+DHA, Omega-3 Index-guided: test then dose then retest at 12 weeks, titrate to >8% (some push 8-10%)',
        timing: 'Split doses across meals. Retest at 12 weeks minimum, then quarterly if titrating.',
        notes: 'CRITICAL AF SAFETY GATE. AF signal at >1.5g/day in high-CV-risk clients (OR 1.48) - SCREEN for AF history, palpitations, cardiac disease before going above 1.5g in older or TRT men. FDA cap: no more than 3g/day total (2g from supplements) without medical oversight. Do NOT exceed 3g/day supplemental without practitioner sign-off. Not a first move for a general client - reserved for high inflammatory load, athlete recovery blocks, or Index-optimisation projects.',
        fits_client_profile: 'High inflammatory load or joint pain that responded at Enhanced tier. Athlete recovery block optimisation. Omega-3 Index projects (testing available). NOT older TRT men without AF-history screen. NOT anyone with cardiac disease absent GP sign-off.',
      },
    },
  },
  {
    slug: 'whey-protein',
    name: 'Whey Protein (WPI / WPC)',
    category: 'foundational',
    short_description: 'Highest practical protein quality (DIAAS ~1.1) and the workhorse vehicle for hitting daily protein targets. The Body Recode default is WPI - fast digestion, ~1g leucine per 20g serve, minimal lactose, cheap per gram, lowest heavy-metal risk of the powder categories.',
    what_it_does: 'Delivers a rapid, high-leucine amino acid pulse that triggers muscle protein synthesis (MPS) via the mTORC1 pathway. Per-meal ~0.4g/kg (30-40g, >=2.5-3g leucine) maximises the anabolic signal. Total daily protein is the master variable: 1.6-2.2g/kg for trained adults, top of range (1.8-2.0+g/kg) for older adults, peri/postmenopausal women, and dieters, all of whom face anabolic resistance. Trommelen 2023 debunked the "30g ceiling" - larger boluses extend the anabolic response for hours with negligible extra oxidation.',
    contraindications: [
      'True cow\'s milk protein allergy (IgE) - all whey and casein forms must be avoided; use plant blends, soy, egg-white, or beef isolate',
      'Severe lactose intolerance and WPC (>3g lactose per serve) - switch to WPI (<1g) or add a lactase enzyme',
      'Renal disease - protein intake >2g/kg should be discussed with prescriber',
    ],
    safety_notes: 'Whey is well-tolerated. Nearly half of top-selling protein powders exceeded California Prop 65 lead/cadmium limits in 2024-25 testing - WHEY was the cleanest category (~28% over) versus plant-based/organic worst (~80% over). Chocolate flavours accumulate up to ~110x the cadmium of vanilla. Insist on HASTA (Australian) or Informed Sport batch-tested products. In healthy kidneys, protein intake up to ~2.2g/kg is safe long-term; higher provides no additional muscle benefit. TRT and other hormone therapy is the doctor\'s lane - our role is nutrition and training only.',
    coach_doctrine: 'Total daily protein is the master variable, not timing or "which powder." 1.6-2.2g/kg for trained adults; peri/postmenopausal women belong at 1.8-2.0+g/kg (chronic under-intake is the real failure mode in this cohort). The 30g "anabolic ceiling" is a MYTH - Trommelen 2023 (100g whey) showed the anabolic response scales past 40g with no waste. Use 0.4g/kg per meal as a FLOOR not a cap. The post-workout "anabolic window" is essentially dead as a 30-min rule (Schoenfeld 2013 meta-analysis); muscle is sensitised for ~24h. Real timing exceptions: fasted early-AM training, older adults hitting the per-meal leucine threshold, and pre-sleep casein. Distribute 30-40g (>=3g leucine) across 3-4 meals - depleted women typically load protein at dinner and miss breakfast/lunch thresholds. FIX BREAKFAST FIRST. Hydrolysate rarely justifies its premium (hydrolysis cleaves peptide bonds, NOT lactose). Modern pea+rice(+/- canola/soy) blends match whey for MPS at adequate leucine-matched dose (Pinckaers 2023; van der Heijden 2024) - hemp is a leucine-diluter, use for fibre only. Collagen is NOT muscle protein (DIAAS ~0, leucine-poor) - separate tendon/skin slot with vitamin C, never count toward daily protein. Cycle-phase protein tweaking is over-engineered; keep daily total consistent.',
    research_reference: '~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/2026-07-22_Whey_Protein_and_Protein_Powders.md',
    tiers: {
      essential: {
        label: 'Essential',
        form: 'Whey Concentrate (WPC), third-party tested (HASTA or Informed Sport in AU)',
        dose: '25-30g serve delivering ~2.5g leucine, as needed to hit daily protein target (1.6-2.2g/kg)',
        timing: 'Any time. Post-training or as a meal top-up. Distribute across 3-4 feedings for maximum MPS.',
        notes: 'Lowest cost per gram of protein. Lowest contaminant risk of the powder categories. Watch for lactose bloat (3-8g per serve) - swap to WPI if problematic. Cheapest working option.',
        fits_client_profile: 'Budget-conscious general clients. Anyone topping up daily total protein. Fine for the majority of clients as a starting point.',
      },
      enhanced: {
        label: 'Enhanced',
        form: 'Whey Isolate (WPI), batch-tested (Informed Sport, Informed Choice, or HASTA)',
        dose: '25-30g serve delivering ~2.5-2.7g leucine (~1g leucine per 20g serve). Per meal 0.4g/kg. Daily 1.6-2.2g/kg (1.8-2.0+ for peri/postmenopausal women).',
        timing: 'Distributed across breakfast, lunch, dinner. FRONT-LOAD BREAKFAST for perimenopausal women to rescue the worst meal. Optional add-on: 30-40g casein pre-bed for older / sarcopenia-focused clients or hard-training performance clients (Res 2012 showed +22% overnight MPS).',
        notes: 'The Body Recode default vehicle. Low lactose (<1g/serve), fast, satiating. Cleanest contaminant profile. If lactose bloating persists on WPI, try a lactase enzyme before switching to plant. Genuine milk protein allergy needs plant/soy/egg alternative.',
        fits_client_profile: 'Peri/postmenopausal women (primary cohort). Most general clients. TRT men (Luke). Performance clients wanting a reliable base.',
      },
      elite: {
        label: 'Elite',
        form: 'Grass-fed WPI base + high-leucine adjunct + micellar casein + hydrolysed collagen (separate slot)',
        dose: 'WPI 25-30g x 3-4 daily + leucine top-up (~1-2g) to reliably clear 3g leucine/meal + casein 30-40g pre-bed + collagen 15g + vitamin C ~40-50mg in a SEPARATE daily slot',
        timing: 'WPI distributed with meals. Casein ~30 min before sleep. Collagen + vitamin C 30-60 min BEFORE tendon-loading work or training.',
        notes: 'Collagen has its OWN daily slot and MUST NOT be counted toward the muscle-protein target (DIAAS ~0). Vitamin C is a required cofactor for collagen cross-linking. Full stack for bone + tendon + skin + overnight recovery. Reserved for clients with clear tendon/joint priorities, sarcopenia focus, or high-training-load recovery blocks.',
        fits_client_profile: 'Older / anabolically-resistant clients. Hard-training performance clients wanting overnight recovery support. Clients with tendon/joint priorities (Achilles, patellar tendinopathy, skin/hair goals). Sarcopenia focus.',
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
