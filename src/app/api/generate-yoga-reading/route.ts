import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { buildYogaReadingSystemPrompt, buildYogaReadingUserPrompt } from '@/lib/yoga-reading-prompt'

// Generate the 5-part client-facing reading for a yoga block. Writes the same
// pr_* fields the strength reading uses, so the shared ProgramReadingPanel and
// portal ProgramReadingInline render it unchanged. Coach-gated: this only
// generates the draft; publishing is a separate step.
export const maxDuration = 120

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { program_id } = await request.json()
  if (!program_id) return NextResponse.json({ error: 'Missing program_id' }, { status: 400 })

  const admin = createAdminClient()

  const { data: program, error: progErr } = await admin
    .from('programs')
    .select('id, client_id, modality, block_name, prescription_rationale, weekly_pattern_summary, progression_notes, pr_coach_guidance')
    .eq('id', program_id)
    .single()
  if (progErr || !program) return NextResponse.json({ error: 'Block not found' }, { status: 404 })
  if (program.modality !== 'yoga') {
    return NextResponse.json({ error: 'Use /api/generate-program-reading for strength programs' }, { status: 400 })
  }

  const { data: client } = await admin
    .from('clients')
    .select('name')
    .eq('id', program.client_id)
    .single()

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: buildYogaReadingSystemPrompt(),
      messages: [{
        role: 'user',
        content: buildYogaReadingUserPrompt({
          clientName: client?.name ?? 'your client',
          blockName: program.block_name,
          rationale: program.prescription_rationale,
          weeklyStructure: program.weekly_pattern_summary,
          progression: program.progression_notes,
          coachGuidance: program.pr_coach_guidance,
        }),
      }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = message.content[0]
  if (content.type !== 'text') return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 })

  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) return NextResponse.json({ error: `Could not parse reading — AI returned: ${content.text.slice(0, 200)}` }, { status: 500 })

  let r: {
    why_this_block?: string; what_this_is_doing?: string; how_well_know_its_working?: string
    what_were_not_doing_yet?: string; coach_note?: string
  }
  try { r = JSON.parse(jsonText) } catch { return NextResponse.json({ error: 'Reading JSON parse failed' }, { status: 500 }) }

  // No em dashes in client-facing copy (house rule). Replace with a comma.
  const noEmDash = (s: string | undefined | null) =>
    s ? s.replace(/\s*[—–]\s*/g, ', ') : null

  const { error: updErr } = await admin
    .from('programs')
    .update({
      pr_why_this_block: noEmDash(r.why_this_block),
      pr_what_this_program_is_doing: noEmDash(r.what_this_is_doing),
      pr_how_well_know_its_working: noEmDash(r.how_well_know_its_working),
      pr_what_were_not_doing_yet: noEmDash(r.what_were_not_doing_yet),
      pr_coach_note: noEmDash(r.coach_note),
      program_reading_generated_at: new Date().toISOString(),
    })
    .eq('id', program_id)
  if (updErr) return NextResponse.json({ error: `Failed to save reading: ${updErr.message}` }, { status: 500 })

  return NextResponse.json({ ok: true })
}
