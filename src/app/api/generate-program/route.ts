import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { cffsStateForAnyStateLabel } from '@/lib/pattern-doctrine'
import { deriveReadinessCarryForward, applyReadinessCarryForward } from '@/lib/readiness-carry-forward'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveEffectiveTier, clampProgramToDoctrine, requiresFullBodySessions, enforceUpperLowerBias } from '@/lib/training-doctrine'
import { getActiveConstraintManifest } from '@/lib/recovery-state-machine'
import { clampProgramToRecoveryManifest, buildRecoveryPromptSection } from '@/lib/recovery-program-clamp'
import {
  buildProgramSystemPrompt,
  buildProgramUserPrompt,
  ProgramPrescriptionInputs,
  ExerciseRow,
} from '@/lib/program-prompt'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { withTemporalContext } from '@/lib/temporal-context'
import { AI_MODELS, AI_EFFORT } from '@/lib/ai-models'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export const maxDuration = 300

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const body = await request.json()
  return runProgramGenerationInternal(body)
}

/**
 * Internal generation entrypoint. Skips the coach auth check so server-side
 * admin scripts can generate a block for one client without a browser session.
 * Mirrors `runNutritionGenerationInternal` in generate-nutrition/route.ts,
 * which exists for the same reason. Everything it produces is still a DRAFT:
 * publishing stays a separate, deliberate coach action.
 *
 * Extracted 2026-08-30. Do NOT call this from anything reachable without auth.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runProgramGenerationInternal(body: any): Promise<NextResponse> {
  const {
    client_id,
    cffs_id,
    intake_id,
    plan_block_id,
    prescription_rationale,
    training_frequency,
    training_goal,
    training_age,
    movement_competency,
    progression_phase,
    equipment_access,
    week_duration,
    block_name,
    preferred_training_days,
    // Phase 3 soft-gate override: when present, recovery clamp is skipped
    // and an override audit row is written instead.
    recovery_override_reason,
    // 2026-08-30. Carries a Progress Read re-score forward into this block
    // WITHOUT touching the CFFS. The Progress Read writes its re-scored state
    // to programs.tr_new_body_state, but this generator reads
    // cffs.body_state_classification, so a re-score never reached the block it
    // was collected to inform. Accepts either vocabulary (Depleted /
    // Transitioning / Ready, or Remediation / Optimisation / Post-Optimisation).
    // Pattern stays HELD: only a full 234 re-intake may revise the CFFS.
    body_state_override,
    body_state_override_reason,
    // 2026-08-30. Programmed endurance sessions in the client's week (runs,
    // rides, swims). Coach-declared: nothing in the schema records endurance
    // load, `conditioning` is free text and every program is modality
    // 'strength'. Above zero, the doctrine aims at the phase/tier floor
    // instead of the middle of the range. See getSetsPerSessionRange.
    concurrent_endurance_sessions,
    // 2026-08-30. Opt in to carrying re-scored exposure readiness from the
    // recent weekly syntheses. See readiness-carry-forward.ts for why the CFFS
    // values alone are wrong: they are scored once at intake and never move,
    // while readiness is genuinely re-scored every week in the CFWS.
    carry_readiness,
    // 2026-08-31. Coach-declared upper/lower emphasis for a full-body block.
    // 'upper' | 'lower' | null. Distribution was previously only REPORTED, and
    // only when endurance was declared, so asking for it in the prompt did
    // nothing: Greg's Block 2 was regenerated three times and drifted further
    // from the ask each run. See enforceUpperLowerBias.
    upper_lower_bias,
  } = body

  if (!client_id || !training_frequency || !training_goal || !training_age || !movement_competency || !progression_phase || !equipment_access || !week_duration || !block_name) {
    return NextResponse.json({ error: 'Missing required prescription inputs' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch client
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id, name, medications, fixed_session_day')
    .eq('id', client_id)
    .maybeSingle()

  if (clientError) console.error('Client fetch error:', clientError)
  if (!client) return NextResponse.json({ error: `Client not found (id: ${client_id}, db error: ${clientError?.message ?? 'none'})` }, { status: 404 })

  // Fixed in-person coaching day(s): recurring slots + the legacy single day.
  // These become mandatory + anchor sessions in the generated program.
  const { data: fixedSlots } = await admin
    .from('client_fixed_slots')
    .select('day_of_week')
    .eq('client_id', client_id)
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const fixedDayInts = new Set<number>()
  for (const s of fixedSlots ?? []) if (typeof s.day_of_week === 'number') fixedDayInts.add(s.day_of_week)
  if (typeof client.fixed_session_day === 'number') fixedDayInts.add(client.fixed_session_day)
  const anchorDays = [...fixedDayInts].sort((a, b) => a - b).map(i => DAY_NAMES[i]).filter(Boolean)

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

  // Body-state override (2026-08-30). Translate to the internal CFFS
  // vocabulary and REJECT anything unrecognised — passing an unknown state
  // into the prompt silently derives the wrong eligibility level rather than
  // failing loudly. Nothing here writes to the cffs table.
  let effectiveCffs = cffs
  let appliedBodyStateOverride: string | null = null
  if (body_state_override) {
    const mapped = cffsStateForAnyStateLabel(body_state_override)
    if (!mapped) {
      return NextResponse.json(
        { error: `Unrecognised body_state_override "${body_state_override}". Expected Depleted | Transitioning | Ready, or Remediation | Optimisation | Post-Optimisation.` },
        { status: 400 }
      )
    }
    if (!cffs) {
      return NextResponse.json(
        { error: 'body_state_override requires an existing CFFS to override. Generate the foundational read first.' },
        { status: 400 }
      )
    }
    appliedBodyStateOverride = mapped
    // Shallow copy so the override reaches the prompt and the persisted row
    // without mutating the fetched CFFS object.
    effectiveCffs = { ...cffs, body_state_classification: mapped }
  }

  // Readiness carry-forward (2026-08-30). Derived server-side from the weekly
  // syntheses so the coach cannot hand-type a clamp, but applied only on
  // explicit opt-in so the suggest page shows exactly what will change first.
  let readinessCarry = null
  if (cffs) {
    const { data: weeklyRows } = await admin
      .from('cfws')
      .select('week_number, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour')
      .eq('client_id', client_id)
      .eq('is_archived', false)
      .order('week_number', { ascending: false })
      .limit(12)
    readinessCarry = deriveReadinessCarryForward(weeklyRows ?? [], cffs)
    if (carry_readiness && readinessCarry.hasChange) {
      effectiveCffs = applyReadinessCarryForward(effectiveCffs!, readinessCarry)
    }
  }
  const appliedReadinessCarry =
    carry_readiness && readinessCarry?.hasChange ? readinessCarry : null

  // Declared here rather than at the clamp: both the PROMPT (which shapes what
  // the model writes) and the clamp (which is only a backstop) need it.
  const enduranceSessions = Number.isFinite(Number(concurrent_endurance_sessions))
    ? Math.max(0, Math.floor(Number(concurrent_endurance_sessions)))
    : 0

  // Fetch injury context and training days from intake
  let injuryContext = {
    injury_location_current: [] as string[],
    injury_primary_concern: '',
    injury_aggravating_movements: '',
  }
  let intakeTrainingDays: string[] = []

  const intakeSelectFields = 'injury_location_current, injury_primary_concern, injury_aggravating_movements, training_days_available'

  if (intake_id) {
    const { data: intake } = await admin
      .from('intakes')
      .select(intakeSelectFields)
      .eq('id', intake_id)
      .maybeSingle()
    if (intake) {
      injuryContext = {
        injury_location_current: intake.injury_location_current || [],
        injury_primary_concern: intake.injury_primary_concern || '',
        injury_aggravating_movements: intake.injury_aggravating_movements || '',
      }
      intakeTrainingDays = intake.training_days_available || []
    }
  } else {
    // Use most recent intake
    const { data: intake } = await admin
      .from('intakes')
      .select(intakeSelectFields)
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
      intakeTrainingDays = intake.training_days_available || []
    }
  }

  // Use preferred_training_days from request body if provided, otherwise fall back to intake data.
  // Fixed in-person day(s) are unioned in so they're always in the pool, even if
  // the coach didn't explicitly pick them.
  const baseTrainingDays: string[] = (preferred_training_days && preferred_training_days.length > 0)
    ? preferred_training_days
    : intakeTrainingDays
  const resolvedTrainingDays: string[] = Array.from(new Set([...(baseTrainingDays ?? []), ...anchorDays]))

  // Resolve the plan block SERVER-SIDE when the caller did not supply one.
  //
  // Everything below is gated on plan_block_id: the phase objective, the arc
  // shape, what came before and after, and critically the coach guidance. A
  // caller that omits it gets a program detached from the macro arc, with the
  // coach's standing instructions silently discarded. No error, no warning,
  // just absent. The co-pilot panel did exactly this and produced an RPE 8
  // Restoration block for a client whose coach guidance was never read.
  //
  // Rather than fix one caller, resolve it here so every caller is covered.
  let resolvedBlockId: string | null = plan_block_id ?? null
  let arcWarning: string | null = null

  if (!resolvedBlockId) {
    const { data: candidateBlocks } = await admin
      .from('plan_blocks')
      .select('id, position, block_name, status')
      .eq('client_id', client_id)
      .in('status', ['in_progress', 'planned'])
      .order('position', { ascending: true })
      .limit(1)

    if (candidateBlocks?.length) {
      resolvedBlockId = candidateBlocks[0].id
      console.log(
        `[generate-program] no plan_block_id supplied; resolved to block ` +
        `${candidateBlocks[0].position} ("${candidateBlocks[0].block_name}") for client ${String(client_id).slice(0, 8)}`
      )
    } else {
      // Does the client have an arc at all? If they do and we still cannot
      // resolve a block, that is worth surfacing rather than swallowing.
      const { count: arcBlocks } = await admin
        .from('plan_blocks')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client_id)
      if ((arcBlocks ?? 0) > 0) {
        arcWarning =
          'This client has a macro arc but no in-progress or planned block could be resolved, ' +
          'so this program was generated detached from it. The phase objective, arc context and ' +
          'any standing coach guidance were NOT applied. Check the block statuses on their plan.'
        console.warn(`[generate-program] ${arcWarning} client=${String(client_id).slice(0, 8)}`)
      }
    }
  }

  // Fetch macro plan context if a plan block is available
  let macroPlanContext = null
  let coachGuidance: string | null = null
  if (resolvedBlockId) {
    const { data: planBlock } = await admin
      .from('plan_blocks')
      .select('*, training_plans(plan_name, macro_objective, coach_guidance)')
      .eq('id', resolvedBlockId)
      .maybeSingle()

    if (planBlock) {
      // Fetch all blocks in the plan to give Claude the full arc context
      const { data: allBlocks } = await admin
        .from('plan_blocks')
        .select('position, block_name, progression_phase, training_goal, week_duration, status, execution_arc, phase_objective')
        .eq('plan_id', planBlock.plan_id)
        .order('position', { ascending: true })

      // Find previous completed block and next planned block
      const prevBlock = allBlocks?.filter(b => b.position < planBlock.position && b.status === 'complete').pop() ?? null
      const nextBlock = allBlocks?.find(b => b.position > planBlock.position) ?? null

      const trainingPlan = planBlock.training_plans as
        | { plan_name: string; macro_objective: string | null; coach_guidance: string | null }
        | null

      macroPlanContext = {
        plan_name: trainingPlan?.plan_name,
        macro_objective: trainingPlan?.macro_objective,
        current_block_position: planBlock.position,
        total_blocks: allBlocks?.length ?? 1,
        phase_category: planBlock.phase_category,
        execution_arc: planBlock.execution_arc,
        phase_objective: planBlock.phase_objective,
        previous_block: prevBlock ? `Block ${prevBlock.position}: ${prevBlock.block_name} (${prevBlock.progression_phase}, ${prevBlock.training_goal}, ${prevBlock.week_duration}w) — ${prevBlock.status}` : null,
        next_block: nextBlock ? `Block ${nextBlock.position}: ${nextBlock.block_name} (${nextBlock.progression_phase}, ${nextBlock.training_goal}, ${nextBlock.week_duration}w) — planned` : null,
      }

      // Standing coach guidance — applied on every generation tied to this arc.
      // Authority is bounded by the rules in program-prompt.ts system prompt
      // ("COACH GUIDANCE (CONTEXT-LEVEL OVERRIDE)").
      coachGuidance = trainingPlan?.coach_guidance ?? null

      // Mark the plan block as in_progress
      await admin.from('plan_blocks').update({ status: 'in_progress' }).eq('id', resolvedBlockId).eq('status', 'planned')
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
    movement_competency,
    progression_phase,
    equipment_access,
    week_duration,
    block_name,
    preferred_training_days: resolvedTrainingDays,
    anchor_days: anchorDays,
    ...injuryContext,
  }

  if (coachGuidance) {
    console.log('[generate-program] Coach guidance applied:', coachGuidance.slice(0, 120))
  }

  // Recovery and Regulation — Phase 3.
  // If the client has an active recovery state, read its constraint manifest.
  // We inject the manifest into the system prompt so Claude generates a
  // program already respecting the constraints, then clamp post-LLM as
  // defence in depth. If the coach has provided a documented override
  // reason, we skip the clamp but still log the override for audit.
  const activeRecoveryManifest = await getActiveConstraintManifest(client_id)
  const recoveryPromptSection = activeRecoveryManifest && !recovery_override_reason
    ? '\n\n' + buildRecoveryPromptSection(activeRecoveryManifest.playbook)
    : ''

  // Generate program via Claude. Switched from Sonnet 4.6 to Haiku 4.5 for
  // speed (~3-5x faster). Programs are structure-heavy and rule-driven, so
  // the smaller model holds up well; revisit if quality drops.
  //
  // Retry loop + truncation guard (2026-07-11), matching generate-cffs. The
  // program JSON is the largest artefact the engine emits (every session x
  // exercise x set), so the old single-shot 6000-token cap truncated
  // mid-object for 4-5 day blocks: extractFirstJsonObject returned null and
  // the coach saw the opaque "Could not parse program" error that only cleared
  // on a lucky re-click. Unacceptable for white-label coaches. Now: 12k cap,
  // explicit stop_reason === 'max_tokens' detection, empty-content guard,
  // sessions-present check, 3 attempts, then a specific honest failure.
  // Raised from 12000 on 2026-07-29. The 12k cap was set against Haiku, which
  // writes tersely. Sonnet writes fuller sessions and coaching notes, so it hit
  // the cap, the truncation guard fired a retry, and the retry is what pushed
  // the request past the function limit. Truncation was the cause; the timeout
  // was only the symptom. Raising the ceiling removes the retry entirely in the
  // normal case.
  // 20000 was still not enough. Production logs, 2026-07-30:
  //   attempt 1/3: AI returned no text content (stop_reason=max_tokens)
  //   Vercel Runtime Timeout Error: Task timed out after 300 seconds
  //
  // No text block at all, meaning the budget was consumed before any output was
  // written. The local timing test passed at 20k only because it used a short
  // instruction; the real prompt carries 76 exercises, the macro arc context and
  // the coach guidance, so the model works far harder.
  const MAX_TOKENS = 32000
  // Evolving-any (bare `= null`), matching the original untyped JSON.parse
  // result, so the downstream doctrine/recovery clamps keep their loose access.
  let programData = null
  let lastError = 'unknown error'

  // Time budget. maxDuration is 300s and a single Sonnet pass at 12k tokens can
  // run for two to three minutes, so three blind retries walk straight past the
  // limit. When that happens Vercel returns its own HTML error page, the client
  // calls res.json() on it, and the coach sees
  // `Unexpected token 'A', "An error o"... is not valid JSON`, which says
  // nothing about what went wrong. Better to stop early and fail honestly in
  // JSON than to be killed mid-flight.
  const startedAt = Date.now()
  const TIME_BUDGET_MS = 240_000
  const elapsed = () => Date.now() - startedAt

  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1 && elapsed() > TIME_BUDGET_MS) {
      lastError = `${lastError} (stopped after ${Math.round(elapsed() / 1000)}s to return a real error rather than time out)`
      break
    }
    let message
    try {
      // Streamed rather than buffered. At this output size a non-streaming call
      // holds the whole response in memory and gives no signal until it is
      // finished, so a run that overshoots looks identical to a hung one.
      message = await anthropic.messages.stream({
        model: AI_MODELS.clinical,
        max_tokens: MAX_TOKENS,
        // Measured, not guessed. See AI_EFFORT: default effort took 307s and
        // 31.6k tokens to produce a WORSE program than low effort does in 71s
        // and 7.6k. This is assembly work, not analysis.
        output_config: { effort: AI_EFFORT.assembly } as never,
        system: withTemporalContext(buildProgramSystemPrompt() + recoveryPromptSection),
        messages: [{ role: 'user', content: buildProgramUserPrompt(client.name, inputs, effectiveCffs, exercises as ExerciseRow[], macroPlanContext, client.medications, coachGuidance, appliedBodyStateOverride ? { state: appliedBodyStateOverride, original: cffs?.body_state_classification ?? null, reason: body_state_override_reason ?? null } : null, appliedReadinessCarry, enduranceSessions) }],
      }).finalMessage()
    } catch (err) {
      lastError = `AI error: ${err instanceof Error ? err.message : String(err)}`
      console.error(`[generate-program] Anthropic API error (attempt ${attempt}/3):`, lastError)
      continue
    }

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      lastError = `AI returned no text content (stop_reason=${message.stop_reason})`
      console.warn(`[generate-program] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    console.log(`[generate-program] attempt ${attempt}/3 response (stop_reason=${message.stop_reason}, first 300):`, textBlock.text.slice(0, 300))

    // Retrying an identical request with an identical cap truncates identically.
    // The old loop did it twice more and spent the whole function budget proving
    // it, which is how a truncation turned into a 504 with no usable error.
    if (message.stop_reason === 'max_tokens') {
      lastError =
        `The program came back longer than the ${MAX_TOKENS}-token limit allows. ` +
        `Retrying would truncate the same way, so this stopped instead of timing out. ` +
        `Reduce the block's week duration or session count and try again.`
      console.error(`[generate-program] hit max_tokens at ${MAX_TOKENS}, not retrying`)
      break
    }
    const jsonText = extractFirstJsonObject(textBlock.text)
    if (!jsonText) {
      lastError = `Could not locate a JSON object in AI output: ${textBlock.text.slice(0, 200)}`
      console.warn(`[generate-program] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    let candidate
    try {
      candidate = JSON.parse(jsonText)
    } catch (err) {
      lastError = `JSON parse failed: ${(err as Error).message}`
      console.warn(`[generate-program] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    // A truncated-but-parseable object can still be missing the sessions array.
    // Never save a program with no training sessions.
    if (!Array.isArray(candidate.sessions) || candidate.sessions.length === 0) {
      lastError = 'AI output contained no training sessions'
      console.warn(`[generate-program] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    // Every working exercise name MUST exist in the approved library. The
    // downstream clamp silently skips names it does not recognise, so without
    // this a hallucinated or renamed exercise would ship — the "approved
    // library only" rule was prompt-only until here. Movement prep is free-text
    // by design (a separate string array) and is not checked. Skipped if the
    // library failed to load, so an empty library never blocks generation.
    const libraryNames = new Set<string>(
      (exercises ?? [])
        .filter((e: { name?: string }) => e?.name)
        .map((e: { name: string }) => e.name.trim().toLowerCase())
    )
    if (libraryNames.size > 0) {
      const unknownExercises: string[] = []
      for (const session of candidate.sessions as Array<{ blocks?: Array<{ exercises?: Array<{ name?: string }> }> }>) {
        for (const block of session.blocks ?? []) {
          for (const ex of block.exercises ?? []) {
            const nm = (ex?.name ?? '').trim()
            if (nm && !libraryNames.has(nm.toLowerCase())) unknownExercises.push(nm)
          }
        }
      }
      if (unknownExercises.length > 0) {
        lastError = `AI produced exercises not in the approved library: ${[...new Set(unknownExercises)].slice(0, 8).join(', ')}`
        console.warn(`[generate-program] attempt ${attempt}/3: ${lastError}`)
        continue
      }
    }

    programData = candidate
    break
  }

  if (!programData) {
    console.error('[generate-program] generation failed after 3 attempts:', lastError)
    return NextResponse.json(
      { error: `Program generation failed after 3 attempts (${lastError}). Please try again.` },
      { status: 500 }
    )
  }

  // Doctrine enforcement — never trust the LLM for RPE ceilings or set
  // counts. Walks every session/block/exercise and clamps to the floor
  // implied by the client's effective training tier (training_age shifted
  // up by hormonal-class signal load read out of the medications text)
  // and the prescribed phase.
  const effectiveTier = resolveEffectiveTier(
    training_age as 'beginner' | 'intermediate' | 'advanced',
    client.medications
  )
  const phaseForDoctrine = (['restoration', 'accumulation', 'intensification', 'realization']
    .includes(progression_phase) ? progression_phase : 'accumulation') as 'restoration' | 'accumulation' | 'intensification' | 'realization'
  // Exercise name -> movement pattern, so the clamp can verify the full-body rule.
  const patternByName = new Map<string, string>(
    (exercises ?? [])
      .filter((e: { name?: string; primary_pattern?: string }) => e.name && e.primary_pattern)
      .map((e: { name: string; primary_pattern: string }) => [e.name.trim().toLowerCase(), e.primary_pattern])
  )
  // Pattern AND mechanical bias, for the weekly primary-balance check.
  const exerciseMeta = new Map<string, { pattern: string; bias: string }>(
    (exercises ?? [])
      .filter((e: { name?: string; primary_pattern?: string }) => e.name && e.primary_pattern)
      .map((e: { name: string; primary_pattern: string; mechanical_bias?: string }) =>
        [e.name.trim().toLowerCase(), { pattern: e.primary_pattern, bias: e.mechanical_bias ?? '' }])
  )
  const clamp = clampProgramToDoctrine(
    programData.sessions || [],
    phaseForDoctrine,
    effectiveTier,
    patternByName,
    exerciseMeta,
    enduranceSessions
  )
  programData.sessions = clamp.sessions

  // Distribution enforcement runs AFTER the set-count clamp, because it moves
  // sets between exercises without changing a session's total. Running it
  // first would let the clamp undo it.
  if (upper_lower_bias === 'upper' || upper_lower_bias === 'lower') {
    const biased = enforceUpperLowerBias(programData.sessions, patternByName, upper_lower_bias)
    programData.sessions = biased.sessions
    clamp.notes.push(...biased.notes)
    console.log('[generate-program] Upper/lower bias:', { bias: upper_lower_bias, setsMoved: biased.setsMoved })
  }

  if (clamp.notes.length > 0) {
    const doctrineNote = `Doctrine clamp applied (effective tier: ${effectiveTier}, phase: ${phaseForDoctrine}${enduranceSessions > 0 ? `, ${enduranceSessions} concurrent endurance sessions so sets aim at the floor` : ''}). ${clamp.notes.join(' ')}`
    programData.weekly_pattern_summary = Array.isArray(programData.weekly_pattern_summary)
      ? [doctrineNote, ...programData.weekly_pattern_summary]
      : [doctrineNote, ...(programData.weekly_pattern_summary ? [programData.weekly_pattern_summary] : [])]
    console.log('[generate-program] Doctrine clamp:', { rpeClamps: clamp.rpeClamps, setsAdded: clamp.setsAdded, setsTrimmed: clamp.setsTrimmed, tier: effectiveTier, phase: phaseForDoctrine })
  }

  // Recovery and Regulation clamp — runs AFTER training-doctrine clamp.
  // Two paths: (a) state active and no override → clamp applied + audit row.
  // (b) state active and coach overrode → no clamp, override audit row.
  // (c) no state active → no-op.
  if (activeRecoveryManifest) {
    if (recovery_override_reason) {
      // Coach explicitly overrode the recovery constraint. Log it.
      await admin.from('recovery_adjustments').insert({
        client_id,
        recovery_state_id: activeRecoveryManifest.state.id,
        event_type: 'constraint_overridden',
        trigger_type: 'coach_override',
        signals_acknowledged: { active_playbook: activeRecoveryManifest.playbook.id, days_active: activeRecoveryManifest.state.days_active },
        constraints_recognised: { training: activeRecoveryManifest.playbook.trainingConstraints },
        uncertainties_held: 'Coach overrode active recovery state during program generation',
        permissible_category: activeRecoveryManifest.playbook.permissibleCategory,
        authorisation_decision: 'overridden_with_reason',
        override_reason: recovery_override_reason,
        observe_only: false,
      })
      const overrideNote = `RECOVERY OVERRIDE: active state ${activeRecoveryManifest.playbook.source} (${activeRecoveryManifest.playbook.name}) was active but coach overrode the constraint clamp. Reason: ${recovery_override_reason}`
      programData.weekly_pattern_summary = Array.isArray(programData.weekly_pattern_summary)
        ? [overrideNote, ...programData.weekly_pattern_summary]
        : [overrideNote, ...(programData.weekly_pattern_summary ? [programData.weekly_pattern_summary] : [])]
      console.log('[generate-program] Recovery clamp OVERRIDDEN:', recovery_override_reason)
    } else {
      const rClamp = clampProgramToRecoveryManifest(programData.sessions || [], activeRecoveryManifest.playbook)
      programData.sessions = rClamp.sessions
      if (rClamp.notes.length > 0) {
        const recoveryNote = `Recovery clamp applied (active state: ${activeRecoveryManifest.playbook.source}, ${activeRecoveryManifest.playbook.name}, day ${activeRecoveryManifest.state.days_active} of state). ${rClamp.notes.join(' ')}`
        programData.weekly_pattern_summary = Array.isArray(programData.weekly_pattern_summary)
          ? [recoveryNote, ...programData.weekly_pattern_summary]
          : [recoveryNote, ...(programData.weekly_pattern_summary ? [programData.weekly_pattern_summary] : [])]
      }
      // Audit row for the constraint application
      await admin.from('recovery_adjustments').insert({
        client_id,
        recovery_state_id: activeRecoveryManifest.state.id,
        event_type: 'constraint_applied',
        trigger_type: 'program_generation',
        signals_acknowledged: { active_playbook: activeRecoveryManifest.playbook.id, days_active: activeRecoveryManifest.state.days_active, enforcement_mode: activeRecoveryManifest.enforcementMode },
        constraints_recognised: {
          training: activeRecoveryManifest.playbook.trainingConstraints,
          rpe_reductions: rClamp.rpeReductions,
          sessions_removed: rClamp.sessionsRemoved,
          blocks_removed: rClamp.blocksRemoved,
        },
        uncertainties_held: rClamp.notes.join(' '),
        permissible_category: activeRecoveryManifest.playbook.permissibleCategory,
        authorisation_decision: 'authorised',
        observe_only: false,
      })
      console.log('[generate-program] Recovery clamp:', { rpeReductions: rClamp.rpeReductions, sessionsRemoved: rClamp.sessionsRemoved, blocksRemoved: rClamp.blocksRemoved, playbook: activeRecoveryManifest.playbook.id })
    }
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
      // Provenance for a carried-forward Progress Read re-score. The CFFS row
      // referenced above is UNCHANGED; these record what the block was
      // actually built against.
      body_state_override: appliedBodyStateOverride,
      body_state_override_reason: appliedBodyStateOverride ? (body_state_override_reason ?? null) : null,
      body_state_at_generation: appliedBodyStateOverride ?? cffs?.body_state_classification ?? null,
      // What endurance load this block was built alongside. Nothing else in the
      // schema records it, so without this a block has no idea the client runs.
      concurrent_endurance_sessions: enduranceSessions,
      // What readiness this block was actually clamped on, and which weeks
      // justified it. NULL means the CFFS values were used unchanged.
      readiness_at_generation: appliedReadinessCarry
        ? {
            weeks: appliedReadinessCarry.weeksExamined,
            applied: Object.fromEntries(
              appliedReadinessCarry.domains.map(d => [d.domain, d.carried ? d.weekly : d.foundational])
            ),
            carried: appliedReadinessCarry.domains.filter(d => d.carried).map(d => d.domain),
          }
        : null,
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
      client_note: programData.client_note || null,
      prescription_rationale: prescription_rationale || null,
      // 2026-07-05 coach-facing rationale summary. Generator produces this
      // alongside the verbose weekly_pattern_summary / progression_notes /
      // prescription_rationale so the coach dashboard can lead with a
      // scannable card and hide the clinical wall behind an expand. If the
      // model didn't produce it (unlikely — prompt now requires it), the
      // UI falls back to the current verbose fields.
      rationale_summary: (programData as { rationale_summary?: unknown }).rationale_summary ?? null,
      status: 'draft',
      is_active: false,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Program insert error:', insertError)
    return NextResponse.json({ error: `Failed to save program: ${insertError.message}` }, { status: 500 })
  }

  // Link program back to plan block
  if (plan_block_id && program) {
    await admin.from('plan_blocks').update({ program_id: program.id }).eq('id', plan_block_id)
  }

  // Surface the detached-arc warning to the caller, not only to the server
  // log. A silent degrade is the failure this whole change exists to stop.
  return NextResponse.json({ program, arc_warning: arcWarning })
}
