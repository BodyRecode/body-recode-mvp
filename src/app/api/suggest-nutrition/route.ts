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
  const { client_id } = body
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const admin = createAdminClient()

  const [
    { data: client },
    { data: cffs },
    { data: intake },
    { data: previousPlans },
    { data: activeProgram },
    { data: recentReviews },
  ] = await Promise.all([
    admin.from('clients').select('id, name').eq('id', client_id).maybeSingle(),
    admin.from('cffs').select('*').eq('client_id', client_id).eq('is_archived', false).maybeSingle(),
    admin.from('intakes')
      .select('bodyweight_kg, height_cm, age, sex, body_composition_notes, digestive_tolerance, food_intolerances, food_exclusions, appetite_patterns, training_history, training_frequency_current, training_goals, lifestyle_stress_level, sleep_quality, sleep_hours_average')
      .eq('client_id', client_id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from('nutrition_plans')
      .select('plan_name, entry_state, carb_demand_level, generated_at')
      .eq('client_id', client_id)
      .eq('status', 'active')
      .order('generated_at', { ascending: false })
      .limit(3),
    admin.from('programs')
      .select('block_name, progression_phase, training_goal, training_frequency, week_duration')
      .eq('client_id', client_id)
      .eq('is_active', true)
      .maybeSingle(),
    admin.from('nutrition_reviews')
      .select('direction, signal_category, adherence_confirmed, signals_noted, reviewed_at')
      .eq('client_id', client_id)
      .order('reviewed_at', { ascending: false })
      .limit(5),
  ])

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const contextParts: string[] = []
  contextParts.push(`CLIENT: ${client.name}`)

  if (cffs) {
    contextParts.push(`
CFFS — FOUNDATIONAL SYNTHESIS:
- Body state classification: ${cffs.body_state_classification}
- Resolution state: ${cffs.resolution_state}
- Capacity readiness: ${cffs.exposure_readiness_capacity}
- Schedule readiness: ${cffs.exposure_readiness_schedule}
- Regulation readiness: ${cffs.exposure_readiness_regulation}
- Behaviour readiness: ${cffs.exposure_readiness_behaviour}
- Capacity constraints and guardrails: ${cffs.capacity_constraints_and_guardrails}
- Risk flags and watch items: ${cffs.risk_flags_and_watch_items}
- Tensions and trade-offs: ${cffs.tensions_and_trade_offs}
- Primary patterns and signals: ${cffs.primary_patterns_and_signals}
- Client context summary: ${cffs.client_context_summary}`)
  } else {
    contextParts.push(`\nCFFS: Not available. Apply conservative Stabilisation defaults.`)
  }

  if (intake) {
    contextParts.push(`
INTAKE CONTEXT:
- Bodyweight: ${intake.bodyweight_kg ? `${intake.bodyweight_kg}kg` : 'Not provided'}
- Height: ${intake.height_cm ? `${intake.height_cm}cm` : 'Not provided'}
- Age: ${intake.age || 'Not provided'}
- Sex: ${intake.sex || 'Not provided'}
- Body composition notes: ${intake.body_composition_notes || 'Not provided'}
- Digestive tolerance: ${intake.digestive_tolerance || 'Not provided'}
- Food intolerances: ${intake.food_intolerances || 'None noted'}
- Food exclusions: ${intake.food_exclusions || 'None noted'}
- Appetite patterns: ${intake.appetite_patterns || 'Not provided'}
- Training history: ${intake.training_history || 'Not provided'}
- Current training frequency: ${intake.training_frequency_current || 'Not provided'}
- Training goals: ${intake.training_goals || 'Not provided'}
- Lifestyle stress level: ${intake.lifestyle_stress_level || 'Not provided'}
- Sleep quality: ${intake.sleep_quality || 'Not provided'}
- Average sleep hours: ${intake.sleep_hours_average || 'Not provided'}`)
  } else {
    contextParts.push(`\nINTAKE: Not available. Apply conservative defaults.`)
  }

  if (activeProgram) {
    contextParts.push(`
ACTIVE TRAINING PROGRAM:
- Block: ${activeProgram.block_name}
- Phase: ${activeProgram.progression_phase}
- Goal: ${activeProgram.training_goal}
- Frequency: ${activeProgram.training_frequency}x/week
- Duration: ${activeProgram.week_duration} weeks`)
  } else {
    contextParts.push(`\nACTIVE TRAINING PROGRAM: None. Client is not currently on a training program.`)
  }

  if (previousPlans && previousPlans.length > 0) {
    contextParts.push(`
PREVIOUS NUTRITION PLANS:
${previousPlans.map((p, i) =>
  `${i + 1}. ${p.plan_name} — Entry State: ${p.entry_state}, Carb Demand: ${p.carb_demand_level} — ${new Date(p.generated_at).toLocaleDateString('en-AU')}`
).join('\n')}`)
  } else {
    contextParts.push(`\nPREVIOUS NUTRITION PLANS: None. This is the client's first nutrition plan.`)
  }

  if (recentReviews && recentReviews.length > 0) {
    const directionLabel: Record<string, string> = { progress: 'Making progress', hold: 'Staying steady', rebuild: 'Struggling' }
    const signalLabel: Record<string, string> = {
      under_fuelling: 'Under-fuelled', over_fuelling: 'Over-fuelled',
      recovery_constraint: 'Recovery issues', adherence_constraint: 'Hard to stick to', neutral_stable: 'Feeling good',
    }
    contextParts.push(`
RECENT NUTRITION CHECK-IN HISTORY (most recent first — use this to understand how the client has been responding to the nutrition plan):
${recentReviews.map((r, i) => {
  const signals = r.signal_category ? r.signal_category.split(',').map((s: string) => signalLabel[s.trim()] ?? s.trim()).join(', ') : 'Not specified'
  return `${i + 1}. Direction: ${directionLabel[r.direction] ?? r.direction} | Followed plan: ${r.adherence_confirmed ? 'Yes' : 'No'} | What they noticed: ${signals}${r.signals_noted ? ` | Notes: ${r.signals_noted}` : ''}`
}).join('\n')}

If the most recent direction is Rebuild, the client is struggling with the current plan. Do not escalate demands. If multiple consecutive Rebuild entries exist, consider reducing complexity, adjusting macros, or simplifying meal structure.`)
  }

  const systemPrompt = `You are the Body Recode™ Nutrition Prescription Intelligence Layer. Your role is to analyse a client's full context and produce a governed nutrition prescription suggestion — with clear reasoning for every field — before nutrition generation begins.

You operate under the Body Recode™ Cross-Pillar Priority Hierarchy:
1. RRS (Recovery and Regulation) — overrides everything
2. Fat Map Method — metabolic constraint authority
3. BIRS — complexity and pace limits
4. PTS — training demand informs carbohydrate demand only
5. HABNS — nutrition execution (you are advising within this pillar)

ENTRY STATE SELECTION RULES:
- stabilisation: instability present, constraint load high, recovery impaired, or uncertainty high. Carbs: Low only. No modulation.
- training_support: stable + training demand present + manageable constraints + functional recovery. Carbs: Moderate. Restricted modulation.
- high_output_support: consistent stability + minimal constraints + strong recovery + low uncertainty. Carbs: High. Full modulation.
- recovery_reset: fatigue accumulation, declining recovery, degraded signals, regression under load. Carbs: Low. No modulation.
Priority order if conflict: recovery_reset → stabilisation → training_support → high_output_support

PROTEIN ANCHOR RULES:
- Calculate from bodyweight only (not goal weight, not lean mass estimation without data)
- Stabilisation/Recovery Reset: 1.6–1.8g per kg bodyweight
- Training Support: 1.8–2.0g per kg bodyweight
- High Output Support: 2.0–2.2g per kg bodyweight
- Round to nearest 5g
- If bodyweight unknown: use moderate default with noted uncertainty

CARBOHYDRATE DEMAND LEVEL RULES:
- Must respect entry state ceiling
- Stabilisation / Recovery Reset → low only
- Training Support → moderate (high only if training frequency ≥4 and strong recovery)
- High Output Support → high

MEAL FREQUENCY RULES:
- Stabilisation: 3–4 meals (simplicity priority)
- Training Support: 3–5 meals
- High Output Support: 4–5 meals
- Must be realistic for the client's lifestyle context

For each field, give the recommended value AND a plain-language reason grounded in the client's actual data.
Be honest about uncertainty — if data is missing, say so and give the conservative default.

Output valid JSON only — no markdown, no commentary:
{
  "plan_name": "string — descriptive name e.g. Foundation Nutrition — Training Support Phase",
  "plan_name_reason": "string",
  "entry_state": "stabilisation|training_support|high_output_support|recovery_reset",
  "entry_state_reason": "string",
  "body_state": "remediation|optimisation|post_optimisation",
  "body_state_reason": "string",
  "pts_phase": "string — current training phase or 'No active program'",
  "pts_phase_reason": "string",
  "constraint_level": "low|moderate|high",
  "constraint_level_reason": "string",
  "recovery_status": "stable|impaired|strong",
  "recovery_status_reason": "string",
  "uncertainty_level": "low|moderate|high",
  "uncertainty_level_reason": "string",
  "protein_anchor_g": number,
  "protein_anchor_g_reason": "string",
  "carb_demand_level": "low|moderate|high",
  "carb_demand_level_reason": "string",
  "meal_frequency": number,
  "meal_frequency_reason": "string",
  "training_days_per_week": number,
  "training_days_per_week_reason": "string",
  "food_exclusions": ["string"],
  "food_exclusions_reason": "string",
  "overall_rationale": "string — 2–3 sentences summarising the overall prescription logic and what it is trying to achieve for this client right now"
}`

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: 'user', content: contextParts.join('\n') + '\n\nGenerate the nutrition prescription suggestion. JSON only.' }],
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
