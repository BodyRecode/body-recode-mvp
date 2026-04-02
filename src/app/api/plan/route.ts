import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/plan?client_id=xxx — fetch active plan for client
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const client_id = request.nextUrl.searchParams.get('client_id')
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: plans } = await admin
    .from('training_plans')
    .select('*, plan_blocks(*)')
    .eq('client_id', client_id)
    .order('created_at', { ascending: false })

  const activePlan = plans?.find(p => p.is_active && p.status !== 'draft') ?? null
  const draftPlan = plans?.find(p => p.status === 'draft') ?? null

  if (activePlan?.plan_blocks) {
    activePlan.plan_blocks.sort((a: { position: number }, b: { position: number }) => a.position - b.position)
  }
  if (draftPlan?.plan_blocks) {
    draftPlan.plan_blocks.sort((a: { position: number }, b: { position: number }) => a.position - b.position)
  }

  return NextResponse.json({ plan: activePlan, draftPlan })
}

// POST /api/plan — create a new macro plan for a client
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { client_id, plan_name, macro_objective, notes, status = 'active' } = body

  if (!client_id || !plan_name) {
    return NextResponse.json({ error: 'client_id and plan_name required' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (status === 'active') {
    // Deactivate any existing active plan
    await admin
      .from('training_plans')
      .update({ is_active: false })
      .eq('client_id', client_id)
      .eq('is_active', true)
  } else if (status === 'draft') {
    // Remove any existing draft first
    await admin
      .from('training_plans')
      .delete()
      .eq('client_id', client_id)
      .eq('status', 'draft')
  }

  const { data: plan, error } = await admin
    .from('training_plans')
    .insert({
      client_id,
      plan_name,
      macro_objective: macro_objective || null,
      notes: notes || null,
      is_active: status === 'active',
      status,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ plan })
}
