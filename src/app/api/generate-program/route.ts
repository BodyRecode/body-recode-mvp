import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildProgramSystemPrompt,
  buildProgramUserPrompt,
  ProgramPrescriptionInputs,
  ExerciseRow,
} from '@/lib/program-prompt'

export const maxDuration = 120

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const {
    client_id,
    cffs_id,
    intake_id,
    training_frequency,
    training_goal,
    training_age,
    progression_phase,
    equipment_access,
    week_duration,
    block_name,
  } = body

  if (!client_id || !training_frequency || !training_goal || !training_age || !progression_phase || !equipment_access || !week_duration || !block_name) {
    return NextResponse.json({ error: 'Missing required prescription inputs' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch client
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', client_id)
    .maybeSingle()

  if (clientError) console.error('Client fetch error:', clientError)
  if (!client) return NextResponse.json({ error: `Client not found (id: ${client_id}, db error: ${clientError?.message ?? 'none'})` }, { status: 404 })

  // Fetch CFFS (body state context) — non-blocking if not present
  let cffs = null
  if (cffs_id) {
    const { data } = await admin
      .from('cffs')
      .select('*')
      .eq('id', cffs_id)
      .maybeSingle()
    cffs = data
  } else {
    // Use active CFFS if no specific cffs_id provided
    const { data } = await admin
      .from('cffs')
      .select('*')
      .eq('client_id', client_id)
      .eq('is_archived', false)
      .maybeSingle()
    cffs = data
  }

  // Fetch injury context from intake
  let injuryContext = {
    injury_location_current: [] as string[],
    injury_primary_concern: '',
    injury_aggravating_movements: '',
  }
  if (intake_id) {
    const { data: intake } = await admin
      .from('intakes')
      .select('injury_location_current, injury_primary_concern, injury_aggravating_movements')
      .eq('id', intake_id)
      .maybeSingle()
    if (intake) {
      injuryContext = {
        injury_location_current: intake.injury_location_current || [],
        injury_primary_concern: intake.injury_primary_concern || '',
        injury_aggravating_movements: intake.injury_aggravating_movements || '',
      }
    }
  } else {
    // Use most recent intake
    const { data: intake } = await admin
      .from('intakes')
      .select('injury_location_current, injury_primary_concern, injury_aggravating_movements')
      .eq('client_id', client_id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (intake) {
      injuryContext = {
        injury_location_current: intake.injury_location_current || [],
        injury_primary_concern: intake.injury_primary_concern || '',
        injury_aggravating_movements: intake.injury_aggravating_movements || '',
      }
    }
  }

  // Fetch exercises filtered by equipment access
  const { data: exercises, error: exError } = await admin
    .from('exercises')
    .select('name, primary_pattern, secondary_pattern, mechanical_bias, primary_joint_stress, secondary_joint_stress, stability_demand, equipment, tier, axial_loading, grip_demand, bilateral')
    .in('equipment', equipment_access)
    .eq('is_active', true)
    .order('tier', { ascending: true })
    .order('name', { ascending: true })

  if (exError || !exercises || exercises.length === 0) {
    return NextResponse.json({ error: 'No exercises found for the given equipment selection' }, { status: 400 })
  }

  const inputs: ProgramPrescriptionInputs = {
    training_frequency,
    training_goal,
    training_age,
    progression_phase,
    equipment_access,
    week_duration,
    block_name,
    ...injuryContext,
  }

  // Generate program via Claude
  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: buildProgramSystemPrompt(),
      messages: [{ role: 'user', content: buildProgramUserPrompt(client.name, inputs, cffs, exercises as ExerciseRow[]) }],
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

  console.log('Claude program response (first 300 chars):', content.text.slice(0, 300))

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json({ error: `Could not parse program — AI returned: ${content.text.slice(0, 200)}` }, { status: 500 })
  }

  let programData
  try {
    programData = JSON.parse(jsonMatch[0])
  } catch (err) {
    return NextResponse.json({ error: `JSON parse failed: ${jsonMatch[0].slice(0, 100)}` }, { status: 500 })
  }

  // Archive any existing drafts for this client (only one draft at a time)
  await admin
    .from('programs')
    .delete()
    .eq('client_id', client_id)
    .eq('status', 'draft')

  // Save program as draft
  const { data: program, error: insertError } = await admin
    .from('programs')
    .insert({
      client_id,
      intake_id: intake_id || null,
      cffs_id: cffs?.id || null,
      block_name: programData.block_name || block_name,
      progression_phase,
      training_goal,
      training_frequency,
      training_age,
      week_duration,
      equipment_access,
      sessions: programData.sessions || [],
      weekly_pattern_summary: programData.weekly_pattern_summary || null,
      progression_notes: programData.progression_notes || null,
      status: 'draft',
      is_active: false,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Program insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save program' }, { status: 500 })
  }

  return NextResponse.json({ program })
}
