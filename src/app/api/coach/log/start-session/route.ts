/**
 * POST /api/coach/log/start-session
 *
 * Coach-side twin of /api/portal/log/start-session — lets the coach open (or
 * resume) a client's session from the dashboard, e.g. when training them
 * in person. Same DB writes (shared lib), same tables, so it shows up in the
 * client's own portal too. Auth = dashboard session cookie (any authenticated
 * user is the coach, matching every other /dashboard write route); the client
 * is addressed directly by clientId, no token needed.
 *
 * Body: { clientId: string, sessionIndex: number, weekNumberInBlock: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { startSession } from '@/lib/workout-log-write'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { clientId, sessionIndex, weekNumberInBlock } = body as {
    clientId?: string
    sessionIndex?: number
    weekNumberInBlock?: number
  }

  if (!clientId || sessionIndex == null || weekNumberInBlock == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()
  const result = await startSession(admin, { clientId, sessionIndex, weekNumberInBlock })
  return NextResponse.json(result.body, { status: result.status })
}
