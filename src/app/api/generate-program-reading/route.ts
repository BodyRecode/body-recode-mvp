import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildProgramReadingSystemPrompt,
  buildProgramReadingUserPrompt,
  type ProgramReadingFRContext,
  type ProgramReadingProgramContext,
} from '@/lib/client-program-reading-prompt'
import { extractFirstJsonObject } from '@/lib/extract-json'

// Reading-published client emails scrapped 2026-06-09. The Program Reading
// generates silently. Client gets one email per training block via the
// Notify Client button at /api/notify-client-training-plan.

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
    .select('id, name')
    .eq('id', program.client_id)
    .single()

  if (clientErr || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  // Pull the latest published Foundational Reading. This is the state context
  // the Program Reading builds from.
  const { data: cffsRows, error: cffsErr } = await admin
    .from('cffs')
    .select('cr_where_you_are, cr_what_your_body_is_telling_us, cr_what_were_focusing_on_first, cr_what_were_not_doing_yet, cr_coach_note, body_state_classification')
    .eq('client_id', client.id)
    .eq('is_archived', false)
    .not('client_reading_published_at', 'is', null)
    .order('client_reading_published_at', { ascending: false })
    .limit(1)

  if (cffsErr) {
    return NextResponse.json({ error: 'Failed to load Foundational Reading' }, { status: 500 })
  }
  if (!cffsRows || cffsRows.length === 0) {
    return NextResponse.json(
      { error: 'No published Foundational Reading found. Publish the Foundational Reading before generating the Program Reading.' },
      { status: 400 }
    )
  }

  const frContext: ProgramReadingFRContext = cffsRows[0]

  const programContext: ProgramReadingProgramContext = {
    block_name: program.block_name,
    progression_phase: program.progression_phase,
    training_goal: program.training_goal,
    training_frequency: program.training_frequency,
    week_duration: program.week_duration,
    prescription_rationale: program.prescription_rationale,
    weekly_pattern_summary: program.weekly_pattern_summary,
    progression_notes: program.progression_notes,
    sessions: program.sessions,
    current_direction: program.current_direction,
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: buildProgramReadingSystemPrompt(),
      messages: [{
        role: 'user',
        content: buildProgramReadingUserPrompt(
          frContext,
          programContext,
          { name: client.name },
          program.pr_coach_guidance ?? null
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
    pr_why_this_block?: string
    pr_what_this_program_is_doing?: string
    pr_how_well_know_its_working?: string
    pr_what_were_not_doing_yet?: string
    pr_coach_note?: string
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
    'pr_why_this_block',
    'pr_what_this_program_is_doing',
    'pr_how_well_know_its_working',
    'pr_what_were_not_doing_yet',
    'pr_coach_note',
  ] as const
  for (const key of required) {
    if (!reading[key] || typeof reading[key] !== 'string') {
      return NextResponse.json(
        { error: `Missing or invalid section: ${key}` },
        { status: 500 }
      )
    }
  }

  // Banned-terms audit added 2026-06-09 — see banned-client-terms.ts.
  const { auditClientReadingFields } = await import('@/lib/banned-client-terms')
  const audit = auditClientReadingFields(reading, [
    'pr_why_this_block',
    'pr_what_this_program_is_doing',
    'pr_how_well_know_its_working',
    'pr_what_were_not_doing_yet',
    'pr_coach_note',
  ])
  if (!audit.ok) {
    return NextResponse.json(
      { error: `Reading leaked internal terminology (${audit.leaks.join(', ')}). Click Regenerate to redraft.` },
      { status: 500 }
    )
  }
  const cleaned = audit.cleaned

  const { DOCTRINE_VERSIONS } = await import('@/lib/doctrine-versions')

  // Archive previous PR version (item I, 2026-06-09).
  if (program.pr_why_this_block || program.pr_what_this_program_is_doing) {
    const { archiveArtefactVersion } = await import('@/lib/artefact-archive')
    void archiveArtefactVersion({
      admin,
      clientId: program.client_id,
      artefactType: 'pr',
      sourceRowId: program_id,
      doctrineVersion: program.pr_doctrine_version ?? null,
      content: {
        pr_why_this_block: program.pr_why_this_block,
        pr_what_this_program_is_doing: program.pr_what_this_program_is_doing,
        pr_how_well_know_its_working: program.pr_how_well_know_its_working,
        pr_what_were_not_doing_yet: program.pr_what_were_not_doing_yet,
        pr_coach_note: program.pr_coach_note,
      },
      generatedAt: program.program_reading_generated_at ?? null,
      archivedBy: user.id,
    })
  }

  const now = new Date().toISOString()
  // Auto-publish on generation. Regenerations stay published silently. Mirrors
  // the Foundational Reading flow.
  const { data: updated, error: updateErr } = await admin
    .from('programs')
    .update({
      pr_why_this_block: cleaned.pr_why_this_block,
      pr_what_this_program_is_doing: cleaned.pr_what_this_program_is_doing,
      pr_how_well_know_its_working: cleaned.pr_how_well_know_its_working,
      pr_what_were_not_doing_yet: cleaned.pr_what_were_not_doing_yet,
      pr_coach_note: cleaned.pr_coach_note,
      pr_doctrine_version: DOCTRINE_VERSIONS.program_reading,
      program_reading_generated_at: now,
      program_reading_published_at: now,
    })
    .eq('id', program_id)
    .select()
    .single()

  if (updateErr) {
    console.error('Failed to save program reading:', updateErr)
    return NextResponse.json({ error: 'Failed to save reading' }, { status: 500 })
  }

  // No client email on Program Reading publish. The Program Reading frames
  // the new block but the email-trigger event is the explicit Notify Client
  // action on the program view, not Reading generation.

  return NextResponse.json({ program: updated })
}
