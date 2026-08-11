import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

// Creates a Progress Check (delta re-assessment) invitation for a client and
// returns its token. The client completes it at /progress-check/{token}. One
// progress_checks row = one invitation + (once submitted) its answers.
//
// Optional programId / blockNumber tie the check to the block it belongs to,
// so the Progress Read generator (Phase 2) can pair it with that block's CFWS arc.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { clientId, programId, blockNumber } = await request.json().catch(() => ({}))
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  // Client must belong to this coach (same guard as the intake invitation).
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('coach_id', user.id)
    .single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from('progress_checks')
    .insert({ client_id: clientId, program_id: programId ?? null, block_number: blockNumber ?? null })
    .select('token')
    .single()

  if (error || !row) {
    console.error('Progress Check invitation insert error:', error)
    return NextResponse.json({ error: 'Failed to create Progress Check' }, { status: 500 })
  }

  return NextResponse.json({ token: row.token })
}
