/**
 * Recovery Protocol Library — canonical seed.
 *
 * These are Layer 3 coach-side prescription tools per the RRS
 * anti-pattern guardrail: RRS (Layer 2) emits constraint envelopes only,
 * never prescribes protocols. Protocol prescription lives here, on the
 * coach-side, by explicit assignment.
 *
 * Each protocol is typed data with dosing, safety notes, equipment
 * requirements, and coach-facing doctrine. Coach assigns per client;
 * client only sees what's assigned to them.
 *
 * The DB `recovery_protocols` table is seeded FROM this file, not the
 * other way around. Edits here + a re-seed script propagate to the DB.
 * Client-side rendering (portal + coach editor) reads from the DB.
 */

export type RecoveryCategory =
  | 'heat'
  | 'cold'
  | 'contrast'
  | 'compression'
  | 'light'
  | 'breathwork'
  | 'systemic'
  // Added 2026-08-17 with the restorative and Yin yoga entries. Movement-based
  // recovery was a whole missing shelf: the library had heat, cold, compression,
  // light, breathwork and systemic cycles, and nothing you do with your body.
  | 'movement'

export type EquipmentTag =
  | 'sauna_traditional'
  | 'sauna_infrared'
  | 'steam_room'
  | 'magnesium_bath'
  | 'cold_plunge_full'
  | 'ice_water_bowl'
  | 'shower'
  | 'cryo_chamber'
  | 'red_light_panel'
  | 'red_light_bed'
  | 'compression_boots'
  | 'massage_gun'
  | 'vibration_plate'
  | 'sleep_breathing_kit'
  | 'none_needed'

export interface ProtocolDosing {
  frequency: string
  duration: string
  intensity_notes?: string
  timing?: string
}

/**
 * Groups protocols that require strict tiered progression (never skip levels;
 * escalate only after evaluation window with no improvement; de-escalate to
 * lowest effective level). See 13D_16 Sleep Breathing Support Tools doctrine.
 */
export type ProgressionGroup = 'sbst'

export interface ProgressionMeta {
  /** Group this protocol belongs to (e.g. "sbst" = Sleep Breathing Support Tools). */
  group: ProgressionGroup
  /** 1 = first-line, 2 = secondary, 3 = advanced. Higher levels only after lower fails. */
  level: 1 | 2 | 3
  /** Short label for the group shown in the coach UI. */
  group_label: string
  /** One-line group doctrine shown above the grouped protocols. */
  group_rule: string
}

export interface RecoveryProtocol {
  slug: string
  name: string
  category: RecoveryCategory
  short_description: string
  what_it_does: string
  steps: string[]
  dosing: ProtocolDosing
  required_equipment: EquipmentTag[]
  contraindications: string[]
  safety_notes: string
  coach_doctrine: string
  /** Optional: marks this protocol as part of a stepped/tiered progression group. */
  progression?: ProgressionMeta
}

