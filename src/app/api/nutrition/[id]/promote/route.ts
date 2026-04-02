import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

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

  // Deactivate existing active plan
  await admin
    .from('nutrition_plans')
    .update({ is_active: false })
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
