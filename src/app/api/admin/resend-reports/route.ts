import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildReportEmail, buildFollowUpEmails, daysAfter9amBrisbane } from '@/lib/generate-report'
import { darkEmailSignature } from '@/lib/email-signature'
import { logLeadEvent } from '@/lib/log-lead-event'

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

function getSignalPattern(answers: Record<string, number>): string {
  const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0)
  const max = Object.keys(QUESTIONS).length * 3
  const pct = totalScore / max
  if (pct >= 0.55) return 'Remediation'
  if (pct >= 0.25) return 'Optimisation'
  return 'Post-Optimisation'
}

export async function POST(request: NextRequest) {
  // Require secret to prevent accidental triggers
  const { secret } = await request.json()
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const bookingLink = process.env.BOOKING_LINK ?? ''

  const { data: leads } = await admin
    .from('leads')
    .select('id, name, email, check_in_answers, status, followup_email_ids')
    .not('check_in_answers', 'is', null)
    .not('email', 'is', null)

  if (!leads || leads.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const lead of leads) {
    if (!lead.email || !lead.check_in_answers) continue

    try {
      const firstName = lead.name.split(' ')[0]
      const answers = lead.check_in_answers as Record<string, number>
      const signalPattern = getSignalPattern(answers)
      const reportHtml = await buildReportEmail(firstName, answers, signalPattern, bookingLink)

      const introHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
</head>
<body style="margin:0;padding:0;background-color:#0c0a09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" bgcolor="#0c0a09">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:580px;background-color:#111110;border-radius:16px 16px 0 0;border:1px solid #1c1917;border-bottom:none;overflow:hidden;">
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:32px 40px 28px;border-bottom:1px solid #1c1917;">
              <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;">
              <p style="margin:0 0 20px;font-size:15px;color:#888888;line-height:1.75;">Hey ${firstName},</p>
              <p style="margin:0 0 20px;font-size:15px;color:#888888;line-height:1.75;">You completed a performance check-in a little while back and I wanted to follow up.</p>
              <p style="margin:0 0 20px;font-size:15px;color:#888888;line-height:1.75;">There is a chance your original report landed in your junk or spam folder so I have included it again below.</p>
              <p style="margin:0 0 0;font-size:15px;color:#888888;line-height:1.75;">If you have any questions about what it means or want to talk through it, just reply to this email.</p>
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

      // Strip the opening doctype/html tags from the report so we can append it
      const reportBody = reportHtml
        .replace(/^[\s\S]*?<body[^>]*>/i, '')
        .replace(/<\/body>[\s\S]*$/i, '')

      const combined = introHtml.replace('</body>\n</html>', '') +
        `<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:0 20px 48px;">
          <tr><td align="center">${reportBody}</td></tr>
        </table>
        </body></html>`

      // Cancel any previously scheduled follow-ups from the original report send
      const existingIds = (lead.followup_email_ids as string[] | null) ?? []
      for (const emailId of existingIds) {
        try {
          await resend.emails.cancel(emailId)
        } catch (e) {
          // Ignore — may already be sent or expired
        }
      }

      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: lead.email,
        subject: `${firstName}, your Body Recode performance report`,
        html: combined,
      })

      await logLeadEvent({
        leadId: lead.id,
        type: 'reengagement_sent',
        subject: `${firstName}, your Body Recode performance report`,
      })

      // Schedule follow-up sequence (skip if already converted)
      const skipFollowUps = ['commencement_fee_paid', 'closed_declined', 'closed_no_show'].includes(lead.status)
      if (!skipFollowUps) {
        const followUps = buildFollowUpEmails(firstName, bookingLink)
        const now = new Date()
        const followupSchedules = [
          { days: 2, ...followUps.email1 },
          { days: 5, ...followUps.email2 },
          { days: 9, ...followUps.email3 },
        ]
        const followupEmailIds: string[] = []
        for (const fu of followupSchedules) {
          try {
            const sendAt = daysAfter9amBrisbane(now, fu.days)
            const { data } = await resend.emails.send({
              from: 'Kade at Body Recode <kade@bodyrecode.au>',
              to: lead.email,
              subject: fu.subject,
              html: fu.html,
              scheduledAt: sendAt.toISOString(),
            })
            if (data?.id) {
              followupEmailIds.push(data.id)
              await logLeadEvent({
                leadId: lead.id,
                type: 'followup_scheduled',
                subject: fu.subject,
                resendEmailId: data.id,
                sentAt: sendAt,
              })
            }
          } catch (e) {
            console.error(`Follow-up schedule error for ${lead.email}:`, e)
          }
        }
        if (followupEmailIds.length > 0) {
          await admin.from('leads').update({ followup_email_ids: followupEmailIds }).eq('id', lead.id)
        }
      }

      sent++
    } catch (err) {
      failed++
      errors.push(`${lead.name} (${lead.email}): ${err}`)
      console.error(`Failed for ${lead.email}:`, err)
    }
  }

  return NextResponse.json({ sent, failed, errors })
}
