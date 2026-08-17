import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateRecoveryPlanSuggestions } from '@/lib/recovery-plan-suggestions'
import { AI_MODELS } from '@/lib/ai-models'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Generate the recovery plan suggestion set for a client.
 *
 * Whole-file counterpart to the RRS-state-driven banner. That banner only
 * appears when a playbook state is active; this works for every client and
 * treats the RRS table as a hard input when a state IS active.
 *
 * Suggests, never assigns. Persisted so page loads are free.
 */
export const maxDuration = 300

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
  const result = await generateRecoveryPlanSuggestions(admin, id)

  if (!result.ok) {
    const status = result.error === 'Client not found' ? 404 : 500
    return NextResponse.json({ error: result.error }, { status })
  }

  const { data: saved, error: saveErr } = await admin
    .from('recovery_plan_suggestions')
    .insert({
      client_id: id,
      generated_by: user.id,
      model: AI_MODELS.clinical,
      overview: result.overview,
      suggestions: result.suggestions,
      not_now: result.notNow,
      gated: result.gated,
      rrs_note: result.rrsNote,
      attempts: result.attempts,
    })
    .select('id, generated_at')
    .single()

  if (saveErr) {
    // Still return the plan: a failed write should not throw away a
    // clinical-tier call the coach is waiting on.
    console.error('recovery_plan_suggestions insert failed:', saveErr)
  }

  return NextResponse.json({
    id: saved?.id ?? null,
    generated_at: saved?.generated_at ?? new Date().toISOString(),
    overview: result.overview,
    suggestions: result.suggestions,
    not_now: result.notNow,
    gated: result.gated,
    rrs_note: result.rrsNote,
    attempts: result.attempts,
  })
}
