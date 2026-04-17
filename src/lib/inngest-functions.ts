import { inngest } from './inngest'
import { createAdminClient } from './supabase/admin'
import { Resend } from 'resend'
import { sendSms, formatPhone } from './twilio'
import { darkEmailSignature } from './email-signature'
import type { TriggerContext } from './automation-engine'

// ─── Challenge Email Helpers ────────────────────────────────────────────────

function challengeEmailShell(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:520px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
              <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#888888;">
              ${body}
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`
}

// ─── Challenge Sequence Function ─────────────────────────────────────────────

export const challengeSequenceFunction = inngest.createFunction(
  {
    id: 'challenge-sequence',
    retries: 2,
    triggers: [{ event: 'challenge/enrolled' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { leadId, token, email, firstName } = event.data as {
      leadId: string
      token: string
      email: string
      firstName: string
    }

    const portalUrl = `https://bodyrecode.au/challenge/${token}`
    const resend = new Resend(process.env.RESEND_API_KEY)

    // ── Step 1: Welcome email ──────────────────────────────────────────────
    await step.run('send-welcome-email', async () => {
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: `You're in, ${firstName}. Day 1 starts now.`,
        html: challengeEmailShell(`
          <p style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px;">
            Welcome to the 14-Day Body Decode Challenge.
          </p>
          <p>Hi ${firstName},</p>
          <p>You are in. Day 1 starts today.</p>
          <p>Over the next 14 days you will follow a simple structure designed to calm your system, rebuild your baseline, and help you understand what is actually driving the way your body looks and feels.</p>
          <p>Your challenge portal has everything you need:</p>
          <ul style="padding-left:20px;color:#888888;">
            <li style="margin-bottom:6px;">Your daily coaching note - opens each morning</li>
            <li style="margin-bottom:6px;">Your 14-day training plan</li>
            <li style="margin-bottom:6px;">Your HABNS nutrition guide</li>
            <li style="margin-bottom:6px;">Your morning and evening reset sequences</li>
            <li style="margin-bottom:6px;">The Mini Hormone Quiz - unlocks on Day 7</li>
          </ul>
          <p>Start simple. Follow the structure. Do not try to be perfect on Day 1.</p>
          <p>
            <a href="${portalUrl}" style="display:inline-block;padding:13px 24px;background:#14b8a6;color:#0c0a09;font-weight:700;font-size:14px;border-radius:8px;text-decoration:none;">
              Open your challenge portal
            </a>
          </p>
          <p style="font-size:13px;color:#57534e;">
            Bookmark this link. It is your personal portal for the full 14 days.<br/>
            <a href="${portalUrl}" style="color:#57534e;">${portalUrl}</a>
          </p>
        `),
      })
    })

    // ── Step 2: Notify coach ───────────────────────────────────────────────
    await step.run('notify-coach-enrollment', async () => {
      await resend.emails.send({
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        subject: `New challenge enrollment - ${firstName}`,
        html: challengeEmailShell(`
          <p style="color:#ffffff;font-size:16px;font-weight:700;margin:0 0 16px;">New Challenge Enrollment</p>
          <p><strong style="color:#ffffff;">${firstName}</strong> just enrolled in the 14-Day Body Decode Challenge.</p>
          <p style="color:#888888;">Email: ${email}</p>
          <p style="color:#888888;">Portal token: ${token}</p>
          <p>
            <a href="${portalUrl}" style="display:inline-block;padding:10px 18px;background:#14b8a6;color:#0c0a09;font-weight:700;font-size:13px;border-radius:8px;text-decoration:none;">
              View their portal
            </a>
          </p>
        `),
      })
    })

    // ── Step 3: Wait 4 days → Day 5 Zoom invite ───────────────────────────
    await step.sleep('wait-for-day-5', '4d')

    await step.run('send-day5-zoom-invite', async () => {
      // Check enrollment is still active before sending
      const admin = createAdminClient()
      const { data: enrollment } = await admin
        .from('challenge_enrollments')
        .select('status')
        .eq('token', token)
        .single()
      if (!enrollment || enrollment.status !== 'active') return

      const sessionVideoUrl = process.env.CHALLENGE_SESSION_VIDEO_URL ?? portalUrl
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: `Day 5 - Your Week One Progress Session is ready`,
        html: challengeEmailShell(`
          <p style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px;">
            Week One Progress Session
          </p>
          <p>Hi ${firstName},</p>
          <p>You have made it to Day 5. That puts you ahead of most people who started.</p>
          <p>Your Week One Progress Session is now available to watch. It is a 30-minute session I recorded specifically for this point in the challenge.</p>
          <p style="color:#ffffff;font-weight:600;">In this session:</p>
          <ul style="padding-left:20px;color:#888888;">
            <li style="margin-bottom:6px;">What your body has actually been doing this week</li>
            <li style="margin-bottom:6px;">How to decode the signals you have been feeling - energy, digestion, puffiness, mood</li>
            <li style="margin-bottom:6px;">Why rhythm matters more than restriction</li>
            <li style="margin-bottom:6px;">What Week 2 is building toward</li>
            <li style="margin-bottom:6px;">The next step after the challenge for those who want to go deeper</li>
          </ul>
          <p>I also share the personal story behind how I built this system. Watch it today while you are in the middle of the reset - it will make Week 2 feel much clearer.</p>
          <div style="background:#0d2d29;border:1px solid rgba(20,184,166,0.2);border-radius:10px;padding:20px;margin:20px 0;">
            <p style="color:#14b8a6;font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px;">Now Available</p>
            <p style="color:#ffffff;font-weight:700;font-size:16px;margin:0 0 4px;">Week One Progress Session</p>
            <p style="color:#a8a29e;font-size:13px;margin:0 0 16px;">30 minutes</p>
            <a href="${sessionVideoUrl}" style="display:inline-block;padding:12px 22px;background:#14b8a6;color:#0c0a09;font-weight:700;font-size:14px;border-radius:8px;text-decoration:none;">
              Watch the session
            </a>
          </div>
          <p style="font-size:13px;color:#57534e;">You can also find this in your portal under the Live Session section.</p>
        `),
      })
    })

    // ── Step 4: Wait 9 more days → Day 14 ascension ───────────────────────
    await step.sleep('wait-for-day-14', '9d')

    await step.run('send-day14-ascension', async () => {
      const admin = createAdminClient()
      const { data: enrollment } = await admin
        .from('challenge_enrollments')
        .select('status')
        .eq('token', token)
        .single()
      if (!enrollment || enrollment.status !== 'active') return

      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: `${firstName}, you finished the 14 days.`,
        html: challengeEmailShell(`
          <p style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px;">
            14 days done.
          </p>
          <p>Hi ${firstName},</p>
          <p>You finished the challenge. That is not nothing.</p>
          <p>Most people who start something like this quit before Day 5. You made it to Day 14. That means your body has had 14 consecutive days of structured rhythm - consistent training, real food, better sleep, predictable timing.</p>
          <p style="color:#ffffff;font-weight:600;">What that should have done:</p>
          <ul style="padding-left:20px;color:#888888;">
            <li style="margin-bottom:6px;">Reduced the daily puffiness and inflammation</li>
            <li style="margin-bottom:6px;">Stabilised your energy across the day</li>
            <li style="margin-bottom:6px;">Calmed the afternoon cravings</li>
            <li style="margin-bottom:6px;">Improved your sleep quality</li>
            <li style="margin-bottom:6px;">Given your digestion a cleaner baseline</li>
          </ul>
          <p>This is your baseline now. The question is: what do you build on top of it?</p>
          <p>The 6-Week Body Recode Blueprint takes everything you have started and adds structure, progressive training, signal-guided nutrition, and real accountability. It is where the results become visible.</p>
          <div style="background:#0d2d29;border:1px solid rgba(20,184,166,0.2);border-radius:10px;padding:20px;margin:20px 0;">
            <p style="color:#14b8a6;font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px;">Next Step</p>
            <p style="color:#ffffff;font-weight:700;font-size:16px;margin:0 0 4px;">6-Week Body Recode Blueprint</p>
            <p style="color:#a8a29e;font-size:13px;margin:0 0 16px;">Where rhythm becomes results.</p>
            <a href="https://bodyrecode.au/scorecard" style="display:inline-block;padding:12px 22px;background:#14b8a6;color:#0c0a09;font-weight:700;font-size:14px;border-radius:8px;text-decoration:none;">
              Take the full Body State Scorecard
            </a>
          </div>
          <p style="font-size:13px;color:#57534e;">Or just reply to this email and I will personally help you figure out the right next step.</p>
        `),
      })

      // Log completion
      await admin
        .from('challenge_enrollments')
        .update({ status: 'completed' })
        .eq('token', token)
    })
  }
)

