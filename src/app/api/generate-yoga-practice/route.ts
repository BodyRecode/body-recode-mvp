import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractFirstJsonObject } from '@/lib/extract-json'
import {
  intensityCeilingForState,
  intensityAtOrBelow,
  filterContraindicated,
  practiceArc,
  clampYogaSequence,
  RRSLevel,
  YogaIntensity,
  YogaSequence,
} from '@/lib/yoga-doctrine'
import {
  buildYogaSystemPrompt,
  buildYogaUserPrompt,
  YogaMovementRow,
} from '@/lib/yoga-prompt'

export const maxDuration = 300

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

type LibraryRow = YogaMovementRow & { id: string }

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const {
    client_id,
    block_name = 'Yoga Practice',
    target_minutes = 45,
    // RRS execution level 0-4. Defaults to standard (3) until wired to the
    // recovery state machine. Determines the intensity ceiling.
    rrs_level = 3,
    contraindications = [],
    body_state_context = null,
    coach_guidance = null,
  } = body

  if (!client_id) {
    return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', client_id)
    .maybeSingle()
  if (clientError || !client) {
    return NextResponse.json({ error: `Client not found (${clientError?.message ?? 'none'})` }, { status: 404 })
  }

  // Recovery state -> intensity ceiling (hard cap).
  const level = (Math.max(0, Math.min(4, Number(rrs_level))) as RRSLevel)
  const ceiling: YogaIntensity = intensityCeilingForState(level)

  // Fetch the yoga library, then apply the two hard floors in code:
  // intensity ceiling and client contraindications.
  const { data: libRaw, error: libError } = await admin
    .from('yoga_movements')
    .select('id, name, sanskrit_name, family, intensity, level, target_regions, weight_bearing, props, contraindications, hold_style, default_hold_seconds, default_breaths, breath_cue, cue')
    .eq('is_active', true)
  if (libError || !libRaw || libRaw.length === 0) {
    return NextResponse.json({ error: 'Yoga library is empty or unavailable. Seed yoga_movements first.' }, { status: 400 })
  }

  const library = libRaw as LibraryRow[]
  const withinCeiling = library.filter((p) =>
    intensityAtOrBelow(p.intensity as YogaIntensity, ceiling),
  )
  const available = filterContraindicated(withinCeiling, contraindications as string[])

  if (available.length === 0) {
    return NextResponse.json({ error: 'No poses available after applying state ceiling and contraindications.' }, { status: 400 })
  }

  const arc = practiceArc(ceiling)

  // Generate via Claude (Haiku, matching the strength engine's speed choice).
  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: buildYogaSystemPrompt(),
      messages: [{
        role: 'user',
        content: buildYogaUserPrompt(
          client.name,
          ceiling,
          arc,
          body_state_context,
          available as YogaMovementRow[],
          Number(target_minutes),
          coach_guidance,
        ),
      }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 })
  }

  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) {
    return NextResponse.json({ error: `Could not parse practice — AI returned: ${content.text.slice(0, 200)}` }, { status: 500 })
  }

  let parsed: YogaSequence
  try {
    parsed = JSON.parse(jsonText) as YogaSequence
  } catch {
    return NextResponse.json({ error: `JSON parse failed: ${jsonText.slice(0, 120)}` }, { status: 500 })
  }

  // Enforcement: allowed poses only (state ceiling + contraindications),
  // bilateral symmetry, closing rest.
  const { sequence, notes } = clampYogaSequence(parsed, available.map((p) => p.name))

  // Enrich poses with sanskrit names from the library for the review display.
  const sanskritByName = new Map(
    available.map((p) => [p.name.toLowerCase().trim(), p.sanskrit_name]),
  )
  const enrichedSegments = sequence.segments.map((seg) => ({
    key: seg.key,
    label: seg.label,
    poses: seg.poses.map((pose) => ({
      name: pose.name,
      sanskrit_name: sanskritByName.get(pose.name.toLowerCase().trim()) ?? null,
      side: pose.side ?? null,
      hold_seconds: pose.hold_seconds ?? null,
      breaths: pose.breaths ?? null,
      cue: pose.cue ?? null,
    })),
  }))
  const poseCount = enrichedSegments.reduce((n, s) => n + s.poses.length, 0)

  // Persist into programs.sessions JSONB (the production model), tagged
  // modality = 'yoga'. The strength-shaped NOT NULL columns get neutral
  // placeholders; they are ignored for yoga and exist only to satisfy the
  // current schema. (Phase: generalise these to nullable later.)
  const yogaSessions = [{
    day_label: sequence.practice_name,
    skeleton: 'Yoga Practice',
    modality: 'yoga',
    intention: sequence.intention,
    summary: sequence.summary ?? null,
    ceiling,
    segments: enrichedSegments,
  }]

  const { data: program, error: progErr } = await admin
    .from('programs')
    .insert({
      client_id,
      block_name,
      modality: 'yoga',
      progression_phase: 'restoration',
      training_goal: 'capacity',
      training_frequency: 2,
      training_age: 'beginner',
      week_duration: 4,
      equipment_access: [],
      sessions: yogaSessions,
      weekly_pattern_summary: notes.length ? notes.join(' ') : null,
      // Coach-gated: created as a draft. Not visible to the client until the
      // coach publishes (see /api/publish-yoga-practice).
      status: 'draft',
      is_active: false,
    })
    .select('id')
    .single()
  if (progErr || !program) {
    return NextResponse.json({ error: `Failed to save practice: ${progErr?.message}` }, { status: 500 })
  }

  return NextResponse.json({
    program_id: program.id,
    ceiling,
    pose_count: poseCount,
    clamp_notes: notes,
    sequence: { ...sequence, segments: enrichedSegments },
  })
}
