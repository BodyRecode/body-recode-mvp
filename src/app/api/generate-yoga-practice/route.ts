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
  clampYogaBlock,
  RRSLevel,
  YogaIntensity,
  YogaBlock,
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
    target_minutes = 45,
    // RRS execution level 0-4. Defaults to standard (3) until wired to the
    // recovery state machine. Determines the intensity ceiling.
    rrs_level = 3,
    contraindications = [],
    body_state_context = null,
    coach_guidance = null,
    // Block parameters (parallel to a strength block).
    week_duration = 4,        // 4 | 6 | 8
    practices_per_week = 2,   // 2-4
    // When generated from a macro-plan block: the block's ceiling + name, and
    // the plan_block to mark in progress.
    ceiling: ceilingOverride = null,
    block_name_override = null,
    plan_block_id = null,
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

  // Recovery state -> intensity ceiling (hard cap). A macro-plan block can
  // pass its own ceiling directly.
  const level = (Math.max(0, Math.min(4, Number(rrs_level))) as RRSLevel)
  const validCeilings = ['restorative', 'gentle', 'moderate', 'strong']
  const ceiling: YogaIntensity = validCeilings.includes(String(ceilingOverride))
    ? (ceilingOverride as YogaIntensity)
    : intensityCeilingForState(level)

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

  const weeks = [4, 6, 8].includes(Number(week_duration)) ? Number(week_duration) : 4
  const perWeek = Math.max(2, Math.min(4, Number(practices_per_week)))

  // Generate the block via Claude (Haiku, matching the strength engine).
  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 7000,
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
          perWeek,
          weeks,
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
    return NextResponse.json({ error: `Could not parse block — AI returned: ${content.text.slice(0, 200)}` }, { status: 500 })
  }

  let parsed: YogaBlock
  try {
    parsed = JSON.parse(jsonText) as YogaBlock
  } catch {
    return NextResponse.json({ error: `JSON parse failed: ${jsonText.slice(0, 120)}` }, { status: 500 })
  }

  // Enforcement: allowed poses only (ceiling + contraindications), symmetry,
  // closing rest, applied to every practice in the block.
  const { block, notes } = clampYogaBlock(parsed, available.map((p) => p.name))

  // Enrich poses with sanskrit names for the display.
  const sanskritByName = new Map(available.map((p) => [p.name.toLowerCase().trim(), p.sanskrit_name]))
  const sessions = block.practices.map((pr) => ({
    day_label: pr.day_label,
    skeleton: 'Yoga Practice',
    modality: 'yoga',
    intention: pr.intention ?? null,
    ceiling,
    segments: pr.segments.map((seg) => ({
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
    })),
  }))

  // Persist into the shared programs columns, tagged modality = 'yoga'.
  // training_frequency = practices/week, week_duration = block weeks (both reused).
  const { data: program, error: progErr } = await admin
    .from('programs')
    .insert({
      client_id,
      block_name: block_name_override || block.block_name || 'Yoga Block',
      modality: 'yoga',
      progression_phase: 'restoration',
      training_goal: 'capacity',
      training_frequency: perWeek,
      training_age: 'beginner',
      week_duration: weeks,
      equipment_access: [],
      sessions,
      prescription_rationale: block.rationale ?? null,
      weekly_pattern_summary: block.weekly_structure ?? null,
      progression_notes: block.progression ?? null,
      // Coach-gated draft until published.
      status: 'draft',
      is_active: false,
    })
    .select('id')
    .single()
  if (progErr || !program) {
    return NextResponse.json({ error: `Failed to save block: ${progErr?.message}` }, { status: 500 })
  }

  // If generated from a macro-plan block, mark it in progress.
  if (plan_block_id) {
    await admin.from('plan_blocks').update({ status: 'in_progress' }).eq('id', plan_block_id)
  }

  return NextResponse.json({
    program_id: program.id,
    ceiling,
    practices: sessions.length,
    clamp_notes: notes,
    block: { ...block, practices: sessions },
  })
}
