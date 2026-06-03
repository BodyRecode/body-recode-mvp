import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildNutritionSystemPrompt, buildNutritionUserPrompt, NutritionPrescriptionInputs } from '@/lib/nutrition-prompt'
import { getActiveConstraintManifest } from '@/lib/recovery-state-machine'
import { buildRecoveryNutritionPromptSection } from '@/lib/recovery-program-clamp'
import { validateNutritionPlan, normalizeMealAndDayTotals, MealLike, BRIDGE_CEILING_BUFFER, NUTRITION_DOCTRINE_VERSION, detectAppetiteSuppression } from '@/lib/nutrition-validation'
import { emitValidatorEvent, type ValidatorEventTier, type ValidatorEventFinalOutcome } from '@/lib/nutrition-telemetry'
import { randomUUID } from 'crypto'
import { extractFirstJsonObject } from '@/lib/extract-json'

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
    transitional_override_active,
    transitional_override_floor_kcal,
    transitional_override_justification,
  } = body

  if (!client_id || !entry_state || !protein_anchor_g || !carb_demand_level) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Transitional override validation: if the coach has enabled it, both a
  // floor_kcal and a justification are required (audit trail + auto-expiry
  // gating). Otherwise reject before any LLM cost.
  const overrideActive = Boolean(transitional_override_active)
  const overrideFloor = Number(transitional_override_floor_kcal) || 0
  const overrideJustification = String(transitional_override_justification || '').trim()
  if (overrideActive) {
    if (overrideFloor < 800 || overrideFloor > 4000) {
      return NextResponse.json({ error: 'Transitional override floor must be between 800 and 4,000 kcal.' }, { status: 400 })
    }
    if (overrideJustification.length < 20) {
      return NextResponse.json({ error: 'Transitional override requires a justification (≥20 characters) explaining the clinical reason for prescribing below the bodyweight floors.' }, { status: 400 })
    }
  }

  const admin = createAdminClient()

  const [
    { data: client },
    { data: cffs },
    { data: intake },
    { data: baseline },
    { data: previousPlans },
  ] = await Promise.all([
    admin.from('clients').select('id, name, medications').eq('id', client_id).maybeSingle(),
    admin.from('cffs').select('*').eq('client_id', client_id).eq('is_archived', false).maybeSingle(),
    admin.from('intakes')
      .select('id, date_of_birth, gender, primary_goal, training_days_available, injury_location_current, injury_primary_concern, nutrition_responses, sleep_responses, stress_responses, training_responses, dietary_restrictions, dietary_preferences, typical_day_eating, meals_per_day, fluid_intake, caffeine_intake, alcohol_intake, eating_context')
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
    // Dietary context: HARD-CONSTRAINT free-text from Section D. Surface
    // each field with its own label so the engine treats restrictions and
    // preferences as constraints to never violate, the typical day as the
    // baseline to design FROM, and eating context as adherence design info.
    if (intake.dietary_restrictions) intakeLines.push(`\nDIETARY RESTRICTIONS (allergies, intolerances, medical — HARD CONSTRAINT, never violate):\n${intake.dietary_restrictions}`)
    if (intake.dietary_preferences) intakeLines.push(`\nDIETARY PREFERENCES (personal, cultural, religious, framework — HARD CONSTRAINT):\n${intake.dietary_preferences}`)
    if (intake.typical_day_eating) intakeLines.push(`\nTYPICAL DAY'S EATING (baseline to design FROM):\n${intake.typical_day_eating}`)
    if (intake.meals_per_day) intakeLines.push(`\nMEALS PER DAY (current eating frequency baseline; see appetite-suppression meal-count rules):\n${intake.meals_per_day}`)
    if (intake.fluid_intake) intakeLines.push(`\nDAILY FLUIDS (water and other drinks; factor sugary/caloric drinks into the energy picture):\n${intake.fluid_intake}`)
    if (intake.caffeine_intake) intakeLines.push(`\nDAILY CAFFEINE (timing matters for sleep, appetite and stimulant interactions):\n${intake.caffeine_intake}`)
    if (intake.alcohol_intake) intakeLines.push(`\nALCOHOL INTAKE (caloric load, sleep and recovery impact; design realistically around it, do not moralise):\n${intake.alcohol_intake}`)
    if (intake.eating_context) intakeLines.push(`\nEATING ENVIRONMENT (shapes adherence design):\n${intake.eating_context}`)
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
    // Pass the bridge mode band to the prompt so the LLM has an explicit
    // target. Without this the model only knows the bodyweight-derived
    // floors (which are skipped under bridge mode) and produces drastically
    // undersized plans because every other doctrine signal pushes
    // conservative.
    // Ceiling sent to the LLM matches the validator's enforced buffer exactly.
    // Drift was the #3 audit finding on 2026-05-25 (prompt said +100, validator
    // allowed +150 — model targeted tighter band than needed, more retries).
    transitional_target_band: overrideActive
      ? { floor_kcal: overrideFloor, ceiling_kcal: overrideFloor + BRIDGE_CEILING_BUFFER }
      : undefined,
  }

  // Recovery and Regulation — Phase 3.
  // If a recovery state is active, inject the nutrition constraint section
  // into the system prompt and write an audit row. There is no post-LLM
  // clamp for nutrition because prescriptions are largely textual.
  const activeRecoveryManifest = await getActiveConstraintManifest(client_id)
  const recoveryPromptSection = activeRecoveryManifest
    ? '\n\n' + buildRecoveryNutritionPromptSection(activeRecoveryManifest.playbook)
    : ''

  const systemPrompt = buildNutritionSystemPrompt() + recoveryPromptSection
  const userPrompt = buildNutritionUserPrompt(inputs, cffsText, intakeText, previousPlans, client.medications)

  // Tiered model strategy:
  //   Tier 1: Haiku 4.5 — fast (~15s), passes for typical clients without
  //           tight constraint envelopes. Most plans never need escalation.
  //   Tier 2: Sonnet 4.6 — slow (~60-90s), handles tight constraint
  //           envelopes (stimulant + GLP-1 + SSRI clients near per-meal
  //           protein caps) that Haiku consistently overshoots.
  //
  // Sequence:
  //   1. Haiku no-correction attempt (~15s)
  //   2. If invalid → Haiku with correction note (~15s)
  //   3. If still invalid → Sonnet with cumulative corrections (~80s)
  //
  // Typical case (no tight constraints): done at step 1 in ~15s.
  // Hard case (Amanda-class): done by step 3 in ~110s.
  // Worst case (Sonnet also fails): 422 to coach with all issues.
  //
  // Prompt caching on the system prompt (huge, identical across all calls
  // within a request and across requests in the cache TTL window) cuts
  // input cost ~90% and time-to-first-token on retries.
  async function callModel(modelId: string, correctionNote: string): Promise<Record<string, unknown>> {
    const finalUserPrompt = correctionNote
      ? `${userPrompt}\n\n═══════════════════════════════════════\nVALIDATION CORRECTION REQUIRED\n═══════════════════════════════════════\nYour previous output was rejected by automatic validation. Issues:\n${correctionNote}\n\nRegenerate the plan correcting every issue above. Recompute every food's macros from the reference table; recompute each meal's protein_g/carb_g/fat_g as the sum of its foods; derive estimated_calorie_band from the meal totals last. Increase portion sizes if necessary to meet the daily floors.`
      : userPrompt
    const message = await anthropic.messages.create({
      model: modelId,
      max_tokens: 16000,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: finalUserPrompt }],
    })
    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected AI response')
    const jsonText = extractFirstJsonObject(content.text)
    if (!jsonText) throw new Error('Could not parse nutrition plan output')
    return JSON.parse(jsonText)
  }

  // Generation + validation loop. The model writes structured foods; we
  // recompute meal-level macros AND the daily calorie band server-side from
  // the food macros (Haiku is unreliable at summing). The validator then only
  // enforces structural rules: foods are structured, protein anchor matches,
  // sane daily safety floors.
  function runValidate(p: Record<string, unknown>) {
    normalizeMealAndDayTotals(p as { meals?: MealLike[]; estimated_calorie_band?: string | null })
    return validateNutritionPlan({
      meals: (p.meals as MealLike[]) || [],
      estimated_calorie_band: (p.estimated_calorie_band as string) || null,
      protein_anchor_g: Number(p.protein_anchor_g) || resolvedProtein,
      bodyweight_kg: bodyweightKg,
      entry_state: String(p.entry_state || entry_state),
      medications: client?.medications ?? null,
      carb_demand_level: (String(p.carb_demand_level || carb_demand_level || '').toLowerCase() as 'low' | 'moderate' | 'high' | '') || null,
      transitional_override: overrideActive ? { active: true, floor_kcal: overrideFloor } : null,
    })
  }

  // Phase 4 commit 4: telemetry. One request_id ties all validation attempts
  // for a single coach generation request together. Helper below emits a row
  // per validator call. Fire-and-forget — failures never block the route.
  const requestId = randomUUID()
  const suppressionFlags = detectAppetiteSuppression(client?.medications ?? null)
  function emitEvent(
    val: ReturnType<typeof runValidate>,
    tier: ValidatorEventTier,
    index: number | null,
    finalOutcome?: ValidatorEventFinalOutcome,
  ) {
    void emitValidatorEvent(admin, {
      client_id,
      doctrine_version: NUTRITION_DOCTRINE_VERSION,
      attempt_tier: tier,
      attempt_index: index,
      ok: val.ok,
      issue_codes: val.issues.map(i => i.code),
      entry_state,
      protein_anchor_g: resolvedProtein,
      meal_frequency: Number(meal_frequency) || 4,
      carb_demand_level: carb_demand_level ?? null,
      has_stimulant: suppressionFlags.has_stimulant,
      has_glp1: suppressionFlags.has_glp1,
      has_serotonergic: suppressionFlags.has_serotonergic,
      transitional_override_active: overrideActive,
      request_id: requestId,
      final_outcome: finalOutcome ?? null,
    })
  }

  // Generation strategy: parallel Haiku attempts → Sonnet fallback.
  // Each Haiku call takes ~40s (output is the limiting factor — full
  // nutrition plan with structured foods is ~3-5k output tokens). Three
  // parallel Haiku attempts also take ~40s wall-clock — we just pick the
  // first one that validates. If all three fail, escalate to Sonnet.
  // Plain prompt cache means parallel calls share input cost.
  //
  // Wall-clock timing:
  //   Typical (Haiku passes):     ~40s
  //   Hard case (Sonnet fallback): ~40s + ~80s = ~120s
  //   Pre-tiering was ~180s+.
  const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
  const SONNET_MODEL = 'claude-sonnet-4-6'
  const HAIKU_PARALLEL_ATTEMPTS = 3

  let plan: Record<string, unknown> = {}
  let validation: ReturnType<typeof runValidate> | undefined

  function summariseIssues(label: string, val: { issues: Array<{ code: string; message: string }> }) {
    console.warn(`[generate-nutrition] ${label} failed:`, val.issues.map(i => i.code))
    console.warn(`[generate-nutrition] ${label} detail:\n` + val.issues.map(i => `  - [${i.code}] ${i.message}`).join('\n'))
  }

  try {
    // Tier 1: N parallel Haiku attempts (same prompt, model non-determinism
    // produces diverse outputs). Take the first one that passes validation;
    // if none pass, keep the one with the FEWEST issues to feed as the
    // correction note for Sonnet escalation.
    const startMs = Date.now()
    const haikuResults = await Promise.all(
      Array.from({ length: HAIKU_PARALLEL_ATTEMPTS }, async (_, i) => {
        try {
          const p = await callModel(HAIKU_MODEL, '')
          const v = runValidate(p)
          return { i, p, v, error: null as string | null }
        } catch (e) {
          return { i, p: {} as Record<string, unknown>, v: null as ReturnType<typeof runValidate> | null, error: e instanceof Error ? e.message : String(e) }
        }
      })
    )
    console.warn(`[generate-nutrition] Parallel Haiku (${HAIKU_PARALLEL_ATTEMPTS}) took ${Date.now() - startMs}ms`)
    for (const r of haikuResults) {
      if (r.error) console.warn(`[generate-nutrition] Haiku attempt ${r.i + 1} threw:`, r.error)
      else console.warn(`[generate-nutrition] Haiku attempt ${r.i + 1} ok=${r.v?.ok}, issues=${r.v?.issues.length ?? '?'}`)
    }
    const passed = haikuResults.find(r => r.v?.ok)
    if (passed && passed.v) {
      plan = passed.p
      validation = passed.v
      // Telemetry: emit one event per haiku attempt. The passing attempt
      // carries the final_outcome; others are tagged null so the dashboard
      // can compute per-attempt rates AND per-request outcomes.
      for (const r of haikuResults) {
        if (r.v) emitEvent(r.v, 'haiku', r.i, r === passed ? 'passed_first_haiku' : undefined)
      }
    } else {
      // None passed. Pick the "least bad" attempt — used both as the
      // correction note for Sonnet AND as the surfaced result if Sonnet
      // itself throws (audit finding #11: previously a Sonnet exception
      // discarded all Haiku candidates and returned a 500 with just the
      // error string, losing the coach's chance to see what the engine
      // got close to).
      const bestHaiku = haikuResults
        .filter(r => r.v)
        .sort((a, b) => (a.v!.issues.length - b.v!.issues.length))[0]
      const correctionNote = bestHaiku?.v
        ? bestHaiku.v.issues.map(i => `- ${i.message}`).join('\n')
        : ''

      // Tier 2: Sonnet escalation. Wrap in its own try/catch so that an
      // exception (model unavailable, rate limit, network) falls back to
      // the best Haiku candidate instead of throwing away the whole
      // generation.
      console.warn('[generate-nutrition] All Haiku attempts failed validation — escalating to Sonnet')
      // Telemetry: emit one event per failed Haiku attempt before the Sonnet
      // call. Final outcome tag goes on the Sonnet event below.
      for (const r of haikuResults) {
        if (r.v) emitEvent(r.v, 'haiku', r.i)
      }
      const sonnetStart = Date.now()
      try {
        plan = await callModel(SONNET_MODEL, correctionNote)
        validation = runValidate(plan)
        console.warn(`[generate-nutrition] Sonnet attempt took ${Date.now() - sonnetStart}ms, ok=${validation.ok}`)
        if (!validation.ok) {
          summariseIssues('Sonnet (final)', validation)
          console.warn('[generate-nutrition] All tiers exhausted. Final meal summary:', JSON.stringify(
            (plan.meals as MealLike[] | undefined)?.map(m => ({
              name: m.meal_name,
              P: m.protein_g, C: m.carb_g, F: m.fat_g,
              food_count: Array.isArray(m.foods) ? m.foods.length : 0,
            })) ?? [], null, 2))
        }
        emitEvent(validation, 'sonnet', null, validation.ok ? 'sonnet_escalation_succeeded' : 'returned_422_to_coach')
      } catch (sonnetErr) {
        const msg = sonnetErr instanceof Error ? sonnetErr.message : String(sonnetErr)
        console.warn(`[generate-nutrition] Sonnet threw (${msg}) — falling back to best Haiku candidate`)
        if (bestHaiku?.v && bestHaiku.p) {
          plan = bestHaiku.p
          validation = bestHaiku.v
          // Note the Sonnet failure into the issue list so the 422 message
          // explains why the plan came back invalid (without Sonnet save).
          validation.issues.push({
            code: 'SONNET_ESCALATION_FAILED',
            message: `Sonnet model call threw: ${msg}. Returning best Haiku candidate (${bestHaiku.v.issues.length} validator issues) so you can see what the engine produced.`,
          })
          emitEvent(validation, 'sonnet', null, 'sonnet_escalation_failed')
        } else {
          // No usable Haiku candidates either — re-throw to outer catch.
          throw sonnetErr
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  if (!validation || !validation.ok) {
    return NextResponse.json({
      error: 'Generated plan failed validation across all Haiku attempts + Sonnet escalation',
      issues: validation?.issues ?? [],
      totals: validation?.totals ?? null,
      band: validation?.band ?? null,
    }, { status: 422 })
  }

  // Save as draft. Transitional override (Phase 3A) is appended only when
  // active so older deployments without the migration don't blow up on
  // unknown columns — the insert silently omits the override fields.
  // When the migration has been run, the override + auto-computed expiry
  // (4 weeks from now) are persisted alongside the plan.
  const insertRow: Record<string, unknown> = {
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
    // Phase 4 commit 2: stamp the doctrine version. Coach view diffs this
    // against the current constant to flag stale plans. Wrapped by the same
    // graceful-degradation retry below as the bridge-mode columns so the
    // route doesn't blow up if the migration hasn't been run yet.
    doctrine_version: NUTRITION_DOCTRINE_VERSION,
  }
  if (overrideActive) {
    insertRow.transitional_override_active = true
    insertRow.transitional_override_floor_kcal = overrideFloor
    insertRow.transitional_override_justification = overrideJustification
    // Default expiry: 2 weeks. Bridge progression should happen in stages
    // of ~100 kcal/week — reverse-dieting / appetite-rebuilding doctrine
    // says faster than that risks GI distress and adherence failure. Two-week
    // cadence means each bridge plan is ONE STAGE; coach reviews check-ins,
    // decides whether to step up (+200) or hold the current floor.
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 14)
    insertRow.transitional_override_expires_at = expiry.toISOString()
  }
  let { data: savedPlan, error: saveError } = await admin
    .from('nutrition_plans')
    .insert(insertRow)
    .select('id')
    .single()

  // Graceful degradation: if any of the additive Phase 3 (override) or
  // Phase 4 (doctrine_version) columns don't exist yet (migration not run),
  // retry without them so the plan still ships. Coach loses the audit trail
  // / version tag until migration runs, but generation isn't blocked.
  if (saveError && /column .* does not exist|transitional_override|doctrine_version/i.test(saveError.message)) {
    console.warn('[generate-nutrition] additive columns missing — retrying insert without them. Run sql/2026-05-25_nutrition_transitional_override.sql and sql/2026-05-26_nutrition_doctrine_version.sql to enable persistence.')
    delete insertRow.transitional_override_active
    delete insertRow.transitional_override_floor_kcal
    delete insertRow.transitional_override_justification
    delete insertRow.transitional_override_expires_at
    delete insertRow.doctrine_version
    const retry = await admin.from('nutrition_plans').insert(insertRow).select('id').single()
    savedPlan = retry.data
    saveError = retry.error
  }

  if (saveError) {
    console.error('Save error:', saveError)
    return NextResponse.json({ error: 'Failed to save nutrition plan' }, { status: 500 })
  }

  // Recovery audit row when an active state's nutrition constraints were applied
  if (activeRecoveryManifest) {
    await admin.from('recovery_adjustments').insert({
      client_id,
      recovery_state_id: activeRecoveryManifest.state.id,
      event_type: 'constraint_applied',
      trigger_type: 'nutrition_generation',
      signals_acknowledged: { active_playbook: activeRecoveryManifest.playbook.id, days_active: activeRecoveryManifest.state.days_active },
      constraints_recognised: { nutrition: activeRecoveryManifest.playbook.nutritionConstraints },
      uncertainties_held: 'Nutrition prompt-injected with recovery constraints; no post-LLM clamp (textual prescription).',
      permissible_category: activeRecoveryManifest.playbook.permissibleCategory,
      authorisation_decision: 'authorised',
      observe_only: false,
    })
  }

  if (!savedPlan) {
    return NextResponse.json({ error: 'Failed to save nutrition plan' }, { status: 500 })
  }
  return NextResponse.json({ plan_id: savedPlan.id, client_id })
}
