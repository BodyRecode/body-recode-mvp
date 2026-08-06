/**
 * POST /api/coach/log/exercise — coach-side twin of /api/portal/log/exercise.
 * Auth = dashboard session cookie. Body: { clientId, sessionExerciseCompletionId,
 * substituted?, substitutedExerciseName?, substitutionReason?, exerciseNotes? }.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { updateExercise } from '@/lib/workout-log-write'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const body = await req.json()
  const {
    clientId,
    sessionExerciseCompletionId,
    substituted,
    substitutedExerciseName,
    substitutionReason,
    exerciseNotes,
  } = body as {
    clientId?: string
    sessionExerciseCompletionId?: string
    substituted?: boolean
    substitutedExerciseName?: string | null
    substitutionReason?: string | null
    exerciseNotes?: string | null
  }

  if (!clientId || !sessionExerciseCompletionId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()
  const result = await updateExercise(admin, {
    clientId,
    sessionExerciseCompletionId,
    substituted,
    substitutedExerciseName,
    substitutionReason,
    exerciseNotes,
  })
  return NextResponse.json(result.body, { status: result.status })
}
