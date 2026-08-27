import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const admin = createAdminClient()

  const { data: draft } = await admin
    .from('programs')
    .select('id, client_id, status')
    .eq('id', id)
    .maybeSingle()

  if (!draft) return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  if (draft.status !== 'draft') return NextResponse.json({ error: 'Program is not a draft' }, { status: 400 })

  // Archive any existing active program for this client. Set BOTH is_active=false
  // AND status='archived' — pre-2026-06-22 this only flipped is_active, leaving
  // the old program with status='active' is_active=false (same bug pattern the
  // nutrition promote route had).
  await admin
    .from('programs')
    .update({ is_active: false, status: 'archived' })
    .eq('client_id', draft.client_id)
    .eq('is_active', true)

  // Promote draft to active
  const { error } = await admin
    .from('programs')
    // activated_at is the block's true start. generated_at is when the draft
    // was built, which can be weeks earlier.
    .update({ status: 'active', is_active: true, activated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
