// One-off: persist Ruby's Week 6 feedback (approved text) + send the email.
// Mirrors the save+send path in /api/weekly-checkins/[id]/feedback so the
// client_communications log + COACH_BCC behaviour matches the standard
// coach-driven send. No coach_id (this was a system-driven recovery from
// the failed auto-response).

import { readFileSync } from 'fs'
import { resolve } from 'path'
const envText = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (!m) continue
  if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

import { Resend } from 'resend'
import { createAdminClient } from '../src/lib/supabase/admin'
import { buildWeeklyCheckinFeedbackEmail } from '../src/lib/weekly-checkin-feedback-email'
import { COACH_BCC } from '../src/lib/email-shell'
import { appUrl } from '../src/lib/app-url'

const CHECKIN_ID = 'ee1b27c2-e55a-4c32-9520-1e28cd6d96ac'

const INTERPRETATION = `Ruby-Cate, across the six weeks we have, your recovery rating has held at 4, 4, 4, 4, 4, 4. That consistency is real and it's holding even as the week beneath it shifted. This week reads different though. You named it clearly: working six days a week felt tiring, capacity is more limited than usual, and time and focus are what went missing. The sessions stayed about the same, sleep stayed consistent, eating stayed easy and predictable. But the pressure is there. You also named something important: "i need to make more time for myself." That's not small. What's notable is that recovery stayed at 4 even though the week felt heavier than expected. Your body is not signalling breakdown. It's signalling compression. The difference matters.`

const REFRAME = `Appetite stable and eating easy for three weeks running is good news, and it tells me your digestive system has settled. But it's also the exact signal that can let meal skipping creep back in, especially in a compressed week when time feels scarce. The schedule is still the signal, not how hungry you feel. Hold your meal times regardless of appetite.`

const NEXT_FOCUS = `This week, eat at four anchor times each day, regardless of how much time you have or how hungry you feel. The meal rhythm is what keeps your digestion and your capacity steady. Time pressure doesn't change that. Hold it.`

async function main() {
  const admin = createAdminClient()

  const { data: checkin } = await admin
    .from('weekly_checkins')
    .select('id, client_id, week_number, form_type')
    .eq('id', CHECKIN_ID)
    .single()
  if (!checkin) throw new Error('Check-in not found')

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token')
    .eq('id', checkin.client_id)
    .single()
  if (!client?.email || !client.onboarding_token) throw new Error('Client missing email or token')

  // Upsert feedback row
  const { data: existing } = await admin
    .from('weekly_checkin_feedback')
    .select('id')
    .eq('weekly_checkin_id', CHECKIN_ID)
    .maybeSingle()

  const baseRow = {
    weekly_checkin_id: CHECKIN_ID,
    client_id: checkin.client_id,
    interpretation: INTERPRETATION,
    reframe: REFRAME,
    next_focus: NEXT_FOCUS,
    email_sent_at: new Date().toISOString(),
  }

  const { data: feedback, error: upsertErr } = existing
    ? await admin
        .from('weekly_checkin_feedback')
        .update(baseRow)
        .eq('id', existing.id)
        .select('id')
        .single()
    : await admin
        .from('weekly_checkin_feedback')
        .insert(baseRow)
        .select('id')
        .single()

  if (upsertErr || !feedback) throw new Error(`Save failed: ${upsertErr?.message}`)

  // Send email
  const firstName = client.name?.split(' ')[0] ?? 'there'
  const checkinUrl = `${appUrl()}/portal/${client.onboarding_token}/checkin/${checkin.week_number}/${(checkin.form_type as string).toLowerCase()}`

  const { subject, html } = buildWeeklyCheckinFeedbackEmail({
    firstName,
    weekNumber: checkin.week_number,
    formType: checkin.form_type as 'A' | 'B',
    interpretation: INTERPRETATION,
    reframe: REFRAME,
    nextFocus: NEXT_FOCUS,
    checkinUrl,
  })

  const resend = new Resend(process.env.RESEND_API_KEY!)
  const sendResult = await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: client.email,
    bcc: COACH_BCC,
    subject,
    html,
  })

  console.log('SENT', JSON.stringify({ feedback_id: feedback.id, send_id: sendResult.data?.id, send_err: sendResult.error?.message, to: client.email, bcc: COACH_BCC, subject }, null, 2))
}

main().catch(err => {
  console.error('Script crashed:', err)
  process.exit(1)
})
