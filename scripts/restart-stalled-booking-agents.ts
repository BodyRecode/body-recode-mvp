// Restart the Booking Agent for leads whose sequence never produced a draft.
//
// Context (2026-07-28): `outreach_touches` had no service_role grant, so every
// draft insert failed with a permission error. Three leads were left stranded:
//
//   Evelina Siegrist-Tucci  19 Jul  booking-agent/start never reached Inngest
//   Nicolette Dunstone      19 Jul  (the 19 Jul backfill ran with .env.local,
//                                    whose event key is invalid for cloud)
//   Kim Stevenson           20 Jul  event fired, run died "draft insert failed"
//
// This drafts their overdue touch 1 immediately (proving the grant fix), then
// re-fires booking-agent/start so the rest of the sequence resumes on schedule.
// Option A still applies: everything lands as a DRAFT for Kade to approve.
//
// MUST run against prod env — .env.local's INNGEST_EVENT_KEY is not valid for
// Inngest cloud, which is exactly how the 19 Jul backfill silently no-oped:
//
//   cd ~/body-recode-mvp && set -a && source .env.local.prod && set +a && \
//     npx tsx scripts/restart-stalled-booking-agents.ts

import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/lib/inngest'
import { EMAIL_SEQUENCE } from '@/lib/booking-agent/sequence'
import { draftTouch } from '@/lib/booking-agent/draft-touch'

const LEAD_IDS = [
  '4e1954f4-c353-4615-83db-dac89bda6ed9', // Evelina Siegrist-Tucci
  'c25141b9-97e0-47d7-a7af-1a596a3b04fa', // Nicolette Dunstone
  'b4ba8cd9-41b6-4114-8844-425a50a43c26', // Kim Stevenson
]

async function main() {
  const admin = createAdminClient()

  for (const leadId of LEAD_IDS) {
    const { data: lead } = await admin
      .from('leads')
      .select('name, email, booking_agent_state')
      .eq('id', leadId)
      .maybeSingle()

    if (!lead) {
      console.log(`skip ${leadId}: not found`)
      continue
    }

    // Draft the overdue first touch right now rather than waiting another day.
    const result = await draftTouch(leadId, EMAIL_SEQUENCE[0])
    console.log(`${lead.name}: touch 1 -> ${result.status}${result.touchId ? ` (${result.touchId})` : ''}`)

    // Resume the sequence for touches 2-4. The idempotency guard in draftTouch
    // means the restarted run re-drafting touch 1 is a harmless no-op.
    await inngest.send({ name: 'booking-agent/start', data: { leadId } })
    console.log(`${lead.name}: sequence restarted`)
  }

  console.log('done')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