interface Contact {
  name: string
  email: string | null
  phone: string | null
}

interface Step {
  id: string
  type: string
  action_type: string | null
  config: Record<string, string>
  position: number
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

function stepSleepDuration(config: Record<string, string>): string {
  const amount = parseInt(config.amount) || 1
  const unit = config.unit || 'hours'
  const map: Record<string, string> = {
    minutes: 'm',
    hours: 'h',
    days: 'd',
  }
  return `${amount}${map[unit] ?? 'h'}`
}

async function executeAction(
  step: Step,
  ctx: TriggerContext,
  contact: Contact | null,
  templateVars: Record<string, string>
): Promise<void> {
  const admin = createAdminClient()
  const config = step.config

  switch (step.action_type) {
    case 'send_email': {
      if (!contact?.email || !process.env.RESEND_API_KEY) break
      const resend = new Resend(process.env.RESEND_API_KEY)
      const bodyHtml = interpolate(config.body ?? '', templateVars)
        .replace(/\n/g, '<br/>')
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: contact.email,
        subject: interpolate(config.subject ?? '', templateVars),
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:520px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
              <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#888888;">
              ${bodyHtml}
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`,
      })
      break
    }

    case 'notify_coach': {
      if (!process.env.RESEND_API_KEY) break
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        subject: `Automation: ${interpolate(config.message ?? 'Action triggered', templateVars)}`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0c0a09;color:#aaa;">
          <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
          <p style="font-size:16px;color:#fff;font-weight:600;">${interpolate(config.message ?? '', templateVars)}</p>
          ${contact ? `<p style="color:#aaa;">Contact: ${contact.name} (${contact.email ?? 'no email'})</p>` : ''}
        </div>`,
      })
      break
    }

