'use client'

import { useState, useEffect } from 'react'
import { CoachingAscensionCTA } from '@/components/coaching-ascension-cta'
import { logoUrl, brand, coach } from '@/config/tenant'
import { Compass, ListChecks, LineChart, Salad, FileText, BookOpen, ClipboardCheck, CalendarDays } from 'lucide-react'

type MemberEnrollment = {
  id: string
  first_name: string
  email: string
  token: string
  pattern: string
  current_block: string
  current_week: number
  joined_at: string
}

const PATTERN_CONFIG: Record<string, { label: string; colour: string; description: string }> = {
  'stress-stored': {
    label: 'Stress-Stored',
    colour: '#DC2626',
    description: 'Cortisol is the driver. Block A introduces the cortisol anchor evening meal and tightens caffeine protocol. Training load increases with strict RIR controls.',
  },
  'metabolic-drift': {
    label: 'Insulin-Drift',
    colour: '#B7791F',
    description: 'Insulin sensitivity is the target. Block A introduces formal carb cycling and increases protein volume. The post-meal walk is now non-negotiable.',
  },
  'hormonal-shift': {
    label: 'Estrogen-Shift',
    colour: '#8b5cf6',
    description: 'Block A introduces cycle-aware eating. Fat quality becomes the primary focus. The programme bends to your biology, not the other way around.',
  },
  'system-overload': {
    label: 'Androgen-Decline',
    colour: '#1B6DFC',
    description: 'Testosterone signalling is the target. Block A protects muscle, controls load, and rebuilds the inputs that support androgen function. Check-in data determines when demand increases, not the calendar.',
  },
}

const BLOCK_PHASES: Record<string, { number: number; name: string; weeks: string; description: string }[]> = {
  A: [
    { number: 1, name: 'Reset', weeks: '1-2', description: 'New movements introduced. Let the body adapt to the change in stimulus.' },
    { number: 2, name: 'Build', weeks: '3-4', description: 'Progressive load. Add weight when RIR feels comfortable.' },
    { number: 3, name: 'Load', weeks: '5', description: 'Peak intensity for this block. Record your best sets.' },
    { number: 4, name: 'Deload', weeks: '6', description: 'Planned reduction. Prepare nervous system for Block B.' },
  ],
  B: [
    { number: 1, name: 'Reset', weeks: '1-2', description: 'New complexity introduced. Barbell compounds and superset pairings.' },
    { number: 2, name: 'Build', weeks: '3-4', description: 'Volume increases. Calorie periodisation active.' },
    { number: 3, name: 'Load', weeks: '5', description: 'Peak intensity for this block.' },
    { number: 4, name: 'Deload', weeks: '6', description: 'Planned reduction. Prepare for Block C.' },
  ],
  C: [
    { number: 1, name: 'Reset', weeks: '1-2', description: 'Final block introduction. Refinement phase begins.' },
    { number: 2, name: 'Build', weeks: '3-4', description: 'Pattern peak demand.' },
    { number: 3, name: 'Load', weeks: '5', description: 'Highest intensity of the 24-week cycle.' },
    { number: 4, name: 'Deload', weeks: '6', description: 'Full recovery. Pattern re-assessment follows.' },
  ],
}

const BLOCK_B_SESSIONS: Session[] = [
  {
    id: 'A',
    name: 'Session A',
    subtitle: 'Heavy Compound + Superset',
    gym: [
      { name: 'Barbell Back Squat', sets: 4, reps: '6-8', notes: 'Heavier than Block A. 3-second descent. Drive hard.' },
      { name: 'Superset: Bulgarian Split Squat', sets: 4, reps: '8/leg', notes: 'No rest between squat and split squat. Rest 90s after both.' },
      { name: 'Barbell Bench Press', sets: 4, reps: '6-8', notes: 'Full range. Control the descent.' },
      { name: 'Superset: Chest-Supported Row', sets: 4, reps: '10', notes: 'No rest between press and row. Push-pull pairing.' },
      { name: 'Ab Wheel Rollout', sets: 3, reps: '10-12', notes: 'Full extension. Do not let hips drop.' },
    ],
    home: [
      { name: 'DB Goblet Squat (Heavy, Paused)', sets: 4, reps: '8', notes: 'Heaviest DBs available. 2-second pause at bottom.' },
      { name: 'Superset: Bulgarian Split Squat', sets: 4, reps: '8/leg', notes: 'Hold DBs at sides. Full depth. No rest between.' },
      { name: 'DB Floor Press', sets: 4, reps: '8', notes: 'Lie on floor. Full range. Control descent.' },
      { name: 'Superset: Bent Over DB Row (Heavy)', sets: 4, reps: '8/side', notes: 'Heavy. Drive elbow back hard. No rest between press and row.' },
      { name: 'Dead Bug (Loaded)', sets: 3, reps: '10/side', notes: 'Hold a light DB in the opposite hand. Increases anti-extension demand.' },
    ],
    bodyweight: [
      { name: 'Tempo Squat (5 sec down)', sets: 4, reps: '8', notes: '5-second descent. Pause at bottom. Explosive drive up.' },
      { name: 'Superset: Bulgarian Split Squat (Slow)', sets: 4, reps: '10/leg', notes: '3-second descent. Full depth. No rest between.' },
      { name: 'Archer Push-Up (4 sec descent)', sets: 4, reps: '8/side', notes: '4-second descent to increase difficulty.' },
      { name: 'Superset: Table Inverted Row (Feet Elevated)', sets: 4, reps: '12', notes: 'Immediately after push-up. Horizontal pull.' },
      { name: 'Hollow Rock', sets: 3, reps: '20', notes: 'From hollow hold position, rock forward and back. Core stays engaged.' },
    ],
  },
  {
    id: 'B',
    name: 'Session B',
    subtitle: 'Loaded Conditioning',
    gym: [
      { name: 'Trap Bar Deadlift', sets: 4, reps: '5-6', notes: 'Heaviest lift of the week. Neutral spine throughout.' },
      { name: 'DB Z-Press', sets: 3, reps: '10', notes: 'Seated on floor with legs straight. Press overhead. No back support.' },
      { name: 'Walking Lunge (Heavy)', sets: 3, reps: '12/leg', notes: 'Barbell or heavy DBs. Upright torso. Full depth.' },
      { name: 'Neutral Grip Pull-Up or Pulldown', sets: 4, reps: '8', notes: 'Palms facing each other. Lower slowly.' },
      { name: 'Finisher: Sled Push or Row Sprint', sets: 6, reps: '30s hard / 60s easy', notes: 'Pattern rules apply.' },
    ],
    home: [
      { name: 'DB Romanian Deadlift (Heavy, Both Legs)', sets: 4, reps: '8', notes: 'Two DBs. As heavy as possible. Full hamstring stretch.' },
      { name: 'DB Z-Press', sets: 3, reps: '10', notes: 'Seated on floor. Press both DBs overhead simultaneously.' },
      { name: 'Walking Lunge (Heavy DBs)', sets: 3, reps: '12/leg', notes: 'Heaviest DBs available. Full depth.' },
      { name: 'DB Renegade Row', sets: 4, reps: '8/side', notes: 'Push-up position. Row one DB at a time. Hips stay square.' },
      { name: 'Finisher: DB Complex', sets: 6, reps: '30s hard / 60s easy', notes: '3 reps RDL + 3 reps hang clean + 3 reps press, continuous.' },
    ],
    bodyweight: [
      { name: 'Single Leg RDL (3 sec hold)', sets: 4, reps: '8/leg', notes: '3-second hold at parallel. Challenges balance and posterior chain.' },
      { name: 'Deficit Pike Push-Up', sets: 3, reps: '10', notes: 'Hands on books or elevated surface. Increases depth and range.' },
      { name: 'Walking Lunge (Slow tempo)', sets: 3, reps: '12/leg', notes: '3-second descent on each rep.' },
      { name: 'Single Arm Plank Hold', sets: 4, reps: '20s/side', notes: 'Full plank position. Lift one hand off the floor. Hips stay square.' },
      { name: 'Finisher: Burpee Variations', sets: 6, reps: '30s hard / 60s easy', notes: 'Pattern rules apply.' },
    ],
  },
  {
    id: 'C',
    name: 'Session C',
    subtitle: 'Strength Peaking',
    gym: [
      { name: 'Front Squat or Hack Squat', sets: 4, reps: '6', notes: 'Front squat demands more quad and thoracic extension. Hack squat if front squat is uncomfortable.' },
      { name: 'Incline Barbell Bench Press', sets: 4, reps: '6-8', notes: 'Heavier than DB incline in Block A. Full range.' },
      { name: 'Barbell Row', sets: 4, reps: '6-8', notes: 'Overhand grip. Hinge to 45 degrees. Pull to lower chest. Heavy.' },
      { name: 'Weighted Pull-Up or Heavy Lat Pulldown', sets: 3, reps: '6-8', notes: 'Heaviest of the block. Lower slowly.' },
      { name: "Farmer's Carry", sets: 3, reps: '30m', notes: 'Heaviest DBs or plates available. Grip and core demand.' },
    ],
    home: [
      { name: 'DB Front Squat', sets: 4, reps: '8', notes: 'Hold DBs at shoulder height. Front-rack position. More quad demand than goblet.' },
      { name: 'DB Incline Press (Heaviest)', sets: 4, reps: '8', notes: 'Push the weight on this one. Heaviest DB available.' },
      { name: 'DB Bent Over Row (Heaviest)', sets: 4, reps: '8', notes: 'Both DBs simultaneously. Hinge to 45 degrees. Row to hip.' },
      { name: 'DB Pullover (Slow, Heavy)', sets: 3, reps: '10', notes: 'Floor or bench. Heaviest DB. 3-second stretch at the top.' },
      { name: "DB Farmer's Carry", sets: 3, reps: '30m', notes: 'Heaviest available. Full grip tension.' },
    ],
    bodyweight: [
      { name: 'Pistol Squat or Assisted Pistol', sets: 4, reps: '6/leg', notes: 'Progress from Block A. Reduce assist if able.' },
      { name: 'Pike Push-Up to Downward Dog', sets: 4, reps: '10', notes: 'Full pike push-up, then push hips back to downward dog. Shoulder girdle strength.' },
      { name: 'Wide Grip Table Row', sets: 4, reps: '12', notes: 'Hands wider than shoulder-width. Targets rear delts and upper back.' },
      { name: 'Hollow Body Hold + Rock Combo', sets: 3, reps: '30 sec + 10 rocks', notes: 'Hold 30 seconds, then rock 10 times without losing position.' },
      { name: "Farmer's Carry (Heavy Objects)", sets: 3, reps: '30m', notes: 'Use the heaviest objects available. Grip demand is the point.' },
    ],
  },
]

const BLOCK_B_PATTERN_TRAINING: Record<string, {
  progression: { phase: string; weeks: string; rir: string; notes: string }[]
  rules: string[]
}> = {
  'stress-stored': {
    progression: [
      { phase: 'Reset', weeks: '1-2', rir: '3 RIR', notes: 'New movements, heavier loads. Technique before intensity.' },
      { phase: 'Build', weeks: '3-4', rir: '2 RIR', notes: 'Load increases. Sleep quality check-in guides progression.' },
      { phase: 'Load', weeks: '5', rir: '1-2 RIR', notes: 'Controlled peak. Never 1 RIR if sleep has been poor.' },
      { phase: 'Deload', weeks: '6', rir: '4 RIR', notes: 'Reduce sets by 30%.' },
    ],
    rules: [
      'Skip Session B finisher - conditioning ban continues',
      'Zone 2 walking only on rest days',
      'Supersets are fine - rest between each superset is still 90 seconds minimum total',
      'If Week 5 check-in energy or sleep markers are below 3/5, hold at 2 RIR',
    ],
  },
  'metabolic-drift': {
    progression: [
      { phase: 'Reset', weeks: '1-2', rir: '2 RIR', notes: 'New movement patterns. Maintain conditioning intensity.' },
      { phase: 'Build', weeks: '3-4', rir: '1 RIR', notes: 'Near-maximum effort on compound lifts. Record everything.' },
      { phase: 'Load', weeks: '5', rir: '0-1 RIR', notes: 'Absolute peak. These are the numbers Block C will beat.' },
      { phase: 'Deload', weeks: '6', rir: '3-4 RIR', notes: 'Reduce sets by 30%.' },
    ],
    rules: [
      'Session B finisher mandatory - upgrade to 6 rounds',
      'Post-session walk mandatory - 15-20 minutes every session',
      'Carb cycling continues - training days higher, rest days fruit only',
      'Superset pairings increase metabolic demand significantly - this is intentional for this pattern',
    ],
  },
  'hormonal-shift': {
    progression: [
      { phase: 'Reset', weeks: '1-2', rir: '2-3 RIR', notes: 'New movement patterns. Never miss a session.' },
      { phase: 'Build', weeks: '3-4', rir: '2 RIR', notes: 'Load increases. Cycle phase determines upper limit.' },
      { phase: 'Load', weeks: '5', rir: '1-2 RIR', notes: 'Moderate peak. Luteal phase overrides - hold at 2 RIR.' },
      { phase: 'Deload', weeks: '6', rir: '3-4 RIR', notes: 'Reduce sets by 30%.' },
    ],
    rules: [
      'Session B finisher: optional, 7/10 effort maximum (increased from Block A)',
      'Never miss a session regardless of motivation level',
      'Superset rest: 60-90 seconds between each pairing',
      'Luteal phase: hold at 2-3 RIR regardless of what the programme says',
    ],
  },
  'system-overload': {
    progression: [
      { phase: 'Reset', weeks: '1-2', rir: '3 RIR', notes: 'New stimulus. Single sets on each superset if fatigue is present.' },
      { phase: 'Build', weeks: '3-4', rir: '2-3 RIR', notes: 'Gradual load increase. Check-in data is the progression signal.' },
      { phase: 'Load', weeks: '5', rir: '2 RIR', notes: 'Modest peak. Controlled throughout.' },
      { phase: 'Deload', weeks: '6', rir: '4 RIR', notes: 'Reduce sets by 40%.' },
    ],
    rules: [
      'Skip Session B finisher - conditioning ban continues',
      'Supersets permitted but rest between each pairing is 2-3 minutes minimum',
      'Reduce to 1 set per superset if energy is significantly depleted',
      'Only increase load when 3 RIR feels genuinely comfortable in check-in data',
    ],
  },
}

