/**
 * One-off: repair Dee Berry's Blueprint enrollment.
 *
 *   npx tsx --env-file=.env.local scripts/fix-dee-blueprint-week.ts
 *
 * 1. Her Week 1 check-in saved as Week 2 (the portal posted whatever week it
 *    had rolled to, while the email asked for the week just completed). Her own
 *    note on the row reads "This is for Week 1." Relabelling also frees the
 *    Week 2 slot, which the unique (enrollment_id, week_number) index had burnt.
 * 2. She bought on 19 Aug, so on 5 Sep she is owed Week 3. The old sleep-based
 *    advance would not have opened it until 7 Sep.
 */

import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const ENROLLMENT_ID = '7016569c-9423-4d44-ad2f-71e90c036a2b'

async function main() {
  const { data: relabel, error: relabelError } = await admin
    .from('blueprint_checkins')
    .update({ week_number: 1 })
    .eq('enrollment_id', ENROLLMENT_ID)
    .eq('week_number', 2)
    .select('id, week_number, submitted_at, notes')
  console.log('RELABEL', relabelError ?? '', relabel)

  const { data: advance, error: advanceError } = await admin
    .from('blueprint_enrollments')
    .update({ current_week: 3 })
    .eq('id', ENROLLMENT_ID)
    .eq('current_week', 2)
    .select('first_name, current_week, purchase_date')
  console.log('ADVANCE', advanceError ?? '', advance)
}

main()
