import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * Publish the LLM-generated draft as the client's live routine.
 * Copies daily_routine_draft -> daily_routine, then clears the draft.
 * Coach-authenticated.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail((user.email ?? '').toLowerCase())) {
    return NextResponse.json({ error: 'Coach only' }, { status: 403 })
  }

  const { id } = await params
  const admin = createAdminClient()

  const { data: client, error: readError } = await admin
    .from('clients')
    .select('daily_routine_draft')
    .eq('id', id)
    .maybeSingle()

  if (readError || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }
  if (!client.daily_routine_draft) {
    return NextResponse.json({ error: 'No draft to publish' }, { status: 400 })
  }

  const { error: writeError } = await admin
    .from('clients')
    .update({
      daily_routine: client.daily_routine_draft,
      daily_routine_draft: null,
    })
    .eq('id', id)

  if (writeError) {
    console.error('daily-routine publish error:', writeError)
    return NextResponse.json({ error: writeError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
