/**
 * POST /api/coach/log/set — coach-side twin of /api/portal/log/set.
 * Auth = dashboard session cookie. Body: { clientId, sessionExerciseCompletionId,
 * setNumber, weightKg?, repsCompleted?, rpe? }.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { upsertSet } from '@/lib/workout-log-write'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const body = await req.json()
  const { clientId, sessionExerciseCompletionId, setNumber, weightKg, weightText, repsCompleted, rpe } = body as {
    clientId?: string
    sessionExerciseCompletionId?: string
    setNumber?: number
    weightKg?: number | null
    weightText?: string | null
    repsCompleted?: number | null
    rpe?: number | null
  }

  if (!clientId || !sessionExerciseCompletionId || setNumber == null || setNumber < 1) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const admin = createAdminClient()
  const result = await upsertSet(admin, {
    clientId,
    sessionExerciseCompletionId,
    setNumber,
    weightKg,
    weightText,
    repsCompleted,
    rpe,
  })
  return NextResponse.json(result.body, { status: result.status })
}
