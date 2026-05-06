import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCFWSSystemPrompt, buildCFWSUserPrompt, WeeklyCheckInPair } from '@/lib/cfws-prompt'
import { darkEmailSignature } from '@/lib/email-signature'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'

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
    await generateCFWS(admin, client, weekNumber, formAResponses, formBResponses).catch(
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
  const formLabel = formType === 'A' ? 'Form A (Experience-Forward)' : 'Form B (Pattern-Aware)'

  // Notify Kade
  await resend.emails.send({
    from: 'Body Recode <kade@bodyrecode.au>',
    to: 'kade@bodyrecode.au',
    subject: `${client.name}, Week ${weekNumber} check-in submitted`,
    html: buildCoachNotificationEmail({
      eyebrow: `Week ${weekNumber} Check-In`,
      heading: `${client.name} submitted Week ${weekNumber}`,
      body: `${formLabel} has been submitted. A CFWS will be generated shortly and will surface in their client profile.`,
      ctaLabel: 'View client profile',
      ctaUrl: clientUrl,
    }),
  })

  // Confirm to client
  if (client.email) {
    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: client.email,
      subject: `Week ${weekNumber} check-in received`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px;">
    <div style="margin-bottom:40px;">
      <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
    </div>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Hi ${firstName},</p>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 20px;">Your Week ${weekNumber} check-in has been received. I'll review it and it'll inform your coaching this week.</p>
    ${darkEmailSignature()}
  </div>
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
