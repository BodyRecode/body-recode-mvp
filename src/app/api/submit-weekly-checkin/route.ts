import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCFWSSystemPrompt, buildCFWSUserPrompt, WeeklyCheckInPair } from '@/lib/cfws-prompt'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  const { clientId, weekNumber, formType, responses } = await request.json()

  if (!clientId || !weekNumber || !formType || !responses) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify client exists — also fetch IEEP status
  const { data: client } = await admin
    .from('clients')
    .select('id, name, ieep_complete')
    .eq('id', clientId)
    .single()

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

  // If this is Form B, check if Form A exists for this week — if so, generate CFWS
  if (formType === 'B') {
    const { data: formA } = await admin
      .from('weekly_checkins')
      .select('responses')
      .eq('client_id', clientId)
      .eq('week_number', weekNumber)
      .eq('form_type', 'A')
      .single()

    if (formA) {
      // Fire-and-forget CFWS generation
      generateCFWS(admin, client, weekNumber, formA.responses as Record<string, string>, responses).catch(
        err => console.error('CFWS generation error:', err)
      )
    }
  }

  return NextResponse.json({ success: true })
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
    .limit(6) // Get enough to find 2 complete A+B pairs

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
    ...cfwsData,
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
