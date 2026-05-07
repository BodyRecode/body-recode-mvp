import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 300

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { client_id } = await request.json()
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const admin = createAdminClient()

  const [
    { data: client },
    { data: cffs },
    { data: intake },
    { data: baseline },
    { data: activeProgram },
    { data: nutritionPlan },
    { data: existingPlans },
  ] = await Promise.all([
    admin.from('clients').select('id, name, coaching_started_at, hormonal_support').eq('id', client_id).maybeSingle(),
    admin.from('cffs').select('body_state_classification, resolution_state, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour, capacity_constraints_and_guardrails, primary_patterns_and_signals, client_context_summary').eq('client_id', client_id).eq('is_archived', false).maybeSingle(),
    admin.from('intakes').select('id, date_of_birth, gender, primary_goal, secondary_goals, desired_timeline, subjective_motivator, training_days_available, injury_location_current, injury_primary_concern, training_responses, sleep_responses, stress_responses, fat_map_responses, submitted_at').eq('client_id', client_id).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('baselines').select('bodyweight_kg, captured_at').eq('client_id', client_id).order('captured_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('programs').select('block_name, progression_phase, training_goal, training_frequency, week_duration, generated_at').eq('client_id', client_id).eq('is_active', true).maybeSingle(),
    admin.from('nutrition_plans').select('entry_state, carb_demand_level, modulation_level').eq('client_id', client_id).eq('is_active', true).maybeSingle(),
    admin.from('training_plans').select('plan_name, macro_objective, created_at').eq('client_id', client_id).order('created_at', { ascending: false }).limit(3),
  ])

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const systemPrompt = `You are the Body Recode™ Macro Plan Suggestion Engine. You read a client's current state and suggest a sequenced macro training arc — a series of meso blocks that govern training direction over months.

You are a suggestion engine. The coach reviews and approves before anything is activated.

═══════════════════════════════════════
CROSS-PILLAR AUTHORITY ORDER (governs all arc design decisions)
═══════════════════════════════════════
1. RRS (Recovery and Regulation) — overrides all. Red regulation or capacity = restoration entry mandatory.
2. Fat Map Method — body state classification constrains arc ambition
3. BIRS — behaviour and identity limits complexity and phase pace
4. PTS — training demand (you are designing within this pillar)
5. HABNS — nutrition context only; inform each block but do not prescribe

═══════════════════════════════════════
PHASE INTENT FRAMEWORK (use to select each block's phase)
═══════════════════════════════════════
CAPACITY RESTORATION (restoration)
Intent: Stabilise system, restore tolerance, reduce fatigue, restore recovery margin, re-establish consistency.
Mandate: Performance progression explicitly deprioritised.
Training goal: capacity only. Frequency: 2–3x/week max.
Required entry point if: any Red readiness signal, active injury domain, remediation body state.

CAPACITY BUILDING (accumulation)
Intent: Expand tolerance to load. Gradual exposure increase. Conservative and reversible progression only.
Training goal: capacity or strength (conservative). Frequency: 3–4x/week.
Permitted after: demonstrated stability in restoration; no active escalation flags; Amber or above readiness.

PERFORMANCE EXPRESSION (intensification or realization)
Intent: Allow existing capacity to surface. Expression of strength or output. Does not build new capacity.
Training goal: strength or hypertrophy. Frequency: 3–5x/week.
Permitted after: all readiness gates cleared; sustained accumulation demonstrated; no active flags; Green readiness.

CONSOLIDATION (accumulation at maintenance)
Intent: Preserve adaptations, prevent regression, reinforce habits. Change intentionally limited.
Use: between phases, after realization, managing external stress.

═══════════════════════════════════════
READINESS GATE RULES (block phase advancement if any present)
═══════════════════════════════════════
Do not sequence an arc that skips Restoration if:
- Any readiness signal is Red
- Active injury or escalation flags present
- Recovery debt or sympathetic masking present
- Schedule or behaviour readiness compromised

Accumulation cannot precede demonstrated stability.
Intensification cannot precede completed and stable accumulation.
Phase sequence is NEVER skipped — Restoration → Accumulation → Intensification → Realization.

DEFAULT STATE IS STABILITY. Progression is permissioned, not assumed.

═══════════════════════════════════════
MACRO ARC DESIGN RULES
═══════════════════════════════════════
- Arc must reflect current body state. Remediation clients start with restoration regardless of goals.
- Each block: 4–12 weeks (restore longer, accumulate moderate, express shorter)
- Total arc: 12–24 weeks typical
- Nutrition entry state informs carb demand context per block — inform only, do not prescribe
- Training frequency must respect constraint level and schedule readiness per block
- Do not prescribe hypertrophy as goal in restoration blocks
- Each block must logically follow from the prior block's expected outcome

OUTPUT FORMAT — return ONLY valid JSON, no markdown:
{
  "plan_name": "string",
  "plan_name_reason": "string",
  "macro_objective": "string — 1 sentence direction statement",
  "macro_objective_reason": "string",
  "overall_rationale": "string — 3-4 sentences: what current state drives the arc entry point, what phase sequence is designed and why, what readiness signals constrain the design, and what success looks like across the arc",
  "blocks": [
    {
      "block_name": "string",
      "progression_phase": "accumulation|intensification|realization|restoration",
      "training_goal": "strength|hypertrophy|capacity",
      "week_duration": number,
      "execution_arc": "short|mid|long",
      "phase_category": "string",
      "phase_objective": "string",
      "implied_frequency": number,
      "nutrition_context": "string — brief note on how nutrition entry state should align with this block's demand",
      "block_rationale": "string — why this block in this position, what readiness gate permits or requires it, and what signal would change it"
    }
  ]
}`

  const contextLines: string[] = []

  if (client.hormonal_support) {
    contextLines.push(`HORMONAL SUPPORT (CRITICAL — affects recovery capacity, load tolerance, arc pace):\n${client.hormonal_support}\n`)
  }

  if (cffs) {
    contextLines.push(`CFFS — CURRENT BODY STATE`)
    contextLines.push(`Body State: ${cffs.body_state_classification}`)
    contextLines.push(`Resolution: ${cffs.resolution_state}`)
    contextLines.push(`Capacity Readiness: ${cffs.exposure_readiness_capacity}`)
    contextLines.push(`Schedule Readiness: ${cffs.exposure_readiness_schedule}`)
    contextLines.push(`Regulation Readiness: ${cffs.exposure_readiness_regulation}`)
    contextLines.push(`Behaviour Readiness: ${cffs.exposure_readiness_behaviour}`)
    if (cffs.capacity_constraints_and_guardrails) contextLines.push(`Constraints: ${cffs.capacity_constraints_and_guardrails}`)
    if (cffs.primary_patterns_and_signals) contextLines.push(`Patterns: ${cffs.primary_patterns_and_signals}`)
    if (cffs.client_context_summary) contextLines.push(`Context: ${cffs.client_context_summary}`)
  } else {
    contextLines.push(`No CFFS available — use conservative defaults.`)
  }

  // Bodyweight is captured on baseline (the intakes table has no flat
  // bodyweight column). Age derived from date_of_birth; sex from gender.
  const ageFromDob = intake?.date_of_birth
    ? Math.floor((Date.now() - new Date(intake.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  if (intake) {
    contextLines.push(`\nINTAKE CONTEXT`)
    if (baseline?.bodyweight_kg) contextLines.push(`Bodyweight: ${baseline.bodyweight_kg}kg (from baseline ${baseline.captured_at?.slice(0, 10) ?? ''})`)
    if (ageFromDob) contextLines.push(`Age: ${ageFromDob}`)
    if (intake.gender) contextLines.push(`Sex: ${intake.gender}`)
    if (intake.primary_goal) contextLines.push(`Primary goal: ${intake.primary_goal}`)
    if (intake.secondary_goals) contextLines.push(`Secondary goals: ${intake.secondary_goals}`)
    if (intake.desired_timeline) contextLines.push(`Desired timeline: ${intake.desired_timeline}`)
    if (intake.subjective_motivator) contextLines.push(`What's driving this: ${intake.subjective_motivator}`)
    if (intake.training_days_available) contextLines.push(`Training days available: ${intake.training_days_available}`)
    if (intake.injury_location_current) contextLines.push(`Current injuries: ${intake.injury_location_current}`)
    if (intake.injury_primary_concern) contextLines.push(`Primary injury concern: ${intake.injury_primary_concern}`)
    if (intake.training_responses) contextLines.push(`Training response blob (tr_01..tr_30, scale 0-4): ${JSON.stringify(intake.training_responses)}`)
    if (intake.sleep_responses) contextLines.push(`Sleep response blob (scale 0-4): ${JSON.stringify(intake.sleep_responses)}`)
    if (intake.stress_responses) contextLines.push(`Stress response blob (scale 0-4): ${JSON.stringify(intake.stress_responses)}`)
    if (intake.fat_map_responses) contextLines.push(`Fat Map response blob (fm_01..fm_25, scale 0-4): ${JSON.stringify(intake.fat_map_responses)}`)
  } else if (baseline?.bodyweight_kg) {
    contextLines.push(`\nINTAKE CONTEXT`)
    contextLines.push(`Foundational intake not yet submitted.`)
    contextLines.push(`Bodyweight (from baseline): ${baseline.bodyweight_kg}kg`)
  }

  if (activeProgram) {
    contextLines.push(`\nCURRENT ACTIVE PROGRAM`)
    contextLines.push(`${activeProgram.block_name} — ${activeProgram.progression_phase}, ${activeProgram.training_goal}, ${activeProgram.training_frequency}x/week, ${activeProgram.week_duration} weeks`)
  }

  if (nutritionPlan) {
    contextLines.push(`\nNUTRITION STATE`)
    contextLines.push(`Entry State: ${nutritionPlan.entry_state}`)
    contextLines.push(`Carb Demand: ${nutritionPlan.carb_demand_level}`)
    contextLines.push(`Modulation: ${nutritionPlan.modulation_level}`)
  }

  if (existingPlans && existingPlans.length > 0) {
    contextLines.push(`\nPREVIOUS PLANS`)
    existingPlans.forEach(p => contextLines.push(`- ${p.plan_name}: ${p.macro_objective || 'No objective'}`))
  }

  contextLines.push(`\nSuggest a macro training arc for this client. Design 3–5 meso blocks appropriate to current state. If Remediation/Red signals present, begin conservative. Return valid JSON only.`)

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: 'user', content: contextLines.join('\n') }],
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
