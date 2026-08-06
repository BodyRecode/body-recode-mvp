import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildWeeklyCheckinFeedbackEmail } from '@/lib/weekly-checkin-feedback-email'
import { logClientCommunication } from '@/lib/client-communications'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { appUrlFor } from '@/lib/app-url'
import { isCoachUser, forbidden } from '@/lib/api-auth'

interface FeedbackPayload {
  interpretation?: string
  reframe?: string | null
  next_focus?: string
  send_email?: boolean
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: checkinId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const body = (await request.json()) as FeedbackPayload
  const interpretation = (body.interpretation ?? '').trim()
  const reframe = body.reframe?.trim() || null
  const nextFocus = (body.next_focus ?? '').trim()
  const sendEmail = body.send_email !== false

  if (!interpretation) {
    return NextResponse.json({ error: 'Interpretation is required' }, { status: 400 })
  }
  if (!nextFocus) {
    return NextResponse.json({ error: 'Next focus is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: checkin } = await admin
    .from('weekly_checkins')
    .select('id, client_id, week_number, form_type')
    .eq('id', checkinId)
    .maybeSingle()

  if (!checkin) {
    return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
  }

  // Upsert by weekly_checkin_id — one feedback per check-in. Re-submitting
  // overwrites the prior interpretation and re-sends the email if requested.
  const { data: existing } = await admin
    .from('weekly_checkin_feedback')
    .select('id, email_sent_at')
    .eq('weekly_checkin_id', checkinId)
    .maybeSingle()

  const isUpdate = !!existing
  const baseRow = {
    weekly_checkin_id: checkinId,
    client_id: checkin.client_id,
    coach_id: user.id,
    interpretation,
    reframe,
    next_focus: nextFocus,
  }

  const upsertPromise = isUpdate
    ? admin
        .from('weekly_checkin_feedback')
        .update(baseRow)
        .eq('id', existing!.id)
        .select('id, email_sent_at')
        .single()
    : admin
        .from('weekly_checkin_feedback')
        .insert(baseRow)
        .select('id, email_sent_at')
        .single()

  const { data: feedback, error: upsertErr } = await upsertPromise
  if (upsertErr || !feedback) {
    return NextResponse.json({ error: upsertErr?.message ?? 'Failed to save feedback' }, { status: 500 })
  }

  // Email is optional — coach can save without sending if they're drafting.
  if (!sendEmail) {
    return NextResponse.json({ feedback, emailed: false })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ feedback, emailed: false, warning: 'RESEND_API_KEY not configured' })
  }

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token')
    .eq('id', checkin.client_id)
    .maybeSingle()

  if (!client?.email || !client.onboarding_token) {
    return NextResponse.json(
      { feedback, emailed: false, warning: 'Client missing email or onboarding token' },
      { status: 200 }
    )
  }

  const firstName = client.name?.split(' ')[0] ?? 'there'
  const checkinUrl = appUrlFor(`/portal/${client.onboarding_token}/checkin/${checkin.week_number}/${(checkin.form_type as string).toLowerCase()}`)

  const { subject, html } = buildWeeklyCheckinFeedbackEmail({
    firstName,
    weekNumber: checkin.week_number,
    formType: checkin.form_type as 'A' | 'B',
    interpretation,
    reframe,
    nextFocus,
    checkinUrl,
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: fromCoach(),
    to: client.email,
    bcc: COACH_BCC,
    subject,
    html,
  })

  const sentAt = new Date().toISOString()
  await admin
    .from('weekly_checkin_feedback')
    .update({ email_sent_at: sentAt })
    .eq('id', feedback.id)

  await logClientCommunication(admin, {
    clientId: checkin.client_id,
    kind: 'weekly_checkin_feedback',
    subject,
    toAddress: client.email,
    sentBy: user.id,
    meta: {
      weekly_checkin_id: checkinId,
      week_number: checkin.week_number,
      form_type: checkin.form_type,
      resent: isUpdate && !!existing?.email_sent_at,
    },
  })

  return NextResponse.json({ feedback: { ...feedback, email_sent_at: sentAt }, emailed: true })
}
