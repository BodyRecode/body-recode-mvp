import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const admin = createAdminClient()

  // Only drafts can be edited
  const { data: existing } = await admin
    .from('nutrition_plans')
    .select('id, status')
    .eq('id', id)
    .eq('status', 'draft')
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

  const allowedFields = [
    'plan_name', 'entry_state', 'protein_anchor_g', 'carb_demand_level',
    'meal_frequency', 'meals', 'training_day_adjustments', 'rest_day_adjustments',
    'food_selection_guidelines', 'substitution_options', 'execution_rules',
    'what_not_to_change', 'key_priorities', 'weekly_structure_notes',
    'progression_notes', 'modulation_level', 'active_strategies',
    'nutrient_timing_permission', 'entry_state_summary',
  ]

  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field]
  }

  const { error } = await admin
    .from('nutrition_plans')
    .update(updates)
    .eq('id', id)
    .eq('status', 'draft')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()

  const { error } = await admin
    .from('nutrition_plans')
    .delete()
    .eq('id', id)
    .eq('status', 'draft')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
