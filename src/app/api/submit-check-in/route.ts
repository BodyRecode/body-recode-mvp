import { NextRequest, NextResponse, after } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDefaultCoachId } from '@/lib/default-coach'
import { buildReportEmail, buildFollowUpEmails, nextMorning9amBrisbane, daysAfter9amBrisbane } from '@/lib/generate-report'
import { logLeadEvent } from '@/lib/log-lead-event'
import { darkEmailSignature } from '@/lib/email-signature'
import { appUrl } from '@/lib/app-url'
import { fromCoach } from '@/lib/email-shell'
import { coach, logoUrl, brand } from '@/config/tenant'

export const maxDuration = 300

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': brand().performanceDomain,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  const { name, email, phone, answers, source } = await request.json()

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const QUESTIONS: Record<string, string> = {
    effort_vs_result: 'Effort relative to result',
    consistency: 'Consistency pattern',
    training_response: 'Training response',
    recovery_predictability: 'Recovery predictability',
    planning_vs_reality: 'Planning vs reality drift',
    week_variability: 'Week-to-week variability',
    body_signals: 'Body signals',
    external_load: 'External load (day-to-day demands)',
    adjustments: 'Navigating adjustments',
    support: 'Support as a category',
  }

  const OPTIONS: Record<string, string[]> = {
    effort_vs_result: ['Rarely. Effort and response feel aligned.', 'Occasionally. Some sessions require more than expected.', 'Often. Effort feels higher relative to the result.', 'Frequently. It regularly feels harder than it seems it should.'],
    consistency: ['Largely consistent with minor interruptions', 'Mostly consistent, with some start-stop periods', 'Variable, with frequent changes in routine', 'Difficult to maintain a steady pattern'],
    training_response: ['Settled and able to return to the day without much disruption', 'Noticeably worked, but manageable with some recovery', 'Variable. Sometimes fine, sometimes harder to bounce back.', 'Often carrying fatigue that lingers longer than expected'],
    recovery_predictability: ['Fairly predictable from week to week', 'Predictable most of the time, with occasional fluctuations', 'Inconsistent. Recovery can vary without a clear pattern.', 'Hard to predict. Recovery often feels different session to session.'],
    planning_vs_reality: ['Usually matches closely', 'Mostly matches, with some adjustments', 'Often requires changes as the week unfolds', 'Rarely matches as planned'],
    week_variability: ['Fairly similar from one week to the next', 'Mostly similar, with occasional changes', 'Often different, depending on the week', 'Rarely similar. Weeks tend to look quite different.'],
    body_signals: ['Occasionally, without affecting training much', 'Regularly, but usually manageable', 'Frequently, requiring adjustments more often than not', 'Very frequently, shaping how sessions are approached'],
    external_load: ['Generally steady and manageable', 'Manageable, with some periods of higher demand', 'Often busy or demanding, requiring ongoing adjustment', 'Frequently demanding, with little consistency week to week'],
    adjustments: ['Comfortable making adjustments when needed', 'Somewhat comfortable, but not always sure', 'Often uncertain about how to adjust', 'Rarely confident making changes on my own'],
    support: ['I mostly prefer to manage things independently', 'I occasionally look for guidance or input', 'I often benefit from having someone to sense-check decisions', 'I rely on external support to help navigate training'],
  }

  const totalScore = Object.entries(answers).reduce((sum, [, val]) => sum + (val as number), 0)
  const max = Object.keys(QUESTIONS).length * 3
  const pct = totalScore / max

  let signalPattern: string
  if (pct >= 0.55) signalPattern = 'Remediation'
  else if (pct >= 0.25) signalPattern = 'Optimisation'
  else signalPattern = 'Post-Optimisation'

  const answersHtml = Object.entries(QUESTIONS)
    .map(([id, label]) => {
      const val = answers[id] as number
      const optionText = OPTIONS[id]?.[val] ?? `Option ${val}`
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;vertical-align:top;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#E5E5E5;">${label}</p>
            <p style="margin:0;font-size:13px;color:#999999;">${optionText}</p>
          </td>
        </tr>
      `
    })
    .join('')

  // Save lead first, before any email sending, so it's never lost
  const supabase = createAdminClient()
  const coachId = await getDefaultCoachId(supabase)
  const { data: newLead, error: leadError } = await supabase.from('leads').insert({
    coach_id: coachId,
    name,
    email,
    phone: phone || null,
    source: ['quiz', 'instagram', 'facebook', 'google', 'gym_floor', 'referral', 'direct', 'other'].includes(source) ? source : 'quiz',
    status: 'new_check_in',
    check_in_answers: answers,
    active: true,
  }).select('id').single()
  if (leadError) console.error('Lead insert error:', leadError)

  // Notify Kade
  const { error } = await resend.emails.send({
    from: 'Body Recode™ <kade@bodyrecode.au>',
    to: coach().email,
    subject: `New Check-In: ${name}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="color-scheme" content="light only" /></head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" bgcolor="#FFFFFF">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:560px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">

          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px 24px;border-bottom:1px solid #E5E5E5;">
              <img src="${logoUrl()}" width="120" alt="Body Recode" style="display:block;margin-bottom:20px;" />
              <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#555;">New Check-In</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#1A1A1A;">${name}</h1>
            </td>
          </tr>

          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 0 20px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#555;">Contact</p>
                    <p style="margin:0;font-size:14px;color:#ccc;">${email}</p>
                    ${phone ? `<p style="margin:4px 0 0;font-size:14px;color:#888;">${phone}</p>` : ''}
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin:0 0 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#555;">Answers</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${Object.entries(QUESTIONS).map(([id, label]) => {
                        const val = answers[id] as number
                        const optionText = OPTIONS[id]?.[val] ?? `Option ${val}`
                        return `<tr><td style="padding:8px 0;border-bottom:1px solid #E5E5E5;"><p style="margin:0 0 3px;font-size:12px;font-weight:600;color:#888;">${label}</p><p style="margin:0;font-size:13px;color:#ccc;">${optionText}</p></td></tr>`
                      }).join('')}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:20px 40px 28px;border-top:1px solid #E5E5E5;">
              <a href="${appUrl()}/dashboard/leads" style="display:inline-block;padding:11px 22px;background:#1B6DFC;color:#000;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;">View in dashboard</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  })

  if (error) console.error('Kade notification email error:', error)

  // Automated acknowledgement to submitter
  const firstName = name.trim().split(' ')[0]
  await resend.emails.send({
    from: 'Body Recode™ <kade@bodyrecode.au>',
    to: email,
    subject: 'Performance Check-In received',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" bgcolor="#FFFFFF">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:32px 40px 28px;border-bottom:1px solid #E5E5E5;">
              <img src="${logoUrl()}" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;">
              <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#1A1A1A;line-height:1.3;">Check-In received,<br/>${firstName}.</p>
              <p style="margin:0 0 16px;font-size:15px;color:#999999;line-height:1.7;">
                Your responses have been received and are being reviewed.
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#999999;line-height:1.7;">
                From this submission, a short interpretive report will be prepared, reflecting the patterns currently showing up across your training, recovery, and overall consistency.
              </p>
              <p style="margin:0 0 36px;font-size:15px;color:#999999;line-height:1.7;">
                You can expect this report within one business day. No further action is required from you at this stage.
              </p>

              ${darkEmailSignature()}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  })

  // Check-in emails are paused. Do not schedule report or follow-ups until flow is finalised.
  // after(async () => {
  //   await scheduleReport(resend, newLead?.id ?? null, name, email, answers, signalPattern).catch(err =>
  //     console.error('Report generation error:', err)
  //   )
  // })

  return NextResponse.json({ success: true }, { headers: CORS_HEADERS })
}

