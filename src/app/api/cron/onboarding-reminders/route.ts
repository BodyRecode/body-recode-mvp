import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import { emailUrlFallback } from '@/lib/email-shell'
import { logClientCommunication } from '@/lib/client-communications'
import { appUrl } from '@/lib/app-url'

type Threshold = 3 | 7 | 14

interface ClientRow {
  id: string
  name: string
  email: string | null
  active: boolean | null
  created_at: string
  onboarding_token: string | null
  agreement_accepted_at: string | null
  health_declaration_submitted_at: string | null
  onboarding_reminders_sent: Record<string, string> | null
}

interface TaskState {
  id: 'agreement' | 'health' | 'intake' | 'baseline'
  title: string
  applicable: boolean
  done: boolean
  availableAt: string | null
}

const APP_URL = appUrl()

function dayCard(html: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
            <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            ${html}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function reminderEmail(firstName: string, taskTitle: string, threshold: Threshold, portalUrl: string) {
  const intro =
    threshold === 3
      ? `Just a nudge — your ${taskTitle} is waiting. Pick up where you left off whenever you have a few minutes.`
      : threshold === 7
      ? `Your ${taskTitle} is still outstanding. We need this to keep your coaching on track.`
      : `It's been two weeks since your ${taskTitle} became available. If you've changed your mind that's okay — just let me know. Otherwise, this is the last automated reminder.`

  const body = `
    <p style="margin:0 0 18px;font-size:15px;color:#4A4A4A;line-height:1.75;">Hi ${firstName},</p>
    <p style="margin:0 0 24px;font-size:15px;color:#4A4A4A;line-height:1.75;">${intro}</p>
    <a href="${portalUrl}" style="display:inline-block;padding:12px 24px;background:#1B6DFC;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Open your portal</a>
    <p style="margin:24px 0 0;font-size:13px;color:#6B6B6B;line-height:1.7;">If anything's blocking you or unclear, reply to this email.</p>
    ${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
    ${darkEmailSignature()}`

  return dayCard(body)
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

function pickThreshold(days: number): Threshold | null {
  if (days >= 14) return 14
  if (days >= 7) return 7
  if (days >= 3) return 3
  return null
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data: clients } = await admin
    .from('clients')
    .select('id, name, email, active, created_at, onboarding_token, agreement_accepted_at, health_declaration_submitted_at, onboarding_reminders_sent, intake_invitations(status, completed_at), baselines(id)')
    .eq('active', true)

  if (!clients || clients.length === 0) {
    return NextResponse.json({ sent: 0, considered: 0 })
  }

  let sent = 0
  let considered = 0

  for (const raw of clients) {
    const client = raw as unknown as ClientRow & {
      intake_invitations: { status: string; completed_at: string | null }[]
      baselines: { id: string }[]
    }

    if (!client.email || !client.onboarding_token) continue

    const intakeCompleted = (client.intake_invitations || []).find(i => i.status === 'complete')
    const baselineDone = (client.baselines || []).length > 0

    const tasks: TaskState[] = [
      {
        id: 'agreement',
        title: 'Coaching Agreement',
        applicable: true,
        done: !!client.agreement_accepted_at,
        availableAt: client.created_at,
      },
      {
        id: 'health',
        title: 'Health Declaration',
        applicable: true,
        done: !!client.health_declaration_submitted_at,
        availableAt: client.agreement_accepted_at,
      },
      {
        id: 'intake',
        title: 'Foundational Intake',
        applicable: true,
        done: !!intakeCompleted,
        availableAt: client.health_declaration_submitted_at,
      },
      {
        id: 'baseline',
        title: 'Baseline Documentation',
        applicable: true,
        done: baselineDone,
        availableAt: intakeCompleted?.completed_at ?? null,
      },
    ]

    const sentMap = client.onboarding_reminders_sent ?? {}
    const firstName = client.name.split(' ')[0]
    const portalUrl = `${APP_URL}/portal/${client.onboarding_token}`

    for (const task of tasks) {
      if (!task.applicable || task.done || !task.availableAt) continue
      const threshold = pickThreshold(daysSince(task.availableAt))
      if (!threshold) continue
      const key = `${task.id}_${threshold}`
      if (sentMap[key]) continue

      considered++

      const subject =
        threshold === 3
          ? `Quick reminder - finish your ${task.title}`
          : threshold === 7
          ? `Your ${task.title} is still pending`
          : `Last reminder - your ${task.title}`

      try {
        await resend.emails.send({
          from: 'Kade at Body Recode <kade@bodyrecode.au>',
          to: client.email,
          subject,
          html: reminderEmail(firstName, task.title, threshold, portalUrl),
        })
        const sentAt = new Date().toISOString()
        sentMap[key] = sentAt
        await logClientCommunication(admin, {
          clientId: client.id,
          kind: 'onboarding_reminder',
          subject,
          toAddress: client.email,
          sentAt,
          meta: { task: task.id, task_title: task.title, threshold_days: threshold, url: portalUrl, trigger: 'cron' },
        })
        sent++
      } catch (err) {
        console.error(`Failed to send ${key} reminder to ${client.email}:`, err)
      }
    }

    if (Object.keys(sentMap).length > 0) {
      await admin
        .from('clients')
        .update({ onboarding_reminders_sent: sentMap })
        .eq('id', client.id)
    }
  }

  return NextResponse.json({ sent, considered })
}