const BLOCK_B_NUTRITION: Record<string, { headline: string; newStrategy: { title: string; points: string[] }[]; phaseNotes: { phase: string; weeks: string; note: string }[] }> = {
  'stress-stored': {
    headline: 'Block B nutrition introduces meal anchoring - removing decision fatigue around food as training demand increases.',
    newStrategy: [
      {
        title: 'Meal Anchoring',
        points: [
          'Pick one meal that never changes. Same food, same time, every training day.',
          'Breakfast and the post-training meal work best as anchors for most people.',
          'Eliminates the decision fatigue that spikes cortisol in busy periods.',
          'The rest of the day stays flexible within the pattern rules.',
        ],
      },
      {
        title: 'Pre-Training Fuel (Block B)',
        points: [
          'As training gets heavier, pre-training fuel becomes more important.',
          'Eat 60-90 minutes before every session - protein and fat, no heavy carbs.',
          'Never train fasted in Block B - the load is too high for this pattern.',
        ],
      },
    ],
    phaseNotes: [
      { phase: 'Reset', weeks: '1-2', note: 'Identify your two anchor meals. Write them down. Eat them every training day.' },
      { phase: 'Build', weeks: '3-4', note: 'Post-training carbs stay at 2 cupped hands. Monitor sleep in check-in - it is the nutrition feedback signal.' },
      { phase: 'Load', weeks: '5', note: 'Pre-training fuel is critical this week. Protein and fat 60-90 minutes before every session.' },
      { phase: 'Deload', weeks: '6', note: 'Reduce post-training carbs back to 1 cupped hand. Keep anchor meals. Cortisol anchor evening meal continues.' },
    ],
  },
  'metabolic-drift': {
    headline: 'Block B introduces calorie periodisation - higher calories on training days, lower on rest days, more formally than Block A carb cycling.',
    newStrategy: [
      {
        title: 'Calorie Periodisation',
        points: [
          'Training days: eat more. Post-training carbs 2-3 cupped hands. Fat at normal levels.',
          'Rest days: eat less. Fruit only for carbs. Fat slightly reduced. Protein stays constant.',
          'Session B training days: highest intake of the week. This session demands the most fuel.',
          'The swing between training and rest days is now larger than Block A - this is intentional.',
        ],
      },
      {
        title: 'Creatine',
        points: [
          'Block B is the right time to introduce creatine if not already using it.',
          '5g per day, any time, with food. No loading phase required.',
          'Increases phosphocreatine stores and directly improves training output.',
          'Improved training output is the primary driver of insulin sensitivity gains for this pattern.',
        ],
      },
    ],
    phaseNotes: [
      { phase: 'Reset', weeks: '1-2', note: 'Introduce calorie periodisation. Formalise the difference between training and rest day intake.' },
      { phase: 'Build', weeks: '3-4', note: 'Increase Session B carb window to 3 cupped hands. This session earns the fuel.' },
      { phase: 'Load', weeks: '5', note: 'Highest carb intake of the block on Session B day. Maximum training output requires maximum fuel.' },
      { phase: 'Deload', weeks: '6', note: 'Drop back to Block A carb levels. Use the week to assess body composition shifts.' },
    ],
  },
  'hormonal-shift': {
    headline: 'Block B nutrition introduces cycle-informed calorie variation - using the natural hormonal rhythm to guide weekly food volume.',
    newStrategy: [
      {
        title: 'Weekly Volume Variation',
        points: [
          'Follicular and ovulatory weeks: slightly higher overall food volume. More carbs on training days.',
          'Luteal weeks: increase fat significantly. Allow starchy carbs more freely - even on rest days.',
          'Menstrual week: iron-rich foods, red meat daily, no restriction. This week is a recovery input.',
          'Track where your cycle falls across Block B and adjust accordingly.',
        ],
      },
      {
        title: 'Omega-3 Upgrade',
        points: [
          'Block A introduced omega-3 focus. Block B makes it a daily non-negotiable.',
          'Salmon or sardines 3x per week minimum, or supplement with 2-3g EPA+DHA daily.',
          'Reduces inflammation that amplifies hormonal symptoms in the luteal phase.',
        ],
      },
    ],
    phaseNotes: [
      { phase: 'Reset', weeks: '1-2', note: 'Map where your cycle falls across Block B weeks. Plan food volume variation accordingly.' },
      { phase: 'Build', weeks: '3-4', note: 'If luteal phase falls here, increase fat to 2 thumbs per meal and allow starchy carbs 3x on rest days.' },
      { phase: 'Load', weeks: '5', note: 'If follicular or ovulatory - push training and carbs hard. If luteal - hold steady and recover.' },
      { phase: 'Deload', weeks: '6', note: 'Full food volume maintained. Never reduce nutrition in the deload week for this pattern.' },
    ],
  },
  'system-overload': {
    headline: 'Block B introduces structured recovery nutrition - specific protocols around sleep and pre-session fuelling to support the increased training load.',
    newStrategy: [
      {
        title: 'Pre-Sleep Protocol (Formalised)',
        points: [
          'No food within 2 hours of bed.',
          'Magnesium glycinate 400mg taken 60 minutes before bed - every night.',
          'If genuinely hungry before bed: small serve of protein and fat only. Never carbs.',
          'This protocol accelerates sleep architecture and nervous system recovery.',
        ],
      },
      {
        title: 'Red Meat Frequency',
        points: [
          'Block B: red meat at least twice per week, ideally more.',
          'Beef and lamb are the highest sources of zinc and iron in bioavailable form.',
          'These two minerals are the most commonly depleted in system-overload presentations.',
          'Liver once per week remains the most efficient single food source for nervous system recovery.',
        ],
      },
    ],
    phaseNotes: [
      { phase: 'Reset', weeks: '1-2', note: 'Formalise the pre-sleep protocol. Magnesium every night from week 1.' },
      { phase: 'Build', weeks: '3-4', note: 'Red meat twice per week minimum. Liver once if possible. Monitor energy markers in check-in.' },
      { phase: 'Load', weeks: '5', note: 'Pre-session fuel is critical as load peaks. Eat protein and fat 60-90 minutes before every session.' },
      { phase: 'Deload', weeks: '6', note: 'Maintain full food volume. Pre-sleep protocol continues. Deload is a recovery stimulus.' },
    ],
  },
}

const BLOCK_B_COACHING_NOTES: Record<string, Record<number, string>> = {
  'stress-stored': {
    1: 'Block B starts heavier. The barbell compounds will feel unfamiliar for the first 1-2 sessions - this is expected. Focus on technique in weeks 1-2, not load. Your cortisol system adapts to new movement patterns before it adapts to load.',
    2: 'Identify your two anchor meals this week. Write them down and commit to them every training day. Removing food decisions removes a hidden cortisol source you may not have noticed until now.',
    3: 'Training load increases this week. You are building toward 2 RIR on the main compounds. Check your sleep quality marker in this check-in - if it is below 3, hold the load steady rather than progressing.',
    4: 'The superset pairings should feel more manageable by now. If rest between supersets is drifting below 90 seconds, slow down. Rest is a variable, not a reward.',
    5: 'Peak week. 1-2 RIR on compound lifts. Pre-training fuel is critical this week - protein and fat 60-90 minutes before every session. Do not skip it.',
    6: 'Planned deload. 30% set reduction. Keep the cortisol anchor evening meal and anchor meals in place. Use this week to notice how far energy, sleep, and mood have shifted since the start of Block A.',
  },
  'metabolic-drift': {
    1: 'Block B introduces the heaviest training yet. Trap bar deadlift and barbell compounds are new demands. In weeks 1-2, treat them as technique sessions - the load comes in weeks 3-4.',
    2: 'Calorie periodisation starts this week. Training days get more carbs, rest days get less. The swing is larger than Block A - this is intentional. The bigger the contrast, the stronger the insulin signal.',
    3: 'Near-failure sets begin this week (1 RIR). Record your numbers on every compound lift. These become the benchmarks Block C is designed to surpass.',
    4: 'If strength is progressing week on week, the system is working. The combination of carb cycling, post-meal walks, and progressive training is the most powerful insulin sensitivity intervention available without medication.',
    5: 'Peak week. 0-1 RIR on all major lifts. Session B carb window expands to 3 cupped hands today - this session earns the fuel. Record everything.',
    6: 'Planned deload. Carbs drop back to Block A levels. Use this week to assess how body composition has shifted across 12 weeks of membership. The changes in this pattern are cumulative.',
  },
  'hormonal-shift': {
    1: 'Block B adds supersets and heavier loads. In weeks 1-2 the priority is learning the new movement pairings, not the load. Never miss a session - consistency is still the primary adaptation signal for this pattern.',
    2: 'Map where your cycle falls across the next 6 weeks. This information changes how you approach load, carbs, and recovery in specific weeks. The programme bends to your biology in Block B more than any block so far.',
    3: 'If you are in the luteal phase this week, hold at 2-3 RIR regardless of what the programme says. No exceptions. If follicular or ovulatory, push to 2 RIR and feel the difference.',
    4: 'Omega-3 is now a daily non-negotiable. Salmon, sardines, or 2-3g EPA+DHA supplement. It directly reduces the inflammation that amplifies luteal symptoms and makes training recovery slower.',
    5: 'Peak week if energy supports it. If follicular or ovulatory, push to 1-2 RIR. If luteal, hold steady. The programme has two different week 5 experiences depending on your cycle - both are correct.',
    6: 'Deload. Food volume stays identical. This pattern cannot afford to reduce nutrition when training reduces - the hormonal axis needs fuel to consolidate the adaptations from weeks 1-5.',
  },
  'system-overload': {
    1: 'Block B introduces supersets. In weeks 1-2, you may need to drop to 1 set per exercise pairing rather than the full prescription. That is fine. The nervous system adapts to new patterns before it adapts to volume.',
    2: 'Formalise the pre-sleep protocol this week. Magnesium every night, 60 minutes before bed. Nothing to eat within 2 hours of bed. This is the single most impactful change you can make to nervous system recovery.',
    3: 'Load progression begins. But only progress if your check-in energy markers are 3/5 or above. If they are below, hold at 3 RIR for another week. The data governs this block, not the calendar.',
    4: 'Red meat twice this week minimum. The zinc and iron in beef and lamb are the most depleted minerals in this pattern presentation. Food is recovery infrastructure - treat it that way.',
    5: 'Modest peak. 2 RIR, controlled throughout. Pre-session fuel is critical this week - protein and fat 60-90 minutes before every session without exception.',
    6: 'Extended deload. 40% set reduction. Full food volume maintained. Use this week to assess how energy levels have shifted across 12 weeks of membership. The trend in your check-in data will tell you more than the scale.',
  },
}

