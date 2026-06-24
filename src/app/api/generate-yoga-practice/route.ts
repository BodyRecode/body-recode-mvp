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

  // Persist: reuse programs + program_sessions, store poses in session_yoga_poses.
  const byName = new Map(available.map((p) => [p.name.toLowerCase().trim(), p.id]))

  const { data: program, error: progErr } = await admin
    .from('programs')
    .insert({ client_id, name: block_name, is_active: true, notes: sequence.intention })
    .select('id')
    .single()
  if (progErr || !program) {
    return NextResponse.json({ error: `Failed to save program: ${progErr?.message}` }, { status: 500 })
  }

  const { data: session, error: sessErr } = await admin
    .from('program_sessions')
    .insert({
      program_id: program.id,
      week_number: 1,
      day_label: 'Practice',
      session_name: sequence.practice_name,
      skeleton_type: 'Sequential Time Block',
      notes: sequence.summary ?? null,
      sort_order: 0,
    })
    .select('id')
    .single()
  if (sessErr || !session) {
    return NextResponse.json({ error: `Failed to save session: ${sessErr?.message}` }, { status: 500 })
  }

  const poseRows: Array<Record<string, unknown>> = []
  let order = 0
  for (const seg of sequence.segments) {
    for (const pose of seg.poses) {
      const moveId = byName.get(pose.name.toLowerCase().trim())
      if (!moveId) continue
      poseRows.push({
        session_id: session.id,
        yoga_movement_id: moveId,
        segment_key: seg.key,
        sort_order: order++,
        side: pose.side ?? null,
        hold_seconds: pose.hold_seconds ?? null,
        breaths: pose.breaths ?? null,
        cue: pose.cue ?? null,
      })
    }
  }
  if (poseRows.length > 0) {
    const { error: poseErr } = await admin.from('session_yoga_poses').insert(poseRows)
    if (poseErr) {
      return NextResponse.json({ error: `Failed to save poses: ${poseErr.message}` }, { status: 500 })
    }
  }

  return NextResponse.json({
    program_id: program.id,
    session_id: session.id,
    ceiling,
    pose_count: poseRows.length,
    clamp_notes: notes,
    sequence,
  })
}
