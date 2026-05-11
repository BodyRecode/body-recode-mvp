import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 300

/**
 * Regenerate Program
 *
 * Single-click regeneration of the current draft program for a client.
 * Re-derives all generation inputs from the existing program row, the linked
 * plan_block, the client's latest intake and active CFFS, and then forwards
 * the request to /api/generate-program. The coach_guidance on the parent
 * training_plan is read inside generate-program automatically — so any guidance
 * the coach typed into the editor before clicking Regenerate steers this call.
 *
 * Generate-program already auto-deletes prior drafts for the client before
 * inserting the new one, so we do not need to delete here.
 *
 * Body: { program_id: string, recovery_override_reason?: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { program_id, recovery_override_reason } = await request.json()
  if (!program_id) {
    return NextResponse.json({ error: 'Missing program_id' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch the draft program — all primary inputs were stored at generation time
  const { data: program, error: programError } = await admin
    .from('programs')
    .select('id, client_id, intake_id, cffs_id, block_name, progression_phase, training_goal, training_frequency, training_age, week_duration, equipment_access, prescription_rationale, status')
    .eq('id', program_id)
    .maybeSingle()

  if (programError || !program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  }

  // Find the plan_block this program is linked to (so generate-program can
  // re-resolve the macro arc context and read coach_guidance from the parent
  // training_plan).
  const { data: planBlock } = await admin
    .from('plan_blocks')
    .select('id')
    .eq('program_id', program_id)
    .maybeSingle()

  // Latest intake — gives us movement_competency / training days. The form
  // pre-fills these from intake on first generation, so regen mirrors that.
  const { data: latestIntake } = await admin
    .from('intakes')
    .select('id, training_days_available')
    .eq('client_id', program.client_id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Active CFFS — same lookup pattern as generate-program when cffs_id absent
  const { data: activeCffs } = await admin
    .from('cffs')
    .select('id')
    .eq('client_id', program.client_id)
    .eq('is_archived', false)
    .maybeSingle()

  // Build the generate-program body using the program row as the source of
  // truth for the primary inputs the coach chose on first generation.
  // movement_competency is not stored on programs; default to 'developing'
  // (matches the form default). Coach can override by going back to the form.
  const body = {
    client_id: program.client_id,
    cffs_id: activeCffs?.id ?? program.cffs_id ?? null,
    intake_id: latestIntake?.id ?? program.intake_id ?? null,
    plan_block_id: planBlock?.id ?? null,
    prescription_rationale: program.prescription_rationale,
    training_frequency: program.training_frequency,
    training_goal: program.training_goal,
    training_age: program.training_age,
    movement_competency: 'developing',
    progression_phase: program.progression_phase,
    equipment_access: program.equipment_access,
    week_duration: program.week_duration,
    block_name: program.block_name,
    preferred_training_days: latestIntake?.training_days_available ?? null,
    recovery_override_reason: recovery_override_reason ?? null,
  }

  // Forward to /api/generate-program preserving the auth cookie so the inner
  // route sees the same authenticated session.
  const origin = request.nextUrl.origin
  const cookie = request.headers.get('cookie') ?? ''
  const res = await fetch(`${origin}/api/generate-program`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({ error: 'Unparseable response from generate-program' }))
  return NextResponse.json(data, { status: res.status })
}
