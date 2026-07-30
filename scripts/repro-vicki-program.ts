/**
 * Run the REAL program generation for a real client, locally.
 *
 * Written 2026-07-30 after asking Kade to click regenerate four times on four
 * separate theories, three of which were wrong. Same data, same prompts, same
 * model, same token cap as /api/generate-program. If it fails here it fails in
 * production, and nobody's afternoon is spent finding that out.
 *
 *   npm run repro:program -- <client_id>
 */
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { buildProgramSystemPrompt, buildProgramUserPrompt, type ExerciseRow } from '../src/lib/program-prompt'
import { withTemporalContext } from '../src/lib/temporal-context'
import { AI_MODELS } from '../src/lib/ai-models'
import { extractFirstJsonObject } from '../src/lib/extract-json'

const CLIENT_ID = process.argv[2] || 'e1f414f2-e68c-4b1d-82c8-c736d73756e7'
const MAX_TOKENS = Number(process.env.REPRO_MAX_TOKENS || 32000)

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { data: client } = await db.from('clients').select('id, name, medications').eq('id', CLIENT_ID).maybeSingle()
  const { data: cffs } = await db.from('cffs').select('*').eq('client_id', CLIENT_ID).eq('is_archived', false).maybeSingle()
  const { data: intake } = await db.from('intakes').select('*').eq('client_id', CLIENT_ID).order('submitted_at', { ascending: false }).limit(1).maybeSingle()
  const { data: block } = await db.from('plan_blocks')
    .select('*, training_plans!inner(plan_name, macro_objective, coach_guidance, status)')
    .eq('client_id', CLIENT_ID).eq('training_plans.status', 'active')
    .in('status', ['in_progress', 'planned']).order('position').limit(1).maybeSingle()

  const equipment = ['machine', 'bodyweight', 'dumbbell']
  const { data: exercises } = await db.from('exercises')
    .select('name, primary_pattern, secondary_pattern, mechanical_bias, primary_joint_stress, secondary_joint_stress, stability_demand, equipment, tier, axial_loading, grip_demand, bilateral')
    .in('equipment', equipment).eq('is_active', true).order('tier').order('name')

  const tp = block?.training_plans as unknown as { plan_name?: string; macro_objective?: string; coach_guidance?: string } | null

  const inputs = {
    training_frequency: block?.training_frequency ?? 3,
    training_goal: (block?.training_goal ?? 'capacity') as 'capacity',
    training_age: 'beginner' as const,
    movement_competency: 'developing' as const,
    progression_phase: (block?.progression_phase ?? 'restoration') as 'restoration',
    equipment_access: equipment,
    week_duration: (block?.week_duration ?? 4) as 4,
    block_name: block?.block_name ?? 'Block 1',
    injury_location_current: intake?.injury_location_current ?? [],
    injury_primary_concern: intake?.injury_primary_concern ?? '',
    injury_aggravating_movements: intake?.injury_aggravating_movements ?? '',
    preferred_training_days: intake?.training_days_available ?? [],
  }

  const system = withTemporalContext(buildProgramSystemPrompt())
  const user = buildProgramUserPrompt(
    client!.name, inputs, cffs, (exercises ?? []) as ExerciseRow[],
    { plan_name: tp?.plan_name, macro_objective: tp?.macro_objective, current_block_position: block?.position,
      total_blocks: 4, phase_category: block?.phase_category, execution_arc: block?.execution_arc,
      phase_objective: block?.phase_objective, previous_block: null, next_block: null } as never,
    client!.medications, tp?.coach_guidance ?? null,
  )

  console.log(`client:        ${client!.name}`)
  console.log(`block:         ${inputs.block_name} (${inputs.progression_phase}/${inputs.training_goal}, ${inputs.training_frequency}x, ${inputs.week_duration}w)`)
  console.log(`exercises:     ${exercises?.length} available`)
  console.log(`coach guidance: ${tp?.coach_guidance ? 'PRESENT' : 'MISSING'}`)
  console.log(`system prompt: ~${Math.round(system.length / 4)} tok`)
  console.log(`user prompt:   ~${Math.round(user.length / 4)} tok`)
  console.log(`max_tokens:    ${MAX_TOKENS}\n`)

  const t0 = Date.now()
  const effort = process.env.REPRO_EFFORT || 'low'
  console.log(`effort:        ${effort}\n`)
  const msg = await ai.messages.stream({
    model: AI_MODELS.clinical, max_tokens: MAX_TOKENS, system,
    output_config: { effort } as never,
    messages: [{ role: 'user', content: user }],
  }).finalMessage()
  const secs = ((Date.now() - t0) / 1000).toFixed(1)

  const text = msg.content.find(b => b.type === 'text')
  console.log(`took:          ${secs}s`)
  console.log(`stop_reason:   ${msg.stop_reason}`)
  console.log(`output tokens: ${msg.usage.output_tokens}`)
  console.log(`blocks:        ${msg.content.map(b => b.type).join('+') || 'NONE'}`)

  if (msg.stop_reason === 'max_tokens') {
    console.log(`\nFAIL: truncated at ${MAX_TOKENS}. Needs a higher cap or a split call.`)
    process.exit(1)
  }
  if (!text || text.type !== 'text') { console.log('\nFAIL: no text block'); process.exit(1) }

  const json = extractFirstJsonObject(text.text)
  if (!json) { console.log('\nFAIL: no JSON object found\n' + text.text.slice(0, 400)); process.exit(1) }

  const p = JSON.parse(json)
  console.log(`\nPARSED OK. sessions: ${p.sessions?.length}`)
  for (const s of p.sessions ?? []) {
    const slots = (s.blocks ?? []).map((b: { block_label?: string }) => b.block_label)
    const ex = (s.blocks ?? []).flatMap((b: { exercises?: { exercise_name?: string }[] }) => (b.exercises ?? []).map(e => e.exercise_name))
    console.log(`  ${s.day_label}: ${ex.length} exercises`)
    console.log(`     slots: ${slots.join(' | ')}`)
    console.log(`     ${ex.join(', ')}`)
  }
  const all = JSON.stringify(p.sessions).toLowerCase()
  console.log(`\nresilience work present: ${['calf', 'abduction', 'clamshell', 'tibialis', 'band walk'].some(k => all.includes(k))}`)
}

main().catch(e => { console.error('THREW:', e.message); process.exit(1) })
