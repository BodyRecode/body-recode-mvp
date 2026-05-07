import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCFWSSystemPrompt, buildCFWSUserPrompt, WeeklyCheckInPair } from '@/lib/cfws-prompt'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { client_id, week_number } = await request.json()
  if (!client_id || !week_number) {
    return NextResponse.json({ error: 'Missing client_id or week_number' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', client_id)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Fetch Form A and B for this week
  const { data: checkins } = await admin
    .from('weekly_checkins')
    .select('form_type, responses')
    .eq('client_id', client_id)
    .eq('week_number', week_number)

  const formA = checkins?.find(c => c.form_type === 'A')?.responses as Record<string, string> | undefined
  const formB = checkins?.find(c => c.form_type === 'B')?.responses as Record<string, string> | undefined

  if (!formA || !formB) {
    return NextResponse.json({ error: 'Both Form A and Form B must be submitted for this week' }, { status: 400 })
  }

  // Get last 2 complete pairs for rolling window
  const { data: recentCheckins } = await admin
    .from('weekly_checkins')
    .select('week_number, form_type, responses')
    .eq('client_id', client_id)
    .lt('week_number', week_number)
    .order('week_number', { ascending: false })
    .limit(6)

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

  const currentPair: WeeklyCheckInPair = { weekNumber: week_number, formA, formB }

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: buildCFWSSystemPrompt(),
      messages: [{ role: 'user', content: buildCFWSUserPrompt(client.name, currentPair, recentPairs) }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = message.content[0]
  if (content.type !== 'text') return NextResponse.json({ error: 'Unexpected AI response' }, { status: 500 })

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Could not parse CFWS from AI response' }, { status: 500 })

  let cfwsData
  try {
    cfwsData = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'JSON parse failed' }, { status: 500 })
  }

  cfwsData = stripEmDashes(cfwsData)

  await admin.from('cfws').update({ is_archived: true }).eq('client_id', client_id).eq('week_number', week_number)

  const { error: insertError } = await admin.from('cfws').insert({
    client_id,
    week_number,
    rolling_window_weeks: [week_number, ...recentPairs.map(p => p.weekNumber)],
    ...(cfwsData as Record<string, unknown>),
  })

  if (insertError) return NextResponse.json({ error: 'Failed to save CFWS' }, { status: 500 })

  return NextResponse.json({ success: true })
}

function stripEmDashes(obj: unknown): unknown {
  if (typeof obj === 'string') return obj.replace(/\s*—\s*/g, ', ')
  if (Array.isArray(obj)) return obj.map(stripEmDashes)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, stripEmDashes(v)]))
  }
  return obj
}