const BLOCK_C_SESSIONS: Session[] = [
  {
    id: 'A',
    name: 'Session A',
    subtitle: 'Strength Peak',
    gym: [
      { name: 'Barbell Back Squat', sets: 5, reps: '5', notes: 'Heaviest squat of the programme. 3-second descent. Full depth.' },
      { name: 'Tri-set: Romanian Deadlift', sets: 3, reps: '8', notes: 'No rest after squat. Hinge immediately. Rest 2 minutes after all three.' },
      { name: 'Tri-set: Barbell Bench Press', sets: 3, reps: '5-6', notes: 'Peak pressing load. Full range. No bouncing.' },
      { name: 'Weighted Pull-Up', sets: 4, reps: '5-6', notes: 'Add weight via belt or vest. Lower over 3 seconds.' },
      { name: 'Landmine Press', sets: 3, reps: '10/side', notes: 'Rotational pressing pattern. Core engagement throughout.' },
    ],
    home: [
      { name: 'DB Goblet Squat (Heaviest, Low Rep)', sets: 5, reps: '6', notes: 'Heaviest DB available. Pause at bottom.' },
      { name: 'Tri-set: DB Romanian Deadlift', sets: 3, reps: '8', notes: 'Both DBs. Full hamstring stretch.' },
      { name: 'Tri-set: DB Floor Press (Heaviest)', sets: 3, reps: '6', notes: 'Heaviest available. Full range.' },
      { name: 'DB Bent Over Row (Peak Load)', sets: 4, reps: '6', notes: 'Both DBs. As heavy as possible for 6 reps.' },
      { name: 'DB Lateral + Front Raise Combo', sets: 3, reps: '10 each', notes: 'Lateral raise flowing into front raise. Continuous movement.' },
    ],
    bodyweight: [
      { name: 'Pistol Squat (Unassisted Target)', sets: 5, reps: '5/leg', notes: 'Aim to reduce or eliminate assistance from Block B.' },
      { name: 'Tri-set: Single Leg Hip Hinge (5 sec)', sets: 3, reps: '8/leg', notes: '5-second hold at parallel.' },
      { name: 'Tri-set: Archer Push-Up (5 sec down)', sets: 3, reps: '6/side', notes: '5-second descent. Full range.' },
      { name: 'Table Inverted Row (4 sec lower)', sets: 4, reps: '8', notes: '4-second lowering phase. Maximum tension.' },
      { name: 'Pike Push-Up (Deficit, 4 sec down)', sets: 3, reps: '10', notes: 'Hands elevated. 4-second descent. Full range.' },
    ],
  },
  {
    id: 'B',
    name: 'Session B',
    subtitle: 'Peak Conditioning',
    gym: [
      { name: 'Trap Bar Deadlift (Peak Load)', sets: 5, reps: '4-5', notes: 'Heaviest deadlift of the programme. Set up carefully.' },
      { name: 'Push Press', sets: 4, reps: '6', notes: 'Slight dip and drive from legs to initiate. Press overhead.' },
      { name: 'Walking Lunge (Barbell, Heavy)', sets: 4, reps: '10/leg', notes: 'Heaviest lunge of the cycle. Upright torso.' },
      { name: 'Chest-Supported Row (Heavy)', sets: 4, reps: '6-8', notes: 'Full range. Hard contraction at the top.' },
      { name: 'Finisher: EMOM 10 min', sets: 1, reps: '10 min', notes: 'Every minute: 5 burpees + 5 DB thrusters. Pattern rules apply.' },
    ],
    home: [
      { name: 'DB Romanian Deadlift (Peak, Both)', sets: 5, reps: '6', notes: 'Heaviest possible for 6 reps. Full stretch.' },
      { name: 'DB Push Press', sets: 4, reps: '6', notes: 'Dip and drive. Press both DBs overhead from shoulder height.' },
      { name: 'Walking Lunge (Heaviest DBs)', sets: 4, reps: '10/leg', notes: 'Full depth. Upright torso.' },
      { name: 'DB Renegade Row (Heavy)', sets: 4, reps: '6/side', notes: 'Heaviest renegade row of the cycle. Hips stay square.' },
      { name: 'Finisher: EMOM 10 min', sets: 1, reps: '10 min', notes: 'Every minute: 5 squat jumps + 5 DB push press. Pattern rules apply.' },
    ],
    bodyweight: [
      { name: 'Single Leg RDL (5 sec hold)', sets: 5, reps: '10/leg', notes: 'Highest volume of the cycle for this movement.' },
      { name: 'Push Press (Bodyweight)', sets: 4, reps: '8', notes: 'Jump and press. Explosive. Land soft.' },
      { name: 'Walking Lunge (Slow, Paused)', sets: 4, reps: '10/leg', notes: '3-second descent, 1-second pause at bottom.' },
      { name: 'Plyo Push-Up or Max Effort', sets: 4, reps: 'max', notes: 'Explosive push-up. Max reps per set.' },
      { name: 'Finisher: EMOM 10 min', sets: 1, reps: '10 min', notes: 'Every minute: 5 burpees + 5 jump squats. Pattern rules apply.' },
    ],
  },
  {
    id: 'C',
    name: 'Session C',
    subtitle: 'Technical Refinement',
    gym: [
      { name: 'Front Squat (Peak Load)', sets: 5, reps: '4-5', notes: 'Heaviest front squat of the cycle. Upright torso.' },
      { name: 'Incline Barbell Bench (Peak Load)', sets: 4, reps: '5-6', notes: 'Heaviest incline of the cycle.' },
      { name: 'Pendlay Row', sets: 4, reps: '5-6', notes: 'Bar starts on floor each rep. Full reset. Explosively pull to lower chest.' },
      { name: 'Weighted Chin-Up', sets: 4, reps: '5-6', notes: 'Supinated grip. Add weight. Pull chin fully over bar.' },
      { name: 'Turkish Get-Up', sets: 3, reps: '3/side', notes: 'Slow and deliberate. Full movement from floor to standing with DB overhead.' },
    ],
    home: [
      { name: 'DB Front Squat (Peak Load)', sets: 5, reps: '6', notes: 'Heaviest front squat of the cycle. Front-rack position.' },
      { name: 'DB Incline Press (Peak Load)', sets: 4, reps: '6', notes: 'Heaviest incline press of the cycle.' },
      { name: 'DB Pendlay Row (Floor Reset)', sets: 4, reps: '6', notes: 'Place DBs on floor each rep. Hinge and explosively pull.' },
      { name: 'Supinated Inverted Row (Peak)', sets: 4, reps: '8', notes: 'Under table, supinated grip. Pull chest to table. Maximum effort.' },
      { name: 'Turkish Get-Up', sets: 3, reps: '3/side', notes: 'One DB. Slow and deliberate. Floor to standing.' },
    ],
    bodyweight: [
      { name: 'Shrimp Squat or Pistol Progression', sets: 5, reps: '5/leg', notes: 'Most advanced squat variation of the programme.' },
      { name: 'Close Grip Pike Push-Up', sets: 4, reps: '8', notes: 'Hands close together. Targets triceps more than standard.' },
      { name: 'Explosive Table Row', sets: 4, reps: '8', notes: 'Explosive pull. Touch chest to table hard.' },
      { name: 'L-Sit Hold', sets: 3, reps: '15-20 sec', notes: 'Straight arms, legs extended parallel to floor. Hardest core hold of the programme.' },
      { name: 'Turkish Get-Up (Bodyweight)', sets: 3, reps: '3/side', notes: 'No weight. Perfect technique. Full movement from floor to standing.' },
    ],
  },
]

const BLOCK_C_PATTERN_TRAINING: Record<string, {
  progression: { phase: string; weeks: string; rir: string; notes: string }[]
  rules: string[]
}> = {
  'stress-stored': {
    progression: [
      { phase: 'Reset', weeks: '1-2', rir: '2-3 RIR', notes: 'Adjust to peak-phase rep ranges. Technique refinement.' },
      { phase: 'Build', weeks: '3-4', rir: '1-2 RIR', notes: 'Highest load of the full cycle. Sleep data governs.' },
      { phase: 'Peak', weeks: '5', rir: '1 RIR', notes: 'Controlled personal bests. Never 0 RIR.' },
      { phase: 'Recover', weeks: '6', rir: '4-5 RIR', notes: 'Full recovery. 40% set reduction. Pattern re-assessment follows.' },
    ],
    rules: [
      'Session B finisher remains skipped - no conditioning in Block C',
      'Pre-training fuel mandatory in weeks 3-5 - protein and fat 60-90 min before each session',
      'Week 5 requires sleep quality 4/5+ in check-in to attempt 1 RIR - hold at 2 RIR if below',
      'Week 6: begin noting any shifts in fat storage location, energy patterns, and morning cortisol signals for re-assessment',
    ],
  },
  'metabolic-drift': {
    progression: [
      { phase: 'Reset', weeks: '1-2', rir: '1-2 RIR', notes: 'New rep ranges. Maintain full conditioning output.' },
      { phase: 'Build', weeks: '3-4', rir: '0-1 RIR', notes: 'Near-maximum across all sessions. Record everything.' },
      { phase: 'Peak', weeks: '5', rir: '0 RIR', notes: 'True maximum effort. Personal bests across all lifts.' },
      { phase: 'Recover', weeks: '6', rir: '3-4 RIR', notes: 'Full recovery. Carbs drop to Block A baseline.' },
    ],
    rules: [
      'Session B EMOM finisher is the highest metabolic output of the programme - do not skip',
      'Post-session walk mandatory every session',
      'Week 5 carb intake is the highest of the entire programme - fuel the output fully',
      'Week 6: assess how blood sugar stability, energy consistency, and body composition have shifted across 18 weeks',
    ],
  },
  'hormonal-shift': {
    progression: [
      { phase: 'Reset', weeks: '1-2', rir: '2 RIR', notes: 'New movements. Cycle phase mapping critical.' },
      { phase: 'Build', weeks: '3-4', rir: '1-2 RIR', notes: 'Cycle phase determines upper limit at every session.' },
      { phase: 'Peak', weeks: '5', rir: '1 RIR', notes: 'Follicular or ovulatory only. Luteal holds at 2 RIR.' },
      { phase: 'Recover', weeks: '6', rir: '3-4 RIR', notes: 'Full recovery. Food volume maintained.' },
    ],
    rules: [
      'Session B EMOM finisher: optional, 7/10 effort maximum',
      'Map cycle timing across all 6 weeks before Block C begins - it determines your peak week',
      'If peak week falls during luteal phase, move peak effort to the nearest follicular window',
      'Week 6: note how hormonal symptoms, energy, and body composition have shifted across the full 18 weeks',
    ],
  },
  'system-overload': {
    progression: [
      { phase: 'Reset', weeks: '1-2', rir: '3 RIR', notes: 'Longest reset of any block. New movements only.' },
      { phase: 'Build', weeks: '3-4', rir: '2-3 RIR', notes: 'Gradual increase only. Check-in data governs every step.' },
      { phase: 'Peak', weeks: '5', rir: '2 RIR', notes: 'Most modest peak of any pattern. Quality over proximity to failure.' },
      { phase: 'Recover', weeks: '6', rir: '5 RIR', notes: 'Lightest week of the full cycle. 50% set reduction.' },
    ],
    rules: [
      'Session B finisher remains skipped',
      'Tri-sets: do as straight sets with 2-3 minutes rest if tri-sets feel like too much',
      'Week 5: if energy markers have been below 3/5 consistently, hold at 3 RIR rather than pushing to 2',
      'Week 6: full deload, 50% set reduction. The pattern re-assessment that follows depends on how well you recover this week',
    ],
  },
}

