// Create plan_blocks row for Samantha's Block 2 (the travel block).
// Idempotent: if a plan_block already exists at the next position with
// the same block_name, returns its id instead of inserting a duplicate.
//
// After running, navigate to:
//   /dashboard/clients/{SAMANTHA_ID}/program/generate?plan_block_id={blockId}
// to fill in the remaining prescription inputs (training_age, movement
// competency, equipment_access bodyweight-only, training days) and hit
// Generate.

import { createClient } from '@supabase/supabase-js'

const PLAN_ID = '29565282-b6dd-4f1f-9fec-0488afc794e5'
const CLIENT_ID = '403af6c4-136a-40e9-bd90-7d8e1dd101b9'

const BLOCK = {
  block_name: 'Travel-Adapted Movement Continuity',
  progression_phase: 'restoration', // same as Block 1 — she is still Remediation per CFFS
  training_goal: 'capacity',         // same as Block 1
  week_duration: 4,                  // 4 weeks travel window
  training_frequency: 3,             // per coach_guidance
  notes:
    'Travel block (16 Jun to 13 Jul 2026). Samantha is away from 5 Jun to 5 Jul with uncertain gym access. Generate assuming no equipment: bodyweight + household-object substitutions only. Cap sessions at 25 minutes so she can train in a hotel room or living room. Hold regulation-first framing, no progression push. Goal is consistency under disruption, not capacity build. After her Week 10 return on 6 July, the next block resumes full gym access and the Foundation Arc trajectory.',
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Idempotency check
  const { data: existing } = await supabase
    .from('plan_blocks')
    .select('id, position, block_name, status')
    .eq('plan_id', PLAN_ID)
    .eq('block_name', BLOCK.block_name)
    .maybeSingle()
  if (existing) {
    console.log(`Block already exists: ${existing.id} (position ${existing.position}, status ${existing.status})`)
    console.log(`Generate URL: /dashboard/clients/${CLIENT_ID}/program/generate?plan_block_id=${existing.id}`)
    return
  }

  // Next position
  const { data: last } = await supabase
    .from('plan_blocks')
    .select('position')
    .eq('plan_id', PLAN_ID)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  const position = (last?.position ?? 0) + 1

  const { data: inserted, error } = await supabase
    .from('plan_blocks')
    .insert({
      plan_id: PLAN_ID,
      client_id: CLIENT_ID,
      position,
      block_name: BLOCK.block_name,
      progression_phase: BLOCK.progression_phase,
      training_goal: BLOCK.training_goal,
      week_duration: BLOCK.week_duration,
      training_frequency: BLOCK.training_frequency,
      notes: BLOCK.notes,
      status: 'planned',
    })
    .select()
    .single()

  if (error) { console.error('Insert failed:', error); process.exit(1) }
  console.log(`Created plan_block ${inserted.id} at position ${position}`)
  console.log(`\nGenerate URL:`)
  console.log(`  http://localhost:3000/dashboard/clients/${CLIENT_ID}/program/generate?plan_block_id=${inserted.id}`)
  console.log(`\nOverride these form defaults before clicking Generate:`)
  console.log(`  training_age: intermediate -> beginner`)
  console.log(`  movement_competency: developing -> limited`)
  console.log(`  equipment_access: [barbell, dumbbell, bodyweight] -> [bodyweight] only`)
  console.log(`  training_days: confirm Tuesday + Saturday + one more (e.g. Thursday)`)
}

main().catch((e) => { console.error(e); process.exit(1) })
