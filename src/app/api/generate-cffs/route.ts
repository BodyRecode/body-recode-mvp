import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildCFFSSystemPrompt, buildCFFSUserPrompt } from '@/lib/cffs-prompt'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { intake_id, client_id } = await request.json()

  // Fetch intake
  const { data: intake, error: intakeError } = await supabase
    .from('intakes')
    .select('*')
    .eq('id', intake_id)
    .single()

  if (intakeError || !intake) {
    return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
  }

  // Generate CFFS via Claude
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: buildCFFSSystemPrompt(),
      messages: [{ role: 'user', content: buildCFFSUserPrompt(intake) }],
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

  console.log('Claude raw response:', content.text.slice(0, 200))

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json({ error: `Could not parse CFFS — AI returned: ${content.text.slice(0, 100)}` }, { status: 500 })
  }

  let cffsData
  try {
    cffsData = JSON.parse(jsonMatch[0])
  } catch (err) {
    return NextResponse.json({ error: `JSON parse failed: ${jsonMatch[0].slice(0, 100)}` }, { status: 500 })
  }

  // Strip em dashes from all generated text fields
  cffsData = stripEmDashes(cffsData)

  // Archive any existing CFFS for this client
  await supabase
    .from('cffs')
    .update({ is_archived: true })
    .eq('client_id', client_id)
    .eq('is_archived', false)

  // Save CFFS to database
  const { data: cffs, error: cffsError } = await supabase
    .from('cffs')
    .insert({ client_id, intake_id, ...(cffsData as Record<string, unknown>) })
    .select()
    .single()

  if (cffsError) {
    return NextResponse.json({ error: 'Failed to save CFFS' }, { status: 500 })
  }

  return NextResponse.json({ cffs })
}

function stripEmDashes(obj: unknown): unknown {
  if (typeof obj === 'string') return obj.replace(/\s*—\s*/g, ', ')
  if (Array.isArray(obj)) return obj.map(stripEmDashes)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, stripEmDashes(v)]))
  }
  return obj
}
