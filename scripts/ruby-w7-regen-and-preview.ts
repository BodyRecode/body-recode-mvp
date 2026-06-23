// One-off: regenerate Ruby's Week 7 feedback draft using the now-fixed
// generator (which reads nutrition_plans + prompts against the meal
// frequency) and re-emit the [Approve] preview email to kade@bodyrecode.au.
//
// Overwrites the existing W7 feedback row's three text fields. Does NOT
// send to client. Does NOT change email_sent_at. The Approve gate stays
// armed; Kade clicks Approve in his inbox as normal.

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
import { generateFeedbackDraft } from '../src/lib/weekly-checkin-feedback-generate'
import { buildWeeklyCheckinDraftPreviewEmail } from '../src/lib/weekly-checkin-draft-preview-email'
import { appUrlFor } from '../src/lib/app-url'

const CHECKIN_ID = 'ee1b27c2-e55a-4c32-9520-1e28cd6d96ac' // placeholder, overwritten below

async function main() {
  const admin = createAdminClient()

  const { data: checkinRow } = await admin
    .from('weekly_checkins')
    .select('id, client_id, week_number, form_type, submitted_at')
    .eq('week_number', 7)
    .in('client_id', [
      (await admin.from('clients').select('id').ilike('name', '%ruby%').single()).data!.id,
    ])
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single()

  if (!checkinRow) throw new Error('W7 check-in not found for Ruby')
  const CHECKIN = checkinRow

  const result = await generateFeedbackDraft(admin, CHECKIN.id)
  if (!result.ok) {
    console.error('FAILED:', result.error, 'leaks:', result.leaks?.join(', '))
    process.exit(1)
  }

  const draft = result.draft

  // Overwrite existing feedback row text (do NOT touch email_sent_at).
  // Also pull approval_token — needed for the Approve & Send URL.
  const { data: existing } = await admin
    .from('weekly_checkin_feedback')
    .select('id, approval_token')
    .eq('weekly_checkin_id', CHECKIN.id)
    .maybeSingle()
  if (!existing) throw new Error('No feedback row to overwrite')
  if (!existing.approval_token) throw new Error('Feedback row missing approval_token — cannot build Approve URL')

  await admin
    .from('weekly_checkin_feedback')
    .update({
      interpretation: draft.interpretation,
      reframe: draft.reframe,
      next_focus: draft.next_focus,
      auto_generated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', CHECKIN.client_id)
    .single()
  const firstName = (client?.name ?? 'Ruby').split(' ')[0]

  // Build preview email and send to Kade.
  // Approve URL must hit the actual approve endpoint with the token —
  // NOT the dashboard URL. First version of this script used the dashboard
  // URL, which silently navigated Kade to the dashboard without firing
  // the send. Ruby's W7 send had to be triggered by curl as a result.
  const dashboardUrl = appUrlFor(`/dashboard/clients/${CHECKIN.client_id}#weekly-checkins`)
  const approveUrl = appUrlFor(`/api/coach/approve-checkin-response?token=${existing.approval_token}`)

  const { subject, html } = buildWeeklyCheckinDraftPreviewEmail({
    clientFirstName: firstName,
    weekNumber: CHECKIN.week_number,
    formType: CHECKIN.form_type as 'A' | 'B',
    interpretation: draft.interpretation,
    reframe: draft.reframe,
    nextFocus: draft.next_focus,
    approveUrl,
    dashboardUrl,
    checkinSections: [],
  })

  const resend = new Resend(process.env.RESEND_API_KEY!)
  const sendRes = await resend.emails.send({
    from: 'Body Recode Platform <kade@bodyrecode.au>',
    to: 'kade@bodyrecode.au',
    subject: `[REGEN] ${subject}`,
    html,
  })

  console.log(JSON.stringify({
    attempts: result.attempts,
    checkin_id: CHECKIN.id,
    feedback_id: existing.id,
    preview_send_id: sendRes.data?.id,
    preview_send_err: sendRes.error?.message,
    next_focus: draft.next_focus,
  }, null, 2))
}

main().catch(err => { console.error('Script crashed:', err); process.exit(1) })