export const RECOVERY_PROTOCOLS: RecoveryProtocol[] = [
  {
    slug: 'sauna-traditional',
    name: 'Traditional Sauna',
    category: 'heat',
    short_description: 'Dry heat exposure for cardiovascular conditioning and recovery.',
    what_it_does: 'Increases plasma volume, activates heat shock proteins, mimics moderate cardiovascular training, supports parasympathetic recovery after use.',
    steps: [
      'Enter a preheated sauna at 80 to 100 degrees Celsius',
      'Sit or lie down, breathe through the nose',
      'Stay 15 to 20 minutes per round',
      'Exit, cool down for 5 to 10 minutes with water and rest',
      'Optional second round of 10 to 15 minutes',
      'Rehydrate with electrolytes afterward',
    ],
    dosing: {
      frequency: '2 to 4 sessions per week',
      duration: '15 to 20 minutes per round, 1 to 2 rounds',
      timing: 'Post-training or standalone recovery day. Not immediately before bed.',
    },
    required_equipment: ['sauna_traditional'],
    contraindications: [
      'Uncontrolled high blood pressure',
      'Recent heart attack or cardiac event',
      'Pregnancy',
      'Currently dehydrated or fasted more than 16 hours',
    ],
    safety_notes: 'Exit immediately if dizzy, nauseous, or heart rate feels irregular. Never drink alcohol before or during. Hydrate before, during, and after.',
    coach_doctrine: 'Heat exposure is a hormetic stressor. Dose it like training: enough to trigger adaptation, not so much it adds to the recovery debt. If the client is already in an RRS acute_fatigue or ns_overload state, defer sauna until state clears.',
  },
  {
    slug: 'sauna-infrared',
    name: 'Far-Infrared Sauna',
    category: 'heat',
    short_description: 'Lower-temperature radiant heat, easier to tolerate long sessions.',
    what_it_does: 'Deeper tissue penetration at lower ambient temperature. Better tolerated by heat-sensitive clients. Supports parasympathetic shift and recovery.',
    steps: [
      'Enter preheated infrared sauna at 55 to 65 degrees Celsius',
      'Sit upright, breathe through the nose',
      'Stay 30 to 45 minutes',
      'Exit, shower cool, rehydrate with electrolytes',
    ],
    dosing: {
      frequency: '3 to 5 sessions per week',
      duration: '30 to 45 minutes per session',
      timing: 'Any time. Well tolerated pre-bed if session ends 90 minutes before sleep.',
    },
    required_equipment: ['sauna_infrared'],
    contraindications: [
      'Uncontrolled high blood pressure',
      'Recent heart attack or cardiac event',
      'Pregnancy',
    ],
    safety_notes: 'Lower temperature so heat stress is less. Still hydrate. Exit if dizzy.',
    coach_doctrine: 'Preferred over traditional sauna for clients in remediation, depleted, or heat-intolerant. Same hormetic principle but wider tolerance window.',
  },
  {
    slug: 'steam-room',
    name: 'Steam Room',
    category: 'heat',
    short_description: 'Warm humid environment for respiratory and mild parasympathetic recovery.',
    what_it_does: 'Humidified heat supports respiratory clearance, mild sweating, moderate parasympathetic shift. Gentler than sauna.',
    steps: [
      'Enter steam room at 40 to 45 degrees Celsius, near 100 percent humidity',
      'Sit or lie down, breathe slowly',
      'Stay 10 to 15 minutes',
      'Cool shower afterward',
    ],
    dosing: {
      frequency: '2 to 4 sessions per week',
      duration: '10 to 15 minutes',
      timing: 'Post-training or standalone.',
    },
    required_equipment: ['steam_room'],
    contraindications: ['Uncontrolled high blood pressure', 'Recent cardiac event', 'Respiratory infection'],
    safety_notes: 'Do not stay if breathing becomes uncomfortable. High humidity limits sweating so core temperature can rise faster than in dry sauna.',
    coach_doctrine: 'Underrated for depleted clients who cannot tolerate dry sauna. Also good adjunct during upper respiratory recovery.',
  },
  {
    slug: 'magnesium-bath',
    name: 'Warm Magnesium Bath',
    category: 'heat',
    short_description: 'Warm bath with magnesium chloride or Epsom salts, evening use.',
    what_it_does: 'Warm water triggers vasodilation and parasympathetic shift. Magnesium (transdermal absorption modest but present) plus the ritual itself supports sleep onset.',
    steps: [
      'Fill bath with warm water, 37 to 40 degrees Celsius',
      'Add 2 cups of magnesium chloride flakes or Epsom salts',
      'Soak 20 to 30 minutes, breathing slowly',
      'Rinse off, cool slightly, head to bed within 60 minutes',
    ],
    dosing: {
      frequency: '2 to 4 evenings per week',
      duration: '20 to 30 minutes',
      timing: 'Evening, 60 to 90 minutes before bed.',
    },
    required_equipment: ['magnesium_bath'],
    contraindications: ['Pregnancy without OB clearance', 'Open wounds or infections', 'Uncontrolled high blood pressure'],
    safety_notes: 'Stand up slowly after long soaks (blood pressure drop). Do not exceed 40 degrees Celsius.',
    coach_doctrine: 'Sleep-onset tool for high-stress clients. Effect is 70 percent thermal parasympathetic shift, 20 percent ritual, 10 percent magnesium. Do not oversell the mineral absorption.',
  },
  {
    slug: 'face-ice-immersion',
    name: 'Face Ice Immersion',
    category: 'cold',
    short_description: 'Kade\'s morning nervous-system reset. Short face-only cold exposure.',
    what_it_does: 'Triggers the mammalian dive reflex via the trigeminal nerve. Slows heart rate, increases vagal tone, shifts autonomic balance toward parasympathetic. Fast, targeted reset without whole-body cold stress.',
    steps: [
      'Fill a large bowl with cold water and generous ice, target 5 to 10 degrees Celsius',
      'Take a normal breath in and hold',
      'Submerge whole face including forehead, eyes, cheeks, nose',
      'Hold 10 to 20 seconds',
      'Come up, breathe calmly for 20 to 40 seconds',
      'Repeat 3 to 5 rounds',
    ],
    dosing: {
      frequency: 'Daily to 5 mornings per week',
      duration: '10 to 20 seconds per round, 3 to 5 rounds, total 2 to 4 minutes',
      timing: 'Morning before caffeine, or anytime autonomic reset is needed.',
    },
    required_equipment: ['ice_water_bowl'],
    contraindications: ['Uncontrolled cardiac condition', 'Recent facial surgery', 'Cold urticaria'],
    safety_notes: 'Do not exceed 20 seconds per round. Sit or kneel over the bowl (do not stand). Never combine with breath-hold beyond one comfortable breath.',
    coach_doctrine: 'Trigeminal-driven dive reflex is the fastest parasympathetic lever available. Kade\'s personal morning protocol. Underused because clients think they need a full plunge to get the effect. They do not.',
  },
  {
    // Added 2026-08-17 from the Deep Research report at
    // 00_PLAYBOOK/recovery_research/2026-08-17_Passive_Body_Heating.md
    //
    // FIRST BIPHASIC PROTOCOL IN THE LIBRARY. Stressor during immersion,
    // downregulator in the rebound 30 to 120 minutes afterwards. The entire
    // prescription exists to land the client in phase two and keep them out of
    // phase one at lights out. Filing it as "a downregulator" and stopping
    // there would be the same bug as filing all cold together: the category is
    // not the mechanism, the TIMING is.
    //
    // Deliberately NOT credited as recovery in the RRS table. Per the report,
    // it must count against thermal and cardiovascular load, not for it.
    slug: 'passive-body-heating',
    name: 'Passive Body Heating (Warm Bath or Shower)',
    category: 'heat',
    short_description: 'Warm water before bed to shorten time-to-sleep. Onset only, and the bedroom has to be cool.',
    what_it_does: 'Raises distal skin temperature and widens the distal-to-proximal gradient, which is the best single predictor of how fast someone falls asleep. Core temperature rises during immersion then falls further than it otherwise would, and that fall is what the protocol is buying. Shortens sleep onset latency by somewhere around 5 to 10 minutes. It does NOT improve wake after sleep onset, total sleep time, awakenings or sleep efficiency, all of which came back null or negative.',
    steps: [
      'Cool and darken the bedroom BEFORE the bath, not after. The heat has to have somewhere to go',
      'Bath: 40 to 41 degrees, to mid-thorax not the neck, 10 to 20 minutes, finishing 60 to 120 minutes before lights out',
      'Shower alternative: around 40 degrees, 10 minutes, finishing 20 to 60 minutes before lights out',
      'Endpoint is warmed through and comfortably flushed, NOT sweating. Still sweating at bedtime means the dose was too high or the gap too short',
      'Get out slowly. Sit for 30 seconds before standing',
      'Dry off and stay lightly dressed. No bundling, no electric blanket, no heat source in the bed',
      'Bathroom door unlocked and someone else in the house',
    ],
    dosing: {
      frequency: 'Nightly. No accumulation, no tolerance, no need to cycle. The effect is acute and same-night.',
      duration: 'Bath 10 to 20 minutes at 40 to 41 degrees. Shower 10 minutes at around 40 degrees.',
      intensity_notes: 'NO PROGRESSION. Do not chase a bigger effect with hotter water or longer immersion: the dose-response INVERTS above roughly +1 degree core. At +1.8 degrees rectal the trials found delayed sleep onset, disturbed sleep and frequent awakenings. Hotter is worse, not better.',
      timing: 'Bath finishes 60 to 120 minutes before lights out, up to 180 if it was long or hot. Shower finishes 20 to 60 minutes before. Bigger heat load means a longer gap. Never within 30 minutes of lights out for a bath, or the client goes to bed still in the stressor phase.',
    },
    required_equipment: ['shower'],
    contraindications: [
      'SCREEN BEFORE PRESCRIBING. Snoring plus witnessed pauses plus daytime sleepiness, or an Epworth of 16 or more, means suspected obstructive sleep apnoea: refer, do not prescribe. Treating apnoea as insomnia is the specific harm this screen exists to prevent. Note the STOP-Bang under-detects in women (77% sensitivity, 45% specificity, AUC 0.67 in midlife women) and the most sensitive single item for them is observed apnoeas, while OSA prevalence reaches 27% in perimenopause and 29% after it. A low score in a midlife woman does not clear her. Also refer rather than prescribe if the complaint has run three months or more and looks like chronic insomnia disorder, if she is on a hypnotic, or if restless legs or a parasomnia is suspected',
      'Bedroom above 24 degrees. The mechanism is heat TRANSFER and it needs a gradient. Every positive whole-body result in this literature comes from bedrooms at 17 to 18 degrees. In a hot humid Brisbane summer room you get the stressor phase and none of the rebound. Fix the room first or do not prescribe it at all',
      'Pregnancy. The protocol deliberately raises core temperature 0.5 to 0.9 degrees, which is the exposure obstetric guidance advises against. A warm shower is fine, hot immersion is not',
      'Client on antihypertensives: shower only, and warn specifically about standing up. Hot immersion dropped 24-hour systolic by 7mmHg in treated hypertensives, and that stacks with medication',
      'Client home alone and unobserved: shower only, never immersion',
      'Any dizziness or light-headedness on standing. Immersion stops permanently, move to a shower',
      'Complaint is night waking, unrefreshing sleep or short sleep duration. Wrong tool entirely, the effect is onset-only',
      'Client already falls asleep in under 15 minutes. No headroom, you cannot subtract 7 minutes from 10',
      'Frequent night sweats or vasomotor symptoms. See coach doctrine, the mechanism predicts harm and nobody has measured it',
      'Same evening as sauna, hot yoga or hot-weather training. One heat exposure per evening',
      'With alcohol',
    ],
    safety_notes: 'The stressor phase is real and measurable. In 1,479 older adults measured in their own bathrooms, a 1 degree rise in skin temperature during bathing came with systolic pressure up 2.41mmHg and pulse up 2.99bpm. Bath-related deaths in Japan exceeded 13,000 in a single winter, which is neck-deep immersion in older adults in cold houses and does not transfer directly, but it establishes that hot immersion has a real mortality tail in the elderly. The specific moment of risk is standing up out of hot water with the peripheral vasculature maximally dilated and plasma volume down, and it compounds with antihypertensives, alcohol, dehydration, evening training and age. Mid-thorax rather than neck-deep is a safety instruction: neck-deep is the configuration associated with the tail.',
    coach_doctrine: 'Prescribe it for ONE thing: a client whose specific complaint is taking too long to fall asleep. Everything else came back null. Then hold three caveats honestly. FIRST, the version your client will actually do is the version with the weakest evidence. The whole effect base is baths, in Japan, in winter, in unheated houses at 17 to 18 degrees. The one direct head-to-head ranked SHOWERING WORST of three arms (20.3 min versus 12.3 for a long bath), and the entire shower case otherwise rests on 11 teenage male footballers measured with a consumer EEG headband. SECOND, do not present a foot bath as an evidence-backed equivalent: both polysomnography trials of foot baths were completely null despite confirming the skin-temperature gradient rose, which is where the causal chain actually breaks. THIRD, and this is the one for our client base, in a woman with night sweats the mechanism runs directly against the intervention. Hot flushes are triggered by small core temperature elevations within a narrowed thermoneutral zone; this protocol raises core temperature by five to nine times that magnitude, and vasomotor arousals cluster in the first half of the night, the exact window the onset benefit lands in. Cooling the bedroom to 18 degrees has been directly shown to REDUCE measured flushes in that population. So for a peri or postmenopausal client with night sweats: cool the bedroom before you warm the body, and if you still want the thermal onset protocol, run it n-of-1 for two weeks with a nightly wake count and take it off if the count rises. Nobody has ever studied it in that population, so this is untested with a mechanistically predicted risk, not a hedge.',
  },
  {
    slug: 'cold-shower',
    name: 'Cold Shower Finish',
    category: 'cold',
    short_description: 'Finish a shower with 1 to 3 minutes fully cold.',
    what_it_does: 'Elevates dopamine and norepinephrine, sharpens alertness, builds psychological resilience through voluntary discomfort.',
    steps: [
      'Shower normally',
      'Turn water fully cold at the end',
      'Stand under it, breathe slowly, do not tense',
      'Stay 1 to 3 minutes',
      'Get out, dry off, rewarm naturally (no hot drink or shower immediately after if the goal is metabolic activation)',
    ],
    dosing: {
      frequency: 'Daily to 5 times per week',
      duration: '1 to 3 minutes fully cold',
      timing: 'Morning for alertness. Not within 4 hours of a strength session if hypertrophy is the primary goal.',
    },
    required_equipment: ['shower'],
    contraindications: ['Uncontrolled cardiac condition', 'Raynaud\'s syndrome', 'Recent cardiac event'],
    safety_notes: 'Never combine with breath-hold. Do not exceed 3 minutes without acclimation. Skip if feeling unwell.',
    coach_doctrine: 'Entry-level cold exposure. Adherence-friendly. Same dopamine effect as a full plunge, roughly 40 percent of the magnitude, at zero setup cost.',
  },
  {
    slug: 'cold-plunge-extended',
    name: 'Extended Cold Plunge',
    category: 'cold',
    short_description: 'Full-body cold water immersion, 8 to 12 degrees Celsius.',
    what_it_does: 'Strong sympathetic spike then large parasympathetic rebound, dopamine and norepinephrine surge, brown fat activation, mental resilience training.',
    steps: [
      'Fill tub or plunge with cold water at 8 to 12 degrees Celsius',
      'Enter slowly, submerge to shoulders',
      'Control breathing, slow exhale bias',
      'Stay 2 to 5 minutes (advanced 10 minutes)',
      'Exit, rewarm naturally',
    ],
    dosing: {
      frequency: '2 to 4 sessions per week',
      duration: '2 to 5 minutes per session (10 minute max for advanced)',
      timing: 'Morning for dopamine peak. Not within 6 hours post-strength session if hypertrophy is the goal.',
    },
    required_equipment: ['cold_plunge_full'],
    contraindications: [
      'Uncontrolled cardiac condition',
      'Recent cardiac event',
      'Raynaud\'s syndrome',
      'Uncontrolled hypertension',
      'Pregnancy',
    ],
    safety_notes: 'Never plunge alone at extended durations. Never combine with breath-hold cycles. Do not force through severe shivering.',
    coach_doctrine: 'Higher-dose cold. Only for clients in optimisation or post-optimisation body state, with cardiovascular clearance. Do not confuse with the face immersion protocol - different dose, different application.',
  },
  {
    slug: 'cryo-chamber',
    name: 'Whole-Body Cryotherapy Chamber',
    category: 'cold',
    short_description: 'Standing cold-air chamber at minus 110 to minus 140 degrees Celsius for 2 to 3 minutes.',
    what_it_does: 'Extreme brief cold. Elevates norepinephrine sharply, may reduce muscle soreness, popular for recovery from acute inflammation.',
    steps: [
      'Enter dry, in undergarments plus dry gloves and socks',
      'Stand, breathe normally',
      'Stay 2 to 3 minutes maximum',
      'Exit, move to warm room, walk to rewarm',
    ],
    dosing: {
      frequency: '1 to 3 sessions per week',
      duration: '2 to 3 minutes per session',
      timing: 'Post-training if targeting acute inflammation. Not the same day as extended cold plunge.',
    },
    required_equipment: ['cryo_chamber'],
    contraindications: [
      'Uncontrolled cardiac condition',
      'Raynaud\'s syndrome',
      'Cold urticaria',
      'Pregnancy',
      'Peripheral neuropathy',
    ],
    safety_notes: 'Must be dry entering the chamber (moisture causes frostbite). Never stay past the operator\'s time limit.',
    coach_doctrine: 'Available in some commercial gyms and dedicated recovery centres. Evidence for muscle soreness modest, evidence for mental effect strong. Do not use if hypertrophy is the primary training goal in the same 24-hour window.',
  },
  {
    slug: 'contrast-shower',
    name: 'Contrast Shower',
    category: 'contrast',
    short_description: 'Alternating hot and cold in one shower for circulatory training.',
    what_it_does: 'Vascular pumping (dilate-constrict-dilate) may reduce muscle soreness and support recovery from swelling. Autonomic training via repeated stress-relax cycles.',
    steps: [
      'Start warm, get comfortable',
      'Switch to fully cold for 60 seconds',
      'Switch back to warm for 60 to 90 seconds',
      'Repeat 3 to 4 cycles',
      'Always finish on cold if the goal is alertness, finish on warm if the goal is sleep',
    ],
    dosing: {
      frequency: '3 to 5 times per week',
      duration: '6 to 10 minutes total',
      timing: 'Morning to finish cold. Evening to finish warm.',
    },
    required_equipment: ['shower'],
    contraindications: ['Uncontrolled cardiac condition', 'Recent cardiac event'],
    safety_notes: 'Do not push cold cycles beyond 90 seconds without acclimation. Skip if feeling unwell.',
    coach_doctrine: 'Best entry-point contrast tool - no equipment beyond a shower. Adherence-friendly. Broadly safe. Layered onto the daily cold shower protocol once tolerance is established.',
  },
  {
    slug: 'contrast-pool',
    name: 'Contrast Pool Plunge',
    category: 'contrast',
    short_description: 'Alternating hot pool / plunge pool at gyms with both, for stronger contrast dose.',
    what_it_does: 'Same vascular pumping as contrast shower but a much larger cold dose (full submersion). Popular post-training in commercial gym recovery centres.',
    steps: [
      'Warm pool or hot tub, 3 to 5 minutes',
      'Cold plunge, 30 to 60 seconds',
      'Warm pool, 2 to 3 minutes',
      'Cold plunge, 30 to 60 seconds',
      'Repeat 3 to 4 cycles',
    ],
    dosing: {
      frequency: '1 to 3 sessions per week',
      duration: '15 to 25 minutes total',
      timing: 'Post-training. Not within 6 hours of a hypertrophy session.',
    },
    required_equipment: ['cold_plunge_full'],
    contraindications: ['Uncontrolled cardiac condition', 'Recent cardiac event', 'Pregnancy', 'Uncontrolled hypertension'],
    safety_notes: 'Never exceed 60 seconds in cold plunge in contrast cycles without acclimation. Rewarm fully in the warm pool between cycles.',
    coach_doctrine: 'Higher-dose contrast for clients with commercial gym access. Not superior to contrast shower for most goals - the shower version is enough.',
  },
  {
    slug: 'compression-boots',
    name: 'Compression Boots',
    category: 'compression',
    short_description: 'Sequential pneumatic compression of the legs, 20 to 30 minutes.',
    what_it_does: 'Sequential inflation from feet to hips pushes fluid centrally, may reduce muscle soreness and support venous return. Popular after long-duration training and standing days.',
    steps: [
      'Sit or lie down comfortably',
      'Fit compression boots and connect to the compressor',
      'Select a recovery program (typical: full leg sequential, 20 to 30 minutes, pressure 60 to 80 mmHg)',
      'Relax during the cycle',
      'Remove boots, walk 2 minutes to redistribute fluid',
    ],
    dosing: {
      frequency: '2 to 5 times per week',
      duration: '20 to 30 minutes per session',
      timing: 'Post-training, or standalone on standing / travel days.',
    },
    required_equipment: ['compression_boots'],
    contraindications: [
      'Deep vein thrombosis (current or recent)',
      'Uncontrolled heart failure',
      'Severe peripheral arterial disease',
      'Open wounds or infections on the legs',
    ],
    safety_notes: 'Skip on legs with fresh injuries. Do not exceed 100 mmHg pressure without professional supervision.',
    coach_doctrine: 'Best recovery tool for training loads where legs bear the biggest fatigue. Common in commercial gyms including Anytime Fitness. Client should tag if their gym has them so we can prescribe.',
  },
  {
    slug: 'massage-gun',
    name: 'Percussion Massage Gun',
    category: 'compression',
    short_description: 'Handheld percussive therapy device for targeted muscle release.',
    what_it_does: 'Localised percussive stimulation may reduce muscle stiffness, improve range of motion in the short term. Best used before or between sessions, not during acute injury.',
    steps: [
      'Select a soft or medium attachment for muscle bellies',
      'Turn on at low speed, 2000 rpm',
      'Glide over the target muscle for 1 to 2 minutes',
      'Do not press into bone, joints, or nerves',
      'Repeat on the other side for symmetric coverage',
    ],
    dosing: {
      frequency: 'Daily as needed',
      duration: '1 to 2 minutes per muscle group, 10 minutes max per session',
      timing: 'Pre-training for mobility. Post-training for perceived recovery.',
    },
    required_equipment: ['massage_gun'],
    contraindications: ['Acute injury with swelling', 'Blood thinners without medical clearance', 'Fracture or open wound'],
    safety_notes: 'Never use over the front of the neck, spine, or joint capsules. Reduce speed if bruising occurs.',
    coach_doctrine: 'Symptom-management tool, not a driver of adaptation. Useful for adherence and perceived recovery. Do not oversell the recovery benefit.',
  },
  {
    slug: 'vibration-plate',
    name: 'Whole-Body Vibration Plate',
    category: 'compression',
    short_description: 'Standing on a vibrating platform for neuromuscular activation and circulation.',
    what_it_does: 'Vibration triggers muscle spindle reflex activity. May improve circulation, warm-up efficiency, and mild bone-loading stimulus.',
    steps: [
      'Stand on the plate with slightly bent knees',
      'Set to low frequency (25 to 40 Hz) and low amplitude',
      'Hold static positions or do slow bodyweight movements',
      'Stay 5 to 10 minutes total',
    ],
    dosing: {
      frequency: '2 to 4 times per week',
      duration: '5 to 10 minutes per session',
      timing: 'Warm-up before training, or standalone on recovery days.',
    },
    required_equipment: ['vibration_plate'],
    contraindications: ['Pregnancy', 'Acute deep vein thrombosis', 'Uncontrolled hypertension', 'Recent joint replacement'],
    safety_notes: 'Never stand fully straight-legged (vibration transmits to spine). Keep sessions short.',
    coach_doctrine: 'Modest evidence for bone-density support in older clients. Adjunct tool, not a driver. Use for adherence-friendly warm-up.',
  },
  {
    // Added 2026-08-17 from the Deep Research report at
    // 00_PLAYBOOK/recovery_research/2026-08-17_Light_Exposure_Timing.md
    //
    // TWO ENTRIES, and the split IS the finding. Morning light is a STRESSOR:
    // an ipRGC-driven alerting and phase-advancing input, strong enough that
    // it can precipitate hypomania in bipolar clients. Evening light reduction
    // is NOT a downregulator, it is the REMOVAL of a stressor, which is a
    // different thing again and needed a new classification (see the evening
    // entry below). Filing "light" as one protocol would have repeated the
    // cold bug for the third time.
    slug: 'morning-light-exposure',
    name: 'Morning Light Exposure',
    category: 'light',
    short_description: 'Twenty minutes outdoors within an hour of waking. The highest-leverage circadian lever, and free.',
    what_it_does: 'Light after waking falls on the advance limb of the phase response curve and pulls the body clock earlier, via melanopsin-containing retinal cells signalling the suprachiasmatic nucleus. That pathway is demonstrated, not inferred. Outdoor light delivers an order of magnitude more of the relevant stimulus than any indoor room. Its most consistent real-world associations are with waking more easily and being less tired during the day, rather than with falling asleep faster.',
    steps: [
      'Outside within 60 minutes of waking. Verandah, footpath, backyard, or pair it with a walk',
      'Twenty to thirty minutes. Do not extend it chasing a bigger effect, the dose saturates',
      'Eyes open, NO sunglasses and no prescription tint during the window. The pathway is ocular',
      'Hat, sleeves and sunscreen for the skin. The eyes need the exposure, the skin does not, and this is Queensland',
      'Never look directly at the sun',
      'Not through a window. Standard glazing plus indoor geometry drops the dose by roughly ten times',
      'Through the day, take breaks outdoors and sit near windows where you can',
    ],
    dosing: {
      frequency: 'Daily, or at minimum five to six days a week.',
      duration: '20 to 30 minutes.',
      intensity_notes: 'THERE IS NO PROGRESSION AND THIS IS THE PART COACHES GET WRONG. Light does not progressively overload, the dose-response saturates. The only thing that progresses is consistency of timing. Progress the regularity, never the duration or intensity.',
      timing: 'Within 60 minutes of waking. Consistency of timing outranks everything else in this protocol, including duration.',
    },
    required_equipment: ['none_needed'],
    contraindications: [
      'SCREEN BEFORE PRESCRIBING. Snoring plus witnessed pauses plus daytime sleepiness, or an Epworth of 16 or more, means suspected obstructive sleep apnoea: refer, do not prescribe. Treating apnoea as insomnia is the specific harm this screen exists to prevent. Note the STOP-Bang under-detects in women (77% sensitivity, 45% specificity, AUC 0.67 in midlife women) and the most sensitive single item for them is observed apnoeas, while OSA prevalence reaches 27% in perimenopause and 29% after it. A low score in a midlife woman does not clear her. Also refer rather than prescribe if the complaint has run three months or more and looks like chronic insomnia disorder, if she is on a hypnotic, or if restless legs or a parasomnia is suspected',
      'Bipolar diagnosis or family history, IF a light box is involved. Bright morning light has precipitated hypomania, mania and mixed states; one trial moved to midday dosing after three of its first four pilot patients on morning light developed mixed states. Going outside is a lifestyle behaviour and is between them and their psychiatrist. Prescribing a box is treatment of a psychiatric condition and is out of scope',
      'Photosensitising medication (lithium, phenothiazines, some tricyclics, tetracyclines, some retinoids). Ask what they take BEFORE recommending any device. Prescriber sign-off first',
      'Any pre-existing eye condition: outdoor light only, and an eye-care referral before any device',
      'Active migraine or prodrome. Photophobia is common; use shaded outdoor light or defer',
      'A client who is already turning sleep into a compliance metric to fail at. Withdraw it',
    ],
    safety_notes: 'A systematic review of 43 articles found ocular complaints in 0 to 45% of light-therapy participants with no consistent dose relationship, and no evidence of ocular damage except one maculopathy case in someone taking a photosensitising antidepressant. It appears safe for the eyes in physically healthy unmedicated people, and understudied in those with existing ocular abnormality. Never instruct anyone to look at the sun or a light box directly. Stop and record if it triggers headache, migraine, persistent eye discomfort or agitation.',
    coach_doctrine: 'Rank it first among everything in the light category, by a wide margin, then be honest about why. It is first on mechanism, cost, and the fact that it drags three other behaviours with it: wake-time regularity, movement, and being outside. It is NOT first on trial evidence in our clients, because there is no adequate trial of morning light for sleep in normally entrained midlife adults who simply sleep badly. The light-therapy trials are in older, post-stroke, cancer and dementia populations, and the big outdoor-time associations come from 400,000 people in an observational cohort where reverse causation is entirely live. Prescribe it on mechanism, coherence and near-zero cost, and say that to the client. Two Brisbane-specific points. The light box is mostly redundant here: its role in the literature is as a substitute for daylight that is unavailable, and at 27 degrees south daylight clears the target every day of the year. The binding constraint is behavioural, not photonic. And the UV conflict is real: the exposure that matters is ocular, so protect the skin and leave the eyes uncovered, which is the opposite of what most people do outside in summer. Finally, it is a STRESSOR, an alerting input, but a very cheap one with no metabolic or mechanical cost, timed to when arousal is wanted. Do NOT clamp it under acute fatigue, chronic recovery debt, post-diet or overreaching. Under those states it is arguably more indicated, not less.',
  },
  {
    slug: 'evening-light-reduction',
    name: 'Evening Light Reduction',
    category: 'light',
    short_description: 'Dim the house for three hours before bed. Make it dim, not orange.',
    what_it_does: 'Removes the melatonin-suppressing and phase-delaying input that ordinary household lighting supplies. Evening melatonin suppression is half-maximal at around 25 lux, which is dim room light, so the relevant variable is total brightness rather than colour. Reducing it demonstrably protects melatonin timing and circadian phase.',
    steps: [
      'From three hours before intended sleep: overhead lights off, lamps only',
      'Screens to the lowest comfortable brightness. Dragging the brightness slider down is the part that works',
      'Aim for a room where you would struggle to read fine print comfortably',
      'Bedroom as close to fully dark as practical for the sleep period itself',
      'Make it dim, not orange. Changing a screen spectrum without changing brightness does not meaningfully help',
    ],
    dosing: {
      frequency: 'Nightly.',
      duration: 'The full three hours before intended sleep.',
      intensity_notes: 'Less is better on a curve that flattens below about 1 lux. There is no defensible minimum effective dose in free-living adults because nobody has measured one. Sensitivity varies more than fiftyfold between individuals (half-maximal suppression anywhere from 6 to 350 lux), so the same room is a strong stimulus for one client and negligible for another, and there is currently no way to predict which. Treat non-response as informative rather than as non-compliance.',
      timing: 'Window opens three hours before habitual bedtime.',
    },
    required_equipment: ['none_needed'],
    contraindications: [
      'SCREEN BEFORE PRESCRIBING. Snoring plus witnessed pauses plus daytime sleepiness, or an Epworth of 16 or more, means suspected obstructive sleep apnoea: refer, do not prescribe. Treating apnoea as insomnia is the specific harm this screen exists to prevent. Note the STOP-Bang under-detects in women (77% sensitivity, 45% specificity, AUC 0.67 in midlife women) and the most sensitive single item for them is observed apnoeas, while OSA prevalence reaches 27% in perimenopause and 29% after it. A low score in a midlife woman does not clear her. Also refer rather than prescribe if the complaint has run three months or more and looks like chronic insomnia disorder, if she is on a hypnotic, or if restless legs or a parasomnia is suspected',
      'Falls risk, poor night vision, or an unfamiliar or cluttered home. Dimming a house has a trip hazard attached and it is the only real downside this protocol has',
      'A client already turning sleep into a compliance metric to fail at',
    ],
    safety_notes: 'Essentially no physiological risk, because the intervention is subtraction. The practical risks are domestic: tripping in a dim house, and friction with the rest of the household, who did not agree to this.',
    coach_doctrine: 'Rank it second, behind morning light and ahead of anything worn on the face, and be blunt about the two things clients will ask for. FIRST, blue-blocking glasses. The Cochrane review of blue-light-filtering lenses (17 RCTs) found they probably make no difference to eye strain, could draw no conclusion on sleep, and no included trial even measured melatonin. For evening amber glasses specifically, the only meta-analysis restricted to double-blind crossover actigraphy found nothing significant on any objective endpoint, while subjective effects were large. That gap is the unblinding signature. Worse, the lenses that produce the biggest effects are the ones that also dim everything (30 to 45% light transmission), so the wavelength intervention is partly an intensity intervention in a costume. They are a legitimate behavioural bookend for ending the evening. They are not a photobiological tool and should not be sold as one. SECOND, screen night-mode. A 167-person randomised trial found no difference between Night Shift on, Night Shift off, and no phone at all, and a separate study found spectral warming without a brightness change did not reduce melatonin suppression. It is effectively zero as a standalone. Enable it because it is free, not because it works. The instruction that actually carries the effect is "make the house dim", not "make the light orange". One classification note for the platform: this is NOT a downregulator, it adds nothing. It removes a stressor that should not have been there. It never needs clamping and its ceiling does not move with recovery state.',
  },
  {
    slug: 'red-light-therapy',
    name: 'Red / Near-Infrared Light Therapy',
    category: 'light',
    short_description: 'Red (630 to 680 nm) plus near-infrared (810 to 850 nm) light exposure.',
    what_it_does: 'Photobiomodulation supports mitochondrial function via cytochrome c oxidase. Evidence base is strongest for skin health, moderate for musculoskeletal recovery, moderate for sleep quality when timed correctly.',
    steps: [
      'Position 15 to 30 cm from the panel or use full-body bed',
      'Expose target area (torso, legs, or full body) for 10 to 20 minutes',
      'Eyes closed or protected during direct panel exposure',
      'Ideal in the morning or midday, avoid within 3 hours of bed if bright panel',
    ],
    dosing: {
      frequency: '3 to 5 sessions per week',
      duration: '10 to 20 minutes per session',
      timing: 'Morning to midday preferred. Full-body bed sessions can go longer (up to 30 minutes).',
    },
    required_equipment: ['red_light_panel'],
    contraindications: ['Active melanoma or recent skin cancer treatment', 'Photosensitising medications', 'Pregnancy - avoid direct abdominal exposure'],
    safety_notes: 'Do not stare into the panel. Skin heating means dose is too high or too close. Some medications increase photosensitivity (check with prescribing doctor).',
    coach_doctrine: 'Strongest evidence: skin, wound healing, mild musculoskeletal recovery. Modest evidence: sleep, mood, cognitive. Do not oversell. Best as an adherence-friendly daily anchor.',
  },
  {
    slug: 'breathwork-wim-hof',
    name: 'Wim Hof Style Breathing',
    category: 'breathwork',
    short_description: '30 to 40 deep breaths followed by breath retention, repeated in rounds.',
    what_it_does: 'Cycles of hyperventilation followed by breath-hold shift blood chemistry (respiratory alkalosis then CO2 tolerance) and produce a strong sympathetic-then-parasympathetic wave. Mental resilience and stress inoculation are the strongest documented benefits.',
    steps: [
      'Lie down or sit safely (never near water, never driving)',
      '30 to 40 deep breaths, full inhale, passive exhale',
      'On the last exhale, hold breath as long as comfortable',
      'When the urge to breathe is strong, take one deep breath and hold 15 seconds',
      'Repeat for 3 to 4 rounds',
    ],
    dosing: {
      frequency: '3 to 5 sessions per week',
      duration: '10 to 20 minutes per session',
      timing: 'Morning for alertness. Not within 4 hours of bed.',
    },
    required_equipment: ['none_needed'],
    contraindications: [
      'Pregnancy',
      'Uncontrolled cardiac condition',
      'Epilepsy or seizure disorder',
      'Anxiety or panic disorder (unless supervised)',
      'History of syncope or vaso-vagal episodes',
    ],
    safety_notes: 'NEVER perform while driving, near water (pool, bath, ocean), or standing. Fainting risk from prolonged breath-holds is real. If dizzy, stop.',
    coach_doctrine: 'Strong tool for the right client - active, no contraindications, mentally ready. Not for depleted or anxious clients. Never as a first-line breathwork tool.',
  },
  {
    slug: 'breathwork-box',
    name: 'Box Breathing (4-4-4-4)',
    category: 'breathwork',
    short_description: 'Equal-count inhale, hold, exhale, hold.',
    what_it_does: 'Slows respiratory rate to 4 to 6 breaths per minute, activates the parasympathetic system, sharpens focus while lowering physiological arousal.',
    steps: [
      'Sit upright, hands resting',
      'Inhale through the nose for 4 seconds',
      'Hold for 4 seconds',
      'Exhale through the nose or mouth for 4 seconds',
      'Hold empty for 4 seconds',
      'Repeat for 5 to 10 minutes',
    ],
    dosing: {
      frequency: 'Daily as needed',
      duration: '5 to 10 minutes per session',
      timing: 'Anytime. Especially useful pre-important-meeting or in acute stress.',
    },
    required_equipment: ['none_needed'],
    contraindications: ['Pregnancy - avoid breath-holds, use 4-6 breathing instead'],
    safety_notes: 'Safe for almost everyone. If the 4-count hold is uncomfortable, drop to 3-3-3-3.',
    coach_doctrine: 'The universal safe breathwork tool. First-line prescription for stress regulation. Anyone can do it, anywhere, no equipment.',
  },
  {
    slug: 'breathwork-physiological-sigh',
    name: 'Physiological Sigh',
    category: 'breathwork',
    short_description: 'Double inhale followed by extended exhale for rapid stress reset.',
    what_it_does: 'Fastest documented way to lower heart rate and physiological arousal. Two nasal inhales stack alveolar recruitment, extended exhale clears CO2 and activates parasympathetic tone.',
    steps: [
      'Inhale through the nose deeply',
      'On top of that inhale, take a second short sharp inhale (through the nose)',
      'Long slow exhale through the mouth',
      'Repeat 1 to 3 times',
    ],
    dosing: {
      frequency: 'On demand',
      duration: '30 to 60 seconds total',
      timing: 'Anytime you feel stress escalating. Pre-sleep to accelerate onset.',
    },
    required_equipment: ['none_needed'],
    contraindications: [],
    safety_notes: 'Safe for everyone.',
    coach_doctrine: 'The tool to teach every client on day one. Fastest state-shifter available. Works in under a minute.',
  },
  {
    slug: 'breathwork-478',
    name: '4-7-8 Breathing (Sleep Onset)',
    category: 'breathwork',
    short_description: 'Inhale 4, hold 7, exhale 8 - designed for sleep-onset.',
    what_it_does: 'Extended exhale relative to inhale strongly activates parasympathetic tone. Repeated cycles reliably shift the body toward sleep.',
    steps: [
      'Lie down in bed',
      'Inhale through the nose for 4 counts',
      'Hold breath for 7 counts',
      'Exhale slowly through the mouth for 8 counts',
      'Repeat 4 to 8 cycles',
    ],
    dosing: {
      frequency: 'Nightly as needed',
      duration: '4 to 8 cycles',
      timing: 'In bed, ready to sleep.',
    },
    required_equipment: ['none_needed'],
    contraindications: ['Pregnancy - modify to 4-4-6 without the extended hold'],
    safety_notes: 'Safe for adults. If the 7-count hold is uncomfortable, drop to 4-6-8 or 4-4-6.',
    coach_doctrine: 'First-line sleep-onset tool. Prescribe when the client reports racing mind at night or long sleep latency.',
  },
  {
    slug: 'breathwork-coherent',
    name: 'Coherent Breathing (5.5 bpm)',
    category: 'breathwork',
    short_description: 'Slow steady breathing at 5.5 breaths per minute (about 6 seconds in, 6 seconds out).',
    what_it_does: 'Synchronises heart rate variability with breathing (respiratory sinus arrhythmia), improves HRV, supports baroreflex sensitivity, best-documented tool for sustained parasympathetic tone.',
    steps: [
      'Sit or lie down',
      'Inhale slowly for 5 to 6 seconds',
      'Exhale slowly for 5 to 6 seconds',
      'No breath-holds',
      'Continue for 10 to 20 minutes',
    ],
    dosing: {
      frequency: 'Daily or 5 sessions per week',
      duration: '10 to 20 minutes per session',
      timing: 'Anytime. Especially useful pre-training or in the evening.',
    },
    required_equipment: ['none_needed'],
    contraindications: [],
    safety_notes: 'Safe for everyone. If 5-second cycles feel too long, start at 4-4 and extend over weeks.',
    coach_doctrine: 'The best-evidenced breathwork tool for sustained autonomic regulation. Slow burn - effects accumulate over weeks. Prescribe for chronically dysregulated clients.',
  },
  {
    slug: 'deload-week',
    name: 'Deload Week Protocol',
    category: 'systemic',
    short_description: 'Structured reduction in training volume and intensity for one week to allow full recovery.',
    what_it_does: 'Reduces cumulative training stress while preserving movement patterns and skill. Allows tissue, neuromuscular, and endocrine recovery. Every 4 to 8 weeks depending on training age and RRS state.',
    steps: [
      'Reduce training volume by 40 to 60 percent (fewer sets, same movements)',
      'Reduce intensity by 20 to 30 percent (leave 3 to 4 reps in reserve on every set)',
      'Keep training frequency the same (do not stop training)',
      'Increase sleep window by 30 to 60 minutes',
      'Keep nutrition at maintenance (do not cut calories)',
      'Add one extra recovery modality (sauna, walk, breathwork)',
    ],
    dosing: {
      frequency: 'Every 4 to 8 weeks',
      duration: '7 days',
      timing: 'Scheduled proactively. Or reactively when RRS acute_fatigue or ns_overload state activates.',
    },
    required_equipment: ['none_needed'],
    contraindications: [],
    safety_notes: 'Do not confuse with a training break. Deload keeps training going at reduced load - protects skill and neuromuscular pattern.',
    coach_doctrine: 'Deload is training, not rest. Skill maintenance and lower endocrine load. If RRS routes the client into acute_fatigue, deload week is the first coach-side prescription alongside the RRS constraint envelope.',
  },
  {
    slug: 'sleep-debt-recovery',
    name: 'Sleep Debt Recovery Protocol',
    category: 'systemic',
    short_description: 'Structured week to recover from accumulated sleep loss.',
    what_it_does: 'Extends sleep opportunity, adds strategic napping, reduces stimulants, aligns light exposure and meal timing to circadian anchors.',
    steps: [
      'Bring bedtime forward by 60 minutes for 7 days',
      'Add a 20 to 30 minute nap between 1 and 3 pm',
      'Cut caffeine off by noon',
      'Get 10 minutes of sunlight within 30 minutes of waking',
      'Last meal 3 hours before bed',
      'Magnesium glycinate 400mg 30 minutes before bed if not already prescribed',
    ],
    dosing: {
      frequency: 'As needed after any week averaging under 6.5 hours sleep',
      duration: '7 days',
      timing: 'Start on the first evening after realising the debt.',
    },
    required_equipment: ['none_needed'],
    contraindications: [
      'SCREEN BEFORE PRESCRIBING. Snoring plus witnessed pauses plus daytime sleepiness, or an Epworth of 16 or more, means suspected obstructive sleep apnoea: refer, do not prescribe. Treating apnoea as insomnia is the specific harm this screen exists to prevent. Note the STOP-Bang under-detects in women (77% sensitivity, 45% specificity, AUC 0.67 in midlife women) and the most sensitive single item for them is observed apnoeas, while OSA prevalence reaches 27% in perimenopause and 29% after it. A low score in a midlife woman does not clear her. Also refer rather than prescribe if the complaint has run three months or more and looks like chronic insomnia disorder, if she is on a hypnotic, or if restless legs or a parasomnia is suspected','Do not oversleep by more than 90 minutes in one night (rebound insomnia risk)'],
    safety_notes: 'Naps longer than 30 minutes risk sleep inertia and evening sleep-onset problems.',
    coach_doctrine: 'Sleep debt cannot be paid off in one long night. Requires a full week of consistent extension. Pair with reduced training intensity for that week.',
  },
  {
    // Added 2026-08-17 from the Deep Research report at
    // 00_PLAYBOOK/recovery_research/2026-08-17_Restorative_and_Yin_Yoga.md
    //
    // TWO ENTRIES, NOT ONE. The report's central verdict: restorative and Yin
    // are different stimuli with different risk profiles and different RRS
    // gating, and merging them repeats the whole-body-versus-face-only cold
    // error exactly. Restorative downregulates by SUBTRACTION (no load, no
    // discomfort, no metabolic cost). Yin ADDS end-range passive load and
    // deliberately courts mild discomfort. Do not merge them.
    slug: 'restorative-yoga',
    name: 'Restorative Yoga',
    category: 'movement',
    short_description: 'Fully propped, fully supported shapes held long. Structured rest, not a workout.',
    what_it_does: 'Downregulates by subtraction rather than by adding a relaxing stimulus. The client is horizontal, fully supported, not producing force, not making decisions and not on a device. Metabolic demand is near resting. The demonstrated benefits are subjective: perceived stress, quality of life and self-reported sleep. Measured autonomic and endocrine change has not been shown.',
    steps: [
      'Dim the room, floor or bed, blanket for warmth, eye cover if wanted',
      'Prop every shape so no muscle is holding position. Folded blankets and cushions substitute for bolsters, books for blocks',
      'If the client can feel a muscle working, add another prop',
      'Four to six shapes: supported reclined chest opener, supported side-lying, legs elevated, supported neutral-spine rest, final supine rest',
      'Five to ten minutes per shape',
      'Nasal breathing, unforced, exhale longer than inhale. No counting drills',
    ],
    dosing: {
      frequency: '2 to 3 sessions per week. Permitted daily.',
      duration: '20 to 45 minutes.',
      intensity_notes: 'There is no depth in restorative yoga. Progress by consistency and session length only. A client progressing depth has drifted into Yin.',
      timing: 'Evening, 60 to 90 minutes before intended sleep. Any day including hard training days, since it adds no load.',
    },
    required_equipment: ['none_needed'],
    contraindications: [
      'Known or suspected low bone density: remove all loaded end-range spinal flexion. Supported forward folds out, supported extension and neutral-spine shapes stay',
      'Pregnancy: refer to their maternity care provider before prescribing',
      'Client who reports increased rumination, distress or intrusive thought during stillness. Stop and substitute something with an external focus. Do not tell them to sit with it',
    ],
    safety_notes: 'Physical risk is low. Across 94 RCTs and 8430 participants there was no excess of adverse events versus usual care or exercise, though reporting is poor and only 3 of 13 trials in the 2024 stress meta-analysis reported safety data at all. The one real physical concern is bone: two case series document vertebral compression fracture in people with osteopenia or osteoporosis after taking up yoga spinal flexion. Case series cannot size the risk, but loaded end-range spinal flexion in a low-density spine is a known fracture mechanism and a long supported forward fold is exactly that shape held for minutes. Screen before prescribing.',
    coach_doctrine: 'Prescribe for adherence, subjective recovery and behavioural downshift. Do NOT prescribe on a promise of HRV, cortisol or hormonal change. The best-designed trial (PRYSMS, n=180, 48 weeks, NIH-funded, active stretching control) went the wrong way: waking and bedtime cortisol improved MORE in the stretching control, and perceived stress fell 2.0 points further in stretching at 12 months. The 2024 meta-analysis found yoga beat passive controls on stress (SMD -0.69) but showed no advantage over active controls short term and a long-term result FAVOURING the control. The effect is roughly the size of the control group sitting still. Post hoc, the cortisol improvement tracked feelings of belonging rather than stress scores, which points at the room rather than the practice. So: if the client already does an equivalent volume of any other low-intensity movement in a social setting, adding this buys nothing measurable. Where it genuinely earns its place is as a permitted activity while training load is clamped, because it gives a driven client something to do and that is often the only way a deload sticks.',
  },
  {
    // Added 2026-08-17 from the Deep Research report at
    // 00_PLAYBOOK/recovery_research/2026-08-17_Evening_Mobility_Wind_Down.md
    //
    // The report's recommendation was NOT to give this standalone status: it
    // does not earn it on physiology, and filing it as a sleep protocol risks
    // coaches prescribing it INSTEAD of the things that work. It is here
    // anyway, as a single entry, because the alternative was inventing a
    // sleep-hygiene protocol nobody has researched. The protection lives in
    // the doctrine field instead: it names the better options explicitly and
    // forbids the sleep-treatment framing.
    //
    // Deliberately NOT credited as downregulation in the RRS table. The report
    // is explicit that it should not consume downregulation budget, because it
    // is not reliably delivering any.
    slug: 'evening-winddown-mobility',
    name: 'Evening Wind-Down Mobility',
    category: 'movement',
    short_description: 'A fixed 10-minute nightly sequence. A boundary marker for the end of the day, not a sleep treatment.',
    what_it_does: 'Gives a disorganised evening a fixed edge. Its demonstrated effect is behavioural, not physiological: the same short sequence at the same time each night marks that the day is finished. It has one specific evidenced medical indication, nocturnal leg cramps in adults over 55, where nightly calf and hamstring stretching immediately before bed reduced cramps by 1.2 per night and pain by 1.3cm on a 10cm scale in a properly randomised concealed-allocation trial.',
    steps: [
      'Same time every night, 30 to 60 minutes before target lights-out',
      'Floor or bed, lights dimmed, phone out of the room or face down and silent, room already at sleeping temperature',
      'Four to six positions, holds of 30 to 60 seconds, SAME ORDER every night',
      'Intensity at 3 to 4 out of 10 stretch sensation. Never at the point of discomfort. If their face changes, it is too hard',
      'Slow nasal breathing throughout, exhale longer than inhale. Never hold the breath',
      'Default sequence: supine or seated calf, supine hamstring with a strap, half-kneeling or supine hip flexor, supine spinal rotation, child\'s pose or seated fold, then two minutes supine with no stretch and slow breathing only',
      'If nocturnal cramps are the reason for prescribing, calf and hamstring are mandatory and the whole sequence moves to immediately before getting into bed',
    ],
    dosing: {
      frequency: 'Nightly. Consistency is the entire point.',
      duration: '8 to 12 minutes.',
      intensity_notes: 'THERE IS NO PROGRESSION AND THAT IS DELIBERATE. Do not add volume, intensity or positions. The value is that it is identical every night. A client who wants progression wants a mobility programme, which is a different prescription in a different slot in the day.',
      timing: '30 to 60 minutes before target lights-out. For the cramp indication, immediately before getting into bed, since that is what the positive trials did and the negative trial did not. If pairing with a warm shower, the shower goes 1 to 2 hours out and this sits after it, closer to bed.',
    },
    required_equipment: ['none_needed'],
    contraindications: [
      'SCREEN BEFORE PRESCRIBING. Snoring plus witnessed pauses plus daytime sleepiness, or an Epworth of 16 or more, means suspected obstructive sleep apnoea: refer, do not prescribe. Treating apnoea as insomnia is the specific harm this screen exists to prevent. Note the STOP-Bang under-detects in women (77% sensitivity, 45% specificity, AUC 0.67 in midlife women) and the most sensitive single item for them is observed apnoeas, while OSA prevalence reaches 27% in perimenopause and 29% after it. A low score in a midlife woman does not clear her. Also refer rather than prescribe if the complaint has run three months or more and looks like chronic insomnia disorder, if she is on a hypnotic, or if restless legs or a parasomnia is suspected',
      'Diagnosed insomnia. Do not position this as therapy. CBT-i is first line and that is a referral, not a prescription',
      'Restless legs symptoms. Refer, do not treat. Iron studies and diagnosis are outside scope',
      'Diagnosed bruxism or evening jaw clenching: do NOT add masticatory stretching. The only trial found MORE bruxism bursts, not fewer',
      'Hypermobility or post-partum laxity: skip end-range passive holds, use active mobility and isometrics instead',
      'High cardiovascular risk, IF holds are taken to the point of discomfort. Static stretching to maximum discomfort raises systolic and diastolic pressure and rate-pressure product. At the prescribed sub-discomfort intensity this is a non-issue, which is why the intensity is specified',
      'Any client where this pushes actual lights-out later. A protocol that costs sleep duration to chase sleep quality is a net loss. Cut it or move it earlier',
      'Clients whose sleep problem is a racing mind rather than physical discomfort. The polysomnography evidence says this has nothing for them',
    ],
    safety_notes: 'Physically close to nil at the prescribed intensity, with no adverse events across the trial base. The breathing instruction is a safety instruction, not a relaxation flourish: breath-holding against a closed glottis during a hard stretch amplifies the pressor response. The real risk here is psychological. A client with sleep-onset anxiety who is told stretching will help them fall asleep, and then does not fall asleep, has been handed one more thing to have failed at, and conditioned arousal is the core maintaining mechanism in chronic insomnia. Framing matters more than the movements. Also watch for the quiet ten minutes becoming a rumination window; if that happens, pair it with audio or move it earlier in the evening.',
    coach_doctrine: 'Frame this to the client as the marker that the day is finished. NEVER as something that will make them fall asleep faster. Both trials that measured objective sleep with polysomnography found nothing: no change in sleep onset latency, sleep efficiency, deep sleep or REM. The best scoping review found only 5 of 16 studies significant on any parameter and 3 of 13 on sleep quality, and concluded there is little evidence stretching improves sleep quality in people with sleep disorders. In postmenopausal women it has been directly tested and lost: yoga beat both control and stretching, while stretching did not beat control. Even the most plausible mediator failed, since the one trial that measured it found the anxiety reduction did not correlate with the sleep improvement. The autonomic story is also intensity-dependent and often backwards: held near the point of discomfort, static stretching produces sympathetic activation with vagal WITHDRAWAL via the exercise pressor reflex, returning to baseline within five minutes, and nobody has shown any shift persists to sleep onset. So do not let it consume downregulation budget. If a client needs vagal load, prescribe breathwork or face-only cold directly and let this be the container they sit inside. AND KNOW THE BETTER OPTION: if the complaint is specifically sleep onset latency, a warm shower or bath at 40 to 42.5 degrees, 1 to 2 hours before bed, shortened onset by around 10 minutes across 13 pooled studies. That is a real effect against a stretching literature that cannot produce one. The one thing this protocol genuinely owns is nocturnal leg cramps in the over-55s, and that is worth having.',
  },
  {
    // Added 2026-08-17 from the Deep Research report at
    // 00_PLAYBOOK/recovery_research/2026-08-17_Low_Intensity_Recovery_Walk.md
    //
    // The report's framing, which the whole entry hangs off: this is a
    // psychological and behavioural intervention wearing physiological
    // clothes. It does NOT speed recovery. Prescribe it for regulation.
    slug: 'recovery-walk',
    name: 'Low-Intensity Recovery Walk',
    category: 'movement',
    short_description: 'Easy, untracked, phone-free walk. Prescribed for regulation, never for recovery.',
    what_it_does: 'Reliably improves mood against the alternative of sitting still, which is the only comparison the evidence actually supports. In a randomised trial a phone-free walk improved every mood measure while a phone walk worsened all of them. Below the first ventilatory threshold it costs roughly 2 to 3 METs, generates no meaningful hormonal excursion and imposes essentially no recovery debt, so it regulates at the level of the day stress budget rather than at the level of the heart.',
    steps: [
      'Flat ground. Outdoors if she prefers it, indoors if she does not, and do not oversell the outdoor difference',
      'Phone away or in the pocket. Audio is allowed if she needs it',
      'Pace test: the speed you would walk showing a friend around while talking the whole way',
      'If she stops talking because she needs the breath, she is too fast. Slow down or end the walk',
      'No warm-up, no intervals, no build. It starts easy and stays easy',
      'No watch, no step count, no distance, no pace. The number turns it into a task',
    ],
    dosing: {
      frequency: '3 to 6 days per week. Deliberately not daily, because dailiness invites compulsion.',
      duration: '10 to 20 minutes. Cap at 30. The post-meal variant is 2 to 10 minutes.',
      intensity_notes: 'Below the first ventilatory threshold. Roughly RPE 9 to 11 on Borg 6-20, around 2 to 3 METs for a deconditioned client. The talk test is more reliable here than a heart rate zone, because a perimenopausal client has a variable heart rate response and an age-predicted maximum that is close to meaningless. Do NOT progress intensity: that is not progression, it is reclassification into conditioning, and conditioning belongs to the program engine.',
      timing: 'Not within an hour of a hard session unless there is a specific reason, and then under 30 minutes to avoid interfering with glycogen resynthesis. Post-meal variant within 15 to 30 minutes of finishing a main meal.',
    },
    required_equipment: ['none_needed'],
    contraindications: [
      'Compulsive exercise features. Walking is the easiest modality to do compulsively because it is available, socially invisible and reads as healthy. If she already walks daily and reports distress when she cannot, this is contraindicated until addressed by an appropriate practitioner',
      'Under-fuelled, low energy availability, restricted intake, or a post-diet state. Do NOT add walking volume, reduce it',
      'Step-count or tracker fixation. Every study in a recent systematic review of tracking technology found at least one positive association with excessive or compulsive exercise',
      'Chronic recovery debt or burnout return WHERE the walk would come out of sleep or rest time. Twenty minutes walking is twenty minutes not spent horizontal',
      'Balance impairment, peripheral neuropathy or vestibular symptoms. Falls risk',
      'Exertional chest discomfort, unusual breathlessness, syncope or presyncope. This is a referral, not a programming adjustment',
      'Clients on insulin or sulfonylureas doing the post-meal variant, without their prescriber guiding hypoglycaemia management. Outside coach scope',
    ],
    safety_notes: 'Heat is the local one. In a Brisbane summer a midday walk is a thermoregulatory stressor, not a downregulator, and that alone flips the classification. Hydration and timing are part of the prescription, not an afterthought. Watch volume creep: step count rises quietly with walking precisely because it does not feel like training, which loads feet, ankles, knees and plantar fascia without anyone noticing. In a high-ruminating client an unstructured silent walk in a stressful environment can amplify rumination rather than settle it, so if she comes back worse, stop.',
    coach_doctrine: 'Prescribe this for regulation and say so out loud. The active-recovery case does not survive scrutiny: the most thorough synthesis found 14 studies showing no next-day performance benefit and none showing benefit, 14 showing no soreness difference against 2 positive, and impaired glycogen resynthesis past 30 minutes. Perceived fatigue actually pointed the wrong way (g=+0.64, favouring doing nothing). Faster lactate clearance is the one robust finding and it is practically irrelevant, since lactate clears on its own within 20 to 120 minutes. The autonomic claim is worse than unsupported, it is backwards: HRV falls during ambulation, so a walk cannot acutely raise it, and the pooled post-exercise evidence found the effect for cold water immersion and not for active recovery. What IS real is affect: a walk beats sitting still on how someone feels, in a pre-registered randomised trial, and the phone-free version beat the phone version on every single mood measure. Also note the soreness benefit that does exist was significantly smaller in women than men, and our clients are mostly women. Two more things to hold: there is no trial of a deliberately easy sub-threshold walk in a depleted or perimenopausal population, so all of this is extrapolated from young rested men and from moderate-intensity training programs; and exercise does NOT relieve vasomotor symptoms, which a 261-woman trial settled clearly enough that its authors said women should not be told otherwise.',
  },
  {
    // Second half of the same report. See the restorative entry above for why
    // these are separate.
    slug: 'yin-yoga',
    name: 'Yin Yoga',
    category: 'movement',
    short_description: 'Long passive holds at end range. A mild stressor with a downregulating layer, and it flips if the client chases depth.',
    what_it_does: 'Applies sustained passive tensile load to muscle-tendon units and joint capsules for minutes at a time, with a slow-breathing and sustained-attention layer over the top. Improves range of motion, as any sustained stretching does. The ROM gain is best explained by increased stretch tolerance rather than tissue lengthening.',
    steps: [
      'Warm room, props available and used: blocks or books under the seat or knees, blanket under the hips',
      'Six to ten shapes targeting hips, hamstrings, adductors, thoracic spine and shoulders',
      'Enter at roughly 60 to 70 percent of available range, NOT end range',
      'Hold 2 to 4 minutes. Continuous slow nasal breathing throughout, exhale-biased',
      'Stop at sensation, never at pain. Numbness, tingling or anything radiating means come out immediately and do not return to that shape today',
      'Exit slowly and rest 30 to 60 seconds between shapes',
    ],
    dosing: {
      frequency: '1 to 2 sessions per week. Not on consecutive days.',
      duration: '30 to 45 minutes. Cap holds at 4 minutes, never past 5. Cap the session at 45 minutes for any client in Remediation.',
      intensity_notes: 'Progress hold duration first (2 to 3 to 4 minutes), then frequency. NEVER progress depth as the primary variable. Note honestly that the stretching literature finds no added ROM benefit past about 4 minutes per session or 10 minutes per week per muscle group, so a long class is justified by the attention and breathing practice, not by tissue adaptation.',
      timing: 'Rest days, or 4 or more hours after training that required force production. Evening preferred. Long passive holds have documented acute effects on peak torque, so keep them away from the hours before heavy or explosive work.',
    },
    required_equipment: ['none_needed'],
    contraindications: [
      'Hypermobility. Contraindicated by default, prescribe restorative instead. Deliberate end-range passive loading with muscles relaxed is the worst possible match for a joint already over-relying on its passive restraints',
      'RRS nervous-system overload, acute fatigue, chronic recovery debt or burnout return. The discomfort component needs a working downregulation response to convert into a recovery stimulus, and in a dysregulated client it does not convert',
      'Known or suspected low bone density: no loaded end-range spinal flexion',
      'Pregnancy. Deep passive hip and pelvic loading is a poor match for a relaxin-affected pelvis. Refer to their maternity care provider and do not prescribe pending clearance',
      'Any client with a dieting or over-control history who treats the hold as an endurance test. Watch for the client who reports it being hard or tracks how deep they got',
    ],
    safety_notes: 'The instruction to tolerate sensation is where the risk lives. A review of 76 published yoga adverse-event case reports found 35.5% musculoskeletal and 18.4% nervous system, with full recovery in only 19.7%. Case reports are biased toward the severe and cannot give incidence, but the mechanism to respect is plain: sustained end-range positions with prolonged nerve compression or tension, held while the client is deliberately ignoring sensation, is a plausible route to a traction or compression neuropathy. Bone risk as per restorative, and worse, because Yin adds load. Psychologically, prolonged stillness can increase rumination rather than reduce it, and the sit-with-discomfort framing converts a recovery protocol into a punishment protocol for the wrong client.',
    coach_doctrine: 'Classification is conditional and depends on execution. With the slow breathing and attention layer intact, Yin is a mild downregulator with a stretch stimulus attached. Without it, when the client is chasing depth, gritting or breath-holding, it is a stressor delivered to someone who was prescribed rest. Two claims to never make. First, Yin does not reduce perceived stress on its own: in its flagship trial the Yin-alone arm was NULL on stress and depression versus no treatment, and only the arm with psychoeducation attached worked. Second, and this is the loudest commercial claim in the category, there is not one human trial measuring fascial or ligamentous property change after a Yin intervention. Not a weak one. None. Viscoelastic creep during a hold is real and transient; durable fascial remodelling is unevidenced in humans. A coach may say Yin loads connective tissue during the hold. A coach may not say it remodels, hydrates, releases or restructures fascia. Saying the latter is reciting marketing.',
  },
  {
    // Added 2026-08-17 from the Deep Research report at
    // 00_PLAYBOOK/recovery_research/2026-08-17_NSDR_Yoga_Nidra_Downregulation_and_Sleep.md
    //
    // Every claim below is bounded by that report. Three things it explicitly
    // forbids and which must NOT creep back in: this does not raise HRV (the
    // only study that tested it was null on every measure), it does not raise
    // dopamine by 65% (that number is an inference chained onto an inference
    // from 8 lifetime meditators), and it does not replace sleep or a nap.
    slug: 'nsdr-yoga-nidra',
    name: 'NSDR / Yoga Nidra',
    category: 'systemic',
    short_description: 'Guided audio downregulation, run daily for weeks. A habit, not a dose.',
    what_it_does: 'Holds the client awake but unaroused while a fixed audio script moves attention through the body. The measured acute change is a drop in respiratory rate. EEG shows an awake state with regional slow-wave intrusion and DECREASED occipital alpha, which is consistent with sustained attention rather than sedation. In poor sleepers, daily practice over four weeks is associated with modest subjective sleep improvement.',
    steps: [
      'Lie supine on a mat or bed, blanket if wanted, room quiet and dimly lit',
      'Headphones or speaker, phone on do-not-disturb, no screens in view',
      'Play the SAME recording every session, the trials used one fixed script',
      'Follow the audio, stay awake if you can, and do not improvise the sequence',
      'Allow 20 minutes of buffer afterwards in case you sleep through',
      'Same time each day, morning or early afternoon',
    ],
    dosing: {
      frequency: 'Daily. Intermittent use is not supported by any of the evidence.',
      duration: '20 minutes per session. Minimum four weeks before judging it.',
      intensity_notes: 'No progression. The dose does not escalate. If they want more, the answer is consistency, not a longer session. Never past 30 minutes.',
      timing: 'Morning or early afternoon, while alert enough to follow instructions. The daytime convention comes from protocol integrity in the trials, not from physiology, and bedtime use is untested.',
    },
    required_equipment: ['none_needed'],
    contraindications: [
      'SCREEN BEFORE PRESCRIBING. Snoring plus witnessed pauses plus daytime sleepiness, or an Epworth of 16 or more, means suspected obstructive sleep apnoea: refer, do not prescribe. Treating apnoea as insomnia is the specific harm this screen exists to prevent. Note the STOP-Bang under-detects in women (77% sensitivity, 45% specificity, AUC 0.67 in midlife women) and the most sensitive single item for them is observed apnoeas, while OSA prevalence reaches 27% in perimenopause and 29% after it. A low score in a midlife woman does not clear her. Also refer rather than prescribe if the complaint has run three months or more and looks like chronic insomnia disorder, if she is on a hypnotic, or if restless legs or a parasomnia is suspected',
      'PTSD diagnosis, known trauma history, or a dissociative disorder. Refer, do not prescribe',
      'Active psychiatric instability including current psychosis, mania or acute suicidal ideation. Refer',
      'Any history of relaxation-induced anxiety. Screen first: has lying still with eyes closed, or any meditation or relaxation practice, ever made you feel panicky, agitated, unreal or out of your body',
      'Genuinely sleep-deprived clients who have time to sleep. Prescribe the nap instead, the head-to-head favours it',
      'Immediately before driving or anything needing alertness, sleep during the practice is common',
    ],
    safety_notes: 'Physically near-zero risk, nothing to be injured by, zero adverse events across the trials. The real risk is psychological. Pooled meditation adverse-event prevalence is 8.3%, rising to 31 to 58% when actively screened for rather than spontaneously reported, and yoga nidra specifically has documented flashbacks, distress and extended dissociation. The mechanism is the problem: it removes external stimulation, moves attention inward through the body, and includes deliberate emotional evocation and visualisation, all known triggers in trauma-exposed people. Review after three sessions and ask about distress explicitly, not just about sleep. Stop on the first report of flashback, panic, derealisation or intrusive imagery, and refer. Do not adjust the dose and continue. Note also that 78% of participants in one trial fell asleep during a 30-minute afternoon session and 43% of those did not wake at the end.',
    coach_doctrine: 'Large following, small trial base: six RCTs with sleep endpoints, about 244 participants total, most run in India by overlapping author groups. The 2026 meta-analysis pooled them and found nothing significant (PSQI p=0.50, ISI p=0.06, GRADE very low), and the best-designed acute trial failed its primary endpoint. So prescribe it for what it actually is: a near-free, zero-load daily habit for a depleted client who sleeps badly and cannot afford anything more demanding. It is a behaviour-axis intervention. Three things never to say to a client: that it raises HRV (the only direct test was null on RMSSD and HF in both windows), that it boosts dopamine by 65% (a conversion inferred from 8 lifetime meditators, whose self-reported relaxation did not even differ from the control condition), or that it replaces sleep. It is also not a treatment for insomnia; that is a clinical diagnosis and CBT-I is first line. The marketing pushes short single sessions, and every study of a single 10-minute session either found nothing or found effects small enough to be expectancy. The objective evidence used 20 minutes daily for weeks. Run the first three to five sessions supervised, mostly so the psychological screen actually happens. No evidence at all in perimenopausal or midlife women, so for our core client group this is extrapolated, not evidenced. Say so.',
  },
  {
    // Added 2026-08-17 from the Deep Research report at
    // 00_PLAYBOOK/recovery_research/2026-08-17_Caffeine_Timing_and_Load.md
    //
    // THIRD DISTINCT CLASSIFICATION IN THE LIBRARY. Caffeine is a stressor;
    // this protocol is stressor REMOVAL, which is not downregulation (it adds
    // no parasympathetic tone, it restores the accuracy of a signal). And the
    // taper window is ITSELF an acute stressor for 2 to 9 days. So it draws
    // against the behaviour-axis budget like a new training variable for the
    // first fortnight, then stops drawing. Filing it as a downregulator would
    // have got it scheduled into exactly the week it does most damage.
    slug: 'caffeine-load-management',
    name: 'Caffeine Timing and Load',
    category: 'systemic',
    short_description: 'Manage the dose first and the cut-off second. Most clients do not need this at all.',
    what_it_does: 'Caffeine blocks the adenosine receptors through which the body reads its own accumulated sleep pressure. It does not remove the debt, it removes the client\'s ability to feel it, which is why the damage shows up first in deep sleep and why she cannot perceive it happening. Reducing total load restores the accuracy of that signal. At 400mg within four hours of bed the measured cost is around 50 minutes of total sleep, 30 minutes of deep sleep and a 9 percent hit to sleep efficiency.',
    steps: [
      'TWO WEEKS OF LOGGING FIRST, before changing anything: every source in actual milligrams, the time taken, time in bed, time asleep, night wakings. Include pre-workout, energy drinks, tea, cola, chocolate',
      'Most clients underestimate by 30 to 50 percent because they count coffees, not milligrams. Rough guides: coffee ~107mg per 250ml, energy drink ~160mg per 500ml, pre-workout ~217mg per serve',
      'If the total is under 200mg and all before mid-afternoon: STOP HERE. No prescription. Tell her that',
      'If over 200mg: target 200mg/day maximum, last serving 8 hours before habitual bedtime',
      'Reduce by 10 to 25 percent every three to four days. Nothing in the withdrawal literature rewards speed',
      'Remove in this order: evening intake, then pre-workout, then afternoon top-ups, then shrink the morning serving. NEVER remove the morning serving first',
      'Hold each step until symptoms settle before the next one',
      'Review at four weeks against the logged night-waking count, not against how she says she slept',
    ],
    dosing: {
      frequency: 'One taper, run once, over three to four weeks, then hold indefinitely. This is not a repeating protocol.',
      duration: 'Three to four weeks of taper.',
      intensity_notes: 'Anchor the cut-off to BEDTIME, not the clock. A client with a 9pm bedtime and one with a midnight bedtime need different rules from the same principle. Never take anyone to zero: nothing in the evidence supports abstinence over moderate intake, and it costs her a functional tool for no demonstrated gain.',
      timing: 'Last dose 8 hours before habitual bedtime once total load is at or under 200mg. If any single serving still exceeds 200mg, that one moves to 12 hours out until the dose comes down.',
    },
    required_equipment: ['none_needed'],
    contraindications: [
      'SCREEN BEFORE PRESCRIBING. Snoring plus witnessed pauses plus daytime sleepiness, or an Epworth of 16 or more, means suspected obstructive sleep apnoea: refer, do not prescribe. Treating apnoea as insomnia is the specific harm this screen exists to prevent. Note the STOP-Bang under-detects in women (77% sensitivity, 45% specificity, AUC 0.67 in midlife women) and the most sensitive single item for them is observed apnoeas, while OSA prevalence reaches 27% in perimenopause and 29% after it. A low score in a midlife woman does not clear her. Also refer rather than prescribe if the complaint has run three months or more and looks like chronic insomnia disorder, if she is on a hypnotic, or if restless legs or a parasomnia is suspected',
      'Low energy availability, disordered eating signals, or caffeine being used as an appetite suppressant. That is a disordered-eating signal, not a caffeine problem. Do not touch caffeine until fuelling has been stable for two to three weeks, and refer',
      'Time in bed under seven hours. Fix sleep opportunity first. The largest caffeine effect on total sleep time is about 50 minutes and the gap in a depleted client is usually bigger than that',
      'Competition week, assessment week, or the first week of a new training block. The taper is a real stressor for 2 to 9 days',
      'Running concurrently with any other new protocol: a training-load increase, a nutrition change, or a new cold or heat exposure',
      'Clients on prescribed stimulants: cap at 200mg/day, all before the medication\'s afternoon window, confirm the prescriber knows the intake. Any question touching the medication itself is a referral',
      'Untreated or borderline hypertension: do not add caffeine, and be conservative removing it, since withdrawal fatigue drives compensatory behaviour',
      'Headache lasting beyond nine days, or headache with any neurological symptom. Stop attributing it to caffeine and refer',
    ],
    safety_notes: 'Withdrawal is real, dose-proportional and validated: headache in roughly half of abrupt quitters, clinically significant distress or functional impairment in 13 percent, onset 12 to 24 hours, peak 20 to 51 hours, duration 2 to 9 days. It occurs after abstinence from doses as low as 100mg/day, so the light user is not immune. Warn every client BEFORE day one that days two and three will be worse than day one and that this is expected and self-limiting; a coach who does not will lose them on day three. Mood effects (decreased contentedness, depressed mood, irritability) are validated symptoms, not imagination. Half-life is not fixed: oral contraceptives roughly double it, smoking roughly halves it (so a client who quits smoking will find her usual coffee suddenly feels like too much), pregnancy extends it substantially.',
    coach_doctrine: 'The headline is a null and it should change who you prescribe this to. In the best-designed timing trial, 100mg produced NO significant effect on any objective or subjective sleep outcome at 12, 8 or 4 hours before bed. 400mg did damage at every one of those points. So dose is the variable and timing only matters once the dose is high. A client on one long black is at 80 to 120mg: leave her alone and say so, because spending her limited change budget there costs credibility you need for the change that matters. Second, the perception gap. Participants correctly identified their dose only 44 percent of the time and dose-plus-timing only 22 percent. Objective wake-after-sleep-onset rose significantly while PERCEIVED wake after sleep onset did not move at all. When a client says coffee does not affect her she is reporting her perception accurately and her perception is not tracking her physiology. Third, be honest about the limits: there is NO trial showing that cutting caffeine improves sleep in poor sleepers, the direction has only ever been tested the other way, and a 785-person actigraphy study in adults averaging 63 years found no association at all between caffeine within four hours of bed and any sleep outcome, while alcohol and nicotine both showed effects. Present this as removing an interference, never as a sleep treatment. Two more things. The "no caffeine after 2pm" rule has no traceable primary source; it happens to approximate 8 hours before a 10pm bed, which is roughly right for one coffee and badly wrong in both directions. And do not buy genotype testing: the one trial that genotyped and measured sleep found nothing. The practical substitute is a two-week n-of-1 at 100mg before midday with a night-waking log, then two weeks back at habit. Her own data beats a SNP and costs nothing.',
  },
  {
    slug: 'jet-lag-protocol',
    name: 'Jet Lag Recovery Protocol',
    category: 'systemic',
    short_description: 'Light, meal, and fasting protocol to accelerate circadian re-alignment after travel.',
    what_it_does: 'Uses fasting during flight plus timed light exposure at destination to shift circadian clock faster than passive adaptation.',
    steps: [
      'Fast 12 to 16 hours during and after the flight (water only)',
      'Break the fast at the local time of your first destination breakfast',
      'Get 15 to 30 minutes of bright outdoor light at local sunrise for the first 3 days',
      'Avoid bright light and screens after local sunset for the first 3 days',
      'No caffeine after local noon for the first 3 days',
      'Physiological sighs every hour on the flight',
    ],
    dosing: {
      frequency: 'Per travel event',
      duration: 'Starts during flight, continues 3 days at destination',
    },
    required_equipment: ['none_needed'],
    contraindications: ['Diabetes without medical clearance to fast', 'Pregnancy', 'Eating disorders'],
    safety_notes: 'Fasting during long-haul flights is well tolerated for most healthy adults. Adjust if diabetic or pregnant.',
    coach_doctrine: 'The single biggest lever for jet lag is meal timing followed by light exposure. Everything else (melatonin, sleep meds) is secondary. Pair with reduced training intensity for the first 3 days at destination.',
  },
  {
    slug: 'sbst-nose-tape',
    name: 'Nose Tape / Nasal Strips (SBST Level 1)',
    category: 'breathwork',
    short_description: 'First-line sleep breathing support. Low intrusion, high compliance. Reduces nasal resistance and encourages natural nasal breathing during sleep.',
    what_it_does: 'External nasal strips or nose tape mechanically hold the nostrils open, reducing nasal airflow resistance. Encourages nasal breathing during sleep without any behavioural or oral intervention. Supports airflow efficiency; does not resolve systemic sleep disruption.',
    steps: [
      'Wash and dry the bridge of the nose before bed',
      'Apply the nasal strip (or nose tape) across the bridge of the nose per product instructions',
      'Sleep normally; peel off in the morning',
      'Evaluate after 3-7 nights: subjective sleep quality, wake frequency, morning readiness',
      'If no improvement after 7-10 days AND behaviour/load is not the driver: consider progression to Level 2 (mouth tape)',
      'If sleep improves: hold at Level 1 as the minimum effective support',
    ],
    dosing: {
      frequency: 'Nightly (baseline environmental use if sleep stable) OR during sleep disruption episodes (intervention use)',
      duration: '3-7 night evaluation window minimum before judging effect',
      timing: 'Applied at bedtime',
    },
    required_equipment: ['sleep_breathing_kit'],
    contraindications: [
      'Skin sensitivity or allergy to adhesives on the nasal bridge',
      'Active nasal skin infection or open wound',
      'Diagnosed sleep apnoea should be managed by GP or sleep physician - SBST is not a substitute for CPAP',
    ],
    safety_notes: 'Very low risk. Skin irritation on the nasal bridge is the main issue - trial a hypoallergenic tape or brand switch if reactive. NOT a substitute for CPAP or a diagnostic tool for sleep apnoea - if the client snores heavily, has witnessed apnoeas, or wakes gasping, refer to a GP for a sleep study.',
    coach_doctrine: 'ALWAYS start here before progressing. Low intervention, low behavioural disruption, high compliance - the first-line SBST tool. Governed by 13D_16 Sleep Breathing Support Tools doctrine: SBST supports airflow but does NOT resolve systemic instability. Non-substitution rule: cannot be used to replace sleep schedule consistency, offset poor recovery behaviours, maintain excessive training load, or avoid reducing stress. If the client is in RRS ns_overload state, REMOVE this tool (not just avoid). If in RRS sleep_disruption, allowed as secondary support. If in chronic_recovery_debt, do not prioritise. Baseline / environmental use permitted continuously when sleep and recovery are stable and no active 13D playbook is engaged.',
    progression: {
      group: 'sbst',
      level: 1,
      group_label: 'Sleep Breathing Support Tools (SBST)',
      group_rule: 'Strict tiered progression per 13D_16 doctrine. Never skip levels. Escalate only after 3-7 nights at current level with no improvement AND behaviour/load is not the driver. De-escalate to lowest effective level once sleep improves. Remove entirely if RRS enters ns_overload state.',
    },
  },
  {
    slug: 'sbst-mouth-tape',
    name: 'Mouth Tape (SBST Level 2)',
    category: 'breathwork',
    short_description: 'Secondary sleep breathing support. Moderate intrusion. Introduced only if Level 1 (nose tape / nasal strips) is insufficient. Encourages nasal breathing by mechanically discouraging mouth breathing during sleep.',
    what_it_does: 'A vertical strip or structured mouth-tape system across the closed lips reduces oral breathing during sleep, encouraging nasal breathing pattern. Behaviourally more intrusive than Level 1. Must not create anxiety or disrupt sleep continuity.',
    steps: [
      'Confirm Level 1 (nose tape / nasal strips) has been trialled for 3-7 nights with insufficient benefit',
      'Ensure nasal airway is patent (no cold/congestion; if congested, delay introduction)',
      'Apply a purpose-built mouth tape system (vertical strip or structured; e.g. Respire mouth tape) across the closed lips at bedtime',
      'Sleep normally; peel off in the morning',
      'Evaluate after 3-7 nights: sleep continuity, morning readiness, no anxiety or discomfort',
      'If sleep continuity or comfort worsens: REMOVE and return to Level 1',
      'If no improvement after 7-10 nights AND behaviour/load is not the driver: consider progression to Level 3 (mouthpiece)',
      'If sleep improves: hold at Level 2 as the minimum effective support',
    ],
    dosing: {
      frequency: 'Nightly once introduced (baseline environmental) OR during sleep disruption episodes (intervention)',
      duration: '3-7 night evaluation window minimum before judging effect',
      timing: 'Applied at bedtime after Level 1 has been tolerated',
    },
    required_equipment: ['sleep_breathing_kit'],
    contraindications: [
      'Nasal obstruction (cold, sinusitis, deviated septum causing significant unilateral obstruction) - client cannot breathe adequately through the nose',
      'Diagnosed or suspected sleep apnoea (untreated) - refer to sleep physician first; mouth tape can worsen unmanaged sleep apnoea',
      'Anxiety about airway obstruction / claustrophobia around the mouth',
      'Skin sensitivity or allergy to adhesives on the peri-oral skin',
      'Alcohol intoxication or sedative use that impairs arousal response',
      'GORD / severe reflux - risk of overnight reflux without oral airway escape',
    ],
    safety_notes: 'Never use in a client with untreated obstructive sleep apnoea - mouth tape can worsen it. If nasal airway is not patent (cold, allergy flare, congestion), DELAY use until it clears. Confirm the client is not on sedatives or alcohol that impair arousal response. Skin irritation around the mouth is the second most common issue - switch tape brand or use a smaller vertical strip. If any anxiety about airway obstruction, do not use - the doctrine explicitly requires no anxiety or discomfort. If the client wakes gasping, has episodes of witnessed apnoea, or heavy snoring - stop and refer to GP for sleep study.',
    coach_doctrine: 'Introduced ONLY after Level 1 has been trialled for 3-7 nights with insufficient benefit. Never skip Level 1. Must not create anxiety or disrupt sleep continuity - if it does, REMOVE and return to Level 1. Behaviourally more intrusive than Level 1 so tolerance and comfort are prerequisites. Governed by 13D_16 SBST doctrine: non-substitution rule applies (cannot replace sleep schedule consistency, offset poor recovery, maintain excessive training load, avoid reducing stress). If the client is in RRS ns_overload state, REMOVE this tool. If in RRS sleep_disruption, allowed as secondary support only. Kade uses mouth tape personally and reports it works well - the doctrine is written from that direct experience but respects the escalation model regardless.',
    progression: {
      group: 'sbst',
      level: 2,
      group_label: 'Sleep Breathing Support Tools (SBST)',
      group_rule: 'Strict tiered progression per 13D_16 doctrine. Never skip levels. Escalate only after 3-7 nights at current level with no improvement AND behaviour/load is not the driver. De-escalate to lowest effective level once sleep improves. Remove entirely if RRS enters ns_overload state.',
    },
  },
  {
    slug: 'sbst-airway-mouthpiece',
    name: 'Airway Positioning Mouthpiece (SBST Level 3)',
    category: 'breathwork',
    short_description: 'Advanced sleep breathing support. Highest intrusion. Introduced only if Levels 1 and 2 have failed after adequate trial. Maintains airway positioning to support structural breathing limitations during sleep.',
    what_it_does: 'A dentist-fitted or OTC mandibular-advancement or airway-positioning device holds the jaw or tongue in a position that maintains airway patency during sleep. Addresses structural airway limitations that nose tape and mouth tape cannot resolve. Highest intervention level and requires ongoing monitoring.',
    steps: [
      'Confirm Levels 1 and 2 have both been trialled adequately (3-7 nights each) with no meaningful improvement',
      'Confirm the persistent non-response is not driven by behaviour or excessive training load',
      'Refer client to GP or dentist for assessment and fitting where possible - OTC options exist but a fitted device is safer',
      'Fit and wear per device instructions at bedtime',
      'Sleep normally; monitor for jaw discomfort, tooth sensitivity, TMJ symptoms',
      'Evaluate at 2-4 weeks: sleep quality, morning readiness, no new pain or bite changes',
      'If no improvement or new discomfort: REMOVE, refer to sleep physician for assessment (may need formal sleep study)',
      'If sleep improves: monitor ongoing tolerance; annual dental review recommended',
    ],
    dosing: {
      frequency: 'Nightly once introduced',
      duration: '2-4 week evaluation window (longer than L1/L2 because of adjustment period)',
      timing: 'Applied at bedtime per device instructions',
    },
    required_equipment: ['sleep_breathing_kit'],
    contraindications: [
      'Untreated obstructive sleep apnoea - requires sleep physician assessment before any device',
      'Severe TMJ dysfunction or recent dental / jaw surgery',
      'Loose teeth, extensive dental restorations, or gum disease',
      'Age under 18 (developmental)',
      'Any active airway pathology or upper respiratory infection',
    ],
    safety_notes: 'This tier warrants coach-GP or coach-dentist co-management. OTC mandibular-advancement devices exist but a professionally fitted device is safer. Common side effects: jaw soreness (usually settles in 1-2 weeks), tooth movement, TMJ discomfort, hypersalivation, dry mouth. Any persistent pain, bite change, or worsening symptoms - REMOVE immediately and refer. NOT a substitute for CPAP in diagnosed obstructive sleep apnoea - refer to sleep physician for formal assessment if suspected.',
    coach_doctrine: 'Only introduced if Levels 1 and 2 have failed. Not default or first-line. Must be justified by persistent non-response with behaviour and load already corrected. Requires monitoring - this is where the coach role should be shared with a GP or dentist. Governed by 13D_16 SBST doctrine: non-substitution rule applies. If the client is in RRS ns_overload state, REMOVE this tool. If in RRS sleep_disruption, allowed as tertiary support only. The doctrine acknowledges this level is intrusive - clients may reasonably decline in favour of maintaining Level 1 or 2 and accepting incomplete resolution rather than escalating.',
    progression: {
      group: 'sbst',
      level: 3,
      group_label: 'Sleep Breathing Support Tools (SBST)',
      group_rule: 'Strict tiered progression per 13D_16 doctrine. Never skip levels. Escalate only after 3-7 nights at current level with no improvement AND behaviour/load is not the driver. De-escalate to lowest effective level once sleep improves. Remove entirely if RRS enters ns_overload state.',
    },
  },
]

