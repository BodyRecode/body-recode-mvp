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
import { withTemporalContext } from '@/lib/temporal-context'
import { AI_MODELS } from '@/lib/ai-models'
import { isCoachUser, forbidden } from '@/lib/api-auth'

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
  if (!(await isCoachUser(user))) return forbidden()

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

  // Banned-terms aware retry loop. Single-shot pre-2026-06-22 was leaking
  // terms like "autonomic" on nervous-system-themed blocks (Razia's Block 1)
  // even with the system prompt's ban list, because Haiku gravitates back to
  // the natural physiology vocabulary. Up to 3 attempts; on leak, the
  // failed JSON + an explicit "these terms must not appear" message are
  // appended to the conversation so the model gets corrective feedback
  // instead of being asked the same question again.
  const { auditClientReadingFields } = await import('@/lib/banned-client-terms')
  const required = [
    'pr_why_this_block',
    'pr_what_this_program_is_doing',
    'pr_how_well_know_its_working',
    'pr_what_were_not_doing_yet',
    'pr_coach_note',
  ] as const
  const conversation: { role: 'user' | 'assistant'; content: string }[] = [
    {
      role: 'user',
      content: buildProgramReadingUserPrompt(
        frContext,
        programContext,
        { name: client.name },
        program.pr_coach_guidance ?? null
      ),
    },
  ]
  let cleaned: Record<string, string> | null = null
  let leaksSeen: string[] = []
  let lastError: string | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    let message
    try {
      message = await anthropic.messages.create({
        model: AI_MODELS.structural,
        max_tokens: 12000,
        system: withTemporalContext(buildProgramReadingSystemPrompt()),
        messages: conversation,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Anthropic API error (program reading):', msg)
      return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
    }

    const content = (message.content.find(b => b.type === 'text') ?? message.content[0])
    if (!content || content.type !== 'text') {
      lastError = 'Unexpected response from AI'
      continue
    }

    // Truncated mid-object: the JSON never closed, so parsing will fail. Retry
    // rather than feeding a garbled half-object into extraction. (2026-07-11)
    if (message.stop_reason === 'max_tokens') {
      lastError = 'AI output was truncated at the 12000-token limit'
      console.warn('[program-reading] output truncated, retrying')
      continue
    }

    const jsonText = extractFirstJsonObject(content.text)
    if (!jsonText) {
      lastError = `Could not parse reading. AI returned: ${content.text.slice(0, 120)}`
      continue
    }

    let reading: Record<string, unknown>
    try {
      reading = JSON.parse(jsonText)
    } catch (err) {
      lastError = `JSON parse failed: ${(err as Error).message}`
      continue
    }

    const missing = required.filter(k => typeof reading[k] !== 'string' || !(reading[k] as string).trim())
    if (missing.length > 0) {
      lastError = `Missing required sections: ${missing.join(', ')}`
      continue
    }

    const audit = auditClientReadingFields(reading as Record<string, string>, required as unknown as string[])

    // Partner-specific banned phrase check (Mode A+ overlay). Additive to
    // the platform-wide audit; feeds into the same retry loop.
    const { findPartnerBannedPhrase } = await import('@/lib/doctrine-parameters')
    const partnerLeaks: string[] = []
    for (const key of required) {
      const val = (reading as Record<string, unknown>)[key]
      if (typeof val !== 'string') continue
      const hit = findPartnerBannedPhrase(val)
      if (hit && !partnerLeaks.includes(hit)) partnerLeaks.push(hit)
    }

    if (audit.ok && partnerLeaks.length === 0) {
      // Apply partner terminology substitutions post-audit (Mode A+ overlay).
      // No-op for BR (empty substitutions map).
      const { applyPartnerTerminology } = await import('@/lib/doctrine-parameters')
      const rewritten: Record<string, string> = {}
      for (const [k, v] of Object.entries(audit.cleaned as Record<string, string>)) {
        rewritten[k] = applyPartnerTerminology(v)
      }
      cleaned = rewritten
      break
    }

    const allLeaks = [...audit.leaks, ...partnerLeaks]
    leaksSeen = Array.from(new Set([...leaksSeen, ...allLeaks].map(t => t.toLowerCase())))
    if (attempt < 3) {
      conversation.push({ role: 'assistant', content: jsonText })
      conversation.push({
        role: 'user',
        content: `That draft contained internal terminology the client has never seen and the system will reject. These terms must not appear anywhere in the output: ${allLeaks.map(t => `"${t}"`).join(', ')}. Rewrite the entire JSON object using ONLY plain client-facing words to express the same idea. Return only the corrected JSON, no commentary.`,
      })
      lastError = `Leaked: ${allLeaks.join(', ')}`
    }
  }

  if (!cleaned) {
    return NextResponse.json(
      {
        error: `Reading leaked internal terminology after 3 attempts (${leaksSeen.length ? leaksSeen.join(', ') : lastError ?? 'unknown'}). Click Regenerate to try a fresh start.`,
      },
      { status: 500 }
    )
  }

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
  // NOT auto-published. (This comment used to say "Auto-publish on generation",
  // contradicting the code directly beneath it — see program_reading_published_at
  // below and the reason it is nulled.)
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
      // NOT published on generation (changed 2026-08-01). A reading used to go
      // live in the client's portal the instant it was created, so nobody saw it
      // before the client did. That is how a Foundational Reading reached Vicki S
      // asserting "everything going on with your family" when she had never
      // mentioned family, and she ended her engagement over it. Publishing is now
      // a separate, deliberate act with a lint in front of it.
      program_reading_published_at: null,
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
