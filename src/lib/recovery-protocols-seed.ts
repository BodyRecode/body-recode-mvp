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
    contraindications: ['Do not oversleep by more than 90 minutes in one night (rebound insomnia risk)'],
    safety_notes: 'Naps longer than 30 minutes risk sleep inertia and evening sleep-onset problems.',
    coach_doctrine: 'Sleep debt cannot be paid off in one long night. Requires a full week of consistent extension. Pair with reduced training intensity for that week.',
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
