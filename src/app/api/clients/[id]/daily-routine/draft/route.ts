import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * Discard the LLM-generated draft for a client. Does NOT touch the live
 * daily_routine — only clears daily_routine_draft + the generation
 * metadata. Coach-authenticated.
 */
export async function DELETE(
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

  const { error } = await admin
    .from('clients')
    .update({
      daily_routine_draft: null,
      daily_routine_generation_rationale: null,
      daily_routine_generated_at: null,
    })
    .eq('id', id)

  if (error) {
    console.error('daily-routine draft delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
