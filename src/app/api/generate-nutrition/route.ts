import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildNutritionSystemPrompt, buildNutritionUserPrompt, NutritionPrescriptionInputs } from '@/lib/nutrition-prompt'

export const maxDuration = 120

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const {
    client_id,
    plan_name,
    entry_state,
    body_state,
    pts_phase,
    constraint_level,
    recovery_status,
    uncertainty_level,
    protein_anchor_g,
    carb_demand_level,
    meal_frequency,
    training_days_per_week,
    food_exclusions,
  } = body

  if (!client_id || !entry_state || !protein_anchor_g || !carb_demand_level) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  const [
    { data: client },
    { data: cffs },
    { data: intake },
    { data: baseline },
    { data: previousPlans },
  ] = await Promise.all([
    admin.from('clients').select('id, name').eq('id', client_id).maybeSingle(),
    admin.from('cffs').select('*').eq('client_id', client_id).eq('is_archived', false).maybeSingle(),
    admin.from('intakes')
      .select('bodyweight_kg, height_cm, age, sex, digestive_tolerance, food_intolerances, training_history, lifestyle_stress_level, sleep_quality')
      .eq('client_id', client_id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from('baselines')
      .select('bodyweight_kg, captured_at')
      .eq('client_id', client_id)
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from('nutrition_plans')
      .select('plan_name, entry_state, generated_at')
      .eq('client_id', client_id)
      .eq('status', 'active')
      .order('generated_at', { ascending: false })
      .limit(3),
  ])

  // Bodyweight may live in intakes or baselines. Baseline is the canonical
  // capture point in the current onboarding flow, so prefer baseline when
  // intake didn't carry it.
  const bodyweightKg = intake?.bodyweight_kg ?? baseline?.bodyweight_kg ?? null
  const bodyweightSource =
    intake?.bodyweight_kg ? 'intake'
    : baseline?.bodyweight_kg ? `baseline (${baseline.captured_at?.slice(0, 10) ?? 'date unknown'})`
    : null

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Build CFFS text for the prompt
  let cffsText: string | null = null
  if (cffs) {
    cffsText = [
      `Body state: ${cffs.body_state_classification}`,
      `Resolution state: ${cffs.resolution_state}`,
      `Capacity readiness: ${cffs.exposure_readiness_capacity}`,
      `Regulation readiness: ${cffs.exposure_readiness_regulation}`,
      `Capacity constraints: ${cffs.capacity_constraints_and_guardrails}`,
      `Risk flags: ${cffs.risk_flags_and_watch_items}`,
      `Primary patterns: ${cffs.primary_patterns_and_signals}`,
      `Context summary: ${cffs.client_context_summary}`,
    ].join('\n')
  }

  // Build intake/baseline context. Bodyweight is critical for protein anchor —
  // emit from whichever source has it, even when the foundational intake
  // hasn't been submitted yet.
  const intakeLines: string[] = []
  intakeLines.push(`Bodyweight: ${bodyweightKg ? `${bodyweightKg}kg${bodyweightSource ? ` (from ${bodyweightSource})` : ''}` : 'Not provided'}`)
  intakeLines.push(`Height: ${intake?.height_cm ? `${intake.height_cm}cm` : 'Not provided'}`)
  intakeLines.push(`Age: ${intake?.age || 'Not provided'}`)
  intakeLines.push(`Sex: ${intake?.sex || 'Not provided'}`)
  if (intake) {
    intakeLines.push(`Digestive tolerance: ${intake.digestive_tolerance || 'Not provided'}`)
    intakeLines.push(`Food intolerances: ${intake.food_intolerances || 'None'}`)
    intakeLines.push(`Training history: ${intake.training_history || 'Not provided'}`)
    intakeLines.push(`Lifestyle stress: ${intake.lifestyle_stress_level || 'Not provided'}`)
    intakeLines.push(`Sleep quality: ${intake.sleep_quality || 'Not provided'}`)
  } else {
    intakeLines.push(`Foundational intake: not yet submitted (using baseline data only).`)
  }
  const intakeText: string | null = intakeLines.join('\n')

  const inputs: NutritionPrescriptionInputs = {
    plan_name: plan_name || `Nutrition Plan — ${entry_state.replace(/_/g, ' ')}`,
    entry_state,
    body_state: body_state || 'optimisation',
    pts_phase: pts_phase || 'No active program',
    constraint_level: constraint_level || 'moderate',
    recovery_status: recovery_status || 'stable',
    uncertainty_level: uncertainty_level || 'moderate',
    protein_anchor_g: Number(protein_anchor_g),
    carb_demand_level,
    meal_frequency: Number(meal_frequency) || 4,
    training_days_per_week: Number(training_days_per_week) || 3,
    food_exclusions: food_exclusions || [],
  }

  const systemPrompt = buildNutritionSystemPrompt()
  const userPrompt = buildNutritionUserPrompt(inputs, cffsText, intakeText, previousPlans)

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = message.content[0]
  if (content.type !== 'text') return NextResponse.json({ error: 'Unexpected AI response' }, { status: 500 })

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Could not parse nutrition plan output' }, { status: 500 })

  let plan: Record<string, unknown>
  try {
    plan = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'JSON parse failed' }, { status: 500 })
  }

  // Save as draft
  const { data: savedPlan, error: saveError } = await admin
    .from('nutrition_plans')
    .insert({
      client_id,
      plan_name: (plan.plan_name as string) || inputs.plan_name,
      entry_state: plan.entry_state || entry_state,
      body_state: inputs.body_state,
      pts_phase: inputs.pts_phase,
      constraint_level: inputs.constraint_level,
      recovery_status: inputs.recovery_status,
      uncertainty_level: inputs.uncertainty_level,
      protein_anchor_g: plan.protein_anchor_g || inputs.protein_anchor_g,
      carb_demand_level: plan.carb_demand_level || inputs.carb_demand_level,
      estimated_calorie_band: plan.estimated_calorie_band || null,
      meal_frequency: plan.meal_frequency || inputs.meal_frequency,
      modulation_level: plan.modulation_level,
      active_strategies: plan.active_strategies || [],
      nutrient_timing_permission: plan.nutrient_timing_permission || 'prohibited',
      peri_workout_config: plan.peri_workout_config || null,
      meals: plan.meals || [],
      training_day_adjustments: plan.training_day_adjustments || null,
      rest_day_adjustments: plan.rest_day_structure || null,
      food_selection_guidelines: plan.food_selection_guidelines || [],
      substitution_options: plan.substitution_options || null,
      execution_rules: plan.execution_rules || [],
      what_not_to_change: plan.what_not_to_change || [],
      entry_state_summary: plan.entry_state_summary || null,
      key_priorities: plan.key_priorities || [],
      weekly_structure_notes: plan.weekly_structure_notes || null,
      progression_notes: plan.progression_notes || null,
      confidence_level: plan.confidence_level || 'moderate',
      simplification_required: plan.simplification_required || false,
      deescalation_triggered: plan.deescalation_triggered || false,
      status: 'draft',
      is_active: false,
    })
    .select('id')
    .single()

  if (saveError) {
    console.error('Save error:', saveError)
    return NextResponse.json({ error: 'Failed to save nutrition plan' }, { status: 500 })
  }

  return NextResponse.json({ plan_id: savedPlan.id, client_id })
}
