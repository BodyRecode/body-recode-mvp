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

  // Verify ownership
  const { data: session } = await admin
    .from('session_completions')
    .select('id, client_id, status')
    .eq('id', sessionCompletionId)
    .single()

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (session.client_id !== clientId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: client } = await admin
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('onboarding_token', token)
    .ilike('email', user.email!)
    .single()
  if (!client) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (session.status === 'completed') {
    return NextResponse.json({ ok: true, alreadyCompleted: true })
  }

  const { error } = await admin
    .from('session_completions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      session_notes: sessionNotes ?? null,
    })
    .eq('id', sessionCompletionId)

  if (error) {
    console.error('[complete-session] update failed:', error)
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
