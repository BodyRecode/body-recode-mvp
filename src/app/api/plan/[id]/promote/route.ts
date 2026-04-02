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

  const { data: plan } = await admin
    .from('training_plans')
    .select('client_id')
    .eq('id', id)
    .maybeSingle()

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  // Deactivate any current active plan
  await admin
    .from('training_plans')
    .update({ is_active: false })
    .eq('client_id', plan.client_id)
    .eq('is_active', true)

  // Promote draft to active
  const { error } = await admin
    .from('training_plans')
    .update({ status: 'active', is_active: true })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