const BLOCK_C_NUTRITION: Record<string, { headline: string; newStrategy: { title: string; points: string[] }[]; phaseNotes: { phase: string; weeks: string; note: string }[] }> = {
  'stress-stored': {
    headline: 'Block C nutrition prepares the body for peak output and the pattern re-assessment that follows. Recovery is the primary lever.',
    newStrategy: [
      {
        title: 'Peak Fuelling Protocol',
        points: [
          'Weeks 3-5: post-training carbs increase to 2-3 cupped hands on heavy session days.',
          'Pre-training meal is non-negotiable - protein and fat 60-90 minutes before every session.',
          'Cortisol anchor evening meal structure continues throughout Block C.',
          'No skipped meals in peak weeks. Undereating during peak training weeks spikes cortisol and works directly against this pattern.',
        ],
      },
      {
        title: 'Pattern Re-Assessment Preparation (Week 6)',
        points: [
          'Week 6 is not just a deload - it is a reset observation week.',
          'Reduce post-training carbs back to 1 cupped hand.',
          'Notice where any remaining softness or bloating sits in your body.',
          'Track morning energy, afternoon crash, and mood - these become the re-assessment inputs alongside your check-in data.',
        ],
      },
    ],
    phaseNotes: [
      { phase: 'Reset', weeks: '1-2', note: 'Maintain Block B nutrition structure. Anchor meals continue every training day.' },
      { phase: 'Build', weeks: '3-4', note: 'Increase post-training carbs to 2-3 cupped hands on heavy session days. Pre-training fuel mandatory.' },
      { phase: 'Peak', weeks: '5', note: 'Highest food volume of Block C. Never under-eat in peak week for this pattern.' },
      { phase: 'Recover', weeks: '6', note: 'Post-training carbs drop to 1 cupped hand. Begin re-assessment observation. Note energy patterns and fat storage signals.' },
    ],
  },
  'metabolic-drift': {
    headline: 'Block C nutrition peaks carb intake alongside training output, then drops sharply in the deload to assess how the metabolic system has adapted.',
    newStrategy: [
      {
        title: 'Peak Carb Protocol',
        points: [
          'Week 5 is the highest carb intake of the entire programme.',
          'Session B day: 3 cupped hands post-training. This session earns the fuel.',
          'Session A and C days: 2-3 cupped hands post-training.',
          'Rest days remain fruit only - the contrast is what drives the adaptation.',
        ],
      },
      {
        title: 'Post-Block Assessment (Week 6)',
        points: [
          'Drop carbs back to Block A levels in week 6.',
          'This deliberate contrast after peak intake gives a clear read on how insulin sensitivity has shifted.',
          'Monitor energy on rest days specifically - a well-adapted metabolic system maintains energy without starchy carbs.',
          'This data informs whether the next cycle should continue as Insulin-Drift or shift pattern.',
        ],
      },
    ],
    phaseNotes: [
      { phase: 'Reset', weeks: '1-2', note: 'Maintain Block B calorie periodisation. Carbs on training days, fruit on rest days.' },
      { phase: 'Build', weeks: '3-4', note: 'Increase training day carbs. Session B gets the most - it demands the most.' },
      { phase: 'Peak', weeks: '5', note: 'Highest carb intake of the programme on Session B day. Fuel the maximum output.' },
      { phase: 'Recover', weeks: '6', note: 'Drop to Block A carb levels. Observe how energy holds on rest days without starchy carbs. This is the re-assessment signal.' },
    ],
  },
  'hormonal-shift': {
    headline: 'Block C nutrition maps food volume to cycle phase more precisely than any previous block. The programme peaks when your biology peaks.',
    newStrategy: [
      {
        title: 'Cycle-Mapped Peak Week',
        points: [
          'If peak week (week 5) falls in the follicular or ovulatory phase: push training hard, increase carbs to 2-3 cupped hands post-training, eat fully.',
          'If peak week falls in the luteal phase: hold training at 2 RIR, increase fat to 2-3 thumbs per meal, allow starchy carbs 3x on rest days.',
          'Never force a peak during luteal phase. The hormonal environment does not support maximum output - and fighting it creates setbacks.',
          'If the cycle alignment is unfavourable, contact Kade before week 5 to discuss adjusting the peak window.',
        ],
      },
      {
        title: 'Re-Assessment Nutrition (Week 6)',
        points: [
          'Maintain full food volume in week 6 regardless of reduced training.',
          'Observe: has the luteal phase become more manageable? Are cravings lower? Is mood more stable across the cycle?',
          'These changes indicate whether the pattern has shifted or the Estrogen-Shift pattern needs another cycle.',
        ],
      },
    ],
    phaseNotes: [
      { phase: 'Reset', weeks: '1-2', note: 'Map cycle timing across all 6 weeks of Block C. This determines your entire nutrition approach for the block.' },
      { phase: 'Build', weeks: '3-4', note: 'Follow the cycle-mapped approach. Follicular: push. Luteal: support. No exceptions.' },
      { phase: 'Peak', weeks: '5', note: 'Peak nutrition follows peak biology. Follicular: maximum carbs and output. Luteal: maximum fat and recovery.' },
      { phase: 'Recover', weeks: '6', note: 'Full food volume maintained. Observe hormonal symptom changes as re-assessment inputs.' },
    ],
  },
  'system-overload': {
    headline: 'Block C nutrition prioritises nervous system recovery above performance gains. The re-assessment at the end of this block measures how far the system has come.',
    newStrategy: [
      {
        title: 'Maximum Recovery Nutrition',
        points: [
          'Red meat at least 3 times per week in Block C - higher than any previous block.',
          'Liver once per week if tolerated. This remains the most efficient single food for nervous system recovery.',
          'Magnesium every night without exception - the most impactful single supplement for this pattern.',
          'Pre-sleep protocol non-negotiable: nothing within 2 hours of bed, magnesium 60 minutes before sleep.',
        ],
      },
      {
        title: 'Re-Assessment Observation (Week 6)',
        points: [
          'Week 6 is the lightest training week of the entire programme.',
          'Use the reduced demand to observe baseline energy - how does the nervous system feel when the load is low?',
          'Significant improvement in baseline energy over 18 weeks indicates the system has recovered.',
          'Persistent fatigue despite the deload suggests another cycle of Androgen-Decline work is warranted before shifting pattern.',
        ],
      },
    ],
    phaseNotes: [
      { phase: 'Reset', weeks: '1-2', note: 'Maximum recovery nutrition from day 1. Red meat, liver, magnesium. Pre-sleep protocol every night.' },
      { phase: 'Build', weeks: '3-4', note: 'Maintain recovery stack. Pre-session fuel mandatory. Monitor energy markers in check-in closely.' },
      { phase: 'Peak', weeks: '5', note: 'Pre-session fuel critical. Protein and fat 60-90 minutes before every session. No exceptions in peak week.' },
      { phase: 'Recover', weeks: '6', note: '50% set reduction. Maximum food volume. Observe baseline energy - this is the re-assessment signal.' },
    ],
  },
}

const BLOCK_C_COACHING_NOTES: Record<string, Record<number, string>> = {
  'stress-stored': {
    1: 'Block C is the peak of the 18-week cycle. Lower rep ranges, heavier loads, tri-set pairings. In weeks 1-2 the priority is adapting to the new format - not chasing load. The heaviest sets come in weeks 3-5.',
    2: 'Anchor meals are now established. In Block C they become even more important - as training demand peaks, food decision fatigue becomes a real cortisol source. Two anchored meals per day removes that variable entirely.',
    3: 'Training load is now the highest of the programme. Your sleep quality marker in this check-in determines how you approach week 4. 4/5 or above - progress the load. Below that - hold steady.',
    4: 'If your strength numbers are moving week on week, the system is working. The combination of cortisol management, anchor meals, and progressive load is producing adaptation. Notice it.',
    5: 'Peak week. 1 RIR on all major lifts. Pre-training fuel is non-negotiable this week - protein and fat 60-90 minutes before every session. Do not skip it for any reason.',
    6: 'Full deload. 40% set reduction. Begin the re-assessment observation: where does any remaining softness sit? How does your morning energy feel? How is your sleep? This data feeds the next cycle.',
  },
  'metabolic-drift': {
    1: 'Block C introduces the peak rep ranges of the programme. Lower reps, heavier loads, more complex movement pairings. Weeks 1-2 are about adjusting - the maximum effort weeks are 3-5.',
    2: 'Calorie periodisation is now at its most structured. Training days are the highest intake of the programme. Rest days are fruit only. The contrast between training and rest day intake is the insulin sensitivity driver.',
    3: 'Near-maximum effort begins this week. Record every set on every compound lift. These are the numbers you are trying to surpass in week 5. If you are not recording, you cannot know if you improved.',
    4: 'The EMOM finisher in Session B is the highest metabolic output moment of the entire programme. Approach it that way. 10 minutes of maximum sustained effort is what creates the most significant insulin sensitivity shift.',
    5: 'Peak week. 0 RIR. True maximum effort across all sessions. Session B carb window is the largest of the programme today - 3 cupped hands post-training. Fuel the output completely.',
    6: 'Deload. Carbs drop back to Block A levels. Use this week to observe how energy holds on rest days without starchy carbs. If it holds well - the metabolic system has shifted. If it dips sharply - another cycle is warranted.',
  },
  'hormonal-shift': {
    1: 'Block C is the highest demand block. Map where your cycle falls across all 6 weeks before you begin. This single piece of planning will determine how you approach load, carbs, and recovery across the entire block.',
    2: 'The programme peaks when your biology peaks. If you are currently in the follicular phase, push the load and carbs hard this week. If luteal, hold steady and recover well. Both approaches are correct - they are just different.',
    3: 'Build phase begins. Load increases only when your cycle phase supports it. If you are follicular or ovulatory, push to 1-2 RIR. If luteal, hold at 2-3 RIR. The calendar says week 3. Your body determines the intensity.',
    4: 'Consistency across 18 weeks is the adaptation. The fact that you are in Block C at week 4 is evidence of that. The body composition changes in this pattern are visible in the check-in trend data - look at how your markers have moved since Block A.',
    5: 'Peak week. If follicular or ovulatory - push to 1 RIR and fuel fully. If luteal - hold at 2 RIR, increase fat intake, and treat this as a strategic recovery week. There is no wrong answer, only the honest one.',
    6: 'Final deload. Food volume maintained. Observe: has the luteal phase become more manageable across this block? Are cycle symptoms lighter? This determines whether the pattern has shifted or another cycle is needed.',
  },
  'system-overload': {
    1: 'Block C is the most demanding block. Your nervous system has 18 weeks of progressive work behind it. The tri-set format is new - if it feels like too much in weeks 1-2, do straight sets with full rest. The format adjusts to the system.',
    2: 'Maximum recovery nutrition this week. Red meat at least twice. Liver if possible. Magnesium every night. Pre-sleep protocol every night. Recovery nutrition is the most powerful variable for this pattern in Block C.',
    3: 'Load progression only if check-in energy markers are 3/5 or above. If they are below, hold at 3 RIR for another week. This has been the rule since Block A. It does not change in the peak block.',
    4: 'The check-in trend data across 18 weeks is now a meaningful dataset. Look at the trends tab and observe how your energy, sleep, and recovery markers have moved from Block A week 1 to now. That movement is the adaptation.',
    5: 'Modest peak. 2 RIR, controlled throughout. Pre-session fuel is critical this week without exception. The nervous system needs fuel to perform at its current capacity. Do not skip the pre-training meal.',
    6: 'Lightest week of the programme. 50% set reduction. Observe baseline energy with the load removed. How does the nervous system feel when the demand is minimal? That answer determines the re-assessment outcome.',
  },
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'training', label: 'Training' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'resources', label: 'Resources' },
  { id: 'checkin', label: 'Check-In' },
  { id: 'trends', label: 'Trends' },
]

type Exercise = { name: string; sets: number; reps: string; notes: string }
type Session = { id: string; name: string; subtitle: string; gym: Exercise[]; home: Exercise[]; bodyweight: Exercise[] }

