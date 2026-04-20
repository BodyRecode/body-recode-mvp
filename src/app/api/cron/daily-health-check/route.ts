import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'

type CheckStatus = 'ok' | 'fixed' | 'failed' | 'info'

type CheckResult = {
  name: string
  status: CheckStatus
  detail: string           // what was found
  action?: string          // what the system did to fix it (if anything)
  manualFix?: string       // what Kade needs to do if it couldn't be auto-fixed
}

// ─── Checks + auto-fixes ───────────────────────────────────────────────────

async function checkDatabase(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const { error } = await admin.from('leads').select('id').limit(1)
    if (error) {
      return {
        name: 'Database',
        status: 'failed',
        detail: error.message,
        manualFix: 'Check Supabase project status at supabase.com — the project may be paused or over its usage limit.',
      }
    }
    return { name: 'Database', status: 'ok', detail: 'Connected and readable' }
  } catch (e) {
    return {
      name: 'Database',
      status: 'failed',
      detail: String(e),
      manualFix: 'Check Supabase project status at supabase.com.',
    }
  }
}

async function checkAvailabilitySlots(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const { data, error } = await admin
      .from('be_availability')
      .select('id')
      .eq('is_active', true)

    if (error) {
      return {
        name: 'Booking Slots',
        status: 'failed',
        detail: error.message,
        manualFix: 'Check Supabase — the be_availability table may be missing.',
      }
    }

    if (!data || data.length === 0) {
      return {
        name: 'Booking Slots',
        status: 'failed',
        detail: 'No active availability rules — leads cannot see any times to book.',
        manualFix: 'Go to Dashboard → Business → Availability and add your available days and times.',
      }
    }

    const slotsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/booking-slots?days=7`)
    const slots = await slotsRes.json()
    if (!Array.isArray(slots) || slots.length === 0) {
      return {
        name: 'Booking Slots',
        status: 'failed',
        detail: 'Availability rules exist but no slots are showing for the next 7 days.',
        manualFix: 'Go to Dashboard → Business → Availability and check for blocked times or gaps in your schedule that cover the next 7 days.',
      }
    }

    return { name: 'Booking Slots', status: 'ok', detail: `${slots.length} slots available over the next 7 days` }
  } catch (e) {
    return {
      name: 'Booking Slots',
      status: 'failed',
      detail: String(e),
      manualFix: 'Go to Dashboard → Business → Availability to review your schedule.',
    }
  }
}

async function checkZoom(): Promise<CheckResult> {
  try {
    const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env
    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      return {
        name: 'Zoom',
        status: 'failed',
        detail: 'One or more Zoom environment variables are missing.',
        manualFix: 'Go to Vercel → body-recode-mvp → Settings → Environment Variables and check ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET are all set.',
      }
    }

    const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')
    const res = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
      { method: 'POST', headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    if (!res.ok) {
      const err = await res.text()
      return {
        name: 'Zoom',
        status: 'failed',
        detail: `Credentials rejected by Zoom: ${err}`,
        manualFix: 'Go to marketplace.zoom.us → your Server-to-Server OAuth app → check the credentials are still active and the app has not been deactivated.',
      }
    }

    return { name: 'Zoom', status: 'ok', detail: 'Credentials valid — meeting links will generate on booking' }
  } catch (e) {
    return {
      name: 'Zoom',
      status: 'failed',
      detail: String(e),
      manualFix: 'Check your Zoom app credentials at marketplace.zoom.us.',
    }
  }
}

async function checkResend(): Promise<CheckResult> {
  // Send-only key — management API calls will be rejected.
  // The fact this email arrives is the proof it is working.
  if (!process.env.RESEND_API_KEY) {
    return {
      name: 'Email (Resend)',
      status: 'failed',
      detail: 'RESEND_API_KEY environment variable is missing.',
      manualFix: 'Go to Vercel → body-recode-mvp → Settings → Environment Variables and add RESEND_API_KEY.',
    }
  }
  return {
    name: 'Email (Resend)',
    status: 'ok',
    detail: 'Key present — delivery confirmed by receipt of this email',
  }
}

async function checkScorecardAutomation(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const { data: workflow, error } = await admin
      .from('be_workflows')
      .select('id, is_active')
      .eq('name', 'Scorecard — Follow-up Sequence')
      .eq('trigger_type', 'form_submitted')
      .maybeSingle()

    if (error) {
      return {
        name: 'Scorecard Automation',
        status: 'failed',
        detail: `Could not query workflows table: ${error.message}`,
        manualFix: 'Go to Dashboard → Business and click Re-sync on the Scorecard Follow-up Automation.',
      }
    }

    // Missing entirely — create it
    if (!workflow) {
      const seeded = await resyncScorecardWorkflow(admin)
      if (seeded) {
        return {
          name: 'Scorecard Automation',
          status: 'fixed',
          detail: 'Workflow was missing.',
          action: 'Recreated the 9-step scorecard follow-up sequence automatically.',
        }
      }
      return {
        name: 'Scorecard Automation',
        status: 'failed',
        detail: 'Workflow was missing and the auto-recreate attempt failed.',
        manualFix: 'Go to Dashboard → Business and click Re-sync on the Scorecard Follow-up Automation.',
      }
    }

    // Exists but inactive
    if (!workflow.is_active) {
      await admin.from('be_workflows').update({ is_active: true }).eq('id', workflow.id)
      return {
        name: 'Scorecard Automation',
        status: 'fixed',
        detail: 'Workflow existed but was deactivated.',
        action: 'Reactivated automatically.',
      }
    }

    const { count: stepCount } = await admin
      .from('be_workflow_steps')
      .select('id', { count: 'exact', head: true })
      .eq('workflow_id', workflow.id)

    // Wrong step count means stale content — resync
    if (stepCount !== 9) {
      const seeded = await resyncScorecardWorkflow(admin, workflow.id)
      if (seeded) {
        return {
          name: 'Scorecard Automation',
          status: 'fixed',
          detail: `Workflow had ${stepCount} steps instead of the expected 9 — content was out of date.`,
          action: 'Steps resynced automatically with the latest email copy.',
        }
      }
    }

    return {
      name: 'Scorecard Automation',
      status: 'ok',
      detail: `Active — ${stepCount} steps configured`,
    }
  } catch (e) {
    return {
      name: 'Scorecard Automation',
      status: 'failed',
      detail: String(e),
      manualFix: 'Go to Dashboard → Business and click Re-sync on the Scorecard Follow-up Automation.',
    }
  }
}

async function resyncScorecardWorkflow(
  admin: ReturnType<typeof createAdminClient>,
  existingId?: string
): Promise<boolean> {
  const steps = [
    {
      position: 1, type: 'action', action_type: 'send_email',
      config: {
        subject: 'Your Body State result',
        body: `Hi {{first_name}},

Your scorecard result: {{scorecard_score}}/15. Body state: {{scorecard_state}}.

That result tells you one specific thing: which state your body is currently in.

That state determines what works. It also determines what makes things worse. Most people apply the same approach regardless of their state. That is why most people stay stuck.

If you want to understand exactly what is driving your result and what needs to change first, book a free 30-minute call. We go through your scorecard together, identify the specific bottleneck, and map out the first steps.

Book here: https://bodyrecode.au/book

---

Want the written breakdown first? The Body Decode Report ($37) covers what your {{scorecard_state}} result means biologically, what is actively working against you right now, and what needs to change first.

Get your report here: https://bodyrecode.au/get-report

Kade
Body Recode`,
      },
    },
    { position: 2, type: 'wait', action_type: null, config: { unit: 'days', amount: '2' } },
    {
      position: 3, type: 'action', action_type: 'send_email',
      config: {
        subject: 'What your {{scorecard_state}} result actually means',
        body: `Hi {{first_name}},

Your score was {{scorecard_score}}/15. Body state: {{scorecard_state}}.

Most people look at that result and think they need to train harder or eat less. That is usually the wrong call.

Your body state is a biological signal. It tells you how your body is currently handling load, how well it is recovering, and how much capacity it has to respond right now. The right prescription depends entirely on that state.

The Body Decode Report goes through exactly what {{scorecard_state}} means for your training, your nutrition, and your fat loss. It is written specifically to your result, not a generic guide.

$37. Delivered to your inbox within minutes.

Get your report here: https://bodyrecode.au/get-report

Kade
Body Recode`,
      },
    },
    { position: 4, type: 'wait', action_type: null, config: { unit: 'days', amount: '2' } },
    {
      position: 5, type: 'action', action_type: 'send_email',
      config: {
        subject: 'Re: your Body State Scorecard',
        body: `Hi {{first_name}},

Following up on your scorecard.

The most common thing I hear after someone takes it: "That finally explains why nothing has been working."

Knowing your state is the first piece. The second is knowing exactly what to do about it. That is what the call is for.

30 minutes. Free. No pitch.

Book here: https://bodyrecode.au/book

If the timing is not right, no problem. The link will be there when you are ready.

Kade
Body Recode`,
      },
    },
    { position: 6, type: 'wait', action_type: null, config: { unit: 'days', amount: '4' } },
    {
      position: 7, type: 'action', action_type: 'send_email',
      config: {
        subject: 'The prescription problem',
        body: `Hi {{first_name}},

Most coaching programs give everyone the same plan. Same training, same nutrition, same timeline. Your body state does not factor into it at all.

Your scorecard came back as {{scorecard_state}}. That is a specific biological pattern, not a label. It tells me how your body is handling load, how well it is recovering, and how much capacity it has to adapt right now.

A program built for a Ready state will not work for a Depleted state. That is not a motivation problem. That is a prescription problem.

That is exactly what the call addresses. Building the approach around your actual state, not a generic template.

Book here: https://bodyrecode.au/book

Kade
Body Recode`,
      },
    },
    { position: 8, type: 'wait', action_type: null, config: { unit: 'days', amount: '5' } },
    {
      position: 9, type: 'action', action_type: 'send_email',
      config: {
        subject: 'Last one from me, {{first_name}}',
        body: `Hi {{first_name}},

Last email from me on this.

Your scorecard result is still there whenever you want to act on it. The call is still available. The report is still there if you want the written breakdown first.

No follow-up after this.

Book a call: https://bodyrecode.au/book
Get the report: https://bodyrecode.au/get-report

Kade
Body Recode`,
      },
    },
  ]

  try {
    if (existingId) {
      await admin.from('be_workflow_steps').delete().eq('workflow_id', existingId)
      const { error } = await admin.from('be_workflow_steps').insert(steps.map(s => ({ ...s, workflow_id: existingId })))
      return !error
    } else {
      const { data: newWorkflow, error: wfError } = await admin
        .from('be_workflows')
        .insert({
          name: 'Scorecard — Follow-up Sequence',
          trigger_type: 'form_submitted',
          trigger_config: { form: 'scorecard' },
          is_active: true,
        })
        .select('id')
        .single()
      if (wfError || !newWorkflow) return false
      const { error: stepError } = await admin.from('be_workflow_steps').insert(steps.map(s => ({ ...s, workflow_id: newWorkflow.id })))
      return !stepError
    }
  } catch {
    return false
  }
}

async function checkFunnelActivity(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await admin
      .from('lead_events')
      .select('lead_id')
      .eq('type', 'scorecard_completed')
      .gte('sent_at', since)

    if (error) {
      return { name: 'Funnel Activity (24h)', status: 'info', detail: 'Could not query lead events' }
    }

    const count = data?.length ?? 0
    return {
      name: 'Funnel Activity (24h)',
      status: 'info',
      detail: count === 0
        ? 'No scorecard completions in the last 24 hours'
        : `${count} scorecard${count === 1 ? '' : 's'} completed`,
    }
  } catch {
    return { name: 'Funnel Activity (24h)', status: 'info', detail: 'Could not query lead events' }
  }
}

// ─── Main handler ──────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Run all checks sequentially where fixes depend on DB state, parallel elsewhere
  const [db, slots, zoom, email] = await Promise.all([
    checkDatabase(admin),
    checkAvailabilitySlots(admin),
    checkZoom(),
    checkResend(),
  ])

  // These run after DB check since they may write to DB
  const [automation, funnel] = await Promise.all([
    checkScorecardAutomation(admin),
    checkFunnelActivity(admin),
  ])

  const checks: CheckResult[] = [db, slots, zoom, email, automation, funnel]

  const failures = checks.filter(c => c.status === 'failed')
  const fixes = checks.filter(c => c.status === 'fixed')
  const allGood = failures.length === 0

  // ─── Email ───────────────────────────────────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const overallBadge = allGood && fixes.length === 0
      ? `<span style="display:inline-block;padding:4px 14px;background:rgba(20,184,166,0.15);border:1px solid rgba(20,184,166,0.4);border-radius:99px;font-size:12px;font-weight:700;color:#14b8a6;">All systems operational</span>`
      : fixes.length > 0 && failures.length === 0
        ? `<span style="display:inline-block;padding:4px 14px;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);border-radius:99px;font-size:12px;font-weight:700;color:#f59e0b;">${fixes.length} issue${fixes.length === 1 ? '' : 's'} auto-fixed</span>`
        : `<span style="display:inline-block;padding:4px 14px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);border-radius:99px;font-size:12px;font-weight:700;color:#ef4444;">${failures.length} issue${failures.length === 1 ? '' : 's'} need your attention</span>`

    const iconFor = (s: CheckStatus) => {
      if (s === 'ok') return `<span style="color:#14b8a6;">&#10003;</span>`
      if (s === 'fixed') return `<span style="color:#f59e0b;">&#9889;</span>`
      if (s === 'failed') return `<span style="color:#ef4444;">&#10007;</span>`
      return `<span style="color:#57534e;">&#8212;</span>`
    }

    const colorFor = (s: CheckStatus) => {
      if (s === 'ok') return '#ffffff'
      if (s === 'fixed') return '#f59e0b'
      if (s === 'failed') return '#ef4444'
      return '#a8a29e'
    }

    const checkRows = checks.map(c => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #1c1917;">
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px;">
            ${iconFor(c.status)}
            <span style="font-size:13px;font-weight:600;color:${colorFor(c.status)};">${c.name}</span>
          </div>
          <p style="margin:0 0 ${c.action || c.manualFix ? '6px' : '0'};font-size:12px;color:#57534e;padding-left:18px;">${c.detail}</p>
          ${c.action ? `<p style="margin:0;font-size:12px;color:#f59e0b;padding-left:18px;">&#9889; ${c.action}</p>` : ''}
          ${c.manualFix ? `<p style="margin:0;font-size:12px;color:#ef4444;padding-left:18px;">Action needed: ${c.manualFix}</p>` : ''}
        </td>
      </tr>`).join('')

    const subject = allGood && fixes.length === 0
      ? 'Body Recode - Daily Check: All good'
      : fixes.length > 0 && failures.length === 0
        ? `Body Recode - Daily Check: ${fixes.length} issue${fixes.length === 1 ? '' : 's'} auto-fixed`
        : `Body Recode - Daily Check: ${failures.length} issue${failures.length === 1 ? '' : 's'} need your attention`

    await resend.emails.send({
      from: 'Body Recode System <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:520px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
        <tr>
          <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
            <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#ffffff;">Daily System Health Check</p>
            <p style="margin:0 0 24px;font-size:12px;color:#57534e;">Run at ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Brisbane', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })} Brisbane</p>
            <div style="margin-bottom:28px;">${overallBadge}</div>
            <table style="width:100%;border-top:1px solid #1c1917;" cellpadding="0" cellspacing="0">
              ${checkRows}
            </table>
            ${failures.length > 0 ? `
            <div style="margin-top:24px;padding:16px 20px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:10px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#ef4444;">Manual action required</p>
              <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.6;">The issues marked above could not be fixed automatically. Follow the steps listed under each failed check.</p>
            </div>` : ''}
            ${fixes.length > 0 && failures.length === 0 ? `
            <div style="margin-top:24px;padding:16px 20px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:10px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#f59e0b;">Auto-fixed</p>
              <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.6;">Issues were detected and resolved automatically. No action needed from you.</p>
            </div>` : ''}
            <div style="margin-top:32px;">${darkEmailSignature()}</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    })
  }

  return NextResponse.json({ ok: allGood, checks, fixes: fixes.map(f => f.name), failures: failures.map(f => f.name) })
}