async function scheduleReport(
  resend: InstanceType<typeof Resend>,
  leadId: string | null,
  name: string,
  email: string,
  answers: Record<string, number>,
  signalPattern: string
) {
  const firstName = name.trim().split(' ')[0]
  const bookingLink = process.env.BOOKING_LINK ?? ''

  const html = await buildReportEmail(firstName, answers, signalPattern, bookingLink)
  const scheduledAt = nextMorning9amBrisbane()

  const { data: reportResult } = await resend.emails.send({
    from: fromCoach(),
    to: email,
    subject: 'Your Performance Check-In report',
    html,
    scheduledAt: scheduledAt.toISOString(),
  })

  if (leadId) {
    await logLeadEvent({
      leadId,
      type: 'report_scheduled',
      subject: 'Your Performance Check-In report',
      resendEmailId: reportResult?.id,
      sentAt: scheduledAt,
    })
  }

  // Schedule follow-up sequence
  const followUps = buildFollowUpEmails(firstName, bookingLink)
  const followupEmailIds: string[] = []

  const followupSchedules = [
    { days: 2, ...followUps.email1 },
    { days: 5, ...followUps.email2 },
    { days: 9, ...followUps.email3 },
  ]

  for (const fu of followupSchedules) {
    try {
      const sendAt = daysAfter9amBrisbane(scheduledAt, fu.days)
      const { data } = await resend.emails.send({
        from: fromCoach(),
        to: email,
        subject: fu.subject,
        html: fu.html,
        scheduledAt: sendAt.toISOString(),
      })
      if (data?.id) {
        followupEmailIds.push(data.id)
        if (leadId) {
          await logLeadEvent({
            leadId,
            type: 'followup_scheduled',
            subject: fu.subject,
            resendEmailId: data.id,
            sentAt: sendAt,
          })
        }
      }
    } catch (e) {
      console.error('Follow-up schedule error:', e)
    }
  }

  // Save report, follow-up IDs, and advance status new_check_in → report_sent
  if (leadId) {
    try {
      const supabase = createAdminClient()
      await supabase
        .from('leads')
        .update({
          report_html: html,
          report_scheduled_at: scheduledAt.toISOString(),
          followup_email_ids: followupEmailIds.length > 0 ? followupEmailIds : null,
          status: 'report_sent',
        })
        .eq('id', leadId)
        .eq('status', 'new_check_in')
    } catch (e) {
      console.error('Report save error:', e)
    }
  }
}
