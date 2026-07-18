/**
 * Seed a realistic DEMO CLIENT for live Coach Co-Pilot demonstrations.
 *
 * The client-scoped co-pilot (src/lib/copilot-context.ts) reads only the output
 * tables: clients, intakes (6 fields), cffs, programs, nutrition_plans. This
 * script seeds those directly - no Claude generation, no API/token cost.
 *
 * Three doctrine tensions are deliberately planted so the co-pilot visibly
 * catches them when asked to "review the plan against doctrine":
 *   1. Program: RPE-9 top sets + an AMRAP finisher inside a RESTORATION block
 *      whose regulation gate is Red (doctrine: submaximal, no failure/AMRAP).
 *   2. Nutrition: meal protein sums BELOW the 130g anchor and is uneven; carbs
 *      sum to ~145g, contradicting the plan's own "~100g/day" execution rule.
 *   3. The read flags an evening grazing window (8:30-10pm) that no meal covers.
 *
 * Idempotent: wipes any prior demo client of the same name, then re-creates.
 * Run:  set -a && source .env.local && set +a && npx tsx scripts/seed-demo-client.ts
 */
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const COACH_ID = '5181577a-f8fd-4f15-b728-d563ba0971f6' // default coach (Kade)
const CLIENT_NAME = 'Sarah Jennings (DEMO)'

