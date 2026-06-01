import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildTrajectoryReadingSystemPrompt,
  buildTrajectoryReadingUserPrompt,
  type TrajectoryReadingFRContext,
  type TrajectoryReadingBlockContext,
  type TrajectoryReadingWeek,
} from '@/lib/client-trajectory-reading-prompt'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'

export const maxDuration = 300

function stripEmDashes<T>(value: T): T {
  if (typeof value === 'string') return value.replace(/—/g, ', ') as T
  if (Array.isArray(value)) return value.map(stripEmDashes) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripEmDashes(v)])
    ) as T
  }
  return value
}

/** Week number of `when` relative to the coaching start (week 1 = first 7 days). */
function weekNumberAt(coachingStartedAt: string, when: Date): number {
  const start = new Date(coachingStartedAt)
  const diffDays = Math.floor((when.getTime() - start.getTime()) / 86_400_000)
  return Math.floor(diffDays / 7) + 1
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { program_id } = await request.json()
  if (!program_id) {
    return NextResponse.json({ error: 'Missing program_id' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: program, error: programErr } = await admin
    .from('programs')
    .select('*')
    .eq('id', program_id)
    .single()

  if (programErr || !program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  }

  const { data: client, error: clientErr } = await admin
    .from('clients')
    .select('id, name, coaching_started_at')
    .eq('id', program.client_id)
    .single()

  if (clientErr || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  if (!client.coaching_started_at) {
    return NextResponse.json(
      { error: 'Client has no coaching start date, so the block week range cannot be computed.' },
      { status: 400 }
    )
  }
  if (!program.generated_at) {
    return NextResponse.json(
      { error: 'Program has no generated_at, so the block week range cannot be computed.' },
      { status: 400 }
    )
  }

  // Resolve the block's week range. The reading reads every weekly synthesis
  // from the week the block started through to the current week (capped at the
  // block's nominal end).
  const blockStartWeek = weekNumberAt(client.coaching_started_at, new Date(program.generated_at))
  const currentWeek = getWeekNumber(client.coaching_started_at)
  const nominalEndWeek = program.week_duration
    ? blockStartWeek + program.week_duration - 1
    : currentWeek
  const blockEndWeek = Math.max(blockStartWeek, Math.min(currentWeek, nominalEndWeek))

  // Pull the published Foundational Reading for voice continuity.
  const { data: cffsRows } = await admin
    .from('cffs')
    .select('cr_where_you_are, cr_what_your_body_is_telling_us, cr_what_were_focusing_on_first, cr_coach_note, body_state_classification')
    .eq('client_id', client.id)
    .eq('is_archived', false)
    .not('client_reading_published_at', 'is', null)
    .order('client_reading_published_at', { ascending: false })
    .limit(1)

  const frContext: TrajectoryReadingFRContext = cffsRows?.[0] ?? {
    cr_where_you_are: null,
    cr_what_your_body_is_telling_us: null,
    cr_what_were_focusing_on_first: null,
    cr_coach_note: null,
    body_state_classification: null,
  }

  // Pull every non-archived CFWS row in the block's week range, oldest first.
  const { data: cfwsRows, error: cfwsErr } = await admin
    .from('cfws')
    .select('week_number, client_context_snapshot, dominant_weekly_patterns, weekly_capacity_constraints, weekly_risk_flags, weekly_tensions_tradeoffs, closing_weekly_notes, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour')
    .eq('client_id', client.id)
    .eq('is_archived', false)
    .gte('week_number', blockStartWeek)
    .lte('week_number', blockEndWeek)
    .order('week_number', { ascending: true })

  if (cfwsErr) {
    return NextResponse.json({ error: 'Failed to load weekly syntheses' }, { status: 500 })
  }
  if (!cfwsRows || cfwsRows.length === 0) {
    return NextResponse.json(
      { error: `No weekly syntheses (CFWS) found for this block (weeks ${blockStartWeek} to ${blockEndWeek}). Generate weekly check-in syntheses before the trajectory reading.` },
      { status: 400 }
    )
  }

  const weeks = cfwsRows as TrajectoryReadingWeek[]

  const blockContext: TrajectoryReadingBlockContext = {
    block_name: program.block_name,
    progression_phase: program.progression_phase,
    training_goal: program.training_goal,
    week_duration: program.week_duration,
    current_direction: program.current_direction,
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: buildTrajectoryReadingSystemPrompt(),
      messages: [{
        role: 'user',
        content: buildTrajectoryReadingUserPrompt(
          frContext,
          blockContext,
          weeks,
          { name: client.name },
          program.tr_coach_guidance ?? null
        ),
      }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Anthropic API error:', msg)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 })
  }

  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) {
    return NextResponse.json(
      { error: `Could not parse reading. AI returned: ${content.text.slice(0, 120)}` },
      { status: 500 }
    )
  }

  let reading: {
    tr_where_this_block_started?: string
    tr_how_your_signal_moved?: string
    tr_what_held_steady?: string
    tr_what_this_sets_up_next?: string
    tr_coach_note?: string
  }
  try {
    reading = JSON.parse(jsonText)
  } catch {
    return NextResponse.json(
      { error: `JSON parse failed: ${jsonText.slice(0, 120)}` },
      { status: 500 }
    )
  }

  const required = [
    'tr_where_this_block_started',
    'tr_how_your_signal_moved',
    'tr_what_held_steady',
    'tr_what_this_sets_up_next',
    'tr_coach_note',
  ] as const
  for (const key of required) {
    if (!reading[key] || typeof reading[key] !== 'string') {
      return NextResponse.json(
        { error: `Missing or invalid section: ${key}` },
        { status: 500 }
      )
    }
  }

  const cleaned = stripEmDashes(reading)

  // Coach-gated: generate ONLY drafts. Publishing (and the client email) is a
  // separate, deliberate step via /api/publish-trajectory-reading. Regenerating
  // a published reading preserves its published_at so it stays live.
  const { data: updated, error: updateErr } = await admin
    .from('programs')
    .update({
      tr_where_this_block_started: cleaned.tr_where_this_block_started,
      tr_how_your_signal_moved: cleaned.tr_how_your_signal_moved,
      tr_what_held_steady: cleaned.tr_what_held_steady,
      tr_what_this_sets_up_next: cleaned.tr_what_this_sets_up_next,
      tr_coach_note: cleaned.tr_coach_note,
      trajectory_reading_generated_at: new Date().toISOString(),
    })
    .eq('id', program_id)
    .select()
    .single()

  if (updateErr) {
    console.error('Failed to save trajectory reading:', updateErr)
    return NextResponse.json({ error: 'Failed to save reading' }, { status: 500 })
  }

  return NextResponse.json({ program: updated, weeksRead: weeks.length, blockStartWeek, blockEndWeek })
}
