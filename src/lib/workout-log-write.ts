/**
 * Shared workout-logging write logic, keyed on clientId.
 *
 * Both the CLIENT portal routes (src/app/api/portal/log/*, token+email auth)
 * and the COACH dashboard routes (src/app/api/coach/log/*, session-cookie
 * auth) call these so there is ONE source of truth for the DB writes. Auth
 * stays in the routes; these functions assume the caller has already
 * established that they may act for `clientId`.
 *
 * Every function returns { status, body } so a route can do:
 *   const r = await startSession(admin, {...}); return NextResponse.json(r.body, { status: r.status })
 */

import type { createAdminClient } from '@/lib/supabase/admin'
import { parsePrescribedSessions, type PrescribedSession } from '@/lib/workout-logging'

type Admin = ReturnType<typeof createAdminClient>

export interface WriteResult {
  status: number
  body: Record<string, unknown>
}

/**
 * Get-or-create a session_completion for (client × active program × session ×
 * week), pre-creating the exercise rows from the prescription on first open.
 */
export async function startSession(
  admin: Admin,
  input: { clientId: string; sessionIndex: number; weekNumberInBlock: number },
): Promise<WriteResult> {
  const { clientId, sessionIndex, weekNumberInBlock } = input

  const { data: program } = await admin
    .from('programs')
    .select('id, sessions, week_duration')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .maybeSingle()

  if (!program) return { status: 404, body: { error: 'No active program' } }

  const prescribedSessions = parsePrescribedSessions(program.sessions)
  const prescribed: PrescribedSession | undefined = prescribedSessions[sessionIndex]
  if (!prescribed) return { status: 400, body: { error: 'Invalid sessionIndex' } }

  if (program.week_duration && weekNumberInBlock > program.week_duration) {
    return {
      status: 400,
      body: { error: `Week ${weekNumberInBlock} is past the block end (${program.week_duration} weeks)` },
    }
  }

  const { data: existing } = await admin
    .from('session_completions')
    .select('id, status')
    .eq('client_id', clientId)
    .eq('program_id', program.id)
    .eq('session_index', sessionIndex)
    .eq('week_number_in_block', weekNumberInBlock)
    .neq('status', 'abandoned')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    return { status: 200, body: { sessionCompletionId: existing.id, status: existing.status } }
  }

  const { data: created, error: createErr } = await admin
    .from('session_completions')
    .insert({
      client_id: clientId,
      program_id: program.id,
      session_index: sessionIndex,
      day_label: prescribed.day_label,
      session_name: prescribed.skeleton ?? null,
      week_number_in_block: weekNumberInBlock,
      prescription_snapshot: {
        day_label: prescribed.day_label,
        skeleton: prescribed.skeleton,
        movement_prep: prescribed.movement_prep,
        blocks: prescribed.blocks,
      },
      status: 'in_progress',
    })
    .select('id, status')
    .single()

  if (createErr || !created) {
    console.error('[start-session] insert failed:', createErr)
    return { status: 500, body: { error: 'Failed to start session' } }
  }

  const exerciseRows = prescribed.flatExercises.map(({ block_label, exercise, sort_order }) => ({
    session_completion_id: created.id,
    block_label,
    sort_order,
    prescribed_exercise_name: exercise.exercise_name,
    prescribed_sets: exercise.sets,
    prescribed_reps: exercise.reps,
    prescribed_rpe: exercise.rpe,
    prescribed_rest: exercise.rest,
    prescribed_notes: exercise.notes,
    substituted: false,
  }))

  if (exerciseRows.length > 0) {
    const { error: exErr } = await admin.from('session_exercise_completions').insert(exerciseRows)
    if (exErr) {
      console.error('[start-session] exercise rows insert failed:', exErr)
      await admin.from('session_completions').delete().eq('id', created.id)
      return { status: 500, body: { error: 'Failed to start session' } }
    }
  }

  return { status: 200, body: { sessionCompletionId: created.id, status: created.status } }
}

/** Confirm a session_exercise_completions row belongs to clientId and its
 *  parent session is still editable. */