    case 'add_tag': {
      if (!config.tag || !ctx.leadId) break
      const { data: existingTag } = await admin
        .from('be_tags')
        .select('id')
        .eq('name', config.tag)
        .maybeSingle()

      let tagId = existingTag?.id
      if (!tagId) {
        const { data: lead } = await admin
          .from('leads')
          .select('coach_id')
          .eq('id', ctx.leadId)
          .single()
        const { data: newTag } = await admin
          .from('be_tags')
          .insert({ name: config.tag, coach_id: lead?.coach_id })
          .select('id')
          .single()
        tagId = newTag?.id
      }

      if (tagId) {
        await admin
          .from('be_lead_tags')
          .upsert({ lead_id: ctx.leadId, tag_id: tagId })
      }
      break
    }

    case 'remove_tag': {
      if (!config.tag || !ctx.leadId) break
      const { data: tag } = await admin
        .from('be_tags')
        .select('id')
        .eq('name', config.tag)
        .maybeSingle()
      if (tag) {
        await admin
          .from('be_lead_tags')
          .delete()
          .eq('lead_id', ctx.leadId)
          .eq('tag_id', tag.id)
      }
      break
    }

    case 'move_pipeline_stage': {
      if (!config.stage || !ctx.leadId) break
      await admin
        .from('leads')
        .update({ status: config.stage })
        .eq('id', ctx.leadId)
      break
    }

    case 'send_sms': {
      if (!contact?.phone) break
      await sendSms({
        to: formatPhone(contact.phone),
        message: interpolate(config.message ?? '', templateVars),
      })
      break
    }
  }
}

export const executeWorkflowFunction = inngest.createFunction(
  {
    id: 'execute-workflow',
    retries: 3,
    triggers: [{ event: 'automation/workflow.triggered' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { workflowId, executionId, ctx, contact, templateVars } = event.data as {
      workflowId: string
      executionId: string | null
      ctx: TriggerContext
      contact: Contact | null
      templateVars: Record<string, string>
    }

    // Fetch steps fresh from DB (idempotent)
    const steps: Step[] = await step.run('fetch-steps', async () => {
      const admin = createAdminClient()
      const { data } = await admin
        .from('be_workflow_steps')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('position')
      return (data ?? []) as Step[]
    })

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i]

      // Update current step in execution log
      if (executionId) {
        await step.run(`update-progress-${i}`, async () => {
          const admin = createAdminClient()
          await admin
            .from('be_workflow_executions')
            .update({ current_step: i })
            .eq('id', executionId)
        })
      }

      if (s.type === 'wait') {
        const duration = stepSleepDuration(s.config)
        await step.sleep(`wait-${s.id}`, duration)
        continue
      }

      if (s.type === 'action') {
        await step.run(`action-${s.id}`, async () => {
          await executeAction(s, ctx, contact, templateVars)
        })
      }
    }

    // Mark completed
    if (executionId) {
      await step.run('mark-completed', async () => {
        const admin = createAdminClient()
        await admin
          .from('be_workflow_executions')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', executionId)
      })
    }
  }
)
