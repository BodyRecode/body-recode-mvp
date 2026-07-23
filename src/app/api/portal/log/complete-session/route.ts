/**
 * POST /api/portal/log/complete-session
 *
 * Marks a session_completion as completed and stores the optional
 * session-level note. Idempotent: re-submitting on an already-completed
 * session is a no-op (returns ok).
 *
 * Body:
 *   { token: string, clientId: string, sessionCompletionId: string,
 *     sessionNotes?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { completeSession } from '@/lib/workout-log-write'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { token, clientId, sessionCompletionId, sessionNotes } = body as {
    token?: string
    clientId?: string
    sessionCompletionId?: string
    sessionNotes?: string | null
  }

  if (!token || !clientId || !sessionCompletionId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('onboarding_token', token)
    .ilike('email', user.email!)
    .single()
  if (!client) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const result = await completeSession(admin, { clientId: client.id, sessionCompletionId, sessionNotes })
  return NextResponse.json(result.body, { status: result.status })
}