const BLOCK_A_SESSIONS: Session[] = [
  {
    id: 'A',
    name: 'Session A',
    subtitle: 'Strength Foundation',
    gym: [
      { name: 'Barbell Back Squat', sets: 4, reps: '8', notes: 'Controlled descent. Drive through heels. Replace with DB Goblet if unfamiliar with bar.' },
      { name: 'DB Incline Bench Press', sets: 4, reps: '10', notes: '45-degree incline. Full range. Control the descent.' },
      { name: 'Chest-Supported Row', sets: 4, reps: '10', notes: 'Elbows drive back. Squeeze hard at end range.' },
      { name: 'Bulgarian Split Squat', sets: 3, reps: '10/leg', notes: 'Rear foot elevated. Full depth. Upright torso.' },
      { name: 'Pallof Press', sets: 3, reps: '12', notes: 'Core anti-extension. Stand side-on to cable. Press out and hold 2 seconds.' },
    ],
    home: [
      { name: 'DB Goblet Squat (Paused)', sets: 4, reps: '10', notes: '2-second pause at the bottom. Makes the load more demanding.' },
      { name: 'DB Incline Push-Up to Row', sets: 4, reps: '10', notes: 'Hands on chair. Push up, then row each arm. One fluid movement.' },
      { name: 'Bent Over DB Row (Double)', sets: 4, reps: '10', notes: 'Both DBs at once. Hinge at hips. Drive elbows back hard.' },
      { name: 'Bulgarian Split Squat', sets: 3, reps: '10/leg', notes: 'Rear foot on chair. Full depth. Hold DBs at sides.' },
      { name: 'Suitcase Carry', sets: 3, reps: '20m/side', notes: 'Hold one heavy DB at your side. Walk straight. Resist the lean.' },
    ],
    bodyweight: [
      { name: 'Paused Squat', sets: 4, reps: '12', notes: '3-second pause at the bottom. Drive up hard.' },
      { name: 'Archer Push-Up', sets: 4, reps: '8/side', notes: 'Wide hands. Shift weight to one side as you descend. Harder than a standard push-up.' },
      { name: 'Table Inverted Row (Feet Elevated)', sets: 4, reps: '10', notes: 'Feet on chair, body horizontal. Pull chest to table.' },
      { name: 'Bulgarian Split Squat', sets: 3, reps: '12/leg', notes: 'Bodyweight only. Slow and controlled. Pause at the bottom.' },
      { name: 'Dead Bug', sets: 3, reps: '10/side', notes: 'Lie on back. Opposite arm and leg extend slowly. Lower back stays flat.' },
    ],
  },
  {
    id: 'B',
    name: 'Session B',
    subtitle: 'Conditioning and Volume',
    gym: [
      { name: 'Romanian Deadlift', sets: 4, reps: '10', notes: 'Heavy. Hinge deep. Feel full hamstring load before returning.' },
      { name: 'DB Arnold Press', sets: 3, reps: '10', notes: 'Rotate wrists from palms-in to palms-out as you press overhead.' },
      { name: 'Reverse Lunge to Knee Drive', sets: 3, reps: '10/leg', notes: 'Step back, lunge, then drive the back knee up to hip height.' },
      { name: 'Pull-Up or Lat Pulldown', sets: 4, reps: '8-10', notes: 'Pull to the top, lower slowly over 3 seconds.' },
      { name: 'Finisher: Assault Bike or Row', sets: 5, reps: '40s hard / 80s easy', notes: 'Pattern rules apply.' },
    ],
    home: [
      { name: 'DB Romanian Deadlift (Single Leg)', sets: 4, reps: '10/leg', notes: 'Balance on one leg. Hinge until torso is parallel. Control the return.' },
      { name: 'DB Arnold Press', sets: 3, reps: '10', notes: 'Seated or standing. Rotate wrists as you press.' },
      { name: 'Reverse Lunge to Knee Drive', sets: 3, reps: '10/leg', notes: 'DBs at sides. Drive the knee high on the return.' },
      { name: 'DB Pullover (Floor)', sets: 4, reps: '12', notes: 'Lie flat. One heavy DB. Stretch overhead, pull to chest.' },
      { name: 'Finisher: DB Thrusters', sets: 5, reps: '40s hard / 80s easy', notes: 'Squat with DBs at shoulders, press overhead as you stand.' },
    ],
    bodyweight: [
      { name: 'Single Leg Hip Hinge', sets: 4, reps: '10/leg', notes: 'Balance on one leg, hinge forward until torso is parallel. Control the return.' },
      { name: 'Decline Push-Up', sets: 3, reps: '12', notes: 'Feet elevated. Full chest to floor range.' },
      { name: 'Reverse Lunge to Knee Drive', sets: 3, reps: '10/leg', notes: 'Bodyweight. Drive the knee high and hold 1 second at top.' },
      { name: 'Towel Pull-Apart', sets: 4, reps: '15', notes: 'Hold a towel wide, pull it apart with straight arms. Upper back and rear delts.' },
      { name: 'Finisher: Jump Squats', sets: 5, reps: '40s hard / 80s easy', notes: 'Squat, then explode into a jump. Land soft.' },
    ],
  },
  {
    id: 'C',
    name: 'Session C',
    subtitle: 'Unilateral and Overhead',
    gym: [
      { name: 'Single Leg Leg Press', sets: 3, reps: '10/leg', notes: 'Full range. Single leg focus is new this block.' },
      { name: 'Seated DB Shoulder Press', sets: 4, reps: '10', notes: 'Strict seated. No leg drive. Full overhead range.' },
      { name: 'Chest-Supported T-Bar Row', sets: 4, reps: '10', notes: 'Full stretch at the bottom. Drive elbows hard at the top.' },
      { name: 'DB Step-Up (High Box)', sets: 3, reps: '12/leg', notes: 'Box at knee height. Drive through front leg fully before stepping down.' },
      { name: 'Landmine Rotation', sets: 3, reps: '12/side', notes: 'Rotational core. Hips and core move together.' },
    ],
    home: [
      { name: 'Single Leg DB Squat to Box', sets: 3, reps: '10/leg', notes: 'Lower onto a chair on one leg. Drive back up from the box.' },
      { name: 'Seated DB Shoulder Press', sets: 4, reps: '10', notes: 'Seated on chair. Strict overhead press. No leg drive.' },
      { name: 'DB Chest-Supported Row', sets: 4, reps: '10', notes: 'Lie face-down on elevated surface. Row DBs to hips.' },
      { name: 'DB Step-Up', sets: 3, reps: '12/leg', notes: 'High step or sturdy chair. Drive through the front leg.' },
      { name: 'DB Suitcase Deadlift', sets: 3, reps: '12', notes: 'Hold one DB on one side only. Resist the tilt. Full hip hinge.' },
    ],
    bodyweight: [
      { name: 'Assisted Pistol Squat', sets: 3, reps: '8/leg', notes: 'Hold a doorframe. Lower on one leg as far as you can. Build the range.' },
      { name: 'Pike Push-Up (Elevated)', sets: 4, reps: '10', notes: 'Feet on a chair. Hips high. Lower crown toward floor.' },
      { name: 'Table Inverted Row (Close Grip)', sets: 4, reps: '10', notes: 'Hands narrower than shoulder-width. Targets mid-back differently.' },
      { name: 'Step-Up (High)', sets: 3, reps: '12/leg', notes: 'Sturdy chair at knee height. Full extension at the top.' },
      { name: 'Hollow Hold', sets: 3, reps: '25 sec', notes: 'Lower back pressed flat. Arms overhead, legs straight and low.' },
    ],
  },
]

const PATTERN_TRAINING: Record<string, {
  progression: { phase: string; weeks: string; rir: string; notes: string }[]
  rules: string[]
}> = {
  'stress-stored': {
    progression: [
      { phase: 'Reset', weeks: '1-2', rir: '3 RIR', notes: 'New movements only. Do not push. Technique first.' },
      { phase: 'Build', weeks: '3-4', rir: '2-3 RIR', notes: 'Gradual load increases. Only progress if energy markers are 3/5+.' },
      { phase: 'Load', weeks: '5', rir: '2 RIR', notes: 'Controlled peak. No 1 RIR sets.' },
      { phase: 'Deload', weeks: '6', rir: '4 RIR', notes: 'Reduce sets by 30%. Short sessions.' },
    ],
    rules: [
      'Skip Session B finisher - no conditioning work',
      'Zone 2 walking only (20-30 min on rest days) - never high intensity cardio',
      'Sleep outranks training - if sleep was poor, reduce to 2 working sets per exercise',
      'Rest between sets: minimum 90 seconds',
      'If Week 5 check-in energy markers are below 3/5, hold at 3 RIR rather than pushing to 2',
    ],
  },
  'metabolic-drift': {
    progression: [
      { phase: 'Reset', weeks: '1-2', rir: '2-3 RIR', notes: 'Adjust to new movements. Maintain conditioning.' },
      { phase: 'Build', weeks: '3-4', rir: '1-2 RIR', notes: 'Progressive load. Record your numbers.' },
      { phase: 'Load', weeks: '5', rir: '0-1 RIR', notes: 'Near-failure sets. Peak of the block.' },
      { phase: 'Deload', weeks: '6', rir: '3-4 RIR', notes: 'Reduce sets by 30%.' },
    ],
    rules: [
      'Session B finisher is mandatory every session',
      '15-20 min walk after every session - non-negotiable from Block A',
      'Train fasted or semi-fasted where possible',
      'Carbohydrate intake within 90 minutes post-session only',
      'Push Session B finisher to 9/10 effort in Weeks 3-4',
    ],
  },
  'hormonal-shift': {
    progression: [
      { phase: 'Reset', weeks: '1-2', rir: '2-3 RIR', notes: 'Consistent attendance is the priority.' },
      { phase: 'Build', weeks: '3-4', rir: '2 RIR', notes: 'Add load only if recovery markers are 3/5+ in check-in.' },
      { phase: 'Load', weeks: '5', rir: '1-2 RIR', notes: 'Moderate peak. Never 1 RIR if recovery is compromised.' },
      { phase: 'Deload', weeks: '6', rir: '3-4 RIR', notes: 'Reduce sets by 30%.' },
    ],
    rules: [
      'Session B finisher: optional, effort level 6/10 maximum',
      'Never miss a session - consistency is the adaptation signal',
      'Never add extra sessions - three is the prescription, not a minimum',
      'If luteal phase falls in Weeks 3-4, hold at 3 RIR regardless of the programme',
    ],
  },
  'system-overload': {
    progression: [
      { phase: 'Reset', weeks: '1-2', rir: '3-4 RIR', notes: 'Bridge deload. New stimulus without new stress.' },
      { phase: 'Build', weeks: '3-4', rir: '3 RIR', notes: 'Quality only. Progress only when 3 RIR feels genuinely comfortable.' },
      { phase: 'Load', weeks: '5', rir: '2-3 RIR', notes: 'Modest peak. Controlled throughout.' },
      { phase: 'Deload', weeks: '6', rir: '4 RIR', notes: 'Reduce sets by 40%. Nervous system recovery.' },
    ],
    rules: [
      'Skip Session B finisher - no conditioning work',
      'No additional cardio - walking only if genuinely restorative',
      'Rest between sets: 2-3 minutes minimum',
      'Reduce to 2 working sets per exercise if energy is significantly depleted',
      'Do not progress RIR early - wait for check-in energy markers to confirm readiness',
    ],
  },
}

const BLOCK_A_NUTRITION: Record<string, { headline: string; newStrategy: { title: string; points: string[] }[]; phaseNotes: { phase: string; weeks: string; note: string }[] }> = {
  'stress-stored': {
    headline: 'The Blueprint removed the stressors. Block A uses nutrition to actively lower the cortisol curve.',
    newStrategy: [
      {
        title: 'The Cortisol Anchor Evening Meal',
        points: [
          'Protein: 2 palms minimum (red meat preferred - beef or lamb)',
          'Fat: generous - butter, ghee, or avocado',
          'Magnesium-rich vegetables: leafy greens, pumpkin seeds as garnish',
          'No fruit or starchy carbs in this meal',
          'Eat at least 2 hours before bed',
          'This meal tells the nervous system the day is over',
        ],
      },
      {
        title: 'Caffeine Audit',
        points: [
          'Cut all caffeine to before 10am in Block A',
          'Stricter than the Blueprint - the cortisol rhythm is now stable enough to feel the difference',
        ],
      },
      {
        title: 'Carb Timing Update',
        points: [
          'Blueprint: 1 cupped hand post-training only',
          'Block A: 1-2 cupped hands post-training as training demand increases',
          'Still no rest-day starchy carbs',
        ],
      },
    ],
    phaseNotes: [
      { phase: 'Reset', weeks: '1-2', note: 'Introduce the cortisol anchor evening meal. Keep everything else identical to Blueprint habits.' },
      { phase: 'Build', weeks: '3-4', note: 'Tighten caffeine to before 10am. Monitor sleep quality in check-in as the marker of whether nutrition is working.' },
      { phase: 'Load', weeks: '5', note: 'Increase post-training carbs to 2 cupped hands to support higher training intensity.' },
      { phase: 'Deload', weeks: '6', note: 'Drop post-training carbs back to 1 cupped hand. Keep anchor meal structure.' },
    ],
  },
  'metabolic-drift': {
    headline: 'Block A introduces formal carb cycling - using training days vs rest days deliberately to drive insulin response.',
    newStrategy: [
      {
        title: 'Formal Carb Cycling',
        points: [
          'Training day: 2 cupped hands post-training (up from Blueprint)',
          'Rest day: fruit only (1-2 fists) - no starchy carbs',
          'Session B day (highest output): 2-3 cupped hands post-training',
          'The signal needs a clear on/off - rest days create the contrast',
        ],
      },
      {
        title: 'Protein Loading',
        points: [
          'Target 2.5-3 palms of protein per day spread across meals',
          'More lean muscle mass is the long-term driver of insulin sensitivity',
          'Protein is building the system that changes the pattern',
        ],
      },
      {
        title: 'The Post-Meal Walk',
        points: [
          'Was a Blueprint rule - now a non-negotiable habit',
          '15 minutes after every meal does more for this pattern than any supplement',
          'If it is not consistent yet, make it the single nutrition focus of weeks 1-2',
        ],
      },
    ],
    phaseNotes: [
      { phase: 'Reset', weeks: '1-2', note: 'Introduce formal carb cycling. Training days get more carbs. Rest days - fruit only.' },
      { phase: 'Build', weeks: '3-4', note: 'Increase protein to 2.5-3 palms per day. Monitor energy levels in check-in.' },
      { phase: 'Load', weeks: '5', note: 'Maximise post-training carb window on Session B days. Highest demand week.' },
      { phase: 'Deload', weeks: '6', note: 'Drop back to Blueprint carb levels. Use the week to assess how the body has changed over 6 weeks.' },
    ],
  },
  'hormonal-shift': {
    headline: 'Block A introduces cycle-aware eating - using your natural hormonal rhythm to guide when to push and when to hold.',
    newStrategy: [
      {
        title: 'Phase-Aware Eating',
        points: [
          'Follicular (days 1-14): energy tends to be higher. Post-training carbs on the higher end (2 cupped hands).',
          'Ovulatory (days 14-16): peak energy window. Eat fully and do not restrict.',
          'Luteal (days 17-28): progesterone rises. Increase fat intake. Allow 2-3 rest-day starchy carb servings.',
          'Menstrual (days 1-5): red meat, iron-rich foods, rest. Do not restrict carbs.',
          'Without a natural cycle (HBC, peri/menopause): apply luteal principles year-round.',
        ],
      },
      {
        title: 'Fat Quality Focus',
        points: [
          'Omega-3 priority: salmon, sardines, or eggs at least 3x per week',
          'Saturated fat for hormone production: butter, ghee, full-fat dairy daily',
          'Avoid all seed oils - now non-negotiable, not a preference',
        ],
      },
    ],
    phaseNotes: [
      { phase: 'Reset', weeks: '1-2', note: 'Introduce cycle-aware eating. Identify where in the cycle weeks 1-6 fall. Plan accordingly.' },
      { phase: 'Build', weeks: '3-4', note: 'If luteal phase falls here, increase fat to 2 thumbs per meal. Allow rest-day starchy carbs 2-3x per week.' },
      { phase: 'Load', weeks: '5', note: 'If follicular/ovulatory - push training and carbs. If luteal - hold steady.' },
      { phase: 'Deload', weeks: '6', note: 'Keep food volume identical to Week 5. Do not reduce nutrition because training reduces.' },
    ],
  },
  'system-overload': {
    headline: 'Block A introduces targeted recovery nutrition - specific micronutrients and timing protocols to accelerate nervous system repair.',
    newStrategy: [
      {
        title: 'The Recovery Stack',
        points: [
          'Magnesium: pumpkin seeds, leafy greens, dark chocolate, beef - daily',
          'Zinc: red meat, oysters, eggs, pumpkin seeds - daily',
          'Iron: beef, lamb, liver once per week if possible',
          'B vitamins: eggs, meat, leafy greens - daily',
          'All from food first. If supplementing, magnesium is the priority.',
        ],
      },
      {
        title: 'The 4-Hour Pre-Sleep Window',
        points: [
          'Nothing to eat within 2 hours of bed - digestion impairs sleep quality',
          'Magnesium-rich food or supplement 1 hour before bed',
          'Small protein-and-fat meal only if genuinely hungry in the evening - never carbs',
        ],
      },
    ],
    phaseNotes: [
      { phase: 'Reset', weeks: '1-2', note: 'Introduce the recovery stack deliberately. Aim for 3 of the 4 micronutrients every day from food.' },
      { phase: 'Build', weeks: '3-4', note: 'Introduce liver or organ meat once per week. Highest micronutrient density of any food.' },
      { phase: 'Load', weeks: '5', note: 'Pre-session fuel is critical as load peaks. Eat 1-2 hours before every session without exception.' },
      { phase: 'Deload', weeks: '6', note: 'Maintain full food volume. The deload is a recovery stimulus - nutrition is part of it.' },
    ],
  },
}

