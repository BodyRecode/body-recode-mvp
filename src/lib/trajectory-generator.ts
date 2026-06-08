// Shared trajectory-reading generator.
//
// Two callers:
//   1. The coach-facing /api/generate-trajectory-reading route writes the
//      result to the program's tr_* columns (draft -> publish flow).
//   2. The bolt-on instant_engine fulfilment path renders the result
//      directly to a PDF without touching the program row.
//
// Both share the same loader + prompt + Claude call + parse. Extracted
// here so a future deep-dive variant doesn't drift from the coach-side
// reading.

import Anthropic from '@anthropic-ai/sdk'
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

export type TrajectoryReadingSections = {
  tr_where_this_block_started: string
  tr_how_your_signal_moved: string
  tr_what_held_steady: string
  tr_what_this_sets_up_next: string
  tr_coach_note: string
}

export type TrajectoryGenerationResult = {
  sections: TrajectoryReadingSections
  blockStartWeek: number
  blockEndWeek: number
  weeksRead: number
  programId: string
  programName: string | null
  clientName: string
}

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

function weekNumberAt(coachingStartedAt: string, when: Date): number {
  const start = new Date(coachingStartedAt)
  const diffDays = Math.floor((when.getTime() - start.getTime()) / 86_400_000)
  return Math.floor(diffDays / 7) + 1
}

export class TrajectoryGenerationError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

/** Generate a trajectory reading for an explicit programId. */
export async function generateTrajectoryReadingForProgram(
  programId: string,
): Promise<TrajectoryGenerationResult> {
  const admin = createAdminClient()

  const { data: program } = await admin
    .from('programs')
    .select('*')
    .eq('id', programId)
    .single()

  if (!program) throw new TrajectoryGenerationError('Program not found', 404)

  const { data: client } = await admin
    .from('clients')
    .select('id, name, coaching_started_at')
    .eq('id', program.client_id)
    .single()

  if (!client) throw new TrajectoryGenerationError('Client not found', 404)
  if (!client.coaching_started_at) {
    throw new TrajectoryGenerationError('Client has no coaching start date', 400)
  }
  if (!program.generated_at) {
    throw new TrajectoryGenerationError('Program has no generated_at', 400)
  }

  const blockStartWeek = weekNumberAt(client.coaching_started_at, new Date(program.generated_at))
  const currentWeek = getWeekNumber(client.coaching_started_at)
  const nominalEndWeek = program.week_duration
    ? blockStartWeek + program.week_duration - 1
    : currentWeek
  const blockEndWeek = Math.max(blockStartWeek, Math.min(currentWeek, nominalEndWeek))

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

  const { data: cfwsRows, error: cfwsErr } = await admin
    .from('cfws')
    .select('week_number, client_context_snapshot, dominant_weekly_patterns, weekly_capacity_constraints, weekly_risk_flags, weekly_tensions_tradeoffs, closing_weekly_notes, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour')
    .eq('client_id', client.id)
    .eq('is_archived', false)
    .gte('week_number', blockStartWeek)
    .lte('week_number', blockEndWeek)
    .order('week_number', { ascending: true })

  if (cfwsErr) throw new TrajectoryGenerationError('Failed to load weekly syntheses', 500)
  if (!cfwsRows || cfwsRows.length === 0) {
    throw new TrajectoryGenerationError(
      `No weekly syntheses found for this block (weeks ${blockStartWeek}-${blockEndWeek})`,
      400,
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

  const message = await anthropic.messages.create({
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
        program.tr_coach_guidance ?? null,
      ),
    }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new TrajectoryGenerationError('Unexpected response from AI', 500)
  }

  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) {
    throw new TrajectoryGenerationError(`Could not parse reading: ${content.text.slice(0, 120)}`, 500)
  }

  let parsed: Partial<TrajectoryReadingSections>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new TrajectoryGenerationError(`JSON parse failed: ${jsonText.slice(0, 120)}`, 500)
  }

  const required: (keyof TrajectoryReadingSections)[] = [
    'tr_where_this_block_started',
    'tr_how_your_signal_moved',
    'tr_what_held_steady',
    'tr_what_this_sets_up_next',
    'tr_coach_note',
  ]
  for (const key of required) {
    if (!parsed[key] || typeof parsed[key] !== 'string') {
      throw new TrajectoryGenerationError(`Missing or invalid section: ${key}`, 500)
    }
  }

  const cleaned = stripEmDashes(parsed as TrajectoryReadingSections)

  return {
    sections: cleaned,
    blockStartWeek,
    blockEndWeek,
    weeksRead: weeks.length,
    programId: program.id,
    programName: program.block_name,
    clientName: client.name,
  }
}

/** Generate a trajectory reading for the most recently published program of a client. */
export async function generateTrajectoryReadingForLatestBlock(
  clientId: string,
): Promise<TrajectoryGenerationResult> {
  const admin = createAdminClient()
  const { data: programs } = await admin
    .from('programs')
    .select('id, generated_at')
    .eq('client_id', clientId)
    .not('generated_at', 'is', null)
    .order('generated_at', { ascending: false })
    .limit(1)
  if (!programs?.length) {
    throw new TrajectoryGenerationError('Client has no generated programs', 400)
  }
  return generateTrajectoryReadingForProgram(programs[0].id)
}
