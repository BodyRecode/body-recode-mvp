import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

// POST /api/plan/[id]/blocks — add a block to a plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: plan_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const body = await request.json()
  const { client_id, block_name, progression_phase, phase_category, execution_arc, phase_objective, training_goal, week_duration, training_frequency, notes } = body

  if (!client_id || !block_name || !progression_phase || !training_goal || !week_duration) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get next position
  const { data: existing } = await admin
    .from('plan_blocks')
    .select('position')
    .eq('plan_id', plan_id)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const position = (existing?.position ?? 0) + 1

  const { data: block, error } = await admin
    .from('plan_blocks')
    .insert({
      plan_id,
      client_id,
      position,
      block_name,
      progression_phase,
      phase_category: phase_category || null,
      execution_arc: execution_arc || null,
      phase_objective: phase_objective || null,
      training_goal,
      week_duration,
      training_frequency: training_frequency ?? null,
      notes: notes || null,
      status: 'planned',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ block })
}