const COACHING_NOTES: Record<string, Record<number, string>> = {
  'stress-stored': {
    1: 'Block A starts with a slight reset. The Blueprint established the rhythm - Block A builds precision on top of it. Your focus this week is the cortisol anchor evening meal: protein, fat, magnesium-rich foods. Eat it 2 hours before bed every night this week.',
    2: 'Cut caffeine to before 10am this week. Your adrenal system has had 6 weeks to stabilise - now we tighten the protocol. If you notice better sleep quality by day 4, the timing is working.',
    3: 'Training load lifts this week. You are at 2-3 RIR - push the upper end only if energy markers are above 3/5 in your check-in. If sleep has been disrupted, hold at 3 RIR.',
    4: 'Post-training carb window expands to 2 cupped hands this week. Your training demand justifies it. Evening meal stays protein and fat only.',
    5: 'Peak week. Controlled 2 RIR across all sessions. No 1 RIR sets. The goal is quality of effort, not proximity to failure.',
    6: 'Planned deload. Reduce sets by 30%. Keep the cortisol anchor meal structure. This week is a recovery input - treat the lighter training as intentional, not easy.',
  },
  'metabolic-drift': {
    1: 'Block A introduces formal carb cycling. Training days: 2 cupped hands post-training. Rest days: fruit only, no starchy carbs. The signal to the insulin receptor needs a clear on/off - this creates it.',
    2: 'Push the protein this week. Target 2.5-3 palms per day spread across meals. More lean muscle mass is the long-term driver of insulin sensitivity.',
    3: 'Session B finisher is mandatory at near-max effort from this week. 9/10 effort. This is the highest metabolic output session and the biggest driver of insulin response for your pattern.',
    4: 'Post-training carb window stays at 2 cupped hands. If strength numbers are improving week on week, the system is working. If not, review whether you are hitting the walk after every session.',
    5: 'Peak week. Near-failure sets (0-1 RIR) on big compound movements. Record your numbers - these become the baseline for Block B.',
    6: 'Deload. Drop back to Blueprint carb levels. Use this week to assess how body composition has shifted over 6 weeks.',
  },
  'hormonal-shift': {
    1: 'Block A introduces cycle-aware eating. Identify where in your cycle weeks 1-6 fall - this determines your energy pattern for the block. Follicular and ovulatory: push harder. Luteal: increase fat and allow rest-day carbs.',
    2: 'Fat quality focus this week. Omega-3 at least 3 times: salmon, sardines, or eggs. Saturated fat daily: butter, ghee, full-fat dairy. Avoid all seed oils - this is now non-negotiable.',
    3: 'If you are in the luteal phase this week, increase fat to 2 thumbs per meal and allow starchy carbs 2-3 times on rest days. Do not push training intensity if recovery is compromised.',
    4: 'Consistency is the adaptation signal for your pattern. If you have hit every session, the work is landing - even if the scale has not moved. Body composition changes in this pattern show up 3-4 weeks after the training does.',
    5: 'Peak intensity if energy markers support it. If follicular or ovulatory, push to 1-2 RIR. If luteal, hold at 2-3 RIR. The programme bends to your biology.',
    6: 'Deload week. Food volume stays identical - do not reduce nutrition because training reduces. Your hormonal axis needs fuel to rebuild.',
  },
  'system-overload': {
    1: 'Block A starts with a bridge deload. New movements, light load (3-4 RIR), no conditioning. Your nervous system is being introduced to a new stimulus without new stress. This is intentional.',
    2: 'Recovery stack this week. Every day: pumpkin seeds or leafy greens for magnesium, red meat for zinc and iron, eggs for B vitamins. From food first.',
    3: 'Load can begin building this week - but only if check-in energy markers are 3/5 or above. If they are below, hold at 3-4 RIR for another week. The data tells you when to progress, not the calendar.',
    4: 'Introduce liver or organ meat once this week if possible. Highest micronutrient density of any food. Even a small serve makes a measurable difference for this pattern.',
    5: 'Modest peak. 2-3 RIR controlled throughout. No failure sets. Your nervous system responds to quality, not proximity to failure.',
    6: 'Extended deload. Reduce sets by 40%. Maintain full food volume - the deload is a recovery stimulus and nutrition supports it.',
  },
}

const RESOURCES: Record<string, { title: string; content: string }[]> = {
  'stress-stored': [
    { title: 'Cortisol and Sleep Architecture', content: 'Cortisol follows a diurnal rhythm - it should peak within 30-45 minutes of waking and decline steadily throughout the day. When this curve is dysregulated, it peaks too late (keeping you wired at night) or stays elevated through the afternoon. Light exposure within 10 minutes of waking and no screens for 60 minutes before bed are the two highest-leverage non-nutrition inputs for restoring this curve.' },
    { title: 'Supplement Protocol - Stress-Stored', content: 'Priority 1: Magnesium glycinate 300-400mg taken 1 hour before bed. Supports cortisol clearance and sleep architecture. Priority 2: Ashwagandha 300-600mg taken with the evening meal. Adaptogenic - lowers cortisol area under the curve across the day. Priority 3: Vitamin C 500-1000mg with breakfast. Cortisol synthesis draws on Vitamin C reserves.' },
    { title: 'Stress Stacking - What to Audit', content: 'Physical training is one stressor. But cortisol responds to all stressors equally. Audit your current load: sleep debt (the highest-impact stressor), caffeine timing, skipped meals, alcohol, overcommitted schedule, and relationship conflict. Removing one non-training stressor often unlocks more progress than any change to the programme itself.' },
  ],
  'metabolic-drift': [
    { title: 'How Insulin Sensitivity Works', content: 'Insulin is a storage hormone. When cells are sensitive to it, small amounts move glucose efficiently. When resistant, the pancreas secretes more insulin to compensate - and excess insulin signals fat storage. The two most powerful drivers of insulin sensitivity are: resistance training (creates glucose sink in muscle) and fasting gaps between meals (allows insulin to drop fully). Both are built into your programme.' },
    { title: 'Supplement Protocol - Insulin-Drift', content: 'Priority 1: Creatine monohydrate 5g daily. Increases phosphocreatine stores, directly improves training output which drives insulin sensitivity gains. Priority 2: Magnesium glycinate 300mg before bed. Supports glucose metabolism and sleep. Priority 3: Berberine 500mg with your largest carbohydrate meal. Mimics metformin mechanism, improving glucose uptake at the cellular level.' },
    { title: 'The Post-Meal Walk - Why It Works', content: 'A 15-minute walk after eating reduces post-meal blood glucose by 20-30% compared to sitting. The mechanism: muscle contraction (even low intensity) activates GLUT4 transporters independently of insulin - meaning glucose moves into muscle cells without requiring more insulin to be secreted. Over time, repeated post-meal walks rebuild the metabolic capacity that has drifted.' },
  ],
  'hormonal-shift': [
    { title: 'Hormone Synthesis and Fat', content: 'Sex hormones (oestrogen, progesterone, testosterone) are synthesised from cholesterol. Low dietary fat directly reduces the raw material available for hormone production. This is why restriction makes the Estrogen-Shift pattern worse. It removes the building blocks the body needs to produce the hormones that regulate metabolism, mood, and body composition. Fat is not a concession in this programme. It is the intervention.' },
    { title: 'Supplement Protocol - Estrogen-Shift', content: 'Priority 1: Magnesium glycinate 300-400mg before bed. Supports progesterone receptor sensitivity and sleep quality. Priority 2: Omega-3 (EPA+DHA) 2-3g daily. Reduces inflammation, supports oestrogen metabolism. Can come from food (salmon, sardines) or supplement. Priority 3: Zinc 15-25mg with dinner. Supports oestrogen clearance via the liver.' },
    { title: 'Cycle Syncing - Practical Guide', content: 'Follicular (days 1-14): Energy rises, oestrogen climbs. Best phase for high-intensity training and larger carb windows. Ovulatory (days 14-16): Peak physical capacity. Push training here. Luteal (days 17-28): Progesterone rises, energy and mood may dip, appetite increases. Reduce training intensity, increase fat and carbs, do not restrict. Menstrual (days 1-5): Iron-rich foods, rest priority. Allow starchy carbs freely.' },
  ],
  'system-overload': [
    { title: 'Androgen Decline and Recovery', content: 'Testosterone signalling drives muscle protein synthesis, drive, recovery, and motivation. When androgen function declines, the body still trains but the response is suppressed. The Androgen-Decline pattern is a state of insufficient testosterone signalling at the receptor level. The programme is designed to protect the inputs that support androgen function (deep sleep, resistance training, adequate protein and fat, zinc and Vitamin D status) while removing the inputs that suppress it (chronic high-intensity volume, calorie restriction, sleep debt, alcohol).' },
    { title: 'Supplement Protocol - Androgen-Decline', content: 'Priority 1: Magnesium glycinate 400mg before bed. Supports deep sleep, the primary window for testosterone synthesis. Non-negotiable. Priority 2: Zinc 15-25mg with dinner. Direct precursor to testosterone production. Priority 3: Vitamin D3 + K2 if sunlight exposure is limited. Testosterone synthesis depends on adequate Vitamin D. Priority 4 (if available): Liver capsules or desiccated liver 4-6 capsules daily. Provides concentrated B vitamins, iron, and zinc in highly bioavailable form.' },
    { title: 'HRV as a Readiness Signal', content: 'Heart Rate Variability (HRV) is the variation in time between heartbeats. Higher HRV = greater parasympathetic activity = better recovery state. For this pattern, tracking morning HRV (using a wearable or the free app Elite HRV) provides objective data to guide training decisions. On low HRV days, reduce training to 2 working sets per exercise and skip conditioning entirely. On high HRV days, train normally. The check-in energy markers are a subjective proxy for this. HRV adds objectivity.' },
  ],
}

const CHECKIN_MARKERS = [
  { key: 'energy_levels', label: 'Overall Energy', description: 'General energy across the day' },
  { key: 'morning_energy', label: 'Morning Energy', description: 'How you feel in the first hour of waking' },
  { key: 'sleep_quality', label: 'Sleep Quality', description: 'Quality and depth of sleep' },
  { key: 'afternoon_crash', label: 'Afternoon Crash', description: '1 = severe crash, 5 = no crash at all' },
  { key: 'hunger_cravings', label: 'Hunger and Cravings', description: '1 = constant cravings, 5 = controlled and stable' },
  { key: 'training_recovery', label: 'Training Recovery', description: 'How well you recover between sessions' },
  { key: 'mood_stability', label: 'Mood Stability', description: 'Consistency of mood across the week' },
  { key: 'physical_changes', label: 'Physical Changes', description: 'Visible or felt changes in body composition' },
]

