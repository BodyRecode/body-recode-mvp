import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'

// Save the coach-authored conditioning / cardio prescription on a program.
// Interim home for cardio until the full conditioning modality (which will
// generate this) is built. Shown to the coach + the client alongside the
// resistance sessions.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail(user.email)) return NextResponse.json({ error: 'Coach access only' }, { status: 403 })

  const { program_id, conditioning } = await request.json().catch(() => ({}))
  if (!program_id) return NextResponse.json({ error: 'program_id required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('programs')
    .update({ conditioning: typeof conditioning === 'string' && conditioning.trim() ? conditioning.trim() : null })
    .eq('id', program_id)
    .eq('client_id', clientId)

  if (error) {
    console.error('[program-conditioning] save failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
