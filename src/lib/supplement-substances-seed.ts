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
  {
    slug: 'ashwagandha',
    name: 'Ashwagandha (Withania somnifera)',
    category: 'sleep_recovery',
    short_description: 'HPA-axis / cortisol / sleep / perimenopause support with an evidence base concentrated in short trials (<=12 weeks) and a genuine safety profile that demands pre-screening. Best fit for the depleted-leaning cohort - who also concentrate the contraindications. NOT a testosterone booster in healthy men.',
    what_it_does: 'Ayurvedic adaptogen; bioactives are withanolides (steroidal lactones). Down-regulates HPA-axis output (lowers morning cortisol reliably by ~2.4 mcg/dL at 8 weeks). GABAergic activity supports sleep quality and anxiety reduction. Mild thyroid-stimulating (raises T3/T4, lowers TSH) and pro-oestrogenic (raises oestradiol, lowers FSH/LH in perimenopausal women) effects - these are efficacy AND safety mechanisms. The leaf fraction is richer in withaferin A (theoretical cytotoxicity concern), which is why root-only extracts (KSM-66) are the default choice.',
    contraindications: [
      'Pregnancy, trying to conceive, or breastfeeding - CONTRAINDICATED. Mandatory TGA pregnancy warning; traditional abortifacient use',
      'Known liver disease, prior liver injury, or heavy alcohol use - AVOID (rare but real idiosyncratic hepatotoxicity signal, fatal in pre-existing liver disease)',
      'Thyroid disease OR on thyroid medication (levothyroxine, antithyroid) - medical supervision or avoid (ashwagandha raises T3/T4, additive with thyroid meds toward iatrogenic hyperthyroidism)',
      'Autoimmune disease (Hashimoto\'s, RA, lupus, MS) or on immunosuppressants/biologics/post-transplant - avoid or specialist review (bidirectional immunomodulation)',
      'Oestrogen-sensitive history (breast/uterine pathology, endometriosis) - caution given oestradiol effect',
      'On benzodiazepines, Z-drugs, sedatives, sedating antihistamines, or significant alcohol - additive sedation risk',
      'Upcoming elective surgery - stop 1-2 weeks prior (possible antiplatelet activity)',
    ],
    safety_notes: 'ACTIVE TGA SAFETY ADVISORY (2024, updated 7 July 2026): rare idiosyncratic hepatotoxicity signal (NIH LiverTox documents ~23 published cases; Philips 2023 India case series had 3 deaths in pre-existing liver disease; US transplant case reported 2023). Onset typically ~1 month, cholestatic hepatitis pattern, usually reversible on stopping but FATAL in pre-existing liver disease. Danish food-supplement BAN (April 2023) based on DTU 2020 risk assessment (thyroid/sex-hormone disruption, abortifacient concerns - hormone basis is scientifically contested; hepatotoxicity signal is separately corroborated across US, India, EU, Australia). Netherlands RIVM 2024 flagged liver injury, thyrotoxicosis, adrenal suppression in sensitive individuals. GI upset (nausea, loose stools) is most common side effect - take with food. Lowers blood glucose and blood pressure - monitor if on antidiabetics/antihypertensives. Discontinuation rebound reported after abrupt cessation of higher doses - taper the final week. AUST-L TGA-listed products only; not unregulated online/overseas. Teach every client the red-flag symptoms: jaundice, dark urine, itching, right-upper-quadrant pain, unusual fatigue, sudden severe GI - stop immediately and see a doctor.',
    coach_doctrine: 'Cortisol/stress reduction is the strongest, most consistent effect (biochemical). Perceived stress reduction is more heterogeneous (biochemical-subjective dissociation - not everyone who lowers cortisol FEELS calmer). Testosterone story is oversold: real ~10-20% rise in stressed/subfertile/overweight/training men, small-to-null in healthy eugonadal men. It is NOT a testosterone therapy. Dose-response is NON-LINEAR for psychological endpoints - <=500-600mg/day is sufficient and may outperform higher doses (Alsanie/Askarpour 2026 dose-response MA of 22 RCTs). Sleep is the exception where >=600mg for >=8 weeks performs better. Extract matters more than mg number: KSM-66 (root, ~5% withanolides) has the deepest trial base and cleanest withaferin-A profile; Sensoril (root+leaf ~10%) and Shoden (root+leaf ~35%) are more concentrated at lower dose but contain leaf/withaferin A. Generic "full-spectrum" powder has minimal direct evidence - treat mg as meaningless without a NAMED, STANDARDISED extract. Perimenopausal women see oestradiol UP + FSH/LH DOWN with symptom relief (Gopal 2021) - this is a benefit for symptomatic climacteric women but a caution flag for oestrogen-sensitive history. Ashwagandha raises thyroid hormones - beneficial for subclinical hypothyroid, harmful for hyperthyroid/on levothyroxine, unpredictable in Hashimoto\'s. Baseline TSH (+/- free T4, TPO antibodies) should precede recommendation in the primary Body Recode cohort. RCT base is <=12 weeks - no robust long-term safety data. Cycle 8-12 weeks on / 2-4 weeks off with periodic reassessment. Taper to avoid rebound. Evening dose is the rational default (leverages sleep/GABAergic benefit; "adaptogens must be morning" is folklore). 8-week trial minimum before judging - not an "instant calm" supplement. Compared to other sleep aids: ashwagandha SMD -0.59 (moderate) on weeks timescale via stress; magnesium glycinate d=0.2 (small) days-weeks; glycine 3g and L-theanine 200mg act SAME NIGHT for acute racing-mind - these are COMPLEMENTARY not competing (basis for the Elite stack). "434% testosterone increase" is a misleading marketing frame (relative comparison of two small absolute changes in one training study). Screen every client BEFORE recommending - the depleted-leaning 40s-50s cohort is a strong symptomatic fit but concentrates the contraindications (thyroid, autoimmune, oestrogen-sensitive history, polypharmacy).',
    research_reference: '~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/2026-07-22_Ashwagandha_HPA_Sleep_Perimenopause.md',
    tiers: {
      essential: {
        label: 'Essential',
        form: 'Named KSM-66 branded extract (Ixoreal), root-only, TGA AUST-L product only. NOT generic full-spectrum powder.',
        dose: '300-600mg KSM-66 once daily',
        timing: 'With the evening meal (leverages the sleep/GABAergic benefit for the tired-but-wired cohort)',
        notes: '8-week trial minimum before judging effect. Early read at 4 weeks. Screen the client FIRST (see contraindications). GI upset is the most common side effect - take with food to fix it. Do NOT push above 600mg for psychological endpoints - dose-response is non-linear.',
        fits_client_profile: 'High-stress clients with elevated baseline cortisol. Subclinical anxiety. Poor sleep (weeks-scale improvement). Perimenopausal women with climacteric symptoms. ALL after the safety screen clears.',
      },
      enhanced: {
        label: 'Enhanced',
        form: 'KSM-66 (split AM+PM if >600mg), OR 250mg Sensoril evening (root+leaf, more sedating, lower pill burden), OR 120-240mg Shoden evening (root+leaf, high potency)',
        dose: 'KSM-66 500-1000mg split AM+PM, or Sensoril 125-250mg evening, or Shoden 120-240mg evening',
        timing: 'KSM-66 split for higher totals. Sensoril/Shoden evening. All with meals for GI tolerance.',
        notes: 'Use when Essential is tolerated but under-effective, OR where sleep is the dominant complaint (favours the >=600mg / >=8-week sleep data). Push past ~600mg only for sleep or strength/androgen goals - psychological benefit does NOT scale linearly. Sensoril/Shoden achieve significant cortisol/anxiety effects at 1/3 the mg of KSM-66 (higher withanolide concentration).',
        fits_client_profile: 'Clients tolerating Essential but needing more sleep effect. Clients wanting low pill burden. Training/androgen-focused men who responded to Essential and want to push further.',
      },
      elite: {
        label: 'Elite',
        form: 'KSM-66 600mg (performance/androgen or sleep goal) OR Shoden 120-240mg (concentrated evening) + complementary sleep/stress stack: magnesium glycinate 200-300mg elemental evening + glycine 3g pre-bed + L-theanine 200mg',
        dose: 'Ashwagandha as above + stack. Cycle 8-12 weeks ON / 2-4 weeks OFF. Taper the final week.',
        timing: 'PM-weighted. Magnesium glycinate + ashwagandha with evening meal. Glycine and L-theanine 30 min pre-bed for acute same-night support.',
        notes: 'MANDATORY BEFORE ELITE: baseline TSH (+/- free T4, TPO antibodies), autoimmune/medication screen, consider baseline LFTs and repeat if symptomatic. Coach-GP co-management expected at this tier. Stack pairs ashwagandha (weeks-scale HPA down-regulation) with acute same-night calming (glycine, L-theanine) and magnesium repletion - complementary mechanisms and time-courses.',
        fits_client_profile: 'Clients where the Body Recode primary presentation (tired-but-wired + poor sleep + perimenopausal or high-stress) is dominant, Enhanced was insufficient, screening cleared, and client is willing to invest in baseline bloodwork and periodic monitoring.',
      },
    },
  },
  {
    slug: 'l-theanine-caffeine',
    name: 'L-Theanine + Caffeine',
    category: 'cognitive_focus',
    short_description: 'The classic calm-focus stack. Reproducible small-to-moderate wins on attention accuracy and reaction time (peaks in the SECOND hour after dosing). Caffeine does the cognitive lifting; theanine measurably reduces jitter and headache. L-theanine ALONE is a legitimate stand-alone tool for the caffeine-sensitive client (calm daytime, sleep-onset evening).',
    what_it_does: 'L-theanine (N-ethyl-L-glutamine, from tea) crosses the blood-brain barrier via L-type amino acid transporters, modulates glutamatergic signalling and nudges GABA/dopamine/serotonin - most characteristically INCREASES alpha-band EEG activity (the signature of relaxed alertness). Caffeine is an adenosine-receptor antagonist (A1/A2A) - removes the brake on arousal, dopamine and noradrenaline. Combining them: caffeine supplies stimulation, theanine dampens the sympathetic cost. The mechanisms are SEPARABLE - which is why theanine buffers jitter but NOT tolerance. L-theanine alone at 200mg produces genuine calm and improves acute stress response and sleep-onset perception without sedating.',
    contraindications: [
      'Pregnancy / breastfeeding - cap total caffeine at 200mg/day (FSANZ); theanine supplements need medical sign-off (caffeine half-life doubles in pregnancy)',
      'Anxiety disorders / panic - theanine buffer is partial, not absolute; default to theanine-alone (no caffeine)',
      'Cardiovascular disease, hypertension, arrhythmias, palpitations - caffeine cautions apply; theanine buffer does NOT make caffeine cardiac-safe',
      'Insomnia / sleep disorders - enforce 8-10hr caffeine cutoff before bed, or shift to theanine-only',
      'On antihypertensive medication - theanine can modestly lower BP and may potentiate antihypertensives, monitor',
      'On SSRIs, antipsychotics, or other psychotropic medication - flag for practitioner review before daily theanine',
    ],
    safety_notes: 'L-theanine is remarkably safe - no serious adverse events across dozens of trials, well tolerated at 400mg+ doses. Caffeine is where the real cautions live. Adult ceiling 400mg caffeine/day from ALL sources (coffee, tea, pre-workout, chocolate). Anxiety threshold appears at ~3mg/kg/day (~210-240mg for adults). Anxiety-prone clients often best at <=100mg per dose. Pregnancy/breastfeeding cap is 200mg/day (FSANZ). AU listed-medicine rule caps caffeine-as-single-ingredient at 100mg/day and 100mg/3hr - a conservative anchor. NEVER recommend un-weighed bulk caffeine powder - a single ~3g dose has been fatal. Caffeine half-life is ~5hr (doubled in pregnancy and with oral contraceptives; halved in smokers). Withdrawal from regular use begins 12-24hr after last dose, peaks 20-48hr, lasts 2-9 days - taper, do not stop cold. Theanine can modestly lower BP.',
    coach_doctrine: 'The single most reproducible effect is small-to-moderate improvement in ATTENTION accuracy (switching, sustained-attention) and REACTION TIME - most reliably in the SECOND HOUR after dosing (Payne 2025, 50 RCTs). Working memory, subjective alertness, and overall mood show inconsistent, non-significant pooled effects. Position honestly: caffeine does the cognitive lifting; theanine measurably reduces jitter (-3.25 VAS) and headache (-6.83 VAS). The stack is helpful and low-risk, NOT dramatic. 200mg L-theanine is the research standard; 100mg is a genuine floor for reaction time; 400mg is where sustained-attention/RVIP tightens up. 2:1 ratio (200:100mg) is the calm-focus standard - no RCT isolates ratio, its the mechanistically defensible compromise (100mg caffeine = low jitter; 200mg theanine = validated dose). Jitter reduction: lower CAFFEINE first, then raise theanine (2:1 at 100mg caffeine, or 4:1 if still reactive). Theanine ALONE at 200mg is a legitimate stand-alone tool for the caffeine-sensitive client - calm daytime, sleep-onset evening (SMD 0.15 subjective sleep-onset; SMD 0.33 daytime dysfunction; short 1hr half-life = no grogginess). Theanine buffers jitter but NOT tolerance - caffeine tolerance is chronic adenosine receptor adaptation on a different system. Cycling is required: 5:2 weekday/weekend, 3-7 day taper deload every 6-8 weeks, bridge with theanine-only. Hard caffeine cutoff 8-10hr before bed (a 2pm 100mg dose leaves 50mg circulating at 7pm). Effects peak in the SECOND HOUR after dosing - dose 30-40min ahead for coverage. Perimenopausal cohort (primary Body Recode audience): caffeine WORSENS hot flushes/night sweats but IMPROVES mood/memory/concentration (Faubion 2014) - the woman who values the cognitive lift but is destabilised by caffeine typically does well on coffee + theanine by day, theanine alone by night. CYP1A2 genotype matters MOST at high dose (>=3mg/kg) for endurance - for low-dose cognitive (100mg), phenotype (client feels wired/palpitant/sleep-disrupted) > genotype. L-theanine form: verified >=98% L-enantiomer purity is what matters (racemic DL dilutes active dose). Suntheanine and AlphaWave are branded assurances; a quality generic with COA is pharmacologically equivalent. Caffeine source (coffee vs anhydrous vs matcha) does NOT change the theanine synergy chemically - the difference is DOSE PRECISION. Matcha delivers only ~25-45mg theanine per cup - insufficient for therapeutic effect on its own. "434% testosterone boost" style marketing is nowhere in the L-theanine literature; the actual effect sizes are small-to-moderate and CIs are wide.',
    research_reference: '~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/2026-07-22_L_Theanine_Caffeine_Cognitive_Calm_Focus.md',
    tiers: {
      essential: {
        label: 'Essential',
        form: 'L-theanine capsule (verified >=98% L-enantiomer, third-party tested, or branded Suntheanine / AlphaWave) + the coffee the client already drinks',
        dose: '200mg L-theanine + client\'s usual coffee dose',
        timing: '30-40 min before deep work or high-cognitive-demand event. Hard caffeine cutoff 8-10hr before bed.',
        notes: 'Cheapest working option. Uses caffeine the client already consumes. Coffee dose is approximate (a cup ranges 80-120mg). Delivers the buffered smooth-focus experience and stand-alone theanine benefits without changing habits.',
        fits_client_profile: 'Depleted-leaning women who drink coffee but feel wired. Anyone wanting to try the buffered experience without buying caffeine anhydrous. Habit-stacked entry point.',
      },
      enhanced: {
        label: 'Enhanced',
        form: '200mg L-theanine + 100mg caffeine anhydrous (precise dosing, single capsule or split-dose)',
        dose: '200:100 ratio (2:1). Jitter-prone client not settled? Shift to 4:1 (400mg theanine : 100mg caffeine) BEFORE adding caffeine.',
        timing: '30 min pre-cognitive work. Cognitive benefits often peak in the SECOND hour - a 2-hour deep-work block or exam is well-covered by dosing 30 min ahead.',
        notes: 'Precise, reproducible. The default for knowledge workers, executives, TRT men, general cognitive-performance clients. 200mg theanine is the research standard - going to 400mg buys smoothness and calm, not extra cognitive horsepower.',
        fits_client_profile: 'Knowledge workers, executives, TRT men, performance clients pre-cognitive event (not training - see Elite for training-dose caffeine), most general users wanting reliable calm focus.',
      },
      elite: {
        label: 'Elite',
        form: 'Suntheanine (or verified branded) 400mg + caffeine anhydrous 2-3mg/kg bodyweight pre-training/high-demand work. PLUS L-theanine 200mg alone in the evening for sleep-onset support.',
        dose: 'Pre-session: 400mg theanine + 130-210mg caffeine (bodyweight-dosed 2-3mg/kg). Evening: 200mg theanine alone. Caffeine cycling: 5:2 weekday/weekend, 3-7 day taper deload every 6-8 weeks - bridge with theanine-only on off days.',
        timing: 'Pre-session stack 45-60 min before training. Evening theanine-alone 30-60 min pre-bed (short 1hr half-life = no lingering grogginess).',
        notes: 'CYP1A2 / ADORA2A genotyping is optional for performance clients wanting to fine-tune caffeine dose/timing - useful, not essential; phenotype (client\'s own reaction) is the practical guide. Full stack for performance days + evening sleep-onset support. Best fit for perimenopausal "wired anxiety" clients who need day-time cognitive stack AND evening theanine-alone.',
        fits_client_profile: 'Performance clients (pre-training bodyweight-dosed caffeine). Shift workers and jet-lagged travellers. Perimenopausal "wired anxiety" clients needing day-time stack + evening theanine-alone. Anyone wanting the full protocol with cycling.',
      },
    },
  },
  {
    slug: 'glycine',
    name: 'Glycine',
    category: 'sleep_recovery',
    short_description: 'The strongest benign, non-sedative sleep-onset tool available OTC. 3g pre-bed shortens sleep-onset latency and improves morning freshness via core body temperature drop (thermoregulatory, not sedative). Also a collagen and glutathione substrate at higher daytime doses.',
    what_it_does: 'Glycine is both an inhibitory neurotransmitter (via glycine receptors) and an obligatory NMDA co-agonist. The sleep effect is mediated by NMDA receptors in the suprachiasmatic nucleus - driving peripheral vasodilation, heat loss, and core temperature drop, which is the same physiological cue that normally initiates sleep. NOT melatonin-mediated (does not shift circadian phase). At higher daytime doses (5-15g split), acts as a substrate for collagen (glycine is ~1/3 of collagen), glutathione synthesis (glycine + NAC + cysteine), and methylation pool support. The 3g sleep dose and the higher metabolic doses are separate use cases with separate evidence bases.',
    contraindications: [
      'On clozapine or other atypical antipsychotics - glycine may REDUCE antipsychotic efficacy. Refer to prescriber before use',
      'Pregnancy / breastfeeding - safety not established, avoid unless cleared by treating clinician',
      'Kidney or liver disease at higher doses - defer to GP',
    ],
    safety_notes: 'Very benign profile. Main adverse effects are mild GI (nausea, soft stools, bloating), dose-related and uncommon at 3g. No sedation, no tolerance, no dependence, no morning grogginess. Not a controlled substance for tested athletes; standard practice is to use batch-tested HASTA or Informed Sport product where available. Very high single acute doses (0.8g/kg orally / ~50-60g) IMPAIR sensorimotor gating and cognition - do NOT recommend bulk single-dose experimentation. Above 3g provides no added sleep benefit and rising GI risk. AUST-L means "safe and correctly labelled" NOT "proven effective" - keep client-facing claims to permitted low-level indications ("supports sleep quality"), avoid disease claims.',
    coach_doctrine: 'The signature effect is FASTER, SMOOTHER onset and CLEANER morning - NOT more deep sleep or REM (PSG shows architecture largely unchanged; latency to slow-wave sleep is shortened but total time in SWS/REM is not meaningfully altered). Frame it as "faster onset and cleaner morning," not "more deep sleep." 3g is the validated dose AND the practical ceiling for sleep - every positive RCT used 3g. Mechanism is thermoregulatory (core temp drop via SCN NMDA), not GABAergic/sedative - which is exactly why it suits the "wired-tired, brain won\'t switch off" presentation better than a sedating agent. Also NOT melatonin-mediated - it will not shift circadian phase, so pair with light timing for true jet lag or shift-work circadian shifts. Anxiolytic and cognitive benefits are DOWNSTREAM of sleep, not standalone (no dedicated anxiety RCTs in non-psychiatric populations; cognitive gains are sleep-mediated). Metabolic/longevity claims run on 15g/day in diseased populations OR on GlyNAC (glycine + N-acetylcysteine), NOT on the 3g sleep dose in healthy people - do not let the sleep dose borrow the longevity headline. Collagen substrate rationale is mechanistically strong (Melendez-Hevia deficit modelling: ~10g/day shortfall for many adults) but has no outcome RCTs at supplementation doses. Frame Elite tier substrate benefits as "substrate insurance in likely-deficient people" not demonstrated outcomes. Magnesium glycinate is NOT a substitute for 3g pure glycine - a typical 250mg elemental Mg dose from bisglycinate delivers only ~1.5g glycine (half the sleep-effective dose). Evidence base for sleep is small and largely from one manufacturer-linked research group (Ajinomoto: Yamadera, Inagawa, Bannai, Kawai) - real and consistent, but not a large multi-site literature. Trial nightly for 1-2 weeks; often works from night 1.',
    research_reference: '~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/2026-07-22_Glycine_Sleep_Onset_and_Substrate_Support.md',
    tiers: {
      essential: {
        label: 'Essential',
        form: 'Pure glycine powder (food-grade, mildly sweet, mixes into water). Any reputable AUST-L product.',
        dose: '3g single serve',
        timing: '30-60 minutes before bed',
        notes: 'The validated sleep protocol - every positive RCT used this exact protocol. Trial nightly for 1-2 weeks and judge on sleep onset + morning freshness. Often works from night 1. No sedation, no tolerance, no hangover. NOT a substitute for magnesium glycinate for magnesium purposes (they solve different problems).',
        fits_client_profile: 'First-line sleep-onset support across all cohorts. Especially the wired-anxiety perimenopausal presentation where the mechanism (core-temp drop) matches the "can\'t switch off" problem better than a sedating agent.',
      },
      enhanced: {
        label: 'Enhanced',
        form: 'Pure glycine powder + magnesium bisglycinate capsules',
        dose: 'Glycine 3-5g pre-bed + magnesium bisglycinate 200-300mg elemental',
        timing: 'Both 30-60 minutes before bed',
        notes: 'Two mechanisms working together (glycine = thermoregulatory onset; magnesium = broader sleep + relaxation, with its own modest RCT support). Magnesium bisglycinate contributes a bonus glycine trickle but is NOT a substitute for the 3g glycine dose. Both substances already exist in the library - Enhanced tier formalises the pairing recommendation.',
        fits_client_profile: 'Wired-anxiety onset that does not fully resolve on glycine alone. Clients likely low in magnesium (most perimenopausal and older adults). The primary Body Recode cohort default when Essential tier is insufficient.',
      },
      elite: {
        label: 'Elite',
        form: 'Pure glycine powder used both pre-bed AND split with meals during the day. Pair the daytime serves with vitamin C (~40-50mg) as a collagen-synthesis cofactor. Optional serine or B-vitamins/folate at the high end to protect the one-carbon methylation pool.',
        dose: '3g pre-bed for sleep + 5-10g total split across meals during the day (substrate)',
        timing: 'Pre-bed for sleep, split AM+midday+PM for substrate',
        notes: 'Substrate benefits are mechanistically strong (Melendez-Hevia collagen deficit modelling suggests ~10g/day shortfall for many adults) but NOT RCT-proven at these doses. Frame honestly as "substrate insurance in likely-deficient people," not demonstrated outcomes. Pairs naturally with the Whey Protein Elite tier collagen slot - glycine is the primary amino in collagen. High-dose glycine can potentially deplete the one-carbon methylation pool via serine-hydroxymethyltransferase, hence the optional serine / B-vitamin co-supply at the top end.',
        fits_client_profile: 'Older adults, low-collagen diets (low meat-on-bone / skin / gelatine intake), hard-training performance clients wanting recovery + connective-tissue + antioxidant substrate, TRT men optimising, anyone wanting the full sleep + substrate protocol.',
      },
    },
  },
  {
    slug: 'tart-cherry',
    name: 'Tart Cherry (Montmorency)',
    category: 'sleep_recovery',
    short_description: 'Whole-food polyphenol with a real but modest evidence base. Strongest signal is post-exercise recovery of strength and power (via anthocyanins blunting CRP and IL-6). Secondary signal is sleep - objective sleep time and efficiency improve more reliably than how people feel they slept. Not a dose-equivalent replacement for supplemental melatonin.',
    what_it_does: 'Anthocyanin-rich (cyanidin glycosides) polyphenol with three converging mechanisms: (1) modest genuine melatonin content plus procyanidin B-2 that may raise tryptophan bioavailability for endogenous melatonin/serotonin synthesis, (2) anthocyanins reducing exercise-induced CRP, IL-6 and oxidative stress (blunts the inflammatory response that impairs strength recovery between hard sessions), (3) plausible xanthine oxidase inhibition (rate-limiting enzyme in uric acid synthesis) - the mechanism behind the observational gout attack-frequency signal. Effects are cultivar-, form- and dose-dependent: Montmorency skews toward melatonin plus total phenolics (sleep story), Balaton toward anthocyanins (theoretically recovery/gout) - but overwhelmingly the RCT evidence base is Montmorency, so that is the default.',
    contraindications: [
      'Chronic kidney disease - AVOID concentrates (case reports of acute kidney injury; concentrated fruit carries a potassium load with hyperkalaemia risk). Hardest single caution',
      'On warfarin, DOACs, or antiplatelets - theoretical interaction (quercetin, salicylate content). Refer prescriber before initiating high-dose concentrate; keep intake consistent',
      'Poorly controlled diabetes on glucose-lowering therapy - route to capsule form (concentrate/juice carry meaningful sugar/fructose load)',
      'IBS or FODMAP-sensitive - concentrate contains sorbitol, can cause GI upset. Capsule form avoids this',
      'Pregnancy / breastfeeding - safety data thin, refer',
      'Cherry / birch pollen allergy (oral allergy syndrome)',
    ],
    safety_notes: 'Overall well tolerated - randomised trials typically do not report adverse effects at recommended doses. No established anthocyanin upper limit and no significant adverse events at typical supplement doses. Kidney-stone risk: cherries are naturally low in oxalate so calcium-oxalate stone risk is minimal (uric-acid stones may actually benefit via urate lowering); the bigger stone-adjacent issue is the CKD/potassium concern above. AUST-L / food-supplement in Australia - client-facing claims must be kept to permitted low-level indications (supports sleep quality, supports recovery from exercise), avoid disease claims. Refer gout, CKD, anticoagulation, and diabetes-medication questions to GP/pharmacist.',
    coach_doctrine: 'Modest, not magic. Rank the claims honestly by evidence strength: exercise recovery (strongest, meta-analytic across MVC + CRP + IL-6) > sleep (moderate, objective better than subjective) > gout attack prevention (moderate observational signal, weaker RCT for serum urate lowering) > joint / anti-inflammatory in older women (Kuehl 2012, directly relevant to the perimenopausal cohort) > cardiovascular (weak-to-modest, conditional on older age + elevated baseline + at least 12 weeks) > cognitive (preliminary; strongest in one Australian dementia RCT). Cultivar matters: default Montmorency across all tiers - it is the cultivar essentially every published RCT used, has 6x the melatonin and 33% higher total phenolics vs Balaton; Balaton has 6x more anthocyanins but no direct trial support. Product quality is the number-one client-facing failure mode - reject generic "1500mg tart cherry" capsules that do not declare anthocyanin content or a named standardised raw material. Total mg is meaningless without standardisation. Sleep is NOT a dose-equivalent swap for supplemental melatonin (13.46 ng/g melatonin in Montmorency fruit is orders of magnitude below OTC melatonin mg doses); position it as a food-based, gentle, non-hormonal option for clients who dislike synthetic melatonin, not as an equivalent replacement. For recovery, the reliable win is maintaining and restoring strength and power between hard sessions plus CRP/IL-6 reduction, most valuable for back-to-back training days and heavy eccentric loading - treat DOMS reduction as a bonus, not the headline. Effective anthocyanin dose window sits around 250-350mg/day for recovery. Trial for 2-4 weeks (sleep) or across one training block (recovery); if no subjective or objective change, check anthocyanin content and product quality before abandoning the compound. Best-fit BR cohort is perimenopausal women 40s-50s with the sleep + joint-pain + inflammatory drift cluster (mirrors the Kuehl population directly).',
    research_reference: '~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/2026-07-22_Tart_Cherry_Sleep_Recovery_Anti_Inflammatory.md',
    tiers: {
      essential: {
        label: 'Essential',
        form: 'Montmorency tart cherry concentrate (single-strength or 5:1 concentrate that states Montmorency on the label). Diluted in water.',
        dose: '30 mL concentrate (delivers approximately 60mg anthocyanins per serve)',
        timing: '30-60 minutes before bed (single evening serve)',
        notes: 'Matches the concentrate format with the strongest sleep and recovery RCT evidence (Howatson 2012, Stretton 2023). Cheapest option that actually reproduces the trial protocol. Sugar load is the main drawback - not first-line for poorly controlled diabetes; route those to the Enhanced capsule tier instead. Trial for 2-4 weeks.',
        fits_client_profile: 'Clients whose primary complaint is sleep and wind-down. Anyone wanting a food-first trial before capsules. Perimenopausal wired-tired presentation who wants a gentle non-hormonal alternative to synthetic melatonin.',
      },
      enhanced: {
        label: 'Enhanced',
        form: 'Standardised freeze-dried Montmorency capsule (CherryPURE-type or equivalent). Product MUST state anthocyanin content or a named standardised raw material - reject generic high-mg/low-anthocyanin capsules.',
        dose: '480-500mg twice daily (targets 250-350mg anthocyanins/day recovery window)',
        timing: 'Evening (sleep) plus morning (recovery)',
        notes: 'Twice-daily capsule hits the effective recovery anthocyanin dose window with negligible sugar - suits metabolic and perimenopausal clients. Evening dose retains sleep support. Directly matches the Kuehl 2012 population (40-70yo women with inflammatory osteoarthritis - twice-daily tart cherry juice reduced inflammation markers, especially in those with the highest baseline inflammation).',
        fits_client_profile: 'Training clients needing between-session strength and power recovery. Perimenopausal women with the sleep + joint-pain + inflammatory drift cluster (core Body Recode cohort). Sugar-sensitive or diabetic clients who cannot use the concentrate.',
      },
      elite: {
        label: 'Elite',
        form: 'Montmorency concentrate (evening) PLUS standardised freeze-dried Montmorency capsule (mid-day). Periodised, not year-round.',
        dose: '30 mL concentrate pre-bed (sleep) + 480mg standardised capsule mid-day (anti-inflammatory)',
        timing: 'Layered during hard training blocks or acute recovery periods. Load 4-5 days before a hard event, continue 2-3 days post. Step down to Essential (evening-only concentrate) in maintenance phases',
        notes: 'Separates the two jobs - concentrate melatonin/phenolic profile pre-bed for sleep, capsule clean anthocyanin dose for daytime inflammatory load. Combined sugar (concentrate) plus cost mean this is a peak-block protocol, not year-round default. Drop to Essential or Enhanced out of peak blocks.',
        fits_client_profile: 'Competitive athletes, congested training/competition schedules, clients in acute flare or recovery windows (heavy eccentric block, tournament weekend, stage event).',
      },
    },
  },
  {
    slug: 'zinc',
    name: 'Zinc (Bisglycinate)',
    category: 'sleep_recovery',
    short_description: 'Deficiency-correction mineral, NOT a broad enhancer. Real signals in immunity (high-dose lozenges only), thyroid (fT3 support in hypothyroid women), testosterone (deficient/subfertile men only, NOT healthy or TRT), mood (adjunct to antidepressants, strongest >=40yo), acne, and glucose (T2D/prediabetes). Default form is zinc bisglycinate at 15mg elemental for the depleted-leaning BR cohort. Copper co-supplementation becomes mandatory above 25-30mg/day.',
    what_it_does: 'Zinc is an essential trace mineral required by more than 300 enzymes. In the coaching-relevant systems: (1) immune - ionic zinc in the oropharynx (from high-dose acetate/gluconate lozenges, NOT swallowed capsules) modestly shortens common-cold duration; systemic supplementation reduces infection incidence in older adults. (2) Thyroid - required for deiodinase enzymes that convert T4 to active T3, for TSH synthesis, and for thyroid-hormone-receptor zinc-finger binding. (3) Testosterone - deficiency lowers T and repletion raises it; NULL effect in zinc-replete men. (4) Skin/acne - deficient acne patients have lower serum zinc than controls; correction reduces inflammatory papule counts. (5) Glucose - reduces fasting glucose, HbA1c and HOMA-IR in T2D (BJN 2022 MR-supported). (6) Mood - adjunct to antidepressants (SMD -0.36; -0.61 in >=40yo). All effects are strongest where deficiency exists; healthy replete people see little.',
    contraindications: [
      'NEVER intranasal - imported zinc cold sprays/gels cause permanent anosmia (FDA 2009 Zicam withdrawal). Oral and dissolve-in-mouth lozenges are safe',
      'Long-term PPI use - reduces zinc absorption and depletes stores. Screen zinc status, do not just blanket-supplement without addressing the PPI',
      'On levothyroxine - separate zinc dose from thyroxine by ~4 hours (thyroxine fasted first thing, zinc with evening meal)',
      'On tetracyclines or fluoroquinolones (doxycycline, ciprofloxacin) - bidirectional chelation reduces both drug and zinc absorption. Separate by >=2 hours or pause zinc during the course',
      'On thiazide/loop diuretics or ACE inhibitors long-term - increased urinary zinc loss / reduced cellular zinc over months; consider status',
      'Any unexplained anaemia, neutropenia, sensory ataxia, or spastic gait while on chronic zinc - refer IMMEDIATELY for copper + ceruloplasmin bloods (zinc-induced copper deficiency mimics B12 deficiency, MDS, and paraneoplastic syndrome, and neurological damage can be partially irreversible)',
    ],
    safety_notes: 'AU NHMRC Upper Level of Intake = 40mg/day elemental zinc for adults - treat as the routine chronic ceiling. Nausea is the dose-limiting acute side effect (dose- and form-dependent; sulphate and oxide are astringent/irritant, bisglycinate is the gentlest with food; 50-150mg/day causes GI distress, more than 200mg/day causes vomiting). ALWAYS dose by ELEMENTAL zinc, not label weight - a "50mg zinc bisglycinate" and a "50mg zinc sulphate" capsule deliver very different actual zinc. TGA-listed AU products declare elemental; insist on that. Zinc bisglycinate is ~25% elemental (NOT ~14% - that is the magnesium bisglycinate figure). Fasted dosing maximises fractional absorption but is the main nausea trigger; with food wins for the BR audience. AUST-L means "safe and correctly labelled" not "proven effective" - keep client-facing claims to permitted low-level indications (supports immune function, supports thyroid function). Never intranasal. Refer clients on levothyroxine, PPIs, antihypertensives, or with unexplained anaemia/neurological symptoms to their GP or pharmacist.',
    coach_doctrine: 'Zinc is a DEFICIENCY-CORRECTION supplement not a broad enhancer. Almost every endpoint with a real signal (testosterone, thyroid, mood, glucose, immunity, acne, hair) shows benefit ONLY in people who are deficient or have the relevant condition and little-to-nothing in already-replete healthy people. Position it that way with clients - "fixes a deficiency-driven problem, does not upgrade normal function." Populations most likely to actually benefit from screening/supplementation: vegetarians/vegans (plant zinc is poorly bioavailable, phytate binds it, requirement may be ~50% higher; overlaps heavily with BR female audience), older adults (more than half of over-70s have inadequate intake in NHANES), long-term PPI users (acid suppression collapses zinc absorption), heavy sweaters/athletes on high training loads in QLD climate (loss replacement not ergogenic), menstruating women (recognised zinc-loss route), alcohol use disorder, post-bariatric (absorption reduced more than 50%), GI malabsorption (IBD/coeliac). Cold LOZENGES are a different intervention to swallowed capsules - dissolve-in-mouth acetate/gluconate more than 75mg/day shortens colds ~33% via ionic zinc in the oropharynx, started within 24h of symptoms. Swallowed capsules do NOT reproduce this. Testosterone marketing is oversold - zinc raises T only where deficiency constrains it; ZMA trial in replete healthy men found NO effect. For TRT clients (e.g. Luke), zinc will NOT add to exogenous testosterone; legitimate uses are deficiency insurance, fertility/seminal parameters, and sweat-loss replacement, NOT a T-booster stacked on TRT. Thyroid RCT base is small and often combined with selenium; reasonable to correct a documented/likely deficiency in a subclinical-hypothyroid client, NOT a substitute for levothyroxine or iodine/selenium assessment. Bisglycinate is the sensible default form (best-quality single-form trial, chelate protects against phytate, best GI tolerance) but the absorption gap over citrate/gluconate is small - do not oversell form. Copper is the defining chronic risk - post-COVID case series document zinc-mega-dosing myeloneuropathy that can be partially IRREVERSIBLE. Any chronic dose >=25-30mg/day MUST carry copper (1-2mg bisglycinate per ~15mg zinc above baseline; target ~15:1 zinc:copper ratio). Refer clients on levothyroxine, PPIs, antihypertensives or with unexplained anaemia/neuropathy.',
    research_reference: '~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/2026-07-22_Zinc_Bisglycinate_Immune_Testosterone_Thyroid.md',
    tiers: {
      essential: {
        label: 'Essential',
        form: 'Zinc bisglycinate (any reputable TGA-listed AU product that declares ELEMENTAL zinc on the label)',
        dose: '15mg elemental zinc daily',
        timing: 'With the evening meal, away from calcium and iron supplements',
        notes: 'General maintenance / insurance dose. Sits well under the 40mg AU UL. No copper co-supplementation needed at this dose for most people. Fine long-term. Dose by ELEMENTAL zinc not label weight - insist on products that state it. If client is on levothyroxine, separate by ~4 hours (thyroxine fasted first thing, zinc with evening meal).',
        fits_client_profile: 'Default OTC zinc for the depleted-leaning BR cohort - vegetarian-leaning perimenopausal women 40s-50s, menstruating women, light-training clients, mixed-diet clients wanting insurance against a common shortfall.',
      },
      enhanced: {
        label: 'Enhanced',
        form: 'Zinc bisglycinate PLUS copper bisglycinate. Copper is MANDATORY at this tier - non-negotiable.',
        dose: '22-30mg elemental zinc daily + 1-2mg elemental copper (bisglycinate)',
        timing: 'Both with the evening meal, spaced from iron/calcium/magnesium and ~4 hours from levothyroxine. If on tetracyclines or fluoroquinolones, separate >=2 hours or pause zinc during the course',
        notes: 'For documented or likely deficiency, long-term PPI users, post-bariatric clients, heavy-training or heavy-sweat clients, acne or subclinical-hypothyroid support, older adults with reduced absorption. Copper co-supplementation is mandatory because chronic zinc >=25-30mg/day reliably depletes copper (case series of anaemia, neutropenia and partially-irreversible myeloneuropathy from post-COVID zinc mega-dosing). Rule: ~1-2mg copper per ~15mg zinc above baseline. Keep total chronic zinc <=40mg/day (AU UL).',
        fits_client_profile: 'Clients with a real reason to push above 15mg - documented low serum zinc, PPI-user gastroparesis, post-bariatric malabsorption, high sweat losses, acne adjunct, thyroid support (with GP oversight).',
      },
      elite: {
        label: 'Elite',
        form: 'Blood-test-guided zinc bisglycinate + copper bisglycinate + optional acute lozenges for cold episodes. Prescribed to status.',
        dose: 'Titrated to baseline serum (preferably RBC) zinc + serum copper + ceruloplasmin. Copper co-supplemented at ~15:1 zinc:copper. Re-test at 8-12 weeks. Any short-term dose above 40mg/day is time-limited, copper-covered and monitored',
        timing: 'As Enhanced. If using acute cold lozenges: dissolve-in-mouth acetate or gluconate >75mg/day, started within 24 hours of symptoms, continued through the cold - NOT swallowed capsules',
        notes: 'RBC zinc is a more stable read than serum (serum swings with time-of-day, meals, inflammation, stress). Use bloods to rule the intervention IN or OUT rather than assume. For TRT clients (Luke framing): TRT means exogenous testosterone sets serum T; zinc will NOT add to it. Legitimate use is deficiency insurance, fertility/seminal parameters if relevant, and sweat-loss replacement - NOT a T-booster stacked on TRT.',
        fits_client_profile: 'TRT men wanting to know if zinc actually fits their protocol, athletes with high sweat losses on very high training loads, subclinical-hypothyroid clients considering a support trial with GP oversight, anyone contemplating a short-term dose above the AU 40mg UL (e.g. an acute lozenge protocol during infection).',
      },
    },
  },
  {
    slug: 'iron',
    name: 'Iron (Ferrous Bisglycinate)',
    category: 'womens_specific',
    short_description: 'The ONLY supplement in the library where both under- AND over-supplementation cause genuine harm. Test-first doctrine (ferritin +/- TSAT/CRP). Bisglycinate is the tolerability-driven default form (~64% fewer GI side effects vs iron salts at equal efficacy in pregnancy meta-analysis). Primary indication is menstruating women, especially with HMB - the biggest under-served deficiency in the BR cohort. Perimenopause reverses direction - the same routine that helped at 40 can harm at 52.',
    what_it_does: 'Iron is required for haemoglobin (oxygen carrying), myoglobin (muscle oxygen), cytochromes (mitochondrial ATP production), thyroid peroxidase (T4 synthesis), and dopamine/serotonin synthesis (mood, cognition, restless legs). The body has NO regulated excretion pathway - homeostasis is controlled entirely at the point of ABSORPTION (via the hormone hepcidin). Once iron is in, the body cannot readily get rid of it. This single fact drives the whole doctrine. Ferrous bisglycinate is Fe2+ chelated to two glycine molecules; absorbed intact via peptide transporters plus the standard DMT-1 pathway, resisting dietary inhibitors (phytate, polyphenols, calcium) that hobble regular iron salts. Deficiency (with or without anaemia) is the most common nutritional deficiency worldwide, disproportionately affecting menstruating women (~25-40mg iron lost per typical period; HMB affects 25-53% of women and can push losses past 40mg/cycle). Repletion of documented deficiency restores energy, cognition, mood, exercise capacity, thermoregulation, and (in RLS) sleep. Repletion of a replete person causes oxidative harm via non-transferrin-bound iron.',
    contraindications: [
      'Undiagnosed or suspected haemochromatosis - family history, unexplained high ferritin (>200 ug/L women / >300 ug/L men) or TSAT >45%. REFER, do not supplement. Supplementing an undiagnosed iron-loader accelerates end-organ damage',
      'Young children in the home without safe storage - iron overdose is a leading cause of paediatric poisoning death (~20mg/kg symptomatic, ~60mg/kg severe, >250mg/kg potentially lethal, deceptive 6-24h latent phase). AU Poisons Info 13 11 26. Child-resistant packaging + high storage is mandatory',
      'Pregnancy / postpartum - always GP or midwife led (bisglycinate has best tolerability data per Fischer 2023, but clinician-supervised)',
      'Post-bariatric surgery (sleeve, RYGB) - reduced gastric acid + bypassed duodenum makes oral often insufficient; usually needs IV via GP',
      'Coeliac or IBD - ferritin unreliable when inflamed, needs CRP/TSAT context, GP-led (also often needs IV)',
      'On levothyroxine - iron binds thyroxine, separate by at least 4 hours. Getting this wrong can under-treat hypothyroidism',
      'On long-term PPIs / H2 blockers / antacids - reduce absorption of ferrous salts by up to ~40%; may need iron polymaltose or IV via GP',
      'On fluoroquinolones or tetracyclines - iron chelates them and reduces antibiotic efficacy; separate by ~2 hours',
      'Iron-replete client without a repeat ferritin - do NOT extend repletion or insurance dosing on autopilot, especially through perimenopause',
    ],
    safety_notes: 'AU tolerable upper level = 45mg/day elemental iron from all sources (set on GI distress). NHMRC RDA is 18mg (menstruating women), 8mg (men and postmenopausal women), 27mg (pregnancy), with vegetarians needing ~1.8x more. AU scheduling: low-dose iron (<=~24mg elemental per dose unit) is unscheduled AUST-L for general retail (the insurance space); therapeutic-dose oral iron (~60-105mg elemental) is Schedule 2 Pharmacy Medicine (OTC but only from a pharmacist - Ferro-Grad C, Maltofer); IV iron (Ferinject, Monofer) is prescription-only. AU labels declare ELEMENTAL iron - read that figure, not the salt weight. Mandatory child-poisoning warning on iron packs is not decorative. ALWAYS dose by elemental iron. GI adverse events are dose-limiting for ferrous salts (~35% affected on sulfate); bisglycinate has ~64% fewer GI AEs at equal efficacy (Fischer 2023 pregnancy meta-analysis, though ferritin advantage was not statistically significant - honest framing is "equal efficacy, better tolerated, therefore better adherence"). ONE dose per day maximum, never split (splitting raises hepcidin more, does not improve absorption per Stoffel 2017). Iron polymaltose (Maltofer) is the other well-tolerated AU pharmacy option for people who cannot tolerate any ferrous salt. Liposomal iron: excellent tolerance but do NOT assume equivalent repletion (tolerability does not equal efficacy in head-to-head trials). Non-transferrin-bound iron is a redox-active pro-oxidant driving lipid peroxidation - "more iron" is never "better iron"; the therapeutic window is real. Repletion takes 3-6 months; re-check ferritin at 8-12 weeks and stop/reassess if not rising.',
    coach_doctrine: 'Test before you replete. Ferritin decisions follow the marker, not the symptom - fatigue, hair shedding, heavy legs are non-specific. Two dose worlds: nutritional INSURANCE (18-25mg, RDA-level, low-risk, defensible for demonstrably high-risk clients who cannot get bloods) vs REPLETION (30-100mg, clinical intervention, requires a ferritin result and ideally a reason for the deficiency). NO SINGLE "normal" ferritin - a value of 35 ug/L is "fine" asymptomatic, "borderline" fatigued, "suboptimal" endurance athlete, "treat" for RLS. Thresholds by indication: asymptomatic menstruating woman <15-30 ug/L; fatigued non-anaemic woman <=50 ug/L (Verdon 2003, Vaucher 2012 - benefit only at this range); endurance athlete <30 = deplete, aim >=50 before altitude (Peeling framework, AIS practice); RLS <=75 ug/L or TSAT <20% (AASM 2024 CPG - much higher threshold, reflects BRAIN iron need); hair loss <30-40 ug/L (association real, causation disputed, not RCT-confirmed - iron only helps if genuinely deficient). Perimenopause REVERSES direction across the transition - early/mid perimenopause is a HIGH-DEFICIENCY window (HMB drives losses up exactly when women assume they need less iron); late perimenopause to postmenopause is an ACCUMULATION window (ferritin rises 2-3x per Sci Rep 2025, RDA falls from 18 to 8mg, falling oestrogen raises hepcidin). Re-test at the transition; step down deliberately; re-home the iron-containing multivitamin. Alternate-day dosing is a legitimate option (Stoffel 2017/2020 hepcidin insight) but NOT automatically superior (Stoffel/Zimmermann 2023 showed daily reaches higher ferritin at matched total iron); use alternate-day for tolerance/maintenance/athletes-timing-around-training, use daily for speed of repletion. Athletes: exercise triggers hepcidin surge peaking 3-6h post-session; take iron in the morning or shortly after morning training, avoid the 3-6h post-hard-session window. Household screening = client + kids - say the Poisons Info 13 11 26 number out loud. Bisglycinate is "equal efficacy, better tolerated" not "magically more potent" - the real lever is doses that people actually take. IDNA (iron deficiency without anaemia): fatigue benefit is REAL but modest and concentrated in ferritin <=50 with symptoms (Verdon/Vaucher); performance benefit real in ID athletes but do NOT promise podium gains in replete athletes. Refer whenever repletion is needed without recent ferritin, elevated ferritin/TSAT, family history of haemochromatosis, suspected anaemia, pregnancy, malabsorption, HMB (the cause of deficiency is a medical question), or non-response at 8-12 weeks.',
    research_reference: '~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/2026-07-23_Iron_Bisglycinate_Deficiency_Repletion.md',
    tiers: {
      essential: {
        label: 'Essential',
        form: 'Ferrous bisglycinate (any TGA-listed AU product declaring ELEMENTAL iron on the label). AUST-L unscheduled at this dose.',
        dose: '18-25mg elemental iron daily OR alternate-day',
        timing: 'One dose per day maximum, never split. With vitamin C ~100-200mg (potentiator). Separate ~2 hours from calcium, coffee, tea. 4 hours from levothyroxine. Morning or evening (consistency beats optimisation)',
        notes: 'The safe INSURANCE tier - stays at or near dietary-replacement (RDA) level within the AU unscheduled OTC range. Low harm ceiling, meaningful upside for the common deficiency case. This is nutritional insurance, NOT repletion. Encourage bloods as soon as feasible - insurance is a bridge, not a destination. Review at 8-12 weeks.',
        fits_client_profile: 'Likely-deficient women (menstruating, especially HMB; vegetarian; light-eating; time-poor) who genuinely cannot access bloods right now. Explicitly NOT for anyone who might be iron-replete, has a family history of haemochromatosis, or has young children in the home without safe storage.',
      },
      enhanced: {
        label: 'Enhanced',
        form: 'Ferrous bisglycinate at repletion dose. AUST-L at this dose range in AU.',
        dose: '30-50mg elemental iron, daily OR alternate-day (alternate-day if daily is symptom-limiting or for maintenance)',
        timing: 'One dose per day maximum, never split. With vitamin C ~100-200mg. 2h from calcium/coffee/tea. 4h from levothyroxine. Morning or evening consistently. For athletes: morning or shortly after morning training, avoid the 3-6h post-hard-session hepcidin window',
        notes: 'Ferritin-guided repletion for confirmed IDNA (iron deficiency without anaemia). Targets vary by indication: >=30 ug/L general, >=50 ug/L for fatigued or endurance athletes (aim >=50 before altitude), per AASM 2024 CPG if RLS. Re-check ferritin at 8-12 weeks; expect 3-6 months to replete; taper to maintenance or dietary once target reached. Alternate-day dosing raises fractional absorption per mg (Stoffel 2017/2020 hepcidin insight) but daily reaches higher ferritin faster at matched total iron (Stoffel/Zimmermann 2023) - match schedule to tolerance and urgency. Refer if no rise at 8-12 weeks, HMB, or any red flag.',
        fits_client_profile: 'Clients with a documented low ferritin, normal Hb, and no complicating flags. Menstruating women with confirmed IDNA, fatigued perimenopausal women with ferritin <=50, endurance athletes with ferritin <50 aiming for altitude, RLS clients with ferritin <=75.',
      },
      elite: {
        label: 'Elite',
        form: 'Individualised under GP or sports-physician oversight - may be ferrous bisglycinate 60-100mg elemental oral (AU Schedule 2, pharmacy-only OTC - Ferro-Grad C, Maltofer polymaltose), or IV iron (Ferinject / Monofer, prescription-only) where oral fails or speed is needed. Prescribed and monitored by the clinician; the S&ES coordinates adherence, timing, and training integration.',
        dose: 'Individualised. 60-100mg elemental oral daily or periodised, or IV iron per clinician',
        timing: 'Per clinician. For athletes: morning or pre-session (avoid 3-6h post-hard-session hepcidin window). Full iron panel (ferritin + TSAT + CRP +/- Hb) interpreted together',
        notes: 'The connective tissue between athlete and clinician - NEVER the prescriber. Full iron panel is essential (inflammation skews ferritin in athletes; CRP + TSAT context needed in IBD/coeliac). Repletion under supervision for anyone needing more than the OTC dose range or with complicating flags. IV is the pathway for malabsorption, intolerance, or rapid repletion.',
        fits_client_profile: 'Athletes chasing performance or altitude targets, post-blood-donation clients (each whole-blood donation removes 200-250mg iron), pregnancy/postpartum, malabsorption (bariatric, coeliac, IBD), any complex or ambiguous case, anyone contemplating >45mg/day short-term.',
      },
    },
  },
  {
    slug: 'b-complex',
    name: 'B-Complex (Methylfolate + B12 focus)',
    category: 'foundational',
    short_description: 'A TARGETED tool, not a default. Most middle-aged Australians on a mixed diet do NOT need a B-complex - bread/cereal is folate-fortified since 2009, and B1/B2/B3/B5/B6/B7 deficiency is uncommon in the general population. The two that genuinely matter for this audience are B12 and folate. B12 because absorption fails predictably with age, PPIs, metformin, and plant-based diets. Folate because of preconception/pregnancy and its interaction with B12 status. Standalone B12 (1,000 mcg oral) is the single highest-yield addition for this cohort.',
    what_it_does: 'Eight water-soluble vitamins acting as enzyme cofactors in energy metabolism, one-carbon (methylation) chemistry, and red-cell/nervous-system maintenance. In the coaching-relevant systems: (1) B12 (cobalamin) is required for myelin, red-cell production, and methionine synthase (recycling homocysteine to methionine); deficiency causes megaloblastic anaemia AND irreversible neurological damage if prolonged. (2) Folate (5-MTHF or folic acid) drives DNA synthesis, red-cell production, and neural-tube closure in early pregnancy. (3) B6 is a cofactor for neurotransmitter synthesis (serotonin, GABA, dopamine) - hence PMS/perimenopausal mood signal - but has a hard neuropathy ceiling. (4) B2 (riboflavin) at pharmacological dose (400 mg/day) has Level B evidence for migraine prophylaxis. (5) B3 (nicotinamide, NOT niacin/nicotinic acid) at 500 mg BID has a specific Australian NHMRC RCT (ONTRAC 2015) showing 23% reduction in non-melanoma skin cancer in immunocompetent high-risk sun-damaged clients. (6) B1 (thiamine, or benfotiamine at 5x bioavailability) matters in alcohol use disorder and bariatric/gastric bypass, and has modest diabetic-neuropathy evidence. B5 is a non-story (deficiency essentially never seen). Biotin is a lab-interference issue, not an intake issue.',
    contraindications: [
      'Chronic B6 above 50 mg/day - AU TGA rescheduling from 1 June 2027: >50 mg = Pharmacist Only (S3), >200 mg = Prescription Only (S4). ~250 AU adverse-event reports Jan 2023-Oct 2025 for peripheral neuropathy at doses as low as 25 mg/day. NO clearly safe threshold. P5P is NOT a safe-haven - counted as pyridoxine-equivalent. WATCH hidden B6 stacked across multiple products (multi + B-complex + PMS supplement = easy accidental 150-200 mg)',
      'Biotin before any thyroid, cardiac, hormone, or B12 blood test - falsely mimics Graves thyrotoxicosis (elevated free T4/T3, suppressed TSH); can mask myocardial infarction (falsely low troponin). Advise >=2 days washout (up to 1 week if high-dose)',
      'Folic acid without checking B12 status in at-risk clients (over 50, PPI users, metformin users, vegan) - high folate can correct the anaemia of B12 deficiency while irreversible neurological damage progresses silently. Check B12 first',
      'B6 + unmodified levodopa (Parkinson disease older regimens) - accelerates peripheral conversion, less levodopa reaches brain. Modern carbidopa/levodopa combinations largely mitigate',
      'Folate + phenytoin (epilepsy) - bidirectional interaction; folic acid can lower phenytoin levels and reduce seizure control. Neurologist involvement required',
      'High-dose folate + methotrexate in oncology - NEVER add without treating team. Oncology folate management is entirely different (folinic-acid rescue). In rheumatoid arthritis/psoriasis MTX regimens, folic acid is deliberately co-prescribed but at low dose under specialist',
      'Pregnancy folate dosing - always GP or obstetric led. RANZCOG: >=400 mcg (usually 500 mcg AU products) from >=1 month preconception through first 12 weeks; 5 mg/day for high-risk (previous NTD, diabetes, BMI >30, anticonvulsants, malabsorption)',
      'Niacin (nicotinic acid) at gram doses (lipid-lowering use) - hepatotoxicity risk and flushing. Nicotinamide (niacinamide) does NOT share this risk',
      'IM B12 - refer to GP; within Sport & Exercise Scientist scope only for oral or sublingual OTC forms',
    ],
    safety_notes: 'The B-complex is one of the safer supplement categories overall (water-soluble, largely excreted) with three specific exceptions that DO matter: (1) B6 neuropathy - the dominant safety issue in this category. Historically documented from ~200 mg/day but now flagged at doses as low as 25 mg/day with no clearly safe threshold (Health Canada 2024, TGA Australia). The AU rescheduling effective 1 June 2027 puts >50 mg/day into Pharmacist Only and >200 mg/day into Prescription Only. A classic "B-Complex 100" (100 mg B6) is squarely in the restricted band from June 2027. Keep chronic supplemental B6 <=50 mg/day and ideally near the RDI (1.3-1.7 mg) for routine maintenance. Reserve 50-80 mg only for defined short-term use (e.g. PMS cycles). Watch hidden B6 stacked across products. (2) Niacin (nicotinic acid) at gram doses causes hepatotoxicity and flushing. Nicotinamide is a different molecule and does NOT share this. (3) Biotin assay interference - not a toxicity but a diagnostic hazard. Hair/skin/nail products commonly contain 5-10 mg biotin (MS regimens use up to 300 mg). Interferes with biotin-streptavidin immunoassays: falsely HIGH free T4/T3 (mimics Graves); falsely LOW TSH, troponin, NT-proBNP, PTH, hCG. Always ask before any thyroid, cardiac, hormone, or B12 test; 2-day washout minimum. Australian regulatory: mandatory folic-acid fortification of bread-making wheat flour since Sept 2009 (2-3 mg/kg flour, ~0.135 mg per 100 g bread) means general population folate is high (>99% of women of reproductive age above NTD-protective threshold per FSANZ) - most people do NOT need supplemental folate outside pregnancy. AUST-L covers most OTC B-complex products; targeted single nutrients often more appropriate than reflexive high-dose complexes. Deficiency diagnosis, IM B12, pregnancy dosing, and prescription-only forms are GP/pharmacist decisions.',
    coach_doctrine: 'B-complex is a TARGETED tool, NOT a default. Most middle-aged Australians on a mixed diet do NOT need one - the reflex "B-vitamins for energy" positioning is only true where a real deficiency exists; in replete people, B-vitamins are NOT an energy or performance enhancer. The two that matter for this audience are B12 and folate. B12 is the single highest-yield nutrient in the category - concentrates sharply in identifiable groups: vegetarians/vegans (~30-40%+ deficiency, near-guaranteed), adults >50 (gastric acid and intrinsic factor decline), long-term PPI users, long-term metformin users (dose- and duration-dependent, highest >=1,500 mg/day and >=3-10 yrs), the metformin + PPI combo (additive), post-bariatric (~30%). Standalone oral B12 1,000 mcg/day (methyl- or cyanocobalamin) is comparable to IM for most repletion (Cochrane 2005, Butler 2006, Frontiers 2025) - IM reserved for severe/neurological or confirmed pernicious anaemia. Methylation story is half-true - MTHFR C677T frequencies in AU-type populations are ~CC 40%, CT 47%, TT 13%. Heterozygotes (CT) are largely metabolically silent (one functional gene copy is enough). TT homozygotes (10-15%) have ~70% reduced enzyme activity; 5-MTHF is a reasonable choice for them BUT TT carriers actually showed GREATER homocysteine-lowering response to high-dose folic acid than CC carriers (PMC3274435). Methylated forms are a DEFENSIBLE DEFAULT (they work, bypass a conversion step, well tolerated) but NOT a proven upgrade for the general population. Methylcobalamin is NOT shown to beat cyanocobalamin (Obeid et al PMC4692085). The entire NTD-prevention outcome evidence base uses folic acid - guidelines are written around it. B6 marketing must respect the hard ceiling - PMS/perimenopausal signal is real (meta-analysed) but time-limited cyclical use only, with total B6 across all products tallied. AU rescheduling June 2027 is real regulatory context - flag to any client using higher-dose B-complexes. Two Australian condition-specific niches worth remembering: riboflavin 400 mg/day for migraine prophylaxis (Schoenen 1998 NEJM, NNT 2.3, ~3-month onset, Level B AAN evidence); nicotinamide 500 mg BID for non-melanoma skin cancer chemoprevention in immunocompetent high-risk sun-damaged clients (ONTRAC 2015 Australian NHMRC trial, 23% reduction, benefit does NOT persist after stopping, did NOT replicate in transplant recipients). Both are GP/dermatologist-directed condition-specific tools, NOT blanket recommendations. Individual targeted nutrients (B12 for the vegan/older/PPI/metformin cohort; folate for preconception; riboflavin for migraine) serve the audience better than reflexive high-dose "everything" complexes - which is exactly where the B6 problem creeps in. Fatigue in a well-fed replete client is NOT a B-vitamin problem.',
    research_reference: '~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/2026-07-23_B_Complex_Methylfolate_B12_Focus.md',
    tiers: {
      essential: {
        label: 'Essential',
        form: 'Standard once-daily "B50-type" complex OR a good multivitamin. Standard forms are fine (folic acid, cyanocobalamin, pyridoxine HCl). AUST-L.',
        dose: 'Single once-daily serve. Keep total B6 <=10-50 mg across ALL products including multis',
        timing: 'Morning with food (mildly stimulating for some - avoid at night)',
        notes: 'Justified ONLY where dietary intake is genuinely inadequate (restrictive eating, very high training load with poor diet, chronic high stress, disordered/erratic eating patterns). Most BR clients on a mixed AU diet do NOT need this. DO NOT reach for "B-Complex 100" - the extra dose buys nothing and puts B6 into the restricted/neuropathy zone from June 2027. Standard cyanocobalamin and folic acid are fine for most people at these doses.',
        fits_client_profile: 'Clients with genuinely inadequate diet, restrictive eaters, high-stress or high-training-load clients whose diet has visibly slipped. NOT a default recommendation for the wider client base.',
      },
      enhanced: {
        label: 'Enhanced',
        form: 'Three parallel single-nutrient interventions, chosen by client profile - not a one-size product: (a) STANDALONE B12 methylcobalamin OR cyanocobalamin 1,000 mcg oral/sublingual (the highest-yield addition), (b) methylated B-complex (5-MTHF 400-800 mcg + methyl- or hydroxo-B12 + low-dose P5P), (c) B6 for PMS 50-80 mg cyclically. AUST-L.',
        dose: 'Match to profile: B12 1,000 mcg/day; methylated B-complex per label; B6 for PMS 50-80 mg during luteal phase only',
        timing: 'Morning with food (B12 can be any time)',
        notes: 'The actual high-yield tier for this audience. STANDALONE B12 is the single highest-yield addition for vegans/vegetarians, PPI users, long-term metformin users, and adults over 50 with low-normal levels - Cochrane and Butler evidence: high-dose oral is comparable to IM for most repletion. Methylated B-complex is a sensible default for MTHFR TT variants (~10-15% of population), perimenopausal clients, malabsorbers, or those who tolerate methylated forms better - NOT proven superior. B6 for PMS: real meta-analysed benefit but neuropathy ceiling is real - explicitly explain the ceiling AND tally total B6 across all products.',
        fits_client_profile: 'Vegans and vegetarians (near-guaranteed B12 risk), long-term PPI users, long-term metformin users (especially the metformin + PPI combo), adults over 50 with low-normal B12, perimenopausal cluster, MTHFR TT variants, menstruating women with PMS.',
      },
      elite: {
        label: 'Elite',
        form: 'Individualised under GP oversight: baseline HoloTC and/or serum B12 + MMA (functional confirmation) + RBC folate + homocysteine, then targeted repletion. Adjacent condition-specific tools raise with GP/dermatologist: riboflavin 400 mg/day (migraine); nicotinamide 500 mg BID (skin-cancer chemoprevention).',
        dose: 'Individualised to test results. For skin-cancer chemoprevention: nicotinamide 500 mg twice daily (ONTRAC dose). For migraine prophylaxis: riboflavin 400 mg once daily (Schoenen dose, ~3-month onset)',
        timing: 'Per condition-specific protocol',
        notes: 'BIOTIN WASHOUT MANDATORY: stop biotin >=2 days before any thyroid, cardiac, hormone, or B12 test (up to 1 week if high-dose). Assay interference can falsely mimic Graves thyrotoxicosis and mask a heart attack (falsely low troponin). Refer for IM B12 if GP confirms severe/neurological deficiency or pernicious anaemia; otherwise high-dose oral is appropriate and evidence-backed. Recheck bloods at 8-12 weeks. Riboflavin migraine benefit and nicotinamide skin-cancer benefit are condition-specific, GP/dermatologist-directed - NOT blanket recommendations.',
        fits_client_profile: 'Fatigue or low-mood clients where B12/folate deficiency needs ruling in or out; at-risk populations wanting a test-first pathway (vegans on long-term B12, PPI/metformin combos, over-50s with symptoms); episodic migraine sufferers (via GP); high-risk sun-damaged clients with previous non-melanoma skin cancer (via dermatologist, immunocompetent only - did NOT replicate in transplant recipients).',
      },
    },
  },
  {
    slug: 'curcumin',
    name: 'Curcumin (Bioavailability-Enhanced)',
    category: 'longevity_inflammation',
    short_description: 'One of the better-evidenced anti-inflammatory nutraceuticals for joint pain and systemic low-grade inflammation - but ONLY in a bioavailability-enhanced form (plain turmeric powder is inert). Also the one item in the library with a genuine TGA-flagged idiosyncratic hepatotoxicity signal (Safety Advisory Aug 2023; mandatory AUST-L liver warning since March 2024). Rare but real-consequence agent. Needs more care than glycine/zinc/tart cherry.',
    what_it_does: 'Curcuminoids from Curcuma longa modulate multiple inflammatory pathways (NF-kB, COX-2, LOX, cytokine production), reducing systemic inflammation markers (CRP, IL-6, TNF-alpha). Best-evidenced endpoints: (1) OSTEOARTHRITIS - pain reduction and functional improvement comparable to NSAIDs with better GI/renal tolerability (Zhao 2024 network meta-analysis 23 RCTs, Zeng 2021 vs-NSAID indistinguishable, Wang 2021, Hsiao 2021). (2) Systemic inflammation - CRP reduced in 7/10 meta-analyses, IL-6 in 5/8, TNF-alpha in 6/9 across the umbrella (PMC9870680, PMC11174746). (3) Metabolic - fasting glucose reduced in 14/15 meta-analyses, HOMA-IR in 12/12 (the most consistent metabolic finding), HbA1c in 7/8. (4) NAFLD - lower ALT/AST, steatosis resolution 3.5-4x more likely than control. (5) Depression - adjunct signal only (500-1000 mg/day, small heterogeneous trials, cautious interpretation). Perimenopausal hot flashes: one 40-person pilot RCT positive but 12-RCT systematic review lukewarm. Anti-cancer: no OS/PFS benefit in the 7 hard-endpoint RCTs (Marcolin 2023); most preclinical results are PAINS assay artefacts (Nelson 2017). Native oral absorption of free curcuminoids <1% - enhanced forms (Meriva phytosome, Theracurmin colloidal submicron, Longvida solid-lipid particle, NovaSOL micellar, or piperine combos) are mandatory. "Total curcuminoids" is NOT the same as "free curcumin" - most enhancement raises inactive conjugated metabolites.',
    contraindications: [
      'Active or previous liver disease - TGA explicitly advises AVOID. Non-negotiable',
      'Anticoagulants or antiplatelets (warfarin, DOACs including apixaban/rivaroxaban, aspirin, clopidogrel) - theoretical but plausible potentiation of bleeding; refer prescriber; stop ~2 weeks before any procedure or surgery on medical advice',
      'Gallstones or biliary obstruction (cholelithiasis) - curcumin stimulates gallbladder contraction; risk of biliary colic or blockage. AVOID',
      'Pregnancy and breastfeeding - theoretical uterine-stimulant / hormonal effects + documented high-dose turmeric DILI case in pregnancy. Culinary amounts are not the concern; medicinal doses are',
      'Iron-deficient menstruating women - curcumin chelates iron and can worsen deficiency. Screen ferritin first (see Iron entry); dose-separate from iron-rich meals and iron supplements by several hours; re-check if fatigue develops',
      'On prescription medications processed by CYP3A4 or P-gp (some statins, certain immunosuppressants, some anticonvulsants) - piperine-containing products are a general polypharmacy hazard. Prefer piperine-free form and refer for pharmacist interaction check',
      'Alcohol use disorder or known NAFLD - higher-risk hepatic baseline; discuss baseline and 8-12 week LFTs with GP before starting',
      'Symptom red flags demanding IMMEDIATE STOP and medical review: unusual fatigue, nausea, right-upper-quadrant pain, dark urine, pale stools, jaundice (yellow skin or eyes), itch',
    ],
    safety_notes: 'Idiosyncratic drug-induced liver injury (DILI) is the signature risk. Halegoua-DeMarzio 2023 (US DILIN, 10 cases 2004-2022): typically hepatocellular; 80% women, 90% white; median ALT ~1140 U/L; latency 1-4 months; jaundice in 50%; one fatality. 7/10 carried HLA-B*35:01 (allele frequency 0.45 in cases vs 0.056-0.069 in controls - strong immunogenetic signal; ~5-7% of Europeans carry). Of products chemically tested, 3/7 also contained piperine - authors argue piperine plausibly potentiates toxicity by boosting bioavailability. In absolute terms this is RARE (DILIN roughly <1 case/year on a base of hundreds of thousands of users) - turmeric has centuries of dietary use. But when it occurs it can be severe or fatal, is NOT dose-predictable in the classic sense (idiosyncratic and immune-mediated), and risk rises with enhanced-bioavailability forms + higher doses + piperine + susceptible immunogenetic background. Highest-risk configuration: high-dose + enhanced + piperine, months, HLA-B*35:01 carrier. Lowest-risk: modest dose, piperine-free, short-to-moderate courses, no hepatic risk factors. TGA Safety Advisory August 2023 based on 18 adverse-event reports to 29 June 2023 (2 severe including 1 fatal); TGA explicitly stated risk MAY BE HIGHER with enhanced-absorption forms and higher doses. Mandatory liver-warning label required on affected AUST-L oral listed medicines since 1 March 2024 (Therapeutic Goods Permissible Ingredients Determination No. 1 2024) - wording strengthened from "rare" to "very rare" after consultation; ACCM judged liver-injury association "medium to strong." Culinary turmeric and excipient use excluded. AUST-L products are not evaluated by TGA for efficacy and may only carry low-level "health maintenance/support" indications (helps maintain healthy joints, supports healthy liver function) - CANNOT lawfully claim to treat OA, depression, NAFLD or cancer. Coach language must mirror this. Population-level curcumin LOWERS ALT/AST in NAFLD (modest metabolic effect) AND can idiosyncratically cause severe hepatocellular injury in susceptible individuals (rare host-dependent immune reaction) - both true. Ordering and interpreting LFTs sit with a GP, not S&ES scope; the coach action is red-flag teaching and referral. Other cautions: contamination (lead chromate adulteration in some turmeric supply) is a separate confounder in a subset of case reports.',
    coach_doctrine: 'Curcumin earns its place on the strength of its OA + systemic inflammation + metabolic evidence - a rare triple-overlap that fits the perimenopausal inflammatory-plus-metabolic-plus-mood cluster better than almost any single agent. But it is a RARE BUT REAL-CONSEQUENCE agent, not a benign one like glycine or tart cherry. Two rules make or break it in practice: (1) BIOAVAILABILITY-ENHANCED FORM IS MANDATORY - plain turmeric is inert as a supplement (<1% free curcuminoid absorption). (2) TGA-flagged idiosyncratic liver-injury risk that scales with dose + enhanced absorption + piperine. "Total curcuminoids" is NOT the same as "free curcumin" - most enhancement raises inactive conjugated glucuronide/sulfate metabolites; marketing obscures this. Enhancement strategy comparison for practical purposes: Meriva (phytosome/lecithin, deepest OA clinical base, Cuomo 2011), Theracurmin (colloidal submicron, best-reproduced independent PK at low dose, Sasaki 2011), Longvida (solid-lipid particle, strongest claim to delivering FREE curcumin and crossing membranes, choose specifically for mood/CNS work, Gota 2010) - genuine ties for practical purposes; all three are defensible. NovaSOL "wins" on headline number (185x total) but that is dominated by inactive conjugates and uses polysorbate surfactant - highest AUC does NOT equal best supplement. PIPERINE IS THE WEAKEST AND RISKIEST ENHANCER - the entire 20x "2000%" claim rests on Shoba 1998 (n=8, single-dose, industry-sponsored, never independently replicated); mechanism = UGT/SULT + CYP3A4 + P-gp inhibition = broad drug-interaction hazard + plausible hepatotoxicity potentiator; typical commercial products contain only ~5mg piperine (Shoba used 20mg) so effect is extrapolated even beyond the unreplicated finding. Prefer piperine-free by default. Effective dose plateaus at ~500-1000 mg curcuminoids/day for ALL endpoints (Hsiao 2021 high vs low dose ~ equal for pain relief). Chasing 2-3g of an enhanced form is unnecessary + more expensive + potentially counterproductive - more absorbed curcumin is precisely what the TGA flagged as higher-risk. READ DELIVERED DOSE not capsule weight: Meriva ~1000mg complex delivers ~100-200mg curcuminoids; Theracurmin ~180mg matches grams of native; Longvida ~400mg is typical clinical dose. WITH FAT ALWAYS - every lipid-matrix form depends on co-ingested dietary fat and bile-driven micelle/chylomicron transport. Best-fit BR cohort: perimenopausal cluster with inflammatory joint pain + metabolic drift. Curcumin vs Tart Cherry are COMPLEMENTARY not redundant - curcumin = established OA + metabolic/insulin axis; tart cherry = exercise recovery + sleep + gout-adjacent. Running both is defensible. If ANY hepatic risk, interacting meds, iron deficiency, gallstones, or pregnancy - TART CHERRY IS THE SAFER DEFAULT for the recovery/anti-inflammatory role. Never position as anti-cancer - no OS/PFS benefit in the 7 hard-endpoint RCTs (Marcolin 2023); curcumin is a PAINS/IMP compound so most preclinical anti-cancer results are likely assay artefacts; unlawful therapeutic claim on AUST-L in Australia. AUST-L language: support role only (helps maintain joint health, supports liver function) - never "treats." Highest-risk configuration to avoid: high-dose + enhanced + piperine + months + hepatic risk factors + polypharmacy. Cycled 8-12 week blocks with reassessment beats indefinite continuous dosing.',
    research_reference: '~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/2026-07-23_Curcumin_Joint_Inflammation_Hepatotoxicity.md',
    tiers: {
      essential: {
        label: 'Essential',
        form: 'Bioavailability-enhanced product - ideally a phytosome/lecithin (Meriva-type) or a piperine-free formulated curcumin. If cost forces a curcumin + piperine product, keep low-dose and screen hard for hepatic risk and interacting meds. AUST-L; plain turmeric powder is NOT acceptable (inert as a supplement).',
        dose: '~500-1000 mg curcuminoids-equivalent per day',
        timing: 'With a fat-containing meal (mandatory - absorption of all lipid-matrix forms depends on dietary fat and bile-driven micelle/chylomicron transport). Split AM + PM with meals, or single dose with the largest fatty meal for adherence',
        notes: 'Effective dose plateaus at ~500-1000 mg curcuminoids for ALL endpoints - no reason to chase 2-3g and more absorbed curcumin is exactly what the TGA flagged as higher hepatotoxicity risk. Read DELIVERED curcuminoid dose not capsule weight. Teach the liver red-flags and STOP RULE: unusual fatigue, nausea, RUQ pain, dark urine, pale stools, jaundice, itch - stop immediately and see a doctor. Screen for liver disease, alcohol use, anticoagulants, gallstones, pregnancy, and (for menstruating women) iron status BEFORE recommending.',
        fits_client_profile: 'OA joint pain and/or chronic low-grade inflammation in an OTHERWISE LOW-RISK client - no liver disease, no anticoagulants, no gallstones, not pregnant, iron-replete (for menstruating women), not on interacting prescription meds.',
      },
      enhanced: {
        label: 'Enhanced',
        form: 'Specific branded high-bioavailability raw material - Meriva (Indena phytosome, deepest OA/inflammation clinical base) OR Theracurmin (colloidal submicron, best-reproduced independent PK at low dose) OR Longvida (solid-lipid particle, choose specifically if targeting mood/CNS for its free-curcumin/membrane profile). PIPERINE-FREE BY PREFERENCE. AUST-L.',
        dose: 'Brand-specific delivered equivalent of ~500-1000 mg curcuminoids: Meriva ~1000 mg complex; Theracurmin ~180 mg; Longvida ~400 mg',
        timing: 'With fat, split AM + PM. Run a >=8-12 week trial before judging response',
        notes: 'At this tier we prefer branded raw materials with reproducible PK and clinical trial base. Meriva has the deepest OA clinical evidence; Theracurmin has the best-reproduced independent PK at a low label dose; Longvida is the choice specifically if targeting free-curcumin membrane penetration for mood/CNS work. Verify piperine-free (or explicitly low piperine) for any client on prescription medication. Structured symptom tracking (VAS/WOMAC-style for OA; hs-CRP if GP is monitoring inflammation). Same hard-flag screening as Essential.',
        fits_client_profile: 'Confirmed OA, established metabolic/inflammatory drift, perimenopausal cluster (inflammatory joint pain + metabolic drift + mood) wanting a cleaner formulation - with the same "otherwise low-risk" gate as Essential.',
      },
      elite: {
        label: 'Elite',
        form: 'Periodised protocol with GP monitoring: 8-12 week blocks of Meriva or Theracurmin or Longvida (piperine-free), with baseline + repeat LFTs and pharmacist drug-interaction screen. Cycle rather than run continuously.',
        dose: '~500-1000 mg curcuminoids-equivalent daily during blocks, deloaded between',
        timing: 'With fat, split AM + PM. 8-12 week blocks with reassessment and deload between (no evidence continuous lifelong dosing outperforms cycled use; cycling limits cumulative idiosyncratic exposure)',
        notes: 'Advise client to arrange BASELINE and ~8-12 week REPEAT LFTs via their GP - especially for higher-dose, enhanced, or piperine products and any hepatic risk factor. Coach does NOT order or interpret LFTs (out of S&ES scope) but flags need and teaches red flags. Ferritin at baseline for menstruating women (see Iron entry); dose-separate curcumin from iron-rich meals and iron supplements. Pharmacist review for anticoagulants, antiplatelets, CYP3A4/P-gp substrates (some statins, immunosuppressants, some anticonvulsants). PIPERINE-FREE FORM if on ANY prescription medication. Exclude active/prior liver disease, gallstones/biliary obstruction, pregnancy/breastfeeding. Stack logic: pair with tart cherry for recovery/sleep if desired (complementary NOT redundant); do NOT stack multiple high-dose curcumin products.',
        fits_client_profile: 'Clients on any prescription medication, with any hepatic history, or wanting the maximum-effect periodised protocol with full monitoring. Also the appropriate tier for anyone with the perimenopausal inflammatory-plus-metabolic-plus-mood triple-overlap who wants the properly monitored approach.',
      },
    },
  },
  {
    slug: 'psyllium-husk',
    name: 'Psyllium Husk',
    category: 'gut_digestion',
    short_description: 'The best-evidenced, best-value single fibre in the library. Genuinely multi-purpose (constipation, IBS both subtypes, LDL, glucose) with a rare FDA-authorised heart-health claim behind it. Its risks are almost entirely MECHANICAL and preventable - choke/obstruction if taken dry or with too little fluid, and drug-binding if not time-separated. Get the fluid rule and the med-spacing right and it is one of the safest, most useful things a perimenopausal metabolic-drift client can take. Standout multi-tasker for the gut + metabolic drift cluster.',
    what_it_does: 'Milled husk of Plantago ovata (ispaghula) seeds - a soluble, highly viscous, gel-forming, largely non-fermented fibre with a minor insoluble fraction. Viscosity is the whole story. Not all fibre behaves the same: non-viscous fully-fermented fibres (inulin, wheat dextrin, FOS) dissolve without thickening and get rapidly fermented (gas + bloating + no gel); insoluble fibre (wheat bran) adds roughage but frequently worsens IBS; viscous minimally-fermented soluble fibre (psyllium) forms a thick gel that holds water through the whole colon and is only partially fermented - that gel is the active principle. The gel does four useful things: (1) normalises stool in BOTH directions - softens hard stool in constipation AND absorbs excess water in diarrhoea (bidirectional stool-normalising via gel physics, not laxative action - the reason a single agent helps both IBS-C and IBS-D per Mehmood 2011). (2) Lowers LDL by trapping bile acids in stool, forcing the liver to pull cholesterol from blood to make replacement bile (Jovanovski 2018: ~5-7% LDL at ~10g/d husk). (3) Blunts post-meal glucose by slowing gastric emptying + slowing carb absorption (Gibb 2015: HbA1c -1% in T2D, modest in prediabetes, null in euglycaemic). (4) Is gentle on the gut - minimally fermented so far less gas than inulin/FOS, which is exactly why it is tolerated in IBS where fermentable fibres flare symptoms.',
    contraindications: [
      'Dysphagia / any swallowing difficulty - documented fatal choking case (ISMP Canada) plus multiple oesophageal obstruction case reports. Non-negotiable',
      'Mechanical bowel obstruction, strictures, significant adhesions, severe GI dysmotility, faecal impaction, opioid-induced constipation with impaction - REFER, do not add a bulking agent',
      'On levothyroxine - mandatory >=4 hour separation from psyllium dose (~20-30% absorption reduction of thyroxine)',
      'On narrow-therapeutic-index drugs (warfarin, lithium, digoxin, carbamazepine, phenytoin, anticonvulsants) - >=2 hour minimum separation AND refer to pharmacist/GP for confirmation on timing schedule (do not adjust medication schedules yourself)',
      'On tetracyclines / fluoroquinolones or iron/calcium/zinc supplements - >=2 hour separation',
      'On insulin or sulfonylureas - REAL glucose-lowering effect; advise closer monitoring when starting AND route to prescriber for potential medication adjustment (do not adjust diabetes meds yourself)',
      'Taking psyllium dry or with insufficient fluid - this is a USE-ERROR contraindication. Mandatory fluid rule: 200-250 mL water, stir, drink promptly before it gels, chase with more water. Never dry. Never lying down. Never immediately before bed in anyone with swallowing risk',
      'IgE-mediated psyllium allergy or occupational sensitisation - rash, wheeze, swelling on ingestion; stop and refer',
      'Pregnancy - generally considered acceptable with adequate fluid but defer to obstetric team',
    ],
    safety_notes: 'Serious risks are physical and almost entirely avoidable with correct use, unlike curcumin idiosyncratic organ toxicity. The two mandatory rules are (1) the FLUID RULE - 200-250 mL water, stir, drink promptly before it thickens, chase with more water, never dry, never in dysphagia - this single rule prevents essentially all serious choking/obstruction events; and (2) MED SPACING - >=2 hours from any medication, >=4 hours from levothyroxine, with narrow-therapeutic-index drugs (warfarin/INR, lithium, digoxin, thyroxine, anticonvulsants) confirmed by pharmacist. The gel can trap and delay absorption of co-administered drugs and minerals (reduced absorption reported for levothyroxine, lithium, carbamazepine, warfarin, digoxin, some antibiotics, iron, calcium, zinc). Bloating/gas ramp is the #1 tolerability failure - start ~1 tsp/day and titrate up over 2-4 weeks; too-fast escalation is the commonest reason clients quit. Diminishing returns above ~15 g/day (tolerability-limited; LDL effect plateaus ~10 g). Australian regulatory: unscheduled OTC (AUST-L complementary medicine OR food-standard supplement); no TGA dose restriction; MANDATORY choking-hazard label wording required ("Taking this product without adequate fluid may cause it to swell and block your throat or oesophagus and may cause choking"). AU Metamucil powder = 3.4 g husk per 5.9 g dose; capsules deliver far less per unit (~0.5 g husk per capsule - impractical for therapeutic dosing); Fybogel sachets ~3.5 g ispaghula; bulk whole husk is the same active at a fraction of the cost. AUST-L labels can support maintaining regularity/bowel health and helping lower/maintain healthy cholesterol - cannot claim to treat IBS or diabetes as diseases. Coach language mirrors this. Onset is slow by design - stool response over 12-72 hours, full constipation benefit over weeks not hours - psyllium is MAINTENANCE, not RESCUE.',
    coach_doctrine: 'Viscosity is the whole story - do not confuse psyllium with non-viscous fibres (inulin, wheat dextrin) or insoluble bran; they are different functional classes with different behaviour. Psyllium is STOOL-NORMALISING not laxative - the gel softens hard stool AND firms loose stool, same product/opposite problems/same mechanism, which is why a single agent helps both IBS-C and IBS-D (unique among fibres, per Bijkerk 2009 BMJ and Moayyedi 2014 SR). Dose by GRAMS OF HUSK not "servings" - AU Metamucil powder = 3.4 g husk per 5.9 g dose so the FDA cholesterol claim of 7 g soluble fibre = ~10.2 g husk = ~3 powder doses/day. Effective dose windows: laxation 5-10 g/d (MA optimum >10 g/d); IBS ~10 g/d (Bijkerk dose); cholesterol ~10.2 g husk split across meals; glucose 5-10 g PRE-MEAL split across carb-containing meals (benefit scales with baseline dysglycaemia per Gibb 2015 - T2D HbA1c -1%, prediabetes modest, euglycaemic NULL). Diminishing returns above ~15 g/d. Cheap wins - bulk whole husk << branded powder << capsules on cost per gram of husk; capsules are the worst value by a wide margin (~15+ capsules to match one powder dose) and only fit for travel/top-up; wafers add sugar and calories which undercut the metabolic goal. Sugar-free/unflavoured only for metabolic clients. RAMP is the #1 tolerability lever - start 1 tsp (~3-4 g) once daily, titrate over 2-4 weeks; rushing is the #1 reason clients quit. TIMING: for lipid and glucose endpoints, split doses WITH meals (each meal gets the gel effect); for laxation once-daily is fine but consistency matters. vs the drugs: ties or slightly loses to PEG/macrogol for pure laxation but PEG has NO metabolic bonus; beats/matches lactulose with better tolerability (lactulose is highly fermented); is NOT a stimulant substitute for acute relief - psyllium is maintenance not rescue. Multi-tasker fit is what makes it special - one supplement covers constipation/IBS + LDL + HbA1c simultaneously, unusually good for the perimenopausal gut-plus-metabolic-drift cluster. NOT a drug replacement for LDL or glucose - a legitimate adjunct layered on top of first-line care (industry-funded T2D data with Metamucil should be flagged as such). Where it under-performs: IBS-M (mixed subtype) less clear; IBS with SIBO overlap or strong bloating phenotype can be aggravated even by minimally-fermented psyllium (start very low; if bloating dominates it may not be the right tool). Cross-reference the Iron entry - psyllium binds iron, so for menstruating perimenopausal clients dose psyllium well away from iron-rich meals and iron supplements and factor into the iron plan. AUST-L language mirrors what the label can claim: "supports regularity," "helps maintain healthy cholesterol" - never "treats" IBS/diabetes.',
    research_reference: '~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/2026-07-23_Psyllium_Husk_Constipation_IBS_Cholesterol_Glucose.md',
    tiers: {
      essential: {
        label: 'Essential',
        form: 'Plain or sugar-free WHOLE HUSK or powder (best value; no added sugar). Avoid capsules for therapeutic dosing (impractical - ~15+ needed to match one powder dose) and avoid flavoured wafers for metabolic clients (added sugar/calories undercut the metabolic goal).',
        dose: 'Start 1 tsp (~3-4 g husk) once daily, titrate up over 2-4 weeks toward 5-10 g/day as tolerated',
        timing: 'Any time consistent (once-daily fine for laxation). MANDATORY FLUID RULE: dissolve in 200-250 mL water, stir, drink promptly before it thickens, chase with another glass. Never dry. Med spacing: >=2 h from any medication, >=4 h from levothyroxine',
        notes: 'Effect on constipation builds over >=4 weeks - psyllium is MAINTENANCE not RESCUE. Ramp is the #1 tolerability lever - too-fast escalation is the #1 reason clients quit. Screen and EXCLUDE dysphagia, known bowel stricture/obstruction, faecal impaction (refer to GP instead). Dose by GRAMS OF HUSK not "servings" (AU Metamucil powder = 3.4 g husk per 5.9 g dose).',
        fits_client_profile: 'The plant-forward-but-actually-low-fibre client. General regularity. Any client wanting a gentle entry point to gut and metabolic support. Perimenopausal clients wanting a single tool that covers gut + LDL + HbA1c drift simultaneously.',
      },
      enhanced: {
        label: 'Enhanced',
        form: 'Same as Essential (plain/sugar-free whole husk or powder). AUST-L.',
        dose: 'Endpoint-matched: LDL ~10.2 g husk/day (~7 g soluble fibre = FDA-claim dose) split across meals; Glucose (prediabetes/T2D) 5-10 g PRE-MEAL split across carb-containing meals; IBS (both C and D) ~10 g/day titrated slowly',
        timing: 'Split doses WITH meals for lipid + glucose endpoints (each meal gets the gel effect). Pre-meal specifically for glucose. Same fluid rule + med spacing as Essential',
        notes: 'The "actually go after a specific number" tier - each dose pattern matches a specific RCT protocol. Expect ~5-7% LDL over weeks (Jovanovski 2018). Glucose benefit scales with baseline dysglycaemia (Gibb 2015: T2D HbA1c -1%, prediabetes modest, euglycaemic NULL). IBS effect is STOOL-NORMALISING not laxative - set the expectation accordingly. Deprioritise if bloating-dominant or SIBO overlap. If on insulin/sulfonylureas -> real hypoglycaemia risk, advise closer monitoring + prescriber review.',
        fits_client_profile: 'Confirmed elevated LDL wanting a first-line dietary adjunct. Prediabetes or T2D wanting a low-risk pre-meal glucose lever. Diagnosed IBS (either subtype) wanting the soluble-fibre first-line intervention (ACG monograph recommends soluble fibre first-line for IBS).',
      },
      elite: {
        label: 'Elite',
        form: 'Combined protocol: psyllium + food-first fibre-diversity strategy + optionally a strain-matched probiotic. Written daily medication-timing schedule confirmed by pharmacist for any client on narrow-therapeutic-index drugs. GP-ordered baseline + 12-week HbA1c/lipids for metabolic clients. Iron cross-check via GP-ordered ferritin for menstruating women.',
        dose: 'Individualised per endpoint targets, sequenced across the day so psyllium is not blunting other interventions',
        timing: 'Pre-meal split for glucose PLUS across-meal split for LDL. Cross-reference Iron entry timing - psyllium binds iron; dose-separate from iron supplements and iron-rich meals by several hours',
        notes: 'Medication-separation plan (written, pharmacist-confirmed) mandatory for any client on levothyroxine (4h), warfarin (INR check), lithium, digoxin, anticonvulsants, iron. Metabolic layering tracked with GP-ordered HbA1c and lipids at baseline and ~12 weeks. Contraindication gate: exclude dysphagia, mechanical obstruction/stricture, impaction; confirm fluid-rule adherence before escalating dose. Coach role is the connective tissue - never adjust medication schedules or diabetes meds yourself.',
        fits_client_profile: 'Metabolically driven perimenopausal cohort with multiple meds + iron demand. Anyone running psyllium alongside multiple other supplements or prescriptions needing coordinated timing. Complex gut + metabolic + medication cases needing the coordinated multi-provider approach.',
      },
    },
  },
  {
    slug: 'probiotics',
    name: 'Probiotics',
    category: 'gut_digestion',
    short_description: 'The category where the gap between marketing and evidence is widest of anything in this library. Where they work (a small list of NAMED STRAINS for a small list of NAMED CLINICAL SITUATIONS), the evidence is genuinely good. Where they do NOT work (general "gut health," "immune support," mood, weight loss, aimless maintenance in healthy adults) is where the money is spent. This entry uniquely leads with a POSITION not a product - for most healthy asymptomatic clients the honest answer is "you do not need this; eat fermented foods and fibre instead."',
    what_it_does: 'FAO/WHO/ISAPP definition: live microorganisms which, when administered in adequate amounts, confer a health benefit on the host (Hill 2014). Three load-bearing words: LIVE, ADEQUATE AMOUNTS, HEALTH BENEFIT. Effects when they occur are strain-specific and disease-specific (McFarland 2018 covering 228 trials) - trials are run on strains, meta-analyses attach to strains, marketing sells genera. Evidence is BEST for: antibiotic-associated diarrhoea prevention (LGG or S. boulardii CNCM I-745; Cochrane 2019 NNT 9 in children, NNT 6 at high dose, 5-40 billion CFU/day); C. difficile prevention alongside antibiotics (AGA 2020 conditional recommendation for specific formulations); pouchitis (De Simone 8-strain formulation, AGA); NEC in preterm infants (out of scope but the reference point for what a strong probiotic evidence base actually looks like). Evidence is MIXED for: IBS symptoms (B. longum subsp. infantis 35624 at 1x10^8 CFU is the best single dataset - Whorwell 2006, though ACG suggests AGAINST and BSG says "can be trialled"; note both 1x10^6 and 1x10^10 doses FAILED in the same trial - non-monotonic, more was worse); bacterial vaginosis adjunct (L. rhamnosus GR-1 + L. reuteri RC-14, one strong positive Martinez 2009 and one clean null 2021); atopic dermatitis prevention (LGG only when prenatal AND postnatal). Evidence is ABSENT for: general "gut health" maintenance, "immune support" as labelled, mood ("psychobiotics" premature), weight loss, acne, "detox." Ingested strains do NOT colonise the adult gut - they transit and wash out within 3-6 days of stopping, meaning ongoing dosing is required (Suez 2018 also showed multi-strain probiotic DELAYED post-antibiotic microbiome recovery vs spontaneous - the "rebuild your gut flora" marketing frame is falsified).',
    contraindications: [
      'Immunocompromise (haematological malignancy, post-transplant, high-dose immunosuppression, advanced HIV) - REFER, do not recommend OTC',
      'Critical illness or ICU admission - REFER',
      'Central venous catheter in situ - REFER (case-series risk of bacteraemia/fungaemia; ISAPP note that central-line contamination by aerosolised probiotic powder is a documented route)',
      'Short bowel syndrome - REFER (D-lactic acidosis risk)',
      'Structural cardiac disease or prosthetic/damaged heart valves - REFER',
      'Active IBD flare - REFER',
      'Acute pancreatitis - CONTRAINDICATED. PROPATRIA trial (Besselink 2008, Lancet, n=296): multi-strain probiotic arm mortality 16% vs 6% placebo. The defining safety datapoint in the field',
      'Severely debilitated or conditions predisposing to bacterial/fungal translocation - REFER',
      'SIBO or SIBO-suggestive presentation (severe bloating within 30-60 min of meals, distension disproportionate to intake, prior symptomatic response to rifaximin, prior abdominal surgery/adhesions/motility disorder) - REFER to GP before any probiotic. Probiotics can WORSEN SIBO (Rao 2018 in Clin Transl Gastroenterol)',
      'Symptoms got WORSE after starting a probiotic - stop and refer (most useful clinical sign in the whole category)',
      'Histamine intolerance or mast-cell activation on specialist care - some strains produce histamine (L. casei, L. delbrueckii subsp. bulgaricus); strain list matters, check with treating clinician',
      'Pregnancy - defer atopy-prevention protocols to GP/obstetric team; not coach-initiated',
      'Any product without a strain code on the label (Genus + species + STRAIN like ATCC 53103) - cannot be mapped to any evidence; refuse regardless of price or brand',
      'Any imported non-AUST-L US probiotic - weaker regulatory regime; audit data dominated by US products with 30-46% under-dose rates',
    ],
    safety_notes: 'Probiotics are well tolerated in healthy people but NOT safe in everyone; the failure modes are serious. Absolute referral-away situations listed in contraindications. Bacteraemia (Lactobacillus) and fungaemia (S. boulardii) are rare but concentrated in critically ill, immunocompromised, and central-line populations; 92% of S. boulardii-associated fungaemia cases had an IV catheter. Six-point label check (mandatory before recommending any product): (1) AUST-L or AUST-L(A) number present? (2) Full name with STRAIN CODE for every organism (Genus species strain, e.g. Lacticaseibacillus rhamnosus GG ATCC 53103)? (3) CFU declared PER STRAIN not just product total? (4) CFU guaranteed to END OF SHELF LIFE not "at manufacture"? (5) Serving size and daily dose stated clearly? (6) Storage conditions realistic for an Australian home? Fail on #2 or #4 = do not buy. Clients can verify AUST-L number via ARTG search on tga.gov.au (30 seconds). AU regulatory: April 2025 TGA Guidelines for the Quality of Listed Probiotic Medicines wrote strain-not-genus into the quality framework - strain-level identity and quantification required; multi-strain products require strain-specific measurement methods; shelf-life expectation is that stated content is maintained throughout shelf life (already end-of-shelf-life at Australian regulatory level, unlike US where "at manufacture" is common). Guidelines are guidance not mandatory, with a transition period, so Australian labels are currently mid-transition. Do NOT direct clients to imported US probiotics. Product quality audits are consistently damning across two decades - 30-46% of tested products under-dosed vs label (2026 Ann Microbiol: 46.4%; 2016 Front Microbiol: 33%; 2019: 29.4% inaccurate). Only end-of-shelf-life declarations are usable. Antibiotic-separation rule: separate probiotic from antibiotic dose by ~2 hours. Timing (standard uncoated capsule): with a meal containing fat, or up to 30 min before; NEVER with acidic juice (Tompkins 2011). S. boulardii and enteric-coated/spore-forming products = timing irrelevant. Ingested strains do not colonise - detectable 3-6 days after stopping - so effect requires ongoing dosing (permanent subscription; say this out loud, it changes the cost-benefit).',
    coach_doctrine: 'This entry uniquely leads with a POSITION not a product. For most healthy asymptomatic clients the honest answer is "you do not need this." Fermented foods (yoghurt with live cultures, kefir, kimchi, sauerkraut, other fermented vegetables) plus adequate fibre has better randomised evidence in healthy adults than any probiotic capsule does (Wastyk 2021 Cell: high-fermented-food arm raised gut microbial diversity AND reduced 19 inflammatory proteins including IL-6; high-fibre arm did neither at 10 weeks). STRAIN NOT GENUS is the whole doctrine - client analogy: "Lactobacillus" is like "antibiotic," "L. rhamnosus" is like "a penicillin," "L. rhamnosus GG (ATCC 53103)" is like "amoxicillin 500mg" (you would not accept a script that just said "antibiotic"). The epistemic version of the doctrine is unassailable: unlabelled strains are unverifiable, so cannot be mapped to any trial. Taxonomy changed 2020 (Lactobacillus split into 25 genera per Zheng 2020) so strain codes are the only stable identifier - RC-14 is RC-14 and 35624 is 35624 regardless of what genus name currently sits above them. Dose-response is INDICATION-DEPENDENT not universal (Ouwehand 2017): clear for AAD (more is better), possibly for blood pressure, but demonstrably NOT for IBS/C. diff/NEC/atopic dermatitis/transit/immune markers. Whorwell 2006 IBS trial is the counterexample that must be taught alongside AAD - 1x10^10 CFU of B. infantis 35624 FAILED where 1x10^8 succeeded (non-monotonic, more was worse). "100 billion CFU" marketing is a quantity claim not an evidence claim. Multi-strain is a HEDGING argument not a synergy argument (McFarland 2021: multi-strain mixtures were NOT significantly more effective than single-strain probiotics matched by indication). Clear multi-strain wins: pouchitis (De Simone 8-strain formulation, specified by DSM number due to VSL#3/Visbiome brand ambiguity post-2016) + H. pylori eradication adjunct. Product quality is consistently bad - 30-46% of audited products under-dose vs label. AU regulatory context: April 2025 TGA guidelines wrote strain-not-genus into the quality framework and set end-of-shelf-life as the expectation; labels are mid-transition. Do NOT direct clients to imported US probiotics. Colonisation: ingested strains DO NOT COLONISE the adult gut - they transit; detectable 3-6 days post-stopping; effect requires ongoing dosing (permanent subscription). This falsifies "reseed/repopulate/rebuild your gut flora" marketing entirely. The reconstitution paradox: Suez 2018 (Cell) - multi-strain probiotic DELAYED post-antibiotic microbiome recovery vs spontaneous recovery; aFMT recovered rapidly. Symptom endpoint (diarrhoea) benefits; ecological endpoint (return to baseline) may be harmed. "Take a probiotic to rebuild your gut flora after antibiotics" has moved from received wisdom to genuinely questionable. BR cohort specifics: perimenopausal + IBS-flavoured symptoms + VVC/BV history sits in weak-to-mixed evidence territory. IBS-flavoured symptoms need a DIAGNOSIS first (could be IBS, SIBO, coeliac, IBD, bile acid malabsorption, or perimenopausal hormonal effects on gut motility/visceral sensitivity). Recurrent BV/VVC is a GP conversation - also raises the question of vaginal atrophy and local oestrogen, entirely outside supplement territory. Perimenopause itself is NOT a probiotic indication ("oestrobolome" marketing runs well ahead of clinical data). Highest-value intervention for the typical BR client is almost always fermented foods + fibre. Client scripts (memorise these): "But it says 100 billion CFU!" -> "That number is the easiest thing on the label to make bigger and the least connected to whether it works... In an IBS trial, a dose a hundred times higher than the effective one did nothing." "It has Lactobacillus in it" -> "So does yoghurt, and so do about four hundred bacteria that have never been tested for anything. Every trial that ever showed a probiotic worked was run on one specific strain with a code after the name." "Which brand is best?" -> "Wrong question. Brand tells you nothing. What tells you something: does it name the strain with a code, does it guarantee count at expiry, does it have an AUST-L number, does the strain match a study for your actual situation."',
    research_reference: '~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/2026-07-23_Probiotics_Strain_Not_Genus_Doctrine.md',
    tiers: {
      essential: {
        label: 'Essential',
        form: 'FOOD-FIRST: fermented foods most days - yoghurt with live cultures, kefir, kimchi, sauerkraut, other fermented vegetables, kombucha. In scope, no referral needed, better randomised evidence in healthy adults than any probiotic capsule (Wastyk 2021 Cell: high-fermented-food arm raised gut microbial diversity AND lowered 19 inflammatory proteins including IL-6; larger servings produced stronger effects). Plus adequate dietary fibre alongside. IF INDICATED (client about to start antibiotics only): LGG (ATCC 53103) or S. boulardii CNCM I-745, AUST-L, verified strain code on label.',
        dose: 'Fermented foods: aim for daily servings; larger servings = stronger effect (Wastyk 2021 dose-response). IF starting antibiotics: LGG or S. boulardii CNCM I-745 at 5-40 billion CFU/day, starting with the antibiotic course, separated by ~2 hours from each antibiotic dose, continuing 1-2 weeks after. STOP when the course is done',
        timing: 'Fermented foods any time. Antibiotic-adjunct product: with a fat-containing meal (unless S. boulardii, where timing does not matter). Separate ~2 hours from antibiotic dose',
        notes: 'Lead with fermented foods for every client wanting to "do something for their gut" - it is inside coach scope, cheap, food-first, and has better randomised evidence in healthy adults than any probiotic supplement. The antibiotic-adjunct product is the ONE specific indication where a supplement genuinely earns its place at this tier. Do NOT extend the supplement recommendation to "general gut health," "immune support," mood, weight loss, acne, "detox," or aimless maintenance - the evidence is not there. Six-point label check before recommending any product: AUST-L number + strain code + CFU per strain + CFU guaranteed to END OF SHELF LIFE + serving/dose stated + realistic storage. Fail on strain code or shelf-life guarantee = do not buy.',
        fits_client_profile: 'Every BR client wanting to "do something for their gut" (fermented foods + fibre is the primary recommendation, in scope, food-first). Plus the specific antibiotic-adjunct case when relevant.',
      },
      enhanced: {
        label: 'Enhanced',
        form: 'Strain-matched intervention for a DOCUMENTED indication, GP-informed. AUST-L. Verify against ARTG.',
        dose: 'Match to indication: AAD/C. difficile prevention = LGG or S. boulardii CNCM I-745 at >=10 billion CFU/day through course + 1-2 weeks; Diagnosed IBS = B. longum subsp. infantis 35624 at 1x10^8 CFU/day (Whorwell dose; note 1x10^10 FAILED in the same trial - do NOT extrapolate to higher doses); BV/recurrent VVC on antimicrobial treatment = L. rhamnosus GR-1 + L. reuteri RC-14 adjunct, ~30 days per trial protocols (NEVER a substitute for antimicrobial); high-risk travel = S. boulardii CNCM I-745 started pre-departure',
        timing: 'Standard uncoated capsules with a fat-containing meal or up to 30 min before (Tompkins 2011); NEVER with acidic juice. S. boulardii = timing irrelevant. Separate from antibiotics by ~2 hours. IBS trial: minimum 4 weeks, HARD STOP at 12 weeks if no benefit',
        notes: 'Enhanced-tier discipline requirements: baseline symptom measurement + one variable changed at a time + pre-agreed stopping date + label verified against ARTG + GP informed. Position IBS trial as an EXPERIMENT with a defined endpoint, NOT a purchase. Prevents the indefinite subscription that is the actual commercial model of the category.',
        fits_client_profile: 'DOCUMENTED indication (not "probably IBS" - actual GP diagnosis, coeliac serology done, faecal calprotectin if IBD suspected). Client about to start antibiotics wanting stronger AAD/C. diff protection than Essential. BV/VVC on antimicrobial. High-risk international travel.',
      },
      elite: {
        label: 'Elite',
        form: 'Practitioner-guided, referred out. De Simone formulation (specify by DSM numbers 24733, 24730, 24735, 24734, 24736, 24732, 24737, plus S. salivarius subsp. thermophilus - not by brand, due to VSL#3/Visbiome 2016 divergence) for UC adjunct or pouchitis under gastroenterologist. Any SIBO-suggestive presentation refers OUT to GP before any probiotic. Any Section 11.1 contraindication category refers OUT.',
        dose: 'Per specialist. De Simone formulation is sachet-based at 450 billion/sachet',
        timing: 'Per specialist. Note De Simone formulation requires refrigeration (room-temp tolerance ~1 week)',
        notes: 'Targeted strain selection against stool testing with a functional GP: coach role is to make sure clients KNOW the mapping from test result to strain choice is NOT evidence-based. Zmora 2018 showed stool does not predict mucosal colonisation, so the assay everyone uses may not measure what matters. There is currently no validated evidence base for selecting probiotic strains on the basis of a commercial stool test - even if the test itself is well-run.',
        fits_client_profile: 'UC or pouchitis under gastroenterologist care (rare in BR cohort). Any client with a contraindication - refer out, probiotic contraindicated. Any client on a functional-GP stool-testing pathway - coach flags the evidence gap, does not recommend.',
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
