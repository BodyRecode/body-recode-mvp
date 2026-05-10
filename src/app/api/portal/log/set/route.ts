/**
 * POST /api/portal/log/set
 *
 * Upserts a single set log. Called by the live logging UI as the client
 * taps to confirm each set. Idempotent: re-submitting the same
 * (sessionExerciseCompletionId, setNumber) updates the row in place.
 *
 * Body:
 *   { token: string, clientId: string, sessionExerciseCompletionId: string,
 *     setNumber: number, weightKg?: number, repsCompleted?: number, rpe?: number }
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
    setNumber,
    weightKg,
    repsCompleted,
    rpe,
  } = body as {
    token?: string
    clientId?: string
    sessionExerciseCompletionId?: string
    setNumber?: number
    weightKg?: number | null
    repsCompleted?: number | null
    rpe?: number | null
  }

  if (!token || !clientId || !sessionExerciseCompletionId || setNumber == null || setNumber < 1) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify this exercise completion belongs to this client (token-scoped)
  const { data: ownership } = await admin
    .from('session_exercise_completions')
    .select('id, session_completion_id, session_completions!inner(client_id, status)')
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

  // Confirm the client's identity matches the token
  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('onboarding_token', token)
    .ilike('email', user.email!)
    .single()
  if (!client) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Upsert the set log
  const { error } = await admin
    .from('exercise_set_logs')
    .upsert(
      {
        session_exercise_completion_id: sessionExerciseCompletionId,
        set_number: setNumber,
        weight_kg: weightKg ?? null,
        reps_completed: repsCompleted ?? null,
        rpe: rpe ?? null,
        logged_at: new Date().toISOString(),
      },
      { onConflict: 'session_exercise_completion_id,set_number' },
    )

  if (error) {
    console.error('[log-set] upsert failed:', error)
    return NextResponse.json({ error: 'Failed to log set' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