export const EQUIPMENT_LABELS: Record<EquipmentTag, string> = {
  sauna_traditional: 'Traditional sauna',
  sauna_infrared: 'Far-infrared sauna',
  steam_room: 'Steam room',
  magnesium_bath: 'Magnesium bath (home or gym)',
  cold_plunge_full: 'Cold plunge / ice bath (full body)',
  ice_water_bowl: 'Bowl for face ice immersion',
  shower: 'Shower with hot and cold water',
  cryo_chamber: 'Whole-body cryotherapy chamber',
  red_light_panel: 'Red / near-infrared light panel',
  red_light_bed: 'Red light bed (full body)',
  compression_boots: 'Compression boots (Normatec / Hyperice / similar)',
  massage_gun: 'Percussion massage gun',
  vibration_plate: 'Vibration plate',
  sleep_breathing_kit: 'Sleep breathing tools (nose tape, mouth tape, or airway mouthpiece as prescribed)',
  none_needed: 'No equipment needed',
}

export const CATEGORY_LABELS: Record<RecoveryCategory, string> = {
  heat: 'Heat',
  cold: 'Cold',
  contrast: 'Contrast',
  compression: 'Compression / mechanical',
  light: 'Light',
  breathwork: 'Breathwork',
  systemic: 'Systemic recovery cycles',
  movement: 'Movement-based recovery',
}

/**
 * Filter protocols to only those the client has equipment access for.
 * Protocols requiring `none_needed` are always shown.
 */
export function protocolsAvailableForAccess(access: EquipmentTag[]): RecoveryProtocol[] {
  const accessSet = new Set<EquipmentTag>(access)
  accessSet.add('none_needed')
  return RECOVERY_PROTOCOLS.filter(p =>
    p.required_equipment.every(eq => accessSet.has(eq))
  )
}

export function protocolBySlug(slug: string): RecoveryProtocol | null {
  return RECOVERY_PROTOCOLS.find(p => p.slug === slug) ?? null
}
