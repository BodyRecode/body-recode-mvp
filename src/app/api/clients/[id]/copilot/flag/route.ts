import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'

// Thumbs-down "flag for review" toggle for a co-pilot answer. Reviewer = Kade
// for now; flagged rows surface in the flagged-exchanges review (coach-scoped).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail(user.email)) return NextResponse.json({ error: 'Coach access only' }, { status: 403 })

  const { messageId, flagged } = await request.json().catch(() => ({}))
  if (!messageId || typeof flagged !== 'boolean') {
    return NextResponse.json({ error: 'messageId and flagged (boolean) required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('copilot_messages')
    .update({ flagged, flagged_at: flagged ? new Date().toISOString() : null })
    .eq('id', messageId)
    .eq('client_id', clientId)
    .eq('role', 'assistant')

  if (error) {
    console.error('[copilot] flag update failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, flagged })
}
