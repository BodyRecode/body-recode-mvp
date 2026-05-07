import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildNutritionSystemPrompt, buildNutritionUserPrompt, NutritionPrescriptionInputs } from '@/lib/nutrition-prompt'

export const maxDuration = 300

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
      .select('id, date_of_birth, gender, primary_goal, training_days_available, injury_location_current, injury_primary_concern, nutrition_responses, sleep_responses, stress_responses, training_responses')
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

  // Bodyweight is captured on the baseline submission (the intakes table
  // doesn't carry a flat bodyweight column).
  const bodyweightKg = baseline?.bodyweight_kg ?? null
  const bodyweightSource = baseline?.bodyweight_kg
    ? `baseline (${baseline.captured_at?.slice(0, 10) ?? 'date unknown'})`
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
  // hasn't been submitted yet. Age derived from date_of_birth; sex from
  // gender. Lifestyle / sleep / nutrition signals come from JSONB response
  // blobs.
  const ageFromDob = intake?.date_of_birth
    ? Math.floor((Date.now() - new Date(intake.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const intakeLines: string[] = []
  intakeLines.push(`Bodyweight: ${bodyweightKg ? `${bodyweightKg}kg${bodyweightSource ? ` (from ${bodyweightSource})` : ''}` : 'Not provided'}`)
  intakeLines.push(`Age: ${ageFromDob ?? 'Not provided'}`)
  intakeLines.push(`Sex: ${intake?.gender || 'Not provided'}`)
  if (intake) {
    if (intake.primary_goal) intakeLines.push(`Primary goal: ${intake.primary_goal}`)
    if (intake.training_days_available) intakeLines.push(`Training days available: ${intake.training_days_available}`)
    if (intake.injury_location_current) intakeLines.push(`Current injuries: ${intake.injury_location_current}`)
    if (intake.injury_primary_concern) intakeLines.push(`Primary injury concern: ${intake.injury_primary_concern}`)
    if (intake.nutrition_responses) intakeLines.push(`Nutrition response blob (nut_01..nut_25, scale 0-4): ${JSON.stringify(intake.nutrition_responses)}`)
    if (intake.sleep_responses) intakeLines.push(`Sleep response blob (scale 0-4): ${JSON.stringify(intake.sleep_responses)}`)
    if (intake.stress_responses) intakeLines.push(`Stress response blob (scale 0-4): ${JSON.stringify(intake.stress_responses)}`)
    if (intake.training_responses) intakeLines.push(`Training response blob (tr_01..tr_30, scale 0-4): ${JSON.stringify(intake.training_responses)}`)
  } else {
    intakeLines.push(`Foundational intake: not yet submitted (using baseline data only).`)
  }
  const intakeText: string | null = intakeLines.join('\n')

  // Floor the protein anchor against bodyweight if known. Coach can pass any
  // value through the form; we only override when the form value falls below
  // the bodyweight × 1.4 floor (catches stale 85g defaults from upstream
  // suggestions when bodyweight wasn't yet wired in).
  const inboundProtein = Number(protein_anchor_g)
  let resolvedProtein = inboundProtein
  if (bodyweightKg) {
    const floor = Math.round(bodyweightKg * 1.4)
    if (!inboundProtein || inboundProtein < floor) {
      const stateNorm = String(entry_state).toLowerCase()
      const multiplier =
        stateNorm.includes('high_output') || stateNorm.includes('high output') ? 2.0
        : stateNorm.includes('training_support') || stateNorm.includes('training support') ? 1.9
        : 1.7
      resolvedProtein = Math.round(bodyweightKg * multiplier)
      console.warn(`[generate-nutrition] Protein floor applied: ${inboundProtein || 'missing'}g → ${resolvedProtein}g (bodyweight ${bodyweightKg}kg × ${multiplier})`)
    }
  }

  const inputs: NutritionPrescriptionInputs = {
    plan_name: plan_name || `Nutrition Plan — ${entry_state.replace(/_/g, ' ')}`,
    entry_state,
    body_state: body_state || 'optimisation',
    pts_phase: pts_phase || 'No active program',
    constraint_level: constraint_level || 'moderate',
    recovery_status: recovery_status || 'stable',
    uncertainty_level: uncertainty_level || 'moderate',
    protein_anchor_g: resolvedProtein,
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
      model: 'claude-haiku-4-5-20251001',
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
