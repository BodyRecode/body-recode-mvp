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
