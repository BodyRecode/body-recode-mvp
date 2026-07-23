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
import { upsertSet } from '@/lib/workout-log-write'

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

  // Confirm the client's identity matches the token (portal identity bind).
  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('onboarding_token', token)
    .ilike('email', user.email!)
    .single()
  if (!client) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const result = await upsertSet(admin, {
    clientId: client.id,
    sessionExerciseCompletionId,
    setNumber,
    weightKg,
    repsCompleted,
    rpe,
  })
  return NextResponse.json(result.body, { status: result.status })
}
