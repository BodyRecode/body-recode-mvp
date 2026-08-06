/**
 * POST /api/coach/log/complete-session — coach-side twin of
 * /api/portal/log/complete-session. Auth = dashboard session cookie.
 * Body: { clientId, sessionCompletionId, sessionNotes? }.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { completeSession } from '@/lib/workout-log-write'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const body = await req.json()
  const { clientId, sessionCompletionId, sessionNotes } = body as {
    clientId?: string
    sessionCompletionId?: string
    sessionNotes?: string | null
  }

  if (!clientId || !sessionCompletionId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()
  const result = await completeSession(admin, { clientId, sessionCompletionId, sessionNotes })
  return NextResponse.json(result.body, { status: result.status })
}
