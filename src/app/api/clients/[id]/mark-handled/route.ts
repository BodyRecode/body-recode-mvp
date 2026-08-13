import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * Close a client's outstanding messages without sending anything.
 *
 * For the case the inbox previously had no answer for: the conversation
 * genuinely happened, just not in the app. A phone call, a text, a chat at the
 * gym. Replying in the portal purely to clear a queue would send the client a
 * second answer to a question already settled.
 *
 * Nothing is sent, nothing is emailed, and the client sees no change. This only
 * marks the messages closed on the coach side. A newer message from the client
 * has handled_at null, so the conversation reopens by itself.
 *
 * POST with { undo: true } reverses it, because a mis-click should not need a
 * database query to fix.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail(user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const undo = body?.undo === true

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const query = admin
    .from('client_messages')
    .update(undo ? { handled_at: null } : { handled_at: now, read_at: now })
    .eq('client_id', clientId)
    .eq('sender', 'client')

  const { data, error } = await (undo
    ? query.not('handled_at', 'is', null)
    : query.is('handled_at', null)
  ).select('id')

  if (error) {
    console.error('[mark-handled] failed:', error)
    return NextResponse.json({ error: 'Could not update messages' }, { status: 500 })
  }

  return NextResponse.json({ changed: (data ?? []).length, handled: !undo })
}
