import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveEffectiveTier, clampProgramToDoctrine } from '@/lib/training-doctrine'
import { getActiveConstraintManifest } from '@/lib/recovery-state-machine'
import { clampProgramToRecoveryManifest, buildRecoveryPromptSection } from '@/lib/recovery-program-clamp'
import {
  buildProgramSystemPrompt,
  buildProgramUserPrompt,
  ProgramPrescriptionInputs,
  ExerciseRow,
} from '@/lib/program-prompt'
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
  } = body

  if (!client_id || !training_frequency || !training_goal || !training_age || !movement_competency || !progression_phase || !equipment_access || !week_duration || !block_name) {
    return NextResponse.json({ error: 'Missing required prescription inputs' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch client
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id, name, medications')
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

  // Use preferred_training_days from request body if provided, otherwise fall back to intake data
  const resolvedTrainingDays: string[] = (preferred_training_days && preferred_training_days.length > 0)
    ? preferred_training_days
    : intakeTrainingDays

  // Fetch macro plan context if plan_block_id provided
  let macroPlanContext = null
  let coachGuidance: string | null = null
  if (plan_block_id) {
    const { data: planBlock } = await admin
      .from('plan_blocks')
      .select('*, training_plans(plan_name, macro_objective, coach_guidance)')
      .eq('id', plan_block_id)
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
      await admin.from('plan_blocks').update({ status: 'in_progress' }).eq('id', plan_block_id).eq('status', 'planned')
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
  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: buildProgramSystemPrompt() + recoveryPromptSection,
      messages: [{ role: 'user', content: buildProgramUserPrompt(client.name, inputs, cffs, exercises as ExerciseRow[], macroPlanContext, client.medications, coachGuidance) }],
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

  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) {
    return NextResponse.json({ error: `Could not parse program — AI returned: ${content.text.slice(0, 200)}` }, { status: 500 })
  }

  let programData
  try {
    programData = JSON.parse(jsonText)
  } catch {
    return NextResponse.json({ error: `JSON parse failed: ${jsonText.slice(0, 100)}` }, { status: 500 })
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
  const clamp = clampProgramToDoctrine(
    programData.sessions || [],
    phaseForDoctrine,
    effectiveTier
  )
  programData.sessions = clamp.sessions
  if (clamp.notes.length > 0) {
    const doctrineNote = `Doctrine clamp applied (effective tier: ${effectiveTier}, phase: ${phaseForDoctrine}). ${clamp.notes.join(' ')}`
    programData.weekly_pattern_summary = Array.isArray(programData.weekly_pattern_summary)
      ? [doctrineNote, ...programData.weekly_pattern_summary]
      : [doctrineNote, ...(programData.weekly_pattern_summary ? [programData.weekly_pattern_summary] : [])]
    console.log('[generate-program] Doctrine clamp:', { rpeClamps: clamp.rpeClamps, setsAdded: clamp.setsAdded, tier: effectiveTier, phase: phaseForDoctrine })
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
    return NextResponse.json({ error: 'Failed to save program' }, { status: 500 })
  }

  // Link program back to plan block
  if (plan_block_id && program) {
    await admin.from('plan_blocks').update({ program_id: program.id }).eq('id', plan_block_id)
  }

  return NextResponse.json({ program })
}
