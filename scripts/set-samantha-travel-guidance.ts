// Set Samantha's travel-adaptation coach guidance on her active training plan.
// Idempotent — re-running overwrites the same field.
import { createClient } from '@supabase/supabase-js'

const PLAN_ID = '29565282-b6dd-4f1f-9fec-0488afc794e5'
const CLIENT_ID = '403af6c4-136a-40e9-bd90-7d8e1dd101b9'

const GUIDANCE = `Travel adaptation for the block covering Weeks 6 to 9 (5 June 2026 to 5 July 2026): Samantha's last in-person session is Thursday 4 June. She returns to training Monday 6 July. During those four weeks she will be away with uncertain gym access. Generate this block assuming no gym equipment is available. Use bodyweight and household-object substitutions throughout (chairs for dips and step-ups, doorways and towels for rows, water bottles or backpacks for any loaded movement). Cap sessions at 25 minutes. Reduce to three sessions per week, not four. Keep total exercise count low so she can complete a session in a hotel room or living room without setup overhead. Hold the regulation-first framing: this block maintains training continuity through travel, it does not push progression. Goal is consistency under disruption, not capacity build. After her return in Week 10, remove this steering and resume the Foundation Arc trajectory.`

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: before } = await supabase
    .from('training_plans')
    .select('id, client_id, plan_name, coach_guidance, status, is_active')
    .eq('id', PLAN_ID)
    .single()

  if (!before || before.client_id !== CLIENT_ID) {
    console.error('Plan not found or client mismatch'); process.exit(1)
  }

  console.log('--- BEFORE ---')
  console.log('plan_name:', before.plan_name, '| status:', before.status, '| is_active:', before.is_active)
  console.log('coach_guidance:', before.coach_guidance)

  const { data: after, error } = await supabase
    .from('training_plans')
    .update({ coach_guidance: GUIDANCE })
    .eq('id', PLAN_ID)
    .select('id, coach_guidance')
    .single()

  if (error) { console.error('Update failed:', error); process.exit(1) }

  console.log('\n--- AFTER ---')
  console.log('coach_guidance:', after.coach_guidance)
}

main().catch((e) => { console.error(e); process.exit(1) })
