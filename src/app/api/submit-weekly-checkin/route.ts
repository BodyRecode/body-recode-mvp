import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCFWSSystemPrompt, buildCFWSUserPrompt, WeeklyCheckInPair } from '@/lib/cfws-prompt'
import { emailSignature } from '@/lib/email-signature'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  const { clientId, weekNumber, formType, responses } = await request.json()

  if (!clientId || !weekNumber || !formType || !responses) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify client exists
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  // Check not already submitted
  const { data: existing } = await admin
    .from('weekly_checkins')
    .select('id')
    .eq('client_id', clientId)
    .eq('week_number', weekNumber)
    .eq('form_type', formType)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Already submitted for this week' }, { status: 409 })
  }

  // Save check-in
  const { error: insertError } = await admin
    .from('weekly_checkins')
    .insert({
      client_id: clientId,
      week_number: weekNumber,
      form_type: formType,
      responses,
    })

  if (insertError) {
    console.error('Check-in insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 })
  }

  // Send notifications (fire-and-forget)
  sendNotifications(client, weekNumber, formType).catch(err =>
    console.error('Notification error:', err)
  )

  // Generate CFWS using the most recent A and B available (may be from different weeks)
  const otherFormType = formType === 'A' ? 'B' : 'A'
  const { data: otherForm } = await admin
    .from('weekly_checkins')
    .select('responses, week_number')
    .eq('client_id', clientId)
    .eq('form_type', otherFormType)
    .order('week_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (otherForm) {
    const formAResponses = formType === 'A' ? responses : (otherForm.responses as Record<string, string>)
    const formBResponses = formType === 'B' ? responses : (otherForm.responses as Record<string, string>)
    generateCFWS(admin, client, weekNumber, formAResponses, formBResponses).catch(
      err => console.error('CFWS generation error:', err)
    )
  }

  return NextResponse.json({ success: true })
}

async function sendNotifications(
  client: { id: string; name: string; email?: string },
  weekNumber: number,
  formType: string
) {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const firstName = client.name.split(' ')[0]
  const clientUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients/${client.id}`
  const formLabel = formType === 'A' ? 'Form A — Training, load, and recovery' : 'Form B — Regulation, lifestyle, and context'

  // Notify Kade
  await resend.emails.send({
    from: 'Body Recode <kade@bodyrecode.au>',
    to: 'kade@bodyrecode.au',
    subject: `${client.name} — Week ${weekNumber} check-in submitted`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e7e5e4;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #f5f5f4;">
              <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#1c1917;">${client.name} — Week ${weekNumber}</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#57534e;line-height:1.6;">${formLabel} has been submitted. A CFWS will be generated shortly.</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:12px;background:#1c1917;">
                    <a href="${clientUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">
                      View client profile
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  })

  // Confirm to client
  if (client.email) {
    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: client.email,
      subject: `Check-in received — Week ${weekNumber}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e7e5e4;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #f5f5f4;">
              <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#1c1917;line-height:1.3;">Got it, ${firstName}.</h1>
              <p style="margin:0 0 0;font-size:15px;color:#57534e;line-height:1.6;">
                Your Week ${weekNumber} check-in has been received. I'll review it and it'll inform your coaching this week.
              </p>
              ${emailSignature()}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f5f5f4;">
              <p style="margin:0;font-size:12px;color:#a8a29e;">Body Recode Performance Coaching</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })
  }
}

async function generateCFWS(
  admin: ReturnType<typeof createAdminClient>,
  client: { id: string; name: string },
  weekNumber: number,
  formAResponses: Record<string, string>,
  formBResponses: Record<string, string>
) {
  // Get last 2 resolved weeks for rolling window (excluding current)
  const { data: recentCheckins } = await admin
    .from('weekly_checkins')
    .select('week_number, form_type, responses')
    .eq('client_id', client.id)
    .lt('week_number', weekNumber)
    .order('week_number', { ascending: false })
    .limit(6)

  // Build rolling window from recent complete pairs
  const recentPairs: WeeklyCheckInPair[] = []
  if (recentCheckins) {
    const byWeek = new Map<number, { A?: Record<string, string>; B?: Record<string, string> }>()
    for (const ci of recentCheckins) {
      const wk = ci.week_number
      if (!byWeek.has(wk)) byWeek.set(wk, {})
      const entry = byWeek.get(wk)!
      if (ci.form_type === 'A') entry.A = ci.responses as Record<string, string>
      if (ci.form_type === 'B') entry.B = ci.responses as Record<string, string>
    }
    for (const [wk, pair] of byWeek) {
      if (pair.A && pair.B && recentPairs.length < 2) {
        recentPairs.push({ weekNumber: wk, formA: pair.A, formB: pair.B })
      }
    }
  }

  const currentPair: WeeklyCheckInPair = {
    weekNumber,
    formA: formAResponses,
    formB: formBResponses,
  }

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    system: buildCFWSSystemPrompt(),
    messages: [{ role: 'user', content: buildCFWSUserPrompt(client.name, currentPair, recentPairs) }],
  })

  const content = message.content[0]
  if (content.type !== 'text') return

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return

  const cfwsRaw = JSON.parse(jsonMatch[0])
  const cfwsData = stripEmDashes(cfwsRaw)

  // Archive any existing CFWS for this week (in case of regeneration)
  await admin
    .from('cfws')
    .update({ is_archived: true })
    .eq('client_id', client.id)
    .eq('week_number', weekNumber)

  await admin.from('cfws').insert({
    client_id: client.id,
    week_number: weekNumber,
    rolling_window_weeks: [weekNumber, ...recentPairs.map(p => p.weekNumber)],
    ...(cfwsData as Record<string, unknown>),
  })
}

function stripEmDashes(obj: unknown): unknown {
  if (typeof obj === 'string') return obj.replace(/\s*—\s*/g, ', ')
  if (Array.isArray(obj)) return obj.map(stripEmDashes)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, stripEmDashes(v)]))
  }
  return obj
}
