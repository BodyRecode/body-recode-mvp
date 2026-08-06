import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { id } = await params
  const body = await request.json()
  const admin = createAdminClient()

  const { data: program } = await admin
    .from('programs')
    .select('id, client_id, status')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle()

  if (!program) return NextResponse.json({ error: 'Active program not found' }, { status: 404 })

  const {
    adherence_confirmed,
    signal_category,
    signal_strength,
    days_under_observation,
    signals_noted,
    direction,
    adjustment_level,
    adjustment_applied,
    variable_changed,
    deload_triggered,
    block_extended,
    new_block_required,
    coach_notes,
  } = body

  if (!direction) return NextResponse.json({ error: 'direction required' }, { status: 400 })

  // Doctrine gate: no structural+ adjustment without adherence confirmed
  if (!adherence_confirmed && adjustment_level && adjustment_level !== 'execution') {
    return NextResponse.json({
      error: 'Doctrine violation: structural or phase adjustment cannot proceed without session adherence confirmed. Fix compliance before changing the program.'
    }, { status: 422 })
  }

  // Doctrine gate: time qualification
  const minDays: Record<string, number> = { execution: 3, structural: 7, phase_advance: 14, regenerate: 0 }
  const requiredDays = adjustment_level ? (minDays[adjustment_level] ?? 7) : 0
  if (adjustment_level && days_under_observation !== undefined && days_under_observation < requiredDays) {
    return NextResponse.json({
      error: `Doctrine violation: ${adjustment_level} adjustment requires minimum ${requiredDays} days of observation. Current: ${days_under_observation} days.`
    }, { status: 422 })
  }

  const { error: reviewError } = await admin
    .from('program_reviews')
    .insert({
      program_id: id,
      client_id: program.client_id,
      adherence_confirmed: adherence_confirmed ?? false,
      signal_category: signal_category || null,
      signal_strength: signal_strength || null,
      days_under_observation: days_under_observation || null,
      signals_noted: signals_noted || null,
      direction,
      adjustment_level: adjustment_level || null,
      adjustment_applied: adjustment_applied || null,
      variable_changed: variable_changed || null,
      deload_triggered: deload_triggered ?? false,
      block_extended: block_extended ?? false,
      new_block_required: new_block_required ?? false,
      coach_notes: coach_notes || null,
    })

  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 })

  const { error: updateError } = await admin
    .from('programs')
    .update({
      current_direction: direction,
      last_review_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // If new block required → advance macro arc: complete current block, activate next
  if (new_block_required) {
    const { data: currentBlock } = await admin
      .from('plan_blocks')
      .select('id, plan_id, position')
      .eq('program_id', id)
      .maybeSingle()

    if (currentBlock) {
      // Mark current block complete
      await admin
        .from('plan_blocks')
        .update({ status: 'complete' })
        .eq('id', currentBlock.id)

      // Find next block in same plan by position
      const { data: nextBlock } = await admin
        .from('plan_blocks')
        .select('id')
        .eq('plan_id', currentBlock.plan_id)
        .eq('position', currentBlock.position + 1)
        .eq('status', 'planned')
        .maybeSingle()

      if (nextBlock) {
        await admin
          .from('plan_blocks')
          .update({ status: 'in_progress' })
          .eq('id', nextBlock.id)
      }
    }
  }

  return NextResponse.json({ ok: true, direction })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { id } = await params
  const admin = createAdminClient()

  const { data: reviews, error } = await admin
    .from('program_reviews')
    .select('*')
    .eq('program_id', id)
    .order('reviewed_at', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reviews })
}
