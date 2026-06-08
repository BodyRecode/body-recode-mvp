// Loosen the session-duration cap in Samantha's coach_guidance from 25 to 40
// minutes. Recovery has been 5/5 two weeks running and sessions feel easier,
// so 25 was leaving volume on the table. Re-running is idempotent.

import { createClient } from '@supabase/supabase-js'

const PLAN_ID = '29565282-b6dd-4f1f-9fec-0488afc794e5'
const CLIENT_ID = '403af6c4-136a-40e9-bd90-7d8e1dd101b9'

const UPDATED_GUIDANCE = `Travel adaptation for the block covering Weeks 6 to 9 (5 June 2026 to 5 July 2026): Samantha's last in-person session is Thursday 4 June. She returns to training Monday 6 July. During those four weeks she will be away with uncertain gym access. Generate this block assuming no gym equipment is available. Use bodyweight and household-object substitutions throughout (chairs for dips and step-ups, doorways and towels for rows, water bottles or backpacks for any loaded movement). Session duration target 35 to 40 minutes (raised from earlier 25-minute cap because her recovery has been 5/5 for two consecutive weeks and sessions are reading easier). Three sessions per week, not four. Sessions still need to be completable in a hotel room or living room without setup overhead, so favour movements that need no apparatus. Hold the regulation-first framing: this block maintains training continuity through travel, it does not push progression. Goal is consistency under disruption, not capacity build. After her return in Week 10, remove this steering and resume the Foundation Arc trajectory.`

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: before } = await supabase
    .from('training_plans')
    .select('id, client_id, coach_guidance')
    .eq('id', PLAN_ID).single()
  if (!before || before.client_id !== CLIENT_ID) { console.error('Plan/client mismatch'); process.exit(1) }

  console.log('--- BEFORE ---')
  console.log(before.coach_guidance)

  const { error } = await supabase
    .from('training_plans')
    .update({ coach_guidance: UPDATED_GUIDANCE })
    .eq('id', PLAN_ID)
  if (error) { console.error('Update failed:', error); process.exit(1) }

  console.log('\n--- AFTER ---')
  console.log(UPDATED_GUIDANCE)
}

main().catch((e) => { console.error(e); process.exit(1) })
