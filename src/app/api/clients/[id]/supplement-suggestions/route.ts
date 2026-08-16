import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const admin = createAdminClient()
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
