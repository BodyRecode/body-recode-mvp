import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cleanV2Answers, cleanDisputes, loadPreviousAnswers, PROGRESS_CHECK_V2_SECTIONS, WHAT_CHANGED_ID } from '@/lib/progress-check-v2'

/**
 * Saves a near-full Progress Check as she goes (spec 5: 231 questions, so saving
 * is mandatory, not a nicety). Token-authorised, like the form itself.
 *
 * Her corrections to old answers are saved here too, as their own records. Until
 * she submits she can change or withdraw a correction; the answer it disputes is
 * never touched either way.
 *
 * Photos are not saved here: they travel with the final submit.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const token = body?.token
  if (typeof token !== 'string' || !token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const admin = createAdminClient()
  const { data: pc } = await admin
    .from('progress_checks')
    .select('id, client_id, status, form_version')
    .eq('token', token)
    .maybeSingle()
  if (!pc) return NextResponse.json({ error: 'Progress Check not found' }, { status: 404 })
  if (pc.form_version !== 'v2') return NextResponse.json({ error: 'This Progress Check does not save as you go' }, { status: 400 })
  if (pc.status === 'complete') return NextResponse.json({ error: 'Already submitted' }, { status: 409 })

  const answers = cleanV2Answers(body.answers)
  const whatChanged = typeof body.answers?.[WHAT_CHANGED_ID] === 'string' ? body.answers[WHAT_CHANGED_ID].slice(0, 5000) : null
  const section = Number.isInteger(body.section) && body.section >= 0 && body.section <= PROGRESS_CHECK_V2_SECTIONS.length + 2 ? body.section : null

  const { error } = await admin
    .from('progress_checks')
    .update({
      responses: answers,
      what_changed: whatChanged,
      draft_section: section,
      last_saved_at: new Date().toISOString(),
      status: 'started',
    })
    .eq('id', pc.id)
    .neq('status', 'complete')
  if (error) {
    console.error('[progress-check save]', error.message)
    return NextResponse.json({ error: 'Could not save' }, { status: 500 })
  }

  if (Array.isArray(body.disputes)) {
    const previous = await loadPreviousAnswers(admin, pc.client_id, pc.id)
    const disputes = cleanDisputes(body.disputes, previous.answers)
    const { error: delErr } = await admin.from('progress_check_disputes').delete().eq('progress_check_id', pc.id)
    if (delErr) console.error('[progress-check save] disputes clear', delErr.message)
    if (disputes.length) {
      const { error: insErr } = await admin.from('progress_check_disputes').insert(disputes.map(d => ({
        progress_check_id: pc.id,
        client_id: pc.client_id,
        question_id: d.questionId,
        original_value: previous.answers[d.questionId] ?? null,
        should_have_been: d.shouldHaveBeen,
        note: d.note ?? null,
      })))
      if (insErr) {
        console.error('[progress-check save] disputes insert', insErr.message)
        return NextResponse.json({ error: 'Could not save your corrections' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() })
}