async function main() {
  // --- 1. Clean any prior demo client of the same name -------------------
  const { data: existing } = await admin.from('clients').select('id').eq('name', CLIENT_NAME)
  for (const row of existing ?? []) {
    await admin.from('nutrition_plans').delete().eq('client_id', row.id)
    await admin.from('programs').delete().eq('client_id', row.id)
    await admin.from('cffs').delete().eq('client_id', row.id)
    await admin.from('intakes').delete().eq('client_id', row.id)
    await admin.from('copilot_messages').delete().eq('client_id', row.id)
    await admin.from('clients').delete().eq('id', row.id)
  }

  // --- 2. Client ----------------------------------------------------------
  const { data: client, error: cErr } = await admin
    .from('clients')
    .insert({ name: CLIENT_NAME, coach_id: COACH_ID, active: true, medications: 'None reported' })
    .select('id')
    .single()
  if (cErr || !client) throw cErr ?? new Error('client insert failed')
  const client_id = client.id as string

  // --- 3. Intake (thin - only the 6 fields the co-pilot reads) ------------
  const { data: intake } = await admin
    .from('intakes')
    .insert({
      client_id,
      primary_goal: 'Lose fat and stop the afternoon energy crashes without burning out',
      secondary_goals: 'Sleep through the night; rebuild consistency after 8 months off structured training',
      desired_timeline: '4-6 months, sustainable',
      training_days_available: '3 days/week (Mon / Wed / Fri, early mornings)',
      injury_location_current: 'Lower back (lumbar)',
      injury_primary_concern: 'Mild lumbar sensitivity under load - flares with heavy hinging',
    })
    .select('id')
    .single()

  // --- 4. CFFS (the spine of the read) ------------------------------------
  await admin.from('cffs').insert({
    client_id,
    intake_id: intake?.id ?? null,
    generated_at: new Date().toISOString(),
    is_archived: false,
    body_state_classification: 'Remediation',
    resolution_state: 'Restoration - nervous system down-regulated, capacity provisional',
    exposure_readiness_capacity: 'Amber',
    exposure_readiness_schedule: 'Green',
    exposure_readiness_regulation: 'Red',
    exposure_readiness_behaviour: 'Amber',
    client_context_summary:
      "Sarah is returning after ~8 months away from structured training, through a stretch of high work stress and broken sleep. Motivated and consistent by nature, but currently under-recovered rather than under-trained. The presentation is depletion, not deconditioning - she needs the floor rebuilt before the ceiling is touched.",
    primary_patterns_and_signals:
      "Under-fuelled days followed by an evening grazing window (~8:30-10pm) - reactive intake, not hunger. Afternoon energy crashes track with low daytime carbohydrate and skipped mid-day protein. Sleep onset is delayed on higher-stress days.",
    capacity_constraints_and_guardrails:
      "Lumbar sensitivity under heavy hinging - keep spinal loading conservative and submaximal. Recovery bandwidth is thin: intensity, not volume, is the risk. Hold effort submaximal until the regulation gate clears.",
    risk_flags_and_watch_items:
      "Regulation gate is Red: pushing intensity now risks stalling the whole block. Evening grazing window is the highest-leverage behaviour to address, and it is currently unaddressed. Watch sleep onset as the leading indicator.",
    tensions_and_tradeoffs:
      "She wants fast fat loss; the body needs stabilisation first. Aggressive restriction would deepen the evening grazing loop. The tension is patience now versus a stall later.",
    explicit_non_directives:
      "Do NOT progress load or add intensity this block. Do NOT prescribe training to failure or AMRAP work. Do NOT cut calories aggressively while the grazing loop is live.",
    closing_interpretive_notes:
      "First job is regulation and fuelling rhythm. Training is a recovery tool this block, not a stimulus to chase. Re-read once sleep onset and the evening window settle.",
    rationale_summary: {
      headline: 'Depleted, not deconditioned - rebuild the floor before touching the ceiling.',
      scan: {
        body_state: 'Remediation',
        resolution: 'Restoration',
        binding_constraint: 'Regulation (nervous-system) readiness - gate Red',
        flags_count: 2,
      },
      operating_rules: [
        'Hold intensity submaximal (RPE <=7) until the regulation gate clears',
        'No training to failure or AMRAP work this block',
        'Address the evening grazing window before cutting calories',
        'Keep lumbar loading conservative under hinging',
      ],
    },
  })

  // --- 5. Program (RESTORATION block with a planted too-hot session) ------
  await admin.from('programs').insert({
    client_id,
    intake_id: intake?.id ?? null,
    generated_at: new Date().toISOString(),
    status: 'draft',
    is_active: false,
    block_name: 'Restoration Block 1',
    progression_phase: 'restoration',
    training_goal: 'capacity',
    training_age: 'intermediate',
    training_frequency: 3,
    week_duration: 4,
    weekly_pattern_summary: 'Mon full-body / Wed lower emphasis / Fri upper emphasis. Submaximal, technique-led.',
    sessions: [
      {
        day_label: 'Monday - Full Body (Reintroduction)',
        skeleton: 'Prime, hinge, push, pull, carry',
        blocks: [
          {
            block_label: 'A. Primer',
            exercises: [
              { exercise_name: 'Dead Bug', sets: 2, reps: '8/side', rpe: 5, rest: '45s', notes: 'Breathe, brace lightly' },
            ],
          },
          {
            block_label: 'B. Main',
            exercises: [
              { exercise_name: 'Goblet Squat', sets: 3, reps: '8', rpe: 6, rest: '90s', notes: 'Leave 4 in the tank' },
              { exercise_name: 'DB Romanian Deadlift', sets: 3, reps: '10', rpe: 6, rest: '90s', notes: 'Conservative lumbar range' },
              { exercise_name: 'Incline DB Press', sets: 3, reps: '10', rpe: 6, rest: '75s', notes: '' },
            ],
          },
        ],
      },
      {
        day_label: 'Wednesday - Lower Emphasis',
        skeleton: 'Squat pattern, hinge, single-leg, finisher',
        blocks: [
          {
            block_label: 'A. Main',
            exercises: [
              // PLANTED TENSION: RPE 9 top sets in a restoration block
              { exercise_name: 'Back Squat', sets: 5, reps: '3', rpe: 9, rest: '3min', notes: 'Work up to a heavy triple, last set near-max' },
              { exercise_name: 'Barbell RDL', sets: 4, reps: '5', rpe: 8, rest: '2min', notes: 'Load aggressively' },
            ],
          },
          {
            block_label: 'B. Finisher',
            exercises: [
              // PLANTED TENSION: AMRAP-to-failure finisher in a restoration block
              { exercise_name: 'Walking Lunge', sets: 1, reps: 'AMRAP to failure', rpe: 10, rest: '-', notes: 'Go until you cannot continue' },
            ],
          },
        ],
      },
      {
        day_label: 'Friday - Upper Emphasis',
        skeleton: 'Push, pull, accessory',
        blocks: [
          {
            block_label: 'A. Main',
            exercises: [
              { exercise_name: 'Chest-Supported Row', sets: 3, reps: '10', rpe: 6, rest: '75s', notes: '' },
              { exercise_name: 'Half-Kneeling Landmine Press', sets: 3, reps: '10', rpe: 6, rest: '75s', notes: '' },
            ],
          },
        ],
      },
    ],
    rationale_summary: {
      headline: 'A restoration block to rebuild capacity submaximally while the nervous system recovers.',
      scan: {
        body_state: 'Remediation',
        resolution: 'Restoration',
        binding_constraint: 'Regulation gate Red - intensity is the risk',
        flags_count: 1,
      },
      operating_rules: [
        'Effort submaximal (RPE <=7) across the block',
        'No failure or AMRAP work',
        'Conservative lumbar loading under hinging',
      ],
    },
  })

  // --- 6. Nutrition plan (macros contradict its own rules) ----------------
  const meals = [
    { name: 'Breakfast', timing: '7:00am', protein_g: 38, carb_g: 30, fat_g: 10 },
    { name: 'Lunch', timing: '12:30pm', protein_g: 42, carb_g: 45, fat_g: 14 },
    { name: 'Pre-training snack', timing: '3:30pm', protein_g: 12, carb_g: 30, fat_g: 6 },
    { name: 'Dinner', timing: '6:00pm', protein_g: 20, carb_g: 40, fat_g: 16 },
  ]
  // protein sums to 112g (anchor 130), uneven (20 vs 42); carbs sum to 145g (rule says ~100g); nothing after 6pm.
  await admin.from('nutrition_plans').insert({
    client_id,
    generated_at: new Date().toISOString(),
    status: 'draft',
    is_active: false,
    plan_name: 'Stabilisation Plan - Block 1',
    entry_state: 'stabilisation',
    body_state: 'Remediation',
    carb_demand_level: 'low',
    protein_anchor_g: 130,
    estimated_calorie_band: '1650-1800 kcal',
    meal_frequency: 4,
    modulation_level: 'restricted',
    meals,
    execution_rules: [
      'Protein anchored at ~130g/day, spread evenly (~32g across 4 meals)',
      'Total carbohydrate held to ~100g/day (low-carb stabilisation)',
      'No eating within 3 hours of bed to protect sleep onset',
      'Whole-food sources only; no liquid calories',
    ],
    entry_state_summary: {
      current_focus: 'Stabilise fuelling rhythm and protein floor before any deficit; kill the reactive evening grazing loop.',
      body_state: 'Remediation',
      lane: 'Stabilisation',
    },
    what_not_to_change: ['Do not cut calories further while the evening grazing window is live'],
    key_priorities: ['Even protein across the day', 'Daytime carbohydrate to end afternoon crashes'],
  })

  console.log('\n  DEMO CLIENT SEEDED')
  console.log('  Name:      ' + CLIENT_NAME)
  console.log('  Client ID: ' + client_id)
  console.log('  Profile:   https://app.bodyrecode.au/dashboard/clients/' + client_id)
  console.log('  Program:   https://app.bodyrecode.au/dashboard/clients/' + client_id + '/program')
  console.log('  Nutrition: https://app.bodyrecode.au/dashboard/clients/' + client_id + '/nutrition\n')
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
