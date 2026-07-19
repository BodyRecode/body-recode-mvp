// One-off backfill: enrol the qualifying leads that were missed while the
// Booking Agent enrollment block was being skipped (see commit 69ba8191).
// Sets booking_agent_state='active' and fires booking-agent/start so the
// agent drafts their first touch (Option A: draft-only, Kade approves).
//
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && \
//     npx tsx scripts/backfill-booking-agent-missed.ts

import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/lib/inngest'

// Qualifying (non-red, no red-flag) leads created since go-live with a null
// booking_agent_state — pulled 2026-07-19.
const LEAD_IDS = [
  '4e1954f4-c353-4615-83db-dac89bda6ed9', // 19 Jul 08:02
  'c25141b9-97e0-47d7-a7af-1a596a3b04fa', // 19 Jul 11:03 (green)
]

async function main() {
  const admin = createAdminClient()
  for (const leadId of LEAD_IDS) {
    const { data: row } = await admin
      .from('leads')
      .select('booking_agent_state, lead_quality, red_flag')
      .eq('id', leadId)
      .maybeSingle()
    if (!row) { console.log(`skip ${leadId}: not found`); continue }
    if (row.booking_agent_state) { console.log(`skip ${leadId}: already ${row.booking_agent_state}`); continue }
    if (row.lead_quality === 'red' || row.red_flag) { console.log(`skip ${leadId}: not qualifying`); continue }
    await admin.from('leads').update({ booking_agent_state: 'active' }).eq('id', leadId)
    await inngest.send({ name: 'booking-agent/start', data: { leadId } })
    console.log(`enrolled ${leadId} (quality=${row.lead_quality ?? 'null'})`)
  }
  console.log('done')
}

main().catch(e => { console.error(e); process.exit(1) })
