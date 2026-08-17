/**
 * The only place a console action actually runs.
 *
 * Reached by a human clicking Confirm on an approval card. The model cannot
 * call this — it is not exposed as a tool, and the tool layer has no code path
 * that sends. Everything the console stages ends here or nowhere.
 *
 * Four checks before anything executes, in order:
 *   1. The caller is a coach (session, not a request field).
 *   2. The action belongs to THIS coach. A pending action id is a guessable
 *      handle; ownership is re-checked rather than assumed from the URL.
 *   3. It is still pending. Prevents a double-click sending twice.
 *   4. It has not expired. A preview a coach read an hour ago may no longer
 *      describe who would receive it, and approving a stale list is how people
 *      get messaged twice.
 */

import { NextRequest, NextResponse } from 'next/server'
import { resolveConsoleScope } from '@/lib/console/scope'
import { inngest } from '@/lib/inngest'

export const maxDuration = 120

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const gate = await resolveConsoleScope()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })
  const { scope } = gate

  const { data: action, error } = await scope.admin
    .from('console_pending_actions')
    .select('*')
    .eq('id', id)
    .eq('coach_id', scope.coachId) // ownership, not just existence
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!action) return NextResponse.json({ error: 'Action not found' }, { status: 404 })

  if (action.status !== 'pending') {
    return NextResponse.json(
      { error: `This action was already ${action.status}.`, status: action.status },
      { status: 409 },
    )
  }

  if (new Date(action.expires_at as string) < new Date()) {
    await scope.admin
      .from('console_pending_actions')
      .update({ status: 'expired', decided_at: new Date().toISOString() })
      .eq('id', id)
    return NextResponse.json(
      {
        error:
          'This approval expired. The list it showed you may be out of date now — ask again to get a fresh one.',
      },
      { status: 410 },
    )
  }

  const payload = (action.payload ?? {}) as Record<string, unknown>
  let result: Record<string, unknown>

  try {
    switch (action.action_type) {
      case 'dormant_reactivation':
        result = await runDormantReactivation(payload, scope.coachId, scope.admin)
        break
      case 'set_lead_follow_up':
        result = await runSetLeadFollowUp(payload, scope.coachId, scope.admin)
        break
      default:
        return NextResponse.json(
          { error: `Unknown action type: ${action.action_type}` },
          { status: 400 },
        )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[console/confirm] execution failed:', message)
    return NextResponse.json({ error: `The action failed: ${message}` }, { status: 500 })
  }

  await scope.admin
    .from('console_pending_actions')
    .update({
      status: 'executed',
      decided_at: new Date().toISOString(),
      decided_by: scope.email,
      result,
    })
    .eq('id', id)

  return NextResponse.json({ ok: true, action_type: action.action_type, result })
}

/** Cancel without running. Same ownership check. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const gate = await resolveConsoleScope()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })
  const { scope } = gate

  const { error } = await scope.admin
    .from('console_pending_actions')
    .update({
      status: 'cancelled',
      decided_at: new Date().toISOString(),
      decided_by: scope.email,
    })
    .eq('id', id)
    .eq('coach_id', scope.coachId)
    .eq('status', 'pending')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, status: 'cancelled' })
}

/* ──────────────────────────────────────────────────────────────────────────
 * Executors
 * ────────────────────────────────────────────────────────────────────────── */

async function runDormantReactivation(
  payload: Record<string, unknown>,
  coachId: string,
  admin: ReturnType<typeof import('@/lib/supabase/admin').createAdminClient>,
): Promise<Record<string, unknown>> {
  const ids = Array.isArray(payload.lead_ids) ? (payload.lead_ids as string[]) : []
  if (!ids.length) return { enqueued: 0, note: 'No leads in the staged payload.' }

  // Re-verify ownership of every id at execution time. The staged payload was
  // built under this coach's scope, but re-checking costs one query and closes
  // the gap between staging and confirming.
  const { data: owned } = await admin
    .from('leads')
    .select('id')
    .eq('coach_id', coachId)
    .in('id', ids)

  const verified = new Set((owned ?? []).map(l => l.id as string))
  const toSend = ids.filter(i => verified.has(i))

  let enqueued = 0
  const failed: string[] = []
  for (const leadId of toSend) {
    try {
      await inngest.send({ name: 'lead/dormant-reactivation', data: { leadId } })
      enqueued++
    } catch (e) {
      console.error(`[console/confirm] dormant enqueue failed for ${leadId}:`, e)
      failed.push(leadId)
    }
  }

  return {
    enqueued,
    skipped_not_owned: ids.length - toSend.length,
    failed: failed.length,
    note: 'Touch 1 sends immediately, SMS at +4 days, offer at +6 days. Each step re-checks and stops if they reply, book or convert.',
  }
}

async function runSetLeadFollowUp(
  payload: Record<string, unknown>,
  coachId: string,
  admin: ReturnType<typeof import('@/lib/supabase/admin').createAdminClient>,
): Promise<Record<string, unknown>> {
  const leadId = typeof payload.lead_id === 'string' ? payload.lead_id : ''
  const date = typeof payload.follow_up_date === 'string' ? payload.follow_up_date : ''
  const note = typeof payload.note === 'string' ? payload.note : ''
  if (!leadId || !date) throw new Error('Staged payload is missing the lead or the date.')

  const { error } = await admin
    .from('leads')
    .update({
      next_follow_up_at: new Date(`${date}T09:00:00`).toISOString(),
      follow_up_note: note || null,
    })
    .eq('id', leadId)
    .eq('coach_id', coachId)

  if (error) throw new Error(error.message)
  return { lead_id: leadId, follow_up_date: date, note: note || null }
}