type CheckIn = {
  id: string
  week_number: number
  energy_levels: number
  morning_energy: number
  sleep_quality: number
  afternoon_crash: number
  hunger_cravings: number
  training_recovery: number
  mood_stability: number
  physical_changes: number
  notes: string | null
  submitted_at: string
}

type FeaturedBoltOn = {
  product_id: string
  slug: string
  name: string
  price: number
  kind: string
  tagline: string
  hero_headline: string
  cover_signed_url: string
}

// Absolute check-in week <-> block numbering. Block A is weeks 1-6, B is 7-12,
// C is 13-18, matching the Extension's 1-12 across its two blocks.
const BLOCK_OFFSET: Record<string, number> = { A: 0, B: 6, C: 12 }
const weekInBlock = (absolute: number) => ((absolute - 1) % 6) + 1
const blockOfWeek = (absolute: number) => ['A', 'B', 'C'][Math.floor((absolute - 1) / 6)] ?? 'A'

export default function MembershipPortalClient({
  enrollment,
  featuredBoltOns,
  libraryToken,
  checkinEndpoint = '/api/membership/checkin',
  checkinWeekNumber,
}: {
  enrollment: MemberEnrollment
  featuredBoltOns?: FeaturedBoltOn[]
  libraryToken?: string
  // The Extension reuses this portal but stores check-ins in its own table
  // keyed by the true 1-12 week. These props let it override where check-ins
  // are read/written and which week number is recorded (block-relative weeks
  // would collide - Extension week 8 maps to Block B week 2, same as week 2).
  checkinEndpoint?: string
  checkinWeekNumber?: number
}) {
  const [activeTab, setActiveTab] = useState('home')
  const [equipment, setEquipment] = useState<'gym' | 'home' | 'bodyweight'>('gym')
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [expandedResource, setExpandedResource] = useState<string | null>(null)
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [checkinForm, setCheckinForm] = useState<Record<string, number>>({})
  const [checkinNotes, setCheckinNotes] = useState('')
  const [checkinSubmitting, setCheckinSubmitting] = useState(false)
  const [checkinError, setCheckinError] = useState<string | null>(null)
  const [checkinSuccess, setCheckinSuccess] = useState(false)

  const pattern = enrollment.pattern
  const config = PATTERN_CONFIG[pattern] ?? PATTERN_CONFIG['stress-stored']
  const block = enrollment.current_block ?? 'A'
  const currentWeek = enrollment.current_week ?? 1
  // Week recorded on check-ins. Defaults to the block-relative week (membership);
  // the Extension passes its true 1-12 week so its 12 check-ins stay distinct.
  // Check-ins are stored on an ABSOLUTE week number, not a block-relative one.
  // membership_checkins is unique on (enrollment_id, week_number) with no block
  // column, so storing the block-relative week meant Block B Week 1 collided
  // with Block A Week 1 and every check-in in Block B and C was rejected 409.
  // The Extension already passes its true 1-12 week for exactly this reason.
  const blockOffset = BLOCK_OFFSET[block] ?? 0
  const nominalCheckinWeek = checkinWeekNumber ?? blockOffset + currentWeek
  // The check-in being asked for is the EARLIEST week still outstanding, not
  // whatever week the portal has rolled to. The advance email names the week
  // just completed, so without this the answers save one week ahead of the week
  // they describe and the reminder keeps firing for a check-in already done.
  const submittedWeeks = new Set(checkins.map(c => c.week_number))
  const checkinWeek = (() => {
    for (let w = 1; w <= nominalCheckinWeek; w++) {
      if (!submittedWeeks.has(w)) return w
    }
    return nominalCheckinWeek
  })()
  // What the client is shown: the week inside its block, which is the only
  // numbering the portal and the emails use.
  const checkinWeekLabel = weekInBlock(checkinWeek)
  const phases = BLOCK_PHASES[block] ?? BLOCK_PHASES['A']
  const sessions = block === 'C' ? BLOCK_C_SESSIONS : block === 'B' ? BLOCK_B_SESSIONS : BLOCK_A_SESSIONS
  const trainingData = block === 'C'
    ? (BLOCK_C_PATTERN_TRAINING[pattern] ?? BLOCK_C_PATTERN_TRAINING['stress-stored'])
    : block === 'B'
      ? (BLOCK_B_PATTERN_TRAINING[pattern] ?? BLOCK_B_PATTERN_TRAINING['stress-stored'])
      : (PATTERN_TRAINING[pattern] ?? PATTERN_TRAINING['stress-stored'])
  const nutritionData = block === 'C'
    ? (BLOCK_C_NUTRITION[pattern] ?? BLOCK_C_NUTRITION['stress-stored'])
    : block === 'B'
      ? (BLOCK_B_NUTRITION[pattern] ?? BLOCK_B_NUTRITION['stress-stored'])
      : (BLOCK_A_NUTRITION[pattern] ?? BLOCK_A_NUTRITION['stress-stored'])
  const resources = RESOURCES[pattern] ?? RESOURCES['stress-stored']
  const coachingNote = block === 'C'
    ? (BLOCK_C_COACHING_NOTES[pattern]?.[currentWeek] ?? '')
    : block === 'B'
      ? (BLOCK_B_COACHING_NOTES[pattern]?.[currentWeek] ?? '')
      : (COACHING_NOTES[pattern]?.[currentWeek] ?? '')

  const currentPhase = (() => {
    if (currentWeek <= 2) return phases[0]
    if (currentWeek <= 4) return phases[1]
    if (currentWeek === 5) return phases[2]
    return phases[3]
  })()

  useEffect(() => {
    fetch(`${checkinEndpoint}?token=${enrollment.token}`)
      .then(r => r.json())
      .then(data => { if (data.checkins) setCheckins(data.checkins) })
      .catch(() => {})
  }, [enrollment.token, checkinEndpoint])

  async function submitCheckin(e: React.FormEvent) {
    e.preventDefault()
    if (CHECKIN_MARKERS.some(m => !checkinForm[m.key])) return
    setCheckinSubmitting(true)
    setCheckinError(null)
    const res = await fetch(checkinEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: enrollment.token, week_number: checkinWeek, notes: checkinNotes, ...checkinForm }),
    })
    const data = await res.json()
    if (res.ok) {
      setCheckinSuccess(true)
      setCheckinForm({})
      setCheckinNotes('')
      const updated = await fetch(`${checkinEndpoint}?token=${enrollment.token}`).then(r => r.json())
      if (updated.checkins) setCheckins(updated.checkins)
    } else {
      setCheckinError(data.error ?? 'Failed to save check-in.')
    }
    setCheckinSubmitting(false)
  }

  const thisWeekCheckin = checkins.find(c => c.week_number === checkinWeek)

  const card = (children: React.ReactNode, style?: React.CSSProperties) => (
    <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 22px', marginBottom: 16, ...style }}>
      {children}
    </div>
  )

  const label = (text: string, icon?: React.ElementType, colour?: string) => {
    const Icon = icon
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: Icon ? 14 : 8 }}>
        {Icon ? (
          <span style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(27,109,252,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B6DFC', flexShrink: 0 }}>
            <Icon size={16} strokeWidth={2.5} />
          </span>
        ) : null}
        <span style={{ fontSize: 11, fontWeight: 700, color: colour ?? config.colour, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{text}</span>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', color: '#141821', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', position: 'relative' }}>
      <style>{`
        .bp-lift { transition: transform .15s ease, box-shadow .15s ease; }
        .bp-lift:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(16,24,40,0.08), 0 20px 38px rgba(16,24,40,0.13) !important; }
      `}</style>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360, background: `radial-gradient(1100px 300px at 50% -60px, ${config.colour}12, transparent 70%)`, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E8EAEE', padding: '16px 0', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={logoUrl()} width={140} alt={brand().name} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#141821' }}>{enrollment.first_name}</div>
            <div style={{ fontSize: 12, color: config.colour, fontWeight: 600 }}>Membership - Block {block}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(6px)', borderBottom: '1px solid #E8EAEE', overflowX: 'auto', position: 'sticky', top: 57, zIndex: 20 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 6, padding: '10px 24px' }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                padding: '9px 16px', fontSize: 13, fontWeight: 700,
                color: activeTab === item.id ? '#FFFFFF' : '#43474F',
                background: activeTab === item.id ? config.colour : 'transparent', border: 'none', cursor: 'pointer',
                borderRadius: 99, whiteSpace: 'nowrap',
                boxShadow: activeTab === item.id ? `0 2px 8px ${config.colour}55` : 'none', transition: 'all 0.15s',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 24px 80px', position: 'relative' }}>

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div>
            {/* Premium hero panel */}
            <div style={{ background: 'linear-gradient(140deg, #17191F 0%, #0C1B33 100%)', borderRadius: 18, padding: '30px 30px 28px', marginBottom: 16, position: 'relative', overflow: 'hidden', boxShadow: '0 14px 34px rgba(11,31,51,0.28)' }}>
              <div style={{ position: 'absolute', top: -90, right: -70, width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${config.colour}47, transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#8FB4F5', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Body Recode Membership · Block {block}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF', background: config.colour, padding: '3px 11px', borderRadius: 99, letterSpacing: '0.04em' }}>{config.label}</span>
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                  Welcome back, {enrollment.first_name}
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.68)', lineHeight: 1.65, margin: '0 0 24px', maxWidth: 560 }}>{config.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>WEEK {currentWeek} OF 6</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#8FB4F5' }}>{currentPhase.name} phase</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5, 6].map(w => (
                    <div key={w} style={{ flex: 1, height: 7, borderRadius: 99, background: w <= currentWeek ? config.colour : 'rgba(255,255,255,0.14)', transition: 'background 0.3s' }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Block and week status */}
            {card(<>
              {label('Current Position', Compass)}
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div style={{ flex: 1, background: '#FFFFFF', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: config.colour }}>Block {block}</div>
                  <div style={{ fontSize: 11, color: '#43474F', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Consolidate</div>
                </div>
                <div style={{ flex: 1, background: '#FFFFFF', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#141821' }}>Week {currentWeek}</div>
                  <div style={{ fontSize: 11, color: '#43474F', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>of 6</div>
                </div>
                <div style={{ flex: 1, background: '#FFFFFF', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#141821' }}>{currentPhase.name}</div>
                  <div style={{ fontSize: 11, color: '#43474F', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phase</div>
                </div>
              </div>
            </>)}

            {/* Stage 4 ascension: Membership is the most natural step to 1:1 coaching */}
            <div style={{ marginBottom: 16 }}>
              <CoachingAscensionCTA source="membership_block" variant="primary" />
            </div>

            {/* Featured Bolt-ons */}
            {featuredBoltOns && featuredBoltOns.length > 0 && libraryToken && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0 }}>
                    Bolt-on store
                  </p>
                  <a href={`/library/${libraryToken}/store`} style={{ fontSize: 11, fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.10em', textTransform: 'uppercase', textDecoration: 'none' }}>
                    See all  →
                  </a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {featuredBoltOns.map((b, i) => (
                    <a
                      key={b.slug}
                      href={`/library/${libraryToken}/store/${b.slug}`}
                      style={{
                        display: 'block', textDecoration: 'none', color: 'inherit',
                        background: '#FFFFFF',
                        border: '1px solid #E8EAEE',
                        borderLeft: i === 0 ? '4px solid #1B6DFC' : '1px solid #E8EAEE',
                        borderRadius: 12, overflow: 'hidden',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr auto', gap: 16, alignItems: 'center', padding: '14px 16px' }}>
                        <div style={{
                          width: 88, aspectRatio: '1 / 1.414', borderRadius: 6, overflow: 'hidden',
                          background: '#FAFAFA', border: '1px solid #EAEAEA', flexShrink: 0,
                        }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={b.cover_signed_url} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: 10, fontWeight: 700, color: '#1B6DFC',
                            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4,
                          }}>
                            {b.kind === 'bolt_on_ai' ? 'AI Deep-Dive' : b.kind === 'protocol' ? 'Protocol Pack' : 'Bolt-on'}  ·  ${b.price.toFixed(0)}
                          </div>
                          <div style={{
                            fontSize: 16, fontWeight: 800, color: '#141821', letterSpacing: '-0.01em',
                            lineHeight: 1.25, marginBottom: 4,
                          }}>
                            {b.name}
                          </div>
                          <div style={{ fontSize: 13, color: '#43474F', lineHeight: 1.5 }}>
                            {b.tagline}
                          </div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.10em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                          Read  →
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly coaching note */}
            {coachingNote && card(<>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
                <img src={coach().photoUrl} width={38} height={38} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt={coach().firstName} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#141821' }}>{coach().firstName}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: config.colour, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Week {currentWeek} coaching note</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: '#43474F', lineHeight: 1.8, margin: 0 }}>{coachingNote}</p>
            </>)}

            {/* Phase structure */}
            {card(<>
              {label('Block A Phases', ListChecks)}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {phases.map(phase => {
                  const isActive = currentPhase.number === phase.number
                  return (
                    <div key={phase.name} style={{
                      background: '#FFFFFF', borderRadius: 8, padding: '12px 14px',
                      border: `1px solid ${isActive ? config.colour + '50' : '#E8EAEE'}`,
                      opacity: phase.number > currentPhase.number ? 0.4 : 1,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? config.colour : '#98A0AD' }}>{phase.name}</span>
                        <span style={{ fontSize: 12, color: '#43474F' }}>Weeks {phase.weeks}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#666D7A', margin: 0, lineHeight: 1.6 }}>{phase.description}</p>
                    </div>
                  )
                })}
              </div>
            </>)}
          </div>
        )}

        {/* TRAINING TAB */}
        {activeTab === 'training' && (
          <div>
            {/* Equipment toggle */}
            <div style={{ display: 'flex', background: '#FFFFFF', borderRadius: 8, padding: 3, gap: 2, marginBottom: 20, width: 'fit-content' }}>
              {([{ id: 'gym', label: 'Gym' }, { id: 'home', label: 'Home DBs' }, { id: 'bodyweight', label: 'No Equipment' }] as const).map(t => (
                <button key={t.id} onClick={() => setEquipment(t.id)} style={{
                  padding: '8px 16px', fontSize: 13, fontWeight: 600,
                  color: equipment === t.id ? '#FFFFFF' : '#43474F',
                  background: equipment === t.id ? config.colour : 'transparent',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* RIR progression */}
            {card(<>
              {label('Block A Progression', LineChart)}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {trainingData.progression.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 8, borderBottom: i < trainingData.progression.length - 1 ? '1px solid #E8EAEE' : 'none' }}>
                    <div style={{ minWidth: 80 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#141821' }}>{p.phase}</div>
                      <div style={{ fontSize: 11, color: '#43474F' }}>Weeks {p.weeks}</div>
                    </div>
                    <div style={{ minWidth: 60, fontSize: 13, fontWeight: 700, color: config.colour }}>{p.rir}</div>
                    <div style={{ fontSize: 13, color: '#666D7A', lineHeight: 1.5 }}>{p.notes}</div>
                  </div>
                ))}
              </div>
            </>)}

            {/* Pattern rules */}
            {card(<>
              {label('Pattern Rules - Block A', BookOpen)}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {trainingData.rules.map((rule, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.colour, marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#43474F', lineHeight: 1.65 }}>{rule}</span>
                  </div>
                ))}
              </div>
            </>)}

            {/* Sessions */}
            {sessions.map(session => (
              <div key={session.id} style={{ marginBottom: 12 }}>
                <button
                  onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                  style={{
                    width: '100%', background: '#FFFFFF', border: `1px solid ${expandedSession === session.id ? config.colour + '40' : '#E8EAEE'}`,
                    borderRadius: 12, padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#141821' }}>{session.name}</div>
                    <div style={{ fontSize: 12, color: '#43474F', marginTop: 2 }}>{session.subtitle}</div>
                  </div>
                  <div style={{ fontSize: 18, color: config.colour }}>{expandedSession === session.id ? '−' : '+'}</div>
                </button>
                {expandedSession === session.id && (
                  <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0 20px 16px' }}>
                    {session[equipment].map((ex, i) => (
                      <div key={i} style={{ padding: '14px 0', borderBottom: i < session[equipment].length - 1 ? '1px solid #E8EAEE' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#141821' }}>{ex.name}</span>
                          <span style={{ fontSize: 13, color: config.colour, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 12 }}>{ex.sets} x {ex.reps}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#666D7A', margin: 0, lineHeight: 1.6 }}>{ex.notes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* NUTRITION TAB */}
        {activeTab === 'nutrition' && (
          <div>
            {card(<>
              {label('Block A Nutrition Strategy', Salad)}
              <p style={{ fontSize: 14, color: '#43474F', lineHeight: 1.8, margin: 0 }}>{nutritionData.headline}</p>
            </>)}

            <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#43474F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Foundation</div>
              <p style={{ fontSize: 13, color: '#666D7A', margin: 0, lineHeight: 1.7 }}>The HABNS foundation from your Blueprint is unchanged. Protein, fat, fruit, post-training starchy carbs. Remove list still applies. Block A adds precision on top - it does not replace the foundation.</p>
            </div>

            {nutritionData.newStrategy.map((s, i) => (
              <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 12, padding: '20px 22px', marginBottom: 16 }}>
                {label(`New in Block A: ${s.title}`)}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {s.points.map((point, j) => (
                    <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.colour, marginTop: 6, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#43474F', lineHeight: 1.65 }}>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {card(<>
              {label('Phase Notes', FileText)}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {nutritionData.phaseNotes.map((note, i) => (
                  <div key={i} style={{ background: '#FFFFFF', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#141821' }}>{note.phase}</span>
                      <span style={{ fontSize: 12, color: '#43474F' }}>Weeks {note.weeks}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#666D7A', margin: 0, lineHeight: 1.6 }}>{note.note}</p>
                  </div>
                ))}
              </div>
            </>)}
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div>
            {card(<>
              {label('Pattern Resource Library', BookOpen)}
              <p style={{ fontSize: 14, color: '#43474F', margin: 0, lineHeight: 1.7 }}>Deep-dive guides for the {config.label} pattern. These go beyond the programme - they explain the biology, the protocols, and how to apply them.</p>
            </>)}

            {resources.map((resource, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <button
                  onClick={() => setExpandedResource(expandedResource === resource.title ? null : resource.title)}
                  style={{
                    width: '100%', background: '#FFFFFF',
                    border: `1px solid ${expandedResource === resource.title ? config.colour + '40' : '#E8EAEE'}`,
                    borderRadius: expandedResource === resource.title ? '12px 12px 0 0' : 12,
                    padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#141821', textAlign: 'left' }}>{resource.title}</span>
                  <span style={{ fontSize: 18, color: config.colour, flexShrink: 0, marginLeft: 12 }}>{expandedResource === resource.title ? '−' : '+'}</span>
                </button>
                {expandedResource === resource.title && (
                  <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '16px 20px' }}>
                    <p style={{ fontSize: 14, color: '#43474F', margin: 0, lineHeight: 1.8 }}>{resource.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CHECK-IN TAB */}
        {activeTab === 'checkin' && (
          <div>
            {card(<>
              {label('Weekly Check-In', ClipboardCheck)}
              <p style={{ fontSize: 14, color: '#43474F', margin: '0 0 4px', lineHeight: 1.7 }}>Week {checkinWeekLabel} of Block {block}. Rate each marker from 1 (poor) to 5 (excellent).</p>
            </>)}

            {thisWeekCheckin ? (
              <div style={{ background: '#FFFFFF', border: `1px solid ${config.colour}40`, borderRadius: 12, padding: '20px 22px', marginBottom: 16 }}>
                {label('Week ' + checkinWeekLabel + ' submitted')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {CHECKIN_MARKERS.map(m => (
                    <div key={m.key} style={{ background: '#FFFFFF', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: '#43474F', marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: config.colour }}>{(thisWeekCheckin as any)[m.key]}/5</div>
                    </div>
                  ))}
                </div>
                {thisWeekCheckin.notes && (
                  <p style={{ fontSize: 13, color: '#666D7A', margin: '12px 0 0', lineHeight: 1.7 }}>{thisWeekCheckin.notes}</p>
                )}
              </div>
            ) : (
              <form onSubmit={submitCheckin}>
                {CHECKIN_MARKERS.map(marker => (
                  <div key={marker.key} style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#141821', marginBottom: 4 }}>{marker.label}</div>
                    <div style={{ fontSize: 12, color: '#43474F', marginBottom: 12 }}>{marker.description}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3, 4, 5].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCheckinForm(f => ({ ...f, [marker.key]: val }))}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                            background: checkinForm[marker.key] === val ? config.colour : '#E8EAEE',
                            color: checkinForm[marker.key] === val ? '#FFFFFF' : '#43474F',
                            fontWeight: 700, fontSize: 16, cursor: 'pointer',
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#141821', marginBottom: 8 }}>Notes (optional)</div>
                  <textarea
                    value={checkinNotes}
                    onChange={e => setCheckinNotes(e.target.value)}
                    placeholder="Any observations this week..."
                    style={{ width: '100%', background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 8, padding: '12px', color: '#141821', fontSize: 14, lineHeight: 1.6, resize: 'vertical', minHeight: 80, boxSizing: 'border-box' }}
                  />
                </div>
                {checkinError && <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 12 }}>{checkinError}</p>}
                {checkinSuccess && <p style={{ fontSize: 13, color: '#1B6DFC', marginBottom: 12 }}>Check-in saved.</p>}
                <button
                  type="submit"
                  disabled={checkinSubmitting || CHECKIN_MARKERS.some(m => !checkinForm[m.key])}
                  style={{
                    width: '100%', padding: '15px', background: config.colour, color: '#FFFFFF',
                    fontWeight: 700, fontSize: 15, borderRadius: 8, border: 'none',
                    cursor: checkinSubmitting || CHECKIN_MARKERS.some(m => !checkinForm[m.key]) ? 'not-allowed' : 'pointer',
                    opacity: CHECKIN_MARKERS.some(m => !checkinForm[m.key]) ? 0.5 : 1,
                  }}
                >
                  {checkinSubmitting ? 'Saving...' : 'Submit Week ' + checkinWeekLabel + ' Check-In'}
                </button>
              </form>
            )}

            {checkins.length > 0 && (
              <div style={{ marginTop: 24 }}>
                {label('Previous Check-Ins', CalendarDays)}
                {[...checkins].sort((a, b) => b.week_number - a.week_number).slice(0, 5).map(c => (
                  <div key={c.id} style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#43474F', marginBottom: 8 }}>Block {blockOfWeek(c.week_number)} - Week {weekInBlock(c.week_number)}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {CHECKIN_MARKERS.map(m => (
                        <div key={m.key} style={{ fontSize: 12, color: '#43474F' }}>
                          {m.label}: <span style={{ color: config.colour, fontWeight: 700 }}>{(c as any)[m.key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRENDS TAB */}
        {activeTab === 'trends' && (
          <div>
            {card(<>
              {label('Check-In Trend Dashboard', LineChart)}
              <p style={{ fontSize: 14, color: '#43474F', margin: 0, lineHeight: 1.7 }}>Your 8 biological markers visualised over time. Data from weekly check-ins.</p>
            </>)}

            {checkins.length === 0 ? (
              <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 12, padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#43474F', margin: 0 }}>No check-in data yet. Complete your first weekly check-in to start tracking.</p>
              </div>
            ) : (
              <>
                {/* Average scores */}
                {card(<>
                  {label('Current Averages')}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {CHECKIN_MARKERS.map(m => {
                      const avg = checkins.length > 0
                        ? Math.round((checkins.reduce((sum, c) => sum + ((c as any)[m.key] ?? 0), 0) / checkins.length) * 10) / 10
                        : 0
                      const colour = avg >= 4 ? '#1B6DFC' : avg >= 3 ? '#B7791F' : '#DC2626'
                      return (
                        <div key={m.key} style={{ background: '#FFFFFF', borderRadius: 8, padding: '12px 14px' }}>
                          <div style={{ fontSize: 11, color: '#43474F', marginBottom: 4 }}>{m.label}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 22, fontWeight: 800, color: colour }}>{avg}</span>
                            <span style={{ fontSize: 11, color: '#43474F' }}>/ 5</span>
                          </div>
                          <div style={{ marginTop: 6, height: 4, background: '#E8EAEE', borderRadius: 2 }}>
                            <div style={{ height: 4, background: colour, borderRadius: 2, width: `${(avg / 5) * 100}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>)}

                {/* Week by week chart */}
                {card(<>
                  {label('Week by Week')}
                  {CHECKIN_MARKERS.map(m => {
                    const sorted = [...checkins].sort((a, b) => a.week_number - b.week_number)
                    return (
                      <div key={m.key} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#43474F', marginBottom: 6 }}>{m.label}</div>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 40 }}>
                          {sorted.map(c => {
                            const val = (c as any)[m.key] ?? 0
                            const colour = val >= 4 ? '#1B6DFC' : val >= 3 ? '#B7791F' : '#DC2626'
                            return (
                              <div key={c.week_number} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <div style={{ width: '100%', height: `${(val / 5) * 36}px`, background: colour, borderRadius: 3, minHeight: 4 }} />
                                <div style={{ fontSize: 9, color: '#43474F' }}>W{weekInBlock(c.week_number)}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </>)}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
