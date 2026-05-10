/**
 * POST /api/portal/log/exercise
 *
 * Update exercise-level metadata: substitution and per-exercise notes.
 *
 * Body:
 *   { token: string, clientId: string, sessionExerciseCompletionId: string,
 *     substituted?: boolean, substitutedExerciseName?: string,
 *     substitutionReason?: string, exerciseNotes?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const {
    token,
    clientId,
    sessionExerciseCompletionId,
    substituted,
    substitutedExerciseName,
    substitutionReason,
    exerciseNotes,
  } = body as {
    token?: string
    clientId?: string
    sessionExerciseCompletionId?: string
    substituted?: boolean
    substitutedExerciseName?: string | null
    substitutionReason?: string | null
    exerciseNotes?: string | null
  }

  if (!token || !clientId || !sessionExerciseCompletionId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify ownership chain
  const { data: ownership } = await admin
    .from('session_exercise_completions')
    .select('id, session_completions!inner(client_id, status)')
    .eq('id', sessionExerciseCompletionId)
    .single()

  if (!ownership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const sessionRow = (ownership.session_completions as unknown) as { client_id: string; status: string }
  if (sessionRow.client_id !== clientId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (sessionRow.status === 'completed') {
    return NextResponse.json({ error: 'Session already completed - cannot edit' }, { status: 409 })
  }

  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('onboarding_token', token)
    .ilike('email', user.email!)
    .single()
  if (!client) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Build patch — only update fields explicitly present in the body
  const patch: Record<string, unknown> = {}
  if (substituted !== undefined) patch.substituted = substituted
  if (substitutedExerciseName !== undefined) patch.substituted_exercise_name = substitutedExerciseName
  if (substitutionReason !== undefined) patch.substitution_reason = substitutionReason
  if (exerciseNotes !== undefined) patch.exercise_notes = exerciseNotes

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true, noop: true })
  }

  const { error } = await admin
    .from('session_exercise_completions')
    .update(patch)
    .eq('id', sessionExerciseCompletionId)

  if (error) {
    console.error('[log-exercise] update failed:', error)
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
