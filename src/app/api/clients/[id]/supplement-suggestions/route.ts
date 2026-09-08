import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeSupplementSignalFingerprint } from '@/lib/consumption-plan-generate'
import { generateSupplementSuggestions } from '@/lib/supplement-suggestions'
import { AI_MODELS } from '@/lib/ai-models'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Generate the supplement suggestion set for a client.
 *
 * Coach-only. Suggests, never assigns: the response is a shortlist the coach
 * reviews on /dashboard/clients/[id]/supplements and acts on with the existing
 * assign controls.
 *
 * Each generation is persisted to `supplement_suggestions` so the page can
 * render the last set without paying for a clinical-tier call on every load.
 */
export const maxDuration = 300

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // { force: true } re-derives even when the clinical picture is unchanged.
  // Body is optional: the existing caller sends none.
  const body = await request.json().catch(() => ({}))
  const force = Boolean((body as { force?: unknown })?.force)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const admin = createAdminClient()

  // Reuse the last shortlist when nothing clinical has moved.
  //
  // This engine runs on AI_MODELS.clinical (Sonnet 5), where the sampling
  // parameters were REMOVED: passing `temperature` returns a 400. So the usual
  // lever for a reproducible answer does not exist, and re-running produces a
  // genuinely different ranking. Observed 8 Sep 2026: two runs minutes apart on
  // identical inputs, one returning Vitamin D3 + K2 (24 nmol/L against a lab
  // floor of 49) and the other dropping it entirely for Creatine. A coach
  // cannot act on a clinical shortlist that reshuffles when they click twice.
  //
  // The plan-side path already solved this by hashing the clinical picture and
  // carrying forward. This button did not, and re-ran on every click. Same
  // fingerprint, same answer, because the model is never asked again.
  //
  // `force: true` re-derives deliberately, for when the coach wants a second
  // opinion on an unchanged picture rather than the stored one.
  const fingerprint = await computeSupplementSignalFingerprint(admin, id).catch(() => null)
  if (fingerprint && !force) {
    const { data: prior } = await admin
      .from('supplement_suggestions')
      .select('id, generated_at, overview, suggestions, not_now, gated, attempts')
      .eq('client_id', id)
      .eq('signal_fingerprint', fingerprint)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (prior) {
      console.log(`[supplement-suggestions] client=${String(id).slice(0, 8)} reusing ${prior.id}: clinical picture unchanged`)
      return NextResponse.json({
        id: prior.id,
        generated_at: prior.generated_at,
        overview: prior.overview,
        suggestions: prior.suggestions,
        not_now: prior.not_now,
        gated: prior.gated,
        attempts: prior.attempts,
        reused: true,
      })
    }
  }

  const result = await generateSupplementSuggestions(admin, id)

  if (!result.ok) {
    const status = result.error === 'Client not found' ? 404 : 500
    return NextResponse.json({ error: result.error }, { status })
  }

  const { data: saved, error: saveErr } = await admin
    .from('supplement_suggestions')
    .insert({
      client_id: id,
      generated_by: user.id,
      model: AI_MODELS.clinical,
      overview: result.overview,
      suggestions: result.suggestions,
      not_now: result.notNow,
      gated: result.gated,
      attempts: result.attempts,
      signal_fingerprint: fingerprint,
    })
    .select('id, generated_at')
    .single()

  if (saveErr) {
    // The suggestions are still useful even if the write failed; return them
    // and let the coach act, rather than throwing away a clinical-tier call.
    console.error('supplement_suggestions insert failed:', saveErr)
  }

  return NextResponse.json({
    id: saved?.id ?? null,
    generated_at: saved?.generated_at ?? new Date().toISOString(),
    overview: result.overview,
    suggestions: result.suggestions,
    not_now: result.notNow,
    gated: result.gated,
    attempts: result.attempts,
  })
}
