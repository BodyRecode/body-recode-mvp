import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { client_id, plan_block_id } = body
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const admin = createAdminClient()

  // Fetch all context in parallel
  const [
    { data: client },
    { data: cffs },
    { data: intake },
    { data: previousPrograms },
    { data: planBlock },
  ] = await Promise.all([
    admin.from('clients').select('id, name').eq('id', client_id).maybeSingle(),
    admin.from('cffs').select('*').eq('client_id', client_id).eq('is_archived', false).maybeSingle(),
    admin.from('intakes')
      .select('injury_location_current, injury_primary_concern, injury_aggravating_movements, training_history, training_frequency_current, training_goals')
      .eq('client_id', client_id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from('programs')
      .select('block_name, progression_phase, training_goal, training_frequency, training_age, week_duration, status, is_active, generated_at')
      .eq('client_id', client_id)
      .eq('status', 'active')
      .order('generated_at', { ascending: false })
      .limit(3),
    plan_block_id
      ? admin.from('plan_blocks').select('*, training_plans(plan_name, macro_objective)').eq('id', plan_block_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Build context for Claude
  const contextParts: string[] = []

  contextParts.push(`CLIENT: ${client.name}`)

  if (cffs) {
    contextParts.push(`
CFFS BODY STATE:
- Body state classification: ${cffs.body_state_classification}
- Resolution state: ${cffs.resolution_state}
- Capacity readiness: ${cffs.exposure_readiness_capacity}
- Schedule readiness: ${cffs.exposure_readiness_schedule}
- Regulation readiness: ${cffs.exposure_readiness_regulation}
- Behaviour readiness: ${cffs.exposure_readiness_behaviour}
- Capacity constraints: ${cffs.capacity_constraints_and_guardrails}
- Risk flags: ${cffs.risk_flags_and_watch_items}
- Client context summary: ${cffs.client_context_summary}`)
  } else {
    contextParts.push(`\nCFFS: Not available. Apply conservative defaults.`)
  }

  if (intake) {
    contextParts.push(`
INTAKE CONTEXT:
- Injury locations: ${intake.injury_location_current?.join(', ') || 'None'}
- Primary concern: ${intake.injury_primary_concern || 'None'}
- Aggravating movements: ${intake.injury_aggravating_movements || 'None'}
- Training history: ${intake.training_history || 'Not provided'}
- Current training frequency: ${intake.training_frequency_current || 'Not provided'}
- Training goals: ${intake.training_goals || 'Not provided'}`)
  } else {
    contextParts.push(`\nINTAKE: Not available.`)
  }

  if (previousPrograms && previousPrograms.length > 0) {
    contextParts.push(`
PREVIOUS PROGRAMS (most recent first):
${previousPrograms.map((p, i) =>
  `${i + 1}. ${p.block_name} — ${p.progression_phase}, ${p.training_goal}, ${p.training_frequency}x/week, ${p.week_duration} weeks`
).join('\n')}`)
  } else {
    contextParts.push(`\nPREVIOUS PROGRAMS: None. This is the client's first block.`)
  }

  if (planBlock) {
    const plan = planBlock.training_plans as { plan_name: string; macro_objective: string | null } | null
    contextParts.push(`
MACRO PLAN CONTEXT:
- Plan: ${plan?.plan_name ?? 'Unknown'}
- Macro objective: ${plan?.macro_objective ?? 'Not specified'}
- This block: ${planBlock.block_name} — ${planBlock.progression_phase}, ${planBlock.training_goal}, ${planBlock.week_duration}w
- Phase category: ${planBlock.phase_category ?? 'Not specified'}
- Execution arc: ${planBlock.execution_arc ?? 'Not specified'}
- Phase objective: ${planBlock.phase_objective ?? 'Not specified'}`)
  }

  const systemPrompt = `You are the Body Recode™ Prescription Intelligence Layer. Your role is to analyse a client's full context and produce a governed prescription recommendation — with clear reasoning for every input — before program generation begins.

You operate under the full Body Recode™ Cross-Pillar Priority Hierarchy:
1. RRS (Recovery and Regulation) — overrides everything
2. Fat Map Method — constraint authority
3. BIRS — complexity and pace limits
4. PTS — training execution (you are advising within this pillar)

Your output is a prescription suggestion — not a program. You are recommending the inputs the program engine should receive, and explaining why each input is appropriate given the client's current state.

For each prescription field, provide:
- The recommended value
- A clear, plain-language reason why — grounded in the client's CFFS, intake, injury context, previous training history, and doctrine constraints

Be honest about uncertainty. If you lack data for a field (e.g. no intake for training age), state that and give the conservative default with the reason.

Output as valid JSON only — no markdown, no commentary:
{
  "block_name": "string",
  "block_name_reason": "string",
  "progression_phase": "accumulation|intensification|realization|restoration",
  "progression_phase_reason": "string",
  "training_goal": "strength|hypertrophy|capacity",
  "training_goal_reason": "string",
  "training_frequency": number (2-6),
  "training_frequency_reason": "string",
  "training_age": "beginner|intermediate|advanced",
  "training_age_reason": "string",
  "movement_competency": "limited|developing|proficient",
  "movement_competency_reason": "string",
  "week_duration": 4|6|8,
  "week_duration_reason": "string",
  "overall_rationale": "string — 2-3 sentences summarising the overall prescription logic and what it is trying to achieve for this client right now"
}`

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: contextParts.join('\n') + '\n\nGenerate the prescription suggestion. JSON only.' }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = message.content[0]
  if (content.type !== 'text') return NextResponse.json({ error: 'Unexpected AI response' }, { status: 500 })

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Could not parse suggestion' }, { status: 500 })

  let suggestion
  try {
    suggestion = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'JSON parse failed' }, { status: 500 })
  }

  return NextResponse.json({ suggestion })
}
