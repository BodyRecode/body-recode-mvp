/**
 * POST /api/portal/log/start-session
 *
 * Get-or-create endpoint: opens a new session_completion for the given
 * (client × program × session_index × week_number_in_block), or returns the
 * existing one if it's already in_progress / completed.
 *
 * On creation, also pre-creates the session_exercise_completions rows from
 * the prescription snapshot, so the live logging UI can write set logs
 * directly without further setup.
 *
 * Body:
 *   { token: string, clientId: string, sessionIndex: number, weekNumberInBlock: number }
 *
 * Returns:
 *   { sessionCompletionId: string, status: 'in_progress' | 'completed' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { startSession } from '@/lib/workout-log-write'

export async function POST(req: NextRequest) {
  // Portal auth: client must be logged in via the portal email/code
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { token, clientId, sessionIndex, weekNumberInBlock } = body as {
    token?: string
    clientId?: string
    sessionIndex?: number
    weekNumberInBlock?: number
  }

  if (!token || !clientId || sessionIndex == null || weekNumberInBlock == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify token + email match this client (the portal identity bind)
  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('onboarding_token', token)
    .ilike('email', user.email!)
    .single()

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const result = await startSession(admin, { clientId: client.id, sessionIndex, weekNumberInBlock })
  return NextResponse.json(result.body, { status: result.status })
}
