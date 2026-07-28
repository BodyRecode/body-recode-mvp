// Draft a Booking Agent touch immediately, instead of waiting for the Inngest
// sequence to reach it on schedule. Lands in /dashboard/business/outreach as a
// DRAFT for Kade to approve — same as any other touch, nothing sends.
//
// The running sequence is left alone: draftTouch is idempotent per
// (lead, step), so when the scheduled run reaches this touch it no-ops.
//
// MUST run against prod env — .env.local's keys are not valid for cloud:
//
//   cd ~/body-recode-mvp && set -a && source .env.local.prod && set +a && \
//     npx tsx scripts/draft-booking-touch-now.ts <leadId> [stepIndex]
//
// stepIndex is 1-based and defaults to 1 (the intro touch).

import { createAdminClient } from '@/lib/supabase/admin'
import { EMAIL_SEQUENCE } from '@/lib/booking-agent/sequence'
import { draftTouch } from '@/lib/booking-agent/draft-touch'

async function main() {
  const [leadId, stepArg] = process.argv.slice(2)
  if (!leadId) {
    console.error('usage: draft-booking-touch-now.ts <leadId> [stepIndex]')
    process.exit(1)
  }

  const stepIndex = stepArg ? Number(stepArg) : 1
  const touch = EMAIL_SEQUENCE[stepIndex - 1]
  if (!touch) {
    console.error(`no touch at step ${stepIndex} — sequence has ${EMAIL_SEQUENCE.length}`)
    process.exit(1)
  }

  const admin = createAdminClient()
  const { data: lead } = await admin
    .from('leads')
    .select('name, email, booking_agent_state')
    .eq('id', leadId)
    .maybeSingle()

  if (!lead) {
    console.error(`lead ${leadId} not found`)
    process.exit(1)
  }

  console.log(`${lead.name} <${lead.email}> — agent state: ${lead.booking_agent_state ?? 'not enrolled'}`)

  const result = await draftTouch(leadId, touch)
  console.log(`${touch.label} (${touch.key}) -> ${result.status}${result.touchId ? ` (${result.touchId})` : ''}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
