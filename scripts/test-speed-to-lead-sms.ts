/**
 * Diagnostic: send a waitlist SMS to Kade's consented number RIGHT NOW,
 * bypassing the AEST send-window rule.
 *
 * Uses the real sendLeadSms path so:
 *   - opt-in guard runs (must have sms_opt_in_at + no sms_opted_out_at)
 *   - frequency cap runs
 *   - sms_logs row is written
 *   - Twilio API is hit for real
 *
 * The only thing skipped is the Inngest step.sleepUntil(next-window) wait.
 *
 * Run: npx tsx scripts/test-speed-to-lead-sms.ts
 */

import { createClient } from '@supabase/supabase-js'
import { sendLeadSms } from '../src/lib/speed-to-lead-sms'
import { tplWaitlistJoined } from '../src/lib/sms-templates'

async function main() {
  const email = process.argv[2] ?? 'kade.dunstone@gmail.com'
  console.log(`\n=== Diagnostic SMS test for ${email} ===\n`)

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data: lead, error } = await admin
    .from('leads')
    .select('id, name, email, phone, phone_e164, sms_opt_in_at, sms_opted_out_at')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    console.error('Lead lookup failed:', error.message)
    process.exit(1)
  }
  if (!lead) {
    console.error(`No lead found with email ${email}`)
    process.exit(1)
  }

  console.log(`Lead: ${lead.name ?? '(no name)'} · ${lead.id.slice(0, 8)}...`)
  console.log(`Phone: ${lead.phone_e164 ?? lead.phone ?? '(none)'}`)
  console.log(`Opt-in: ${lead.sms_opt_in_at ?? '(never)'}`)
  console.log(`Opt-out: ${lead.sms_opted_out_at ?? '(no)'}`)

  const firstName = lead.name?.split(' ')[0] ?? null
  const body = tplWaitlistJoined({ firstName, productName: '14-Day Body Decode' })

  console.log(`\nBody: ${body}`)
  console.log(`Length: ${body.length} chars\n`)

  console.log('Sending...')
  const result = await sendLeadSms({
    leadId: lead.id,
    trigger: 'waitlist_joined',
    body,
    overrideCap: true, // Bypass 1-per-24h cap for diagnostic runs
  })

  if (result.ok) {
    console.log(`\n✓ SMS queued to Twilio. sms_logs row: ${result.logId}`)
    console.log(`  Check phone in a few seconds.`)
    console.log(`  Watch dashboard: https://bodyrecode.au/dashboard/sms`)
  } else {
    console.log(`\n✗ FAIL: reason=${result.reason} error=${result.error ?? '(none)'}`)
    if (result.reason === 'not_opted_in') {
      console.log(`  Lead has no sms_opt_in_at. Persist opt-in first.`)
    } else if (result.reason === 'opted_out') {
      console.log(`  Lead has sms_opted_out_at set. Cannot send.`)
    } else if (result.reason === 'no_phone') {
      console.log(`  Lead has no phone or phone_e164.`)
    }
  }
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
