// One-off preview: re-build the Week 4 Form B feedback email for Samantha
// and send ONLY to kade@bodyrecode.au (NOT to Samantha — she has it already)
// so Kade can confirm the colour-scheme fix renders light on his phone.
//
// Does NOT update email_sent_at and does NOT log to client_communications,
// because no client email is being sent.

import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { buildWeeklyCheckinFeedbackEmail } from '@/lib/weekly-checkin-feedback-email'
import { appUrlFor } from '@/lib/app-url'

const CHECKIN_ID = '00cab621-a91d-41b3-b2dd-bfe5e035f309'
const KADE_EMAIL = 'kade@bodyrecode.au'

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: checkin } = await supabase
    .from('weekly_checkins')
    .select('id, client_id, week_number, form_type')
    .eq('id', CHECKIN_ID).single()

  if (!checkin) throw new Error('check-in not found')

  const { data: client } = await supabase
    .from('clients')
    .select('name, onboarding_token')
    .eq('id', checkin.client_id).single()

  if (!client) throw new Error('client not found')

  const { data: fb } = await supabase
    .from('weekly_checkin_feedback')
    .select('interpretation, reframe, next_focus')
    .eq('weekly_checkin_id', CHECKIN_ID).single()

  if (!fb) throw new Error('feedback not found')

  const firstName = client.name.split(' ')[0]
  const checkinUrl = appUrlFor(`/portal/${client.onboarding_token}/checkin/${checkin.week_number}/${(checkin.form_type as string).toLowerCase()}`)

  const { subject, html } = buildWeeklyCheckinFeedbackEmail({
    firstName,
    weekNumber: checkin.week_number,
    formType: checkin.form_type as 'A' | 'B',
    interpretation: fb.interpretation,
    reframe: fb.reframe,
    nextFocus: fb.next_focus,
    checkinUrl,
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data, error } = await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: KADE_EMAIL,
    subject: `[PREVIEW] ${subject}`,
    html,
  })

  if (error) { console.error('Send failed:', error); process.exit(1) }
  console.log('Sent preview to', KADE_EMAIL, '| id:', data?.id)
}

main().catch((e) => { console.error(e); process.exit(1) })
