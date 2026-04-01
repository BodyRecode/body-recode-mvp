import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()

  const { data: draft } = await admin
    .from('programs')
    .select('id, client_id, status')
    .eq('id', id)
    .maybeSingle()

  if (!draft) return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  if (draft.status !== 'draft') return NextResponse.json({ error: 'Program is not a draft' }, { status: 400 })

  // Deactivate any existing active program for this client (becomes archived history)
  await admin
    .from('programs')
    .update({ is_active: false })
    .eq('client_id', draft.client_id)
    .eq('is_active', true)

  // Promote draft to active
  const { error } = await admin
    .from('programs')
    .update({ status: 'active', is_active: true })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