async function verifyExerciseOwnership(
  admin: Admin,
  sessionExerciseCompletionId: string,
  clientId: string,
): Promise<WriteResult | null> {
  const { data: ownership } = await admin
    .from('session_exercise_completions')
    .select('id, session_completions!inner(client_id, status)')
    .eq('id', sessionExerciseCompletionId)
    .single()

  if (!ownership) return { status: 404, body: { error: 'Not found' } }

  const sessionRow = (ownership.session_completions as unknown) as { client_id: string; status: string }
  if (sessionRow.client_id !== clientId) return { status: 403, body: { error: 'Forbidden' } }
  if (sessionRow.status === 'completed') {
    return { status: 409, body: { error: 'Session already completed - cannot edit' } }
  }
  return null
}

/** Upsert one set log. Idempotent on (session_exercise_completion_id, set_number). */
export async function upsertSet(
  admin: Admin,
  input: {
    clientId: string
    sessionExerciseCompletionId: string
    setNumber: number
    weightKg?: number | null
    repsCompleted?: number | null
    rpe?: number | null
  },
): Promise<WriteResult> {
  const denied = await verifyExerciseOwnership(admin, input.sessionExerciseCompletionId, input.clientId)
  if (denied) return denied

  const { error } = await admin
    .from('exercise_set_logs')
    .upsert(
      {
        session_exercise_completion_id: input.sessionExerciseCompletionId,
        set_number: input.setNumber,
        weight_kg: input.weightKg ?? null,
        reps_completed: input.repsCompleted ?? null,
        rpe: input.rpe ?? null,
        logged_at: new Date().toISOString(),
      },
      { onConflict: 'session_exercise_completion_id,set_number' },
    )

  if (error) {
    console.error('[log-set] upsert failed:', error)
    return { status: 500, body: { error: 'Failed to log set' } }
  }
  return { status: 200, body: { ok: true } }
}

/** Update exercise-level metadata (substitution + notes). */
export async function updateExercise(
  admin: Admin,
  input: {
    clientId: string
    sessionExerciseCompletionId: string
    substituted?: boolean
    substitutedExerciseName?: string | null
    substitutionReason?: string | null
    exerciseNotes?: string | null
  },
): Promise<WriteResult> {
  const denied = await verifyExerciseOwnership(admin, input.sessionExerciseCompletionId, input.clientId)
  if (denied) return denied

  const patch: Record<string, unknown> = {}
  if (input.substituted !== undefined) patch.substituted = input.substituted
  if (input.substitutedExerciseName !== undefined) patch.substituted_exercise_name = input.substitutedExerciseName
  if (input.substitutionReason !== undefined) patch.substitution_reason = input.substitutionReason
  if (input.exerciseNotes !== undefined) patch.exercise_notes = input.exerciseNotes

  if (Object.keys(patch).length === 0) {
    return { status: 200, body: { ok: true, noop: true } }
  }

  const { error } = await admin
    .from('session_exercise_completions')
    .update(patch)
    .eq('id', input.sessionExerciseCompletionId)

  if (error) {
    console.error('[log-exercise] update failed:', error)
    return { status: 500, body: { error: 'Failed to update exercise' } }
  }
  return { status: 200, body: { ok: true } }
}

/** Mark a session completed (idempotent) with an optional session note. */
export async function completeSession(
  admin: Admin,
  input: { clientId: string; sessionCompletionId: string; sessionNotes?: string | null },
): Promise<WriteResult> {
  const { data: session } = await admin
    .from('session_completions')
    .select('id, client_id, status')
    .eq('id', input.sessionCompletionId)
    .single()

  if (!session) return { status: 404, body: { error: 'Not found' } }
  if (session.client_id !== input.clientId) return { status: 403, body: { error: 'Forbidden' } }

  if (session.status === 'completed') {
    return { status: 200, body: { ok: true, alreadyCompleted: true } }
  }

  const { error } = await admin
    .from('session_completions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      session_notes: input.sessionNotes ?? null,
    })
    .eq('id', input.sessionCompletionId)

  if (error) {
    console.error('[complete-session] update failed:', error)
    return { status: 500, body: { error: 'Failed to complete session' } }
  }
  return { status: 200, body: { ok: true } }
}
