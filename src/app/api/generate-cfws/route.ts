import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCFWSSystemPrompt, buildCFWSUserPrompt, WeeklyCheckInPair } from '@/lib/cfws-prompt'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { withTemporalContext } from '@/lib/temporal-context'

export const maxDuration = 300

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

  // Pull the active CFFS so the CFWS can anchor its readiness ratings to the
  // established baseline. Without this the prompt has no reference and tends
  // to over-call Amber on single-week deviations (see readiness-monitor.ts
  // notes on Ruby-Cate's W2 CFWS, 2026-05-18).
  const { data: cffsRows } = await admin
    .from('cffs')
    .select('body_state_classification, resolution_state, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour, capacity_constraints_and_guardrails, risk_flags_and_watch_items, generated_at, is_archived')
    .eq('client_id', client_id)
    .eq('is_archived', false)
    .order('generated_at', { ascending: false })
    .limit(1)
  const cffsBaseline = cffsRows?.[0] ?? null

  // Generation + parse retry loop + truncation guard (2026-07-11), matching
  // generate-cffs. The weekly synthesis is a large 14-field JSON; the old
  // single-shot 6000-token cap could truncate it mid-object so
  // extractFirstJsonObject returned null and the coach saw "Could not parse
  // CFWS". Now: 12k cap, explicit max_tokens truncation detection, empty
  // content-block guard, resolution_state present check, 3 attempts.
  const MAX_TOKENS = 12000
  let parsed: Record<string, unknown> | null = null
  let lastError = 'unknown error'

  for (let attempt = 1; attempt <= 3; attempt++) {
    let message
    try {
      message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: MAX_TOKENS,
        system: withTemporalContext(buildCFWSSystemPrompt()),
        messages: [{ role: 'user', content: buildCFWSUserPrompt(client.name, currentPair, recentPairs, cffsBaseline) }],
      })
    } catch (err) {
      lastError = `AI error: ${err instanceof Error ? err.message : String(err)}`
      console.error(`[CFWS] Anthropic API error (attempt ${attempt}/3):`, lastError)
      continue
    }

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      lastError = `AI returned no text content (stop_reason=${message.stop_reason})`
      console.warn(`[CFWS] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    console.log(`[CFWS] attempt ${attempt}/3 raw response (stop_reason=${message.stop_reason}):`, textBlock.text.slice(0, 200))

    if (message.stop_reason === 'max_tokens') {
      lastError = `AI output was truncated at the ${MAX_TOKENS}-token limit`
      console.warn(`[CFWS] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    const jsonText = extractFirstJsonObject(textBlock.text)
    if (!jsonText) {
      lastError = `Could not locate a JSON object in AI output: ${textBlock.text.slice(0, 200)}`
      console.warn(`[CFWS] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    let candidate: Record<string, unknown>
    try {
      candidate = JSON.parse(jsonText)
    } catch (err) {
      lastError = `JSON parse failed: ${(err as Error).message}`
      console.warn(`[CFWS] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    if (typeof candidate.resolution_state !== 'string' || !candidate.resolution_state.trim()) {
      lastError = 'AI output missing resolution_state'
      console.warn(`[CFWS] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    parsed = candidate
    break
  }

  if (!parsed) {
    console.error('[CFWS] generation failed after 3 attempts:', lastError)
    return NextResponse.json(
      { error: `CFWS generation failed after 3 attempts (${lastError}). Please try again.` },
      { status: 500 }
    )
  }

  const cfwsData = stripEmDashes(parsed) as Record<string, unknown>

  await admin.from('cfws').update({ is_archived: true }).eq('client_id', client_id).eq('week_number', week_number)

  const { error: insertError } = await admin.from('cfws').insert({
    client_id,
    week_number,
    rolling_window_weeks: [week_number, ...recentPairs.map(p => p.weekNumber)],
    ...(cfwsData as Record<string, unknown>),
  })

  if (insertError) {
    console.error('[CFWS] failed to save CFWS:', insertError.message)
    return NextResponse.json({ error: `Failed to save CFWS: ${insertError.message}` }, { status: 500 })
  }

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
