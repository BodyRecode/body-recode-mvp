// Tokenised coach-approval endpoint for the weekly check-in feedback flow.
//
// Hit from the Approve & Send button inside the [Approve] preview email
// (built by buildWeeklyCheckinDraftPreviewEmail). One-click: GET with
// ?token=<approval_token uuid>.
//
// Behaviour:
//   - 400 if token missing / not a uuid
//   - 200 + "Already sent" page if email_sent_at is already set (idempotent)
//   - 404 if no feedback row matches the token
//   - Otherwise: build the branded feedback email, send to the client,
//     BCC kade@bodyrecode.au, stamp email_sent_at + coach_approved_at,
//     log to client_communications, return a confirmation HTML page
//
// Why GET not POST: the button lives in an email, and Apple Mail / Gmail
// won't render a form. A GET is fine here because the action is
// idempotent (email_sent_at gate) and the token is single-use.
//
// No auth required beyond the token. The token IS the auth — emailed
// only to kade@bodyrecode.au from a trusted Resend sender.

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { appUrlFor } from '@/lib/app-url'
import { COACH_BCC } from '@/lib/email-shell'
import { logClientCommunication } from '@/lib/client-communications'
import { buildWeeklyCheckinFeedbackEmail } from '@/lib/weekly-checkin-feedback-email'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function statusPage({
  heading,
  body,
  dashboardUrl,
  tone = 'success',
}: {
  heading: string
  body: string
  dashboardUrl?: string
  tone?: 'success' | 'info' | 'error'
}): string {
  const accent = tone === 'error' ? '#C7253E' : '#1B6DFC'
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#F8F9FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1A1A1A;">
  <div style="max-width:520px;margin:60px auto;background:#FFFFFF;border:1px solid #E5E5E5;border-radius:16px;padding:48px 40px;">
    <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:${accent};text-transform:uppercase;margin:0 0 12px;">Body Recode</p>
    <h1 style="font-size:22px;font-weight:800;margin:0 0 12px;line-height:1.3;">${heading}</h1>
    <p style="font-size:15px;line-height:1.7;color:#3A3A3A;margin:0 0 24px;">${body}</p>
    ${dashboardUrl ? `<a href="${dashboardUrl}" style="display:inline-block;padding:12px 22px;background:${accent};color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;">Open dashboard</a>` : ''}
  </div>
</body>
</html>`
}

function htmlResponse(html: string, status = 200): NextResponse {
  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''

  if (!token || !UUID_RE.test(token)) {
    return htmlResponse(statusPage({
      heading: 'Missing or invalid token',
      body: 'This link is incomplete. Open the dashboard to send the response manually.',
      dashboardUrl: appUrlFor('/dashboard'),
      tone: 'error',
    }), 400)
  }

  const admin = createAdminClient()

  const { data: feedback } = await admin
    .from('weekly_checkin_feedback')
    .select('id, client_id, weekly_checkin_id, interpretation, reframe, next_focus, email_sent_at, coach_approved_at')
    .eq('approval_token', token)
    .maybeSingle()

  if (!feedback) {
    return htmlResponse(statusPage({
      heading: 'Link not recognised',
      body: 'This approval link no longer matches a drafted response. It may have been regenerated. Open the dashboard to send manually.',
      dashboardUrl: appUrlFor('/dashboard'),
      tone: 'error',
    }), 404)
  }

  const dashboardUrl = appUrlFor(`/dashboard/clients/${feedback.client_id}#weekly-checkins`)

  if (feedback.email_sent_at) {
    return htmlResponse(statusPage({
      heading: 'Already sent',
      body: `This response was sent at ${new Date(feedback.email_sent_at).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' })} Brisbane. No further action needed.`,
      dashboardUrl,
      tone: 'info',
    }))
  }

  const { data: checkin } = await admin
    .from('weekly_checkins')
    .select('id, week_number, form_type, client_id, coach_skipped_at')
    .eq('id', feedback.weekly_checkin_id)
    .maybeSingle()

  if (!checkin) {
    return htmlResponse(statusPage({
      heading: 'Check-in not found',
      body: 'The check-in this response belongs to no longer exists. Open the dashboard to investigate.',
      dashboardUrl: appUrlFor('/dashboard'),
      tone: 'error',
    }), 404)
  }

  if (checkin.coach_skipped_at) {
    return htmlResponse(statusPage({
      heading: 'This week was skipped',
      body: 'You already marked this check-in as skipped. No response will be sent.',
      dashboardUrl,
      tone: 'info',
    }))
  }

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token')
    .eq('id', checkin.client_id)
    .maybeSingle()

  if (!client?.email || !client.onboarding_token) {
    return htmlResponse(statusPage({
      heading: 'Client missing email or portal token',
      body: 'Cannot send the response automatically. Open the dashboard to investigate.',
      dashboardUrl,
      tone: 'error',
    }), 400)
  }

  const firstName = client.name?.split(' ')[0] ?? 'there'
  const checkinUrl = appUrlFor(`/portal/${client.onboarding_token}/checkin/${checkin.week_number}/${(checkin.form_type as string).toLowerCase()}`)
  const { subject, html } = buildWeeklyCheckinFeedbackEmail({
    firstName,
    weekNumber: checkin.week_number,
    formType: checkin.form_type as 'A' | 'B',
    interpretation: feedback.interpretation,
    reframe: feedback.reframe,
    nextFocus: feedback.next_focus,
    checkinUrl,
  })

  if (!process.env.RESEND_API_KEY) {
    return htmlResponse(statusPage({
      heading: 'Email service not configured',
      body: 'RESEND_API_KEY is missing on the server. Open the dashboard and use Send now once configured.',
      dashboardUrl,
      tone: 'error',
    }), 500)
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: client.email,
      bcc: COACH_BCC,
      subject,
      html,
    })
  } catch (err) {
    console.error('[approve-checkin-response] send failed:', err)
    return htmlResponse(statusPage({
      heading: 'Send failed',
      body: 'The response was drafted but Resend rejected the send. Open the dashboard to retry.',
      dashboardUrl,
      tone: 'error',
    }), 502)
  }

  const sentAt = new Date().toISOString()
  await admin
    .from('weekly_checkin_feedback')
    .update({
      email_sent_at: sentAt,
      coach_approved_at: sentAt,
    })
    .eq('id', feedback.id)

  await logClientCommunication(admin, {
    clientId: client.id,
    kind: 'weekly_checkin_feedback',
    subject,
    toAddress: client.email,
    meta: {
      weekly_checkin_id: feedback.weekly_checkin_id,
      week_number: checkin.week_number,
      form_type: checkin.form_type,
      coach_approved: true,
      approved_via: 'email_button',
    },
  })

  return htmlResponse(statusPage({
    heading: `Sent to ${firstName}`,
    body: `The response is on its way to ${firstName} now. You are BCC'd. ${firstName} can also see it in her portal.`,
    dashboardUrl,
    tone: 'success',
  }))
}
