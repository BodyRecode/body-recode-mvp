'use client'

import { useState, useEffect } from 'react'

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
    colour: '#ef4444',
    description: 'Cortisol is the driver. Block A introduces the cortisol anchor evening meal and tightens caffeine protocol. Training load increases with strict RIR controls.',
  },
  'metabolic-drift': {
    label: 'Metabolic-Drift',
    colour: '#f59e0b',
    description: 'Insulin sensitivity is the target. Block A introduces formal carb cycling and increases protein volume. The post-meal walk is now non-negotiable.',
  },
  'hormonal-shift': {
    label: 'Hormonal-Shift',
    colour: '#8b5cf6',
    description: 'Block A introduces cycle-aware eating. Fat quality becomes the primary focus. The programme bends to your biology, not the other way around.',
  },
  'system-overload': {
    label: 'System-Overload',
    colour: '#14b8a6',
    description: 'Targeted recovery micronutrients from food introduced this block. Check-in data determines when demand increases - not the calendar.',
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
    { title: 'Supplement Protocol - Metabolic-Drift', content: 'Priority 1: Creatine monohydrate 5g daily. Increases phosphocreatine stores, directly improves training output which drives insulin sensitivity gains. Priority 2: Magnesium glycinate 300mg before bed. Supports glucose metabolism and sleep. Priority 3: Berberine 500mg with your largest carbohydrate meal. Mimics metformin mechanism - improves glucose uptake at the cellular level.' },
    { title: 'The Post-Meal Walk - Why It Works', content: 'A 15-minute walk after eating reduces post-meal blood glucose by 20-30% compared to sitting. The mechanism: muscle contraction (even low intensity) activates GLUT4 transporters independently of insulin - meaning glucose moves into muscle cells without requiring more insulin to be secreted. Over time, repeated post-meal walks rebuild the metabolic capacity that has drifted.' },
  ],
  'hormonal-shift': [
    { title: 'Hormone Synthesis and Fat', content: 'Sex hormones (oestrogen, progesterone, testosterone) are synthesised from cholesterol. Low dietary fat directly reduces the raw material available for hormone production. This is why restriction makes the Hormonal-Shift pattern worse - it removes the building blocks the body needs to produce the hormones that regulate metabolism, mood, and body composition. Fat is not a concession in this programme. It is the intervention.' },
    { title: 'Supplement Protocol - Hormonal-Shift', content: 'Priority 1: Magnesium glycinate 300-400mg before bed. Supports progesterone receptor sensitivity and sleep quality. Priority 2: Omega-3 (EPA+DHA) 2-3g daily. Reduces inflammation, supports oestrogen metabolism. Can come from food (salmon, sardines) or supplement. Priority 3: Zinc 15-25mg with dinner. Supports testosterone production and oestrogen clearance via the liver.' },
    { title: 'Cycle Syncing - Practical Guide', content: 'Follicular (days 1-14): Energy rises, oestrogen climbs. Best phase for high-intensity training and larger carb windows. Ovulatory (days 14-16): Peak physical capacity. Push training here. Luteal (days 17-28): Progesterone rises, energy and mood may dip, appetite increases. Reduce training intensity, increase fat and carbs, do not restrict. Menstrual (days 1-5): Iron-rich foods, rest priority. Allow starchy carbs freely.' },
  ],
  'system-overload': [
    { title: 'Nervous System Recovery - The Basics', content: 'The autonomic nervous system operates in two modes: sympathetic (fight-or-flight, high alert, stress response) and parasympathetic (rest, digest, recover). System-Overload is a state of chronic sympathetic dominance - the nervous system cannot fully switch into recovery mode. The programme is designed to reduce sympathetic inputs (training volume, calorie restriction, time pressure) while increasing parasympathetic inputs (sleep, magnesium, red meat, Zone 2 movement, social connection).' },
    { title: 'Supplement Protocol - System-Overload', content: 'Priority 1: Magnesium glycinate 400mg before bed. The most impactful intervention for nervous system recovery. Non-negotiable. Priority 2: Zinc 15-25mg with dinner. Supports neurotransmitter function and testosterone. Priority 3: Vitamin D3 + K2 if sunlight exposure is limited. Neurological function depends on adequate Vitamin D. Priority 4 (if available): Liver capsules or desiccated liver 4-6 capsules daily. Provides concentrated B vitamins, iron, and zinc in highly bioavailable form.' },
    { title: 'HRV as a Readiness Signal', content: 'Heart Rate Variability (HRV) is the variation in time between heartbeats. Higher HRV = greater parasympathetic activity = better recovery state. For this pattern, tracking morning HRV (using a wearable or the free app Elite HRV) provides objective data to guide training decisions. On low HRV days, reduce training to 2 working sets per exercise and skip conditioning entirely. On high HRV days, train normally. The check-in energy markers are a subjective proxy for this - but HRV adds objectivity.' },
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

export default function MembershipPortalClient({ enrollment }: { enrollment: MemberEnrollment }) {
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
  const phases = BLOCK_PHASES[block] ?? BLOCK_PHASES['A']
  const trainingData = PATTERN_TRAINING[pattern] ?? PATTERN_TRAINING['stress-stored']
  const nutritionData = BLOCK_A_NUTRITION[pattern] ?? BLOCK_A_NUTRITION['stress-stored']
  const resources = RESOURCES[pattern] ?? RESOURCES['stress-stored']
  const coachingNote = COACHING_NOTES[pattern]?.[currentWeek] ?? ''

  const currentPhase = (() => {
    if (currentWeek <= 2) return phases[0]
    if (currentWeek <= 4) return phases[1]
    if (currentWeek === 5) return phases[2]
    return phases[3]
  })()

  useEffect(() => {
    fetch(`/api/membership/checkin?token=${enrollment.token}`)
      .then(r => r.json())
      .then(data => { if (data.checkins) setCheckins(data.checkins) })
      .catch(() => {})
  }, [enrollment.token])

  async function submitCheckin(e: React.FormEvent) {
    e.preventDefault()
    if (CHECKIN_MARKERS.some(m => !checkinForm[m.key])) return
    setCheckinSubmitting(true)
    setCheckinError(null)
    const res = await fetch('/api/membership/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: enrollment.token, week_number: currentWeek, notes: checkinNotes, ...checkinForm }),
    })
    const data = await res.json()
    if (res.ok) {
      setCheckinSuccess(true)
      setCheckinForm({})
      setCheckinNotes('')
      const updated = await fetch(`/api/membership/checkin?token=${enrollment.token}`).then(r => r.json())
      if (updated.checkins) setCheckins(updated.checkins)
    } else {
      setCheckinError(data.error ?? 'Failed to save check-in.')
    }
    setCheckinSubmitting(false)
  }

  const thisWeekCheckin = checkins.find(c => c.week_number === currentWeek)

  const card = (children: React.ReactNode, style?: React.CSSProperties) => (
    <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '20px 22px', marginBottom: 16, ...style }}>
      {children}
    </div>
  )

  const label = (text: string, colour?: string) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: colour ?? config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
      {text}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0c0a09', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#111110', borderBottom: '1px solid #1c1917', padding: '16px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="https://bodyrecode.au/logo-teal.png" width={100} alt="Body Recode" />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{enrollment.first_name}</div>
            <div style={{ fontSize: 12, color: config.colour, fontWeight: 600 }}>Membership - Block {block}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: '#111110', borderBottom: '1px solid #1c1917', overflowX: 'auto' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', padding: '0 24px' }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                padding: '14px 16px', fontSize: 13, fontWeight: 600,
                color: activeTab === item.id ? config.colour : '#57534e',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: `2px solid ${activeTab === item.id ? config.colour : 'transparent'}`,
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 24px 80px' }}>

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div>
            {/* Pattern banner */}
            <div style={{ background: '#111110', border: `1px solid ${config.colour}30`, borderLeft: `4px solid ${config.colour}`, borderRadius: 12, padding: '20px 22px', marginBottom: 16 }}>
              {label('Your Pattern')}
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{config.label}</div>
              <p style={{ fontSize: 14, color: '#a8a29e', margin: 0, lineHeight: 1.7 }}>{config.description}</p>
            </div>

            {/* Block and week status */}
            {card(<>
              {label('Current Position')}
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div style={{ flex: 1, background: '#0c0a09', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: config.colour }}>Block {block}</div>
                  <div style={{ fontSize: 11, color: '#57534e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Consolidate</div>
                </div>
                <div style={{ flex: 1, background: '#0c0a09', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>Week {currentWeek}</div>
                  <div style={{ fontSize: 11, color: '#57534e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>of 6</div>
                </div>
                <div style={{ flex: 1, background: '#0c0a09', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{currentPhase.name}</div>
                  <div style={{ fontSize: 11, color: '#57534e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phase</div>
                </div>
              </div>
            </>)}

            {/* Weekly coaching note */}
            {coachingNote && card(<>
              {label('This Week')}
              <p style={{ fontSize: 14, color: '#d4d0cc', lineHeight: 1.8, margin: 0 }}>{coachingNote}</p>
            </>)}

            {/* Phase structure */}
            {card(<>
              {label('Block A Phases')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {phases.map(phase => {
                  const isActive = currentPhase.number === phase.number
                  return (
                    <div key={phase.name} style={{
                      background: '#0c0a09', borderRadius: 8, padding: '12px 14px',
                      border: `1px solid ${isActive ? config.colour + '50' : '#292524'}`,
                      opacity: phase.number > currentPhase.number ? 0.4 : 1,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? config.colour : '#a8a29e' }}>{phase.name}</span>
                        <span style={{ fontSize: 12, color: '#57534e' }}>Weeks {phase.weeks}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#78716c', margin: 0, lineHeight: 1.6 }}>{phase.description}</p>
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
            <div style={{ display: 'flex', background: '#111110', borderRadius: 8, padding: 3, gap: 2, marginBottom: 20, width: 'fit-content' }}>
              {([{ id: 'gym', label: 'Gym' }, { id: 'home', label: 'Home DBs' }, { id: 'bodyweight', label: 'No Equipment' }] as const).map(t => (
                <button key={t.id} onClick={() => setEquipment(t.id)} style={{
                  padding: '8px 16px', fontSize: 13, fontWeight: 600,
                  color: equipment === t.id ? '#0c0a09' : '#57534e',
                  background: equipment === t.id ? config.colour : 'transparent',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* RIR progression */}
            {card(<>
              {label('Block A Progression')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {trainingData.progression.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 8, borderBottom: i < trainingData.progression.length - 1 ? '1px solid #1c1917' : 'none' }}>
                    <div style={{ minWidth: 80 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{p.phase}</div>
                      <div style={{ fontSize: 11, color: '#57534e' }}>Weeks {p.weeks}</div>
                    </div>
                    <div style={{ minWidth: 60, fontSize: 13, fontWeight: 700, color: config.colour }}>{p.rir}</div>
                    <div style={{ fontSize: 13, color: '#78716c', lineHeight: 1.5 }}>{p.notes}</div>
                  </div>
                ))}
              </div>
            </>)}

            {/* Pattern rules */}
            {card(<>
              {label('Pattern Rules - Block A')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {trainingData.rules.map((rule, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.colour, marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#a8a29e', lineHeight: 1.65 }}>{rule}</span>
                  </div>
                ))}
              </div>
            </>)}

            {/* Sessions */}
            {BLOCK_A_SESSIONS.map(session => (
              <div key={session.id} style={{ marginBottom: 12 }}>
                <button
                  onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                  style={{
                    width: '100%', background: '#111110', border: `1px solid ${expandedSession === session.id ? config.colour + '40' : '#1c1917'}`,
                    borderRadius: 12, padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{session.name}</div>
                    <div style={{ fontSize: 12, color: '#57534e', marginTop: 2 }}>{session.subtitle}</div>
                  </div>
                  <div style={{ fontSize: 18, color: config.colour }}>{expandedSession === session.id ? '−' : '+'}</div>
                </button>
                {expandedSession === session.id && (
                  <div style={{ background: '#111110', border: '1px solid #1c1917', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0 20px 16px' }}>
                    {session[equipment].map((ex, i) => (
                      <div key={i} style={{ padding: '14px 0', borderBottom: i < session[equipment].length - 1 ? '1px solid #1c1917' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{ex.name}</span>
                          <span style={{ fontSize: 13, color: config.colour, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 12 }}>{ex.sets} x {ex.reps}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#78716c', margin: 0, lineHeight: 1.6 }}>{ex.notes}</p>
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
              {label('Block A Nutrition Strategy')}
              <p style={{ fontSize: 14, color: '#d4d0cc', lineHeight: 1.8, margin: 0 }}>{nutritionData.headline}</p>
            </>)}

            <div style={{ background: '#111110', border: '1px solid #292524', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#57534e', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Foundation</div>
              <p style={{ fontSize: 13, color: '#78716c', margin: 0, lineHeight: 1.7 }}>The HABNS foundation from your Blueprint is unchanged. Protein, fat, fruit, post-training starchy carbs. Remove list still applies. Block A adds precision on top - it does not replace the foundation.</p>
            </div>

            {nutritionData.newStrategy.map((s, i) => (
              card(
                <>
                  {label(`New in Block A: ${s.title}`)}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {s.points.map((point, j) => (
                      <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.colour, marginTop: 6, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#a8a29e', lineHeight: 1.65 }}>{point}</span>
                      </div>
                    ))}
                  </div>
                </>,
                { key: i }
              )
            ))}

            {card(<>
              {label('Phase Notes')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {nutritionData.phaseNotes.map((note, i) => (
                  <div key={i} style={{ background: '#0c0a09', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{note.phase}</span>
                      <span style={{ fontSize: 12, color: '#57534e' }}>Weeks {note.weeks}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#78716c', margin: 0, lineHeight: 1.6 }}>{note.note}</p>
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
              {label('Pattern Resource Library')}
              <p style={{ fontSize: 14, color: '#a8a29e', margin: 0, lineHeight: 1.7 }}>Deep-dive guides for the {config.label} pattern. These go beyond the programme - they explain the biology, the protocols, and how to apply them.</p>
            </>)}

            {resources.map((resource, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <button
                  onClick={() => setExpandedResource(expandedResource === resource.title ? null : resource.title)}
                  style={{
                    width: '100%', background: '#111110',
                    border: `1px solid ${expandedResource === resource.title ? config.colour + '40' : '#1c1917'}`,
                    borderRadius: expandedResource === resource.title ? '12px 12px 0 0' : 12,
                    padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', textAlign: 'left' }}>{resource.title}</span>
                  <span style={{ fontSize: 18, color: config.colour, flexShrink: 0, marginLeft: 12 }}>{expandedResource === resource.title ? '−' : '+'}</span>
                </button>
                {expandedResource === resource.title && (
                  <div style={{ background: '#111110', border: '1px solid #1c1917', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '16px 20px' }}>
                    <p style={{ fontSize: 14, color: '#a8a29e', margin: 0, lineHeight: 1.8 }}>{resource.content}</p>
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
              {label('Weekly Check-In')}
              <p style={{ fontSize: 14, color: '#a8a29e', margin: '0 0 4px', lineHeight: 1.7 }}>Week {currentWeek} of Block {block}. Rate each marker from 1 (poor) to 5 (excellent).</p>
            </>)}

            {thisWeekCheckin ? (
              <div style={{ background: '#111110', border: `1px solid ${config.colour}40`, borderRadius: 12, padding: '20px 22px', marginBottom: 16 }}>
                {label('Week ' + currentWeek + ' submitted')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {CHECKIN_MARKERS.map(m => (
                    <div key={m.key} style={{ background: '#0c0a09', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: '#57534e', marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: config.colour }}>{(thisWeekCheckin as any)[m.key]}/5</div>
                    </div>
                  ))}
                </div>
                {thisWeekCheckin.notes && (
                  <p style={{ fontSize: 13, color: '#78716c', margin: '12px 0 0', lineHeight: 1.7 }}>{thisWeekCheckin.notes}</p>
                )}
              </div>
            ) : (
              <form onSubmit={submitCheckin}>
                {CHECKIN_MARKERS.map(marker => (
                  <div key={marker.key} style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{marker.label}</div>
                    <div style={{ fontSize: 12, color: '#57534e', marginBottom: 12 }}>{marker.description}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3, 4, 5].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCheckinForm(f => ({ ...f, [marker.key]: val }))}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                            background: checkinForm[marker.key] === val ? config.colour : '#1c1917',
                            color: checkinForm[marker.key] === val ? '#0c0a09' : '#57534e',
                            fontWeight: 700, fontSize: 16, cursor: 'pointer',
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Notes (optional)</div>
                  <textarea
                    value={checkinNotes}
                    onChange={e => setCheckinNotes(e.target.value)}
                    placeholder="Any observations this week..."
                    style={{ width: '100%', background: '#0c0a09', border: '1px solid #292524', borderRadius: 8, padding: '12px', color: '#fff', fontSize: 14, lineHeight: 1.6, resize: 'vertical', minHeight: 80, boxSizing: 'border-box' }}
                  />
                </div>
                {checkinError && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{checkinError}</p>}
                {checkinSuccess && <p style={{ fontSize: 13, color: '#14b8a6', marginBottom: 12 }}>Check-in saved.</p>}
                <button
                  type="submit"
                  disabled={checkinSubmitting || CHECKIN_MARKERS.some(m => !checkinForm[m.key])}
                  style={{
                    width: '100%', padding: '15px', background: config.colour, color: '#0c0a09',
                    fontWeight: 700, fontSize: 15, borderRadius: 8, border: 'none',
                    cursor: checkinSubmitting || CHECKIN_MARKERS.some(m => !checkinForm[m.key]) ? 'not-allowed' : 'pointer',
                    opacity: CHECKIN_MARKERS.some(m => !checkinForm[m.key]) ? 0.5 : 1,
                  }}
                >
                  {checkinSubmitting ? 'Saving...' : 'Submit Week ' + currentWeek + ' Check-In'}
                </button>
              </form>
            )}

            {checkins.length > 0 && (
              <div style={{ marginTop: 24 }}>
                {label('Previous Check-Ins')}
                {[...checkins].sort((a, b) => b.week_number - a.week_number).slice(0, 5).map(c => (
                  <div key={c.id} style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#a8a29e', marginBottom: 8 }}>Block {block} - Week {c.week_number}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {CHECKIN_MARKERS.map(m => (
                        <div key={m.key} style={{ fontSize: 12, color: '#57534e' }}>
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
              {label('Check-In Trend Dashboard')}
              <p style={{ fontSize: 14, color: '#a8a29e', margin: 0, lineHeight: 1.7 }}>Your 8 biological markers visualised over time. Data from weekly check-ins.</p>
            </>)}

            {checkins.length === 0 ? (
              <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#57534e', margin: 0 }}>No check-in data yet. Complete your first weekly check-in to start tracking.</p>
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
                      const colour = avg >= 4 ? '#14b8a6' : avg >= 3 ? '#f59e0b' : '#ef4444'
                      return (
                        <div key={m.key} style={{ background: '#0c0a09', borderRadius: 8, padding: '12px 14px' }}>
                          <div style={{ fontSize: 11, color: '#57534e', marginBottom: 4 }}>{m.label}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 22, fontWeight: 800, color: colour }}>{avg}</span>
                            <span style={{ fontSize: 11, color: '#57534e' }}>/ 5</span>
                          </div>
                          <div style={{ marginTop: 6, height: 4, background: '#1c1917', borderRadius: 2 }}>
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
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#a8a29e', marginBottom: 6 }}>{m.label}</div>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 40 }}>
                          {sorted.map(c => {
                            const val = (c as any)[m.key] ?? 0
                            const colour = val >= 4 ? '#14b8a6' : val >= 3 ? '#f59e0b' : '#ef4444'
                            return (
                              <div key={c.week_number} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <div style={{ width: '100%', height: `${(val / 5) * 36}px`, background: colour, borderRadius: 3, minHeight: 4 }} />
                                <div style={{ fontSize: 9, color: '#57534e' }}>W{c.week_number}</div>
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
