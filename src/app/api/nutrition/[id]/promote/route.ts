import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { id } = await params
  const admin = createAdminClient()

  // Verify it's a draft and get client_id
  const { data: draft } = await admin
    .from('nutrition_plans')
    .select('id, client_id, status')
    .eq('id', id)
    .eq('status', 'draft')
    .maybeSingle()

  if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

  // Archive existing active plan(s). Set BOTH is_active=false AND
  // status='archived' — pre-2026-06-22 this only flipped is_active, which
  // left the old plan with status='active' is_active=false. Any query
  // filtering by status alone (e.g. coaching-dashboard rebuild-attention
  // panel) would then pick up the archived plan and surface a stale
  // current_direction signal forever.
  await admin
    .from('nutrition_plans')
    .update({ is_active: false, status: 'archived' })
    .eq('client_id', draft.client_id)
    .eq('is_active', true)

  // Promote draft to active
  const { error } = await admin
    .from('nutrition_plans')
    .update({ status: 'active', is_active: true })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
