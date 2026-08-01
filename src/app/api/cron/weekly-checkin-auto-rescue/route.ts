import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/lib/inngest'

// Weekly Check-in Auto-Response Safety Net (2026-06-14).
//
// Hourly sweep. Re-fires the `weekly-checkin/submitted` Inngest event for
// any check-in submitted >6h ago that the auto-response pipeline never
// touched (auto_response_attempted_at IS NULL AND no feedback row exists)
// where the client still has auto-response enabled.
//
// Drives the underlying eligibility gate again — which now stamps every
// exit. If the gate refuses (toggle off, coach skipped, already drafted)
// it stamps the reason and we never look at it again. If the gate passes,
// the normal generate + preview + 4h schedule + send flow runs.
//
// Why 6h: the normal happy-path schedules send 4h out. A check-in that's
// still untouched after 6h is genuinely orphaned, not in-flight.
//
// Root-cause incident: Ruby-Cate Week 6 (2026-06-14 08:10 UTC) submitted
// successfully but the auto-response Inngest worker never recorded an
// attempt. With no diagnostic stamp and no rescue cron, the only way we
// noticed was Kade asking.

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const sixHoursAgoIso = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

  // Candidate orphans: submitted >6h ago, never attempted, no coach skip.
  // Filtering by client.auto_checkin_response_enabled + absence of a
  // feedback row happens in a second pass to keep the SQL simple.
  const { data: candidates, error: candidatesErr } = await admin
    .from('weekly_checkins')
    .select('id, client_id, week_number, form_type, submitted_at, auto_response_attempted_at, coach_skipped_at')
    .lte('submitted_at', sixHoursAgoIso)
    .is('auto_response_attempted_at', null)
    .is('coach_skipped_at', null)
    .order('submitted_at', { ascending: true })
    .limit(50)

  if (candidatesErr) {
    return NextResponse.json({ error: `query failed: ${candidatesErr.message}` }, { status: 500 })
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ ok: true, refired: 0, skipped: 0, candidates: 0 })
  }

  const clientIds = Array.from(new Set(candidates.map(c => c.client_id)))
  const { data: clientRows } = await admin
    .from('clients')
    .select('id, auto_checkin_response_enabled')
    // Offboarded or frozen clients receive nothing. Gated on clients.ended_at (final) and clients.frozen_at (paused) rather than
    // on an active plan, so a coach can archive a former client's file without
    // it silently re-enabling contact. See offboard-client.ts.
    .is('ended_at', null)
    .is('frozen_at', null)
    .in('id', clientIds)
  const clientFlags = new Map((clientRows ?? []).map(c => [c.id, c.auto_checkin_response_enabled]))

  const checkinIds = candidates.map(c => c.id)
  const { data: existingFeedback } = await admin
    .from('weekly_checkin_feedback')
    .select('weekly_checkin_id')
    .in('weekly_checkin_id', checkinIds)
  const hasFeedback = new Set((existingFeedback ?? []).map(f => f.weekly_checkin_id))

  const refired: Array<{ id: string; client_id: string; week_number: number }> = []
  const skipped: Array<{ id: string; reason: string }> = []

  for (const cand of candidates) {
    if (hasFeedback.has(cand.id)) {
      skipped.push({ id: cand.id, reason: 'feedback exists (coach drafted)' })
      // Stamp so we don't keep scanning this row every hour.
      await admin
        .from('weekly_checkins')
        .update({
          auto_response_attempted_at: new Date().toISOString(),
          auto_response_failure_reason: 'rescue: feedback exists (coach drafted)',
        })
        .eq('id', cand.id)
      continue
    }
    if (!clientFlags.get(cand.client_id)) {
      skipped.push({ id: cand.id, reason: 'auto-response disabled' })
      await admin
        .from('weekly_checkins')
        .update({
          auto_response_attempted_at: new Date().toISOString(),
          auto_response_failure_reason: 'rescue: auto-response disabled for client',
        })
        .eq('id', cand.id)
      continue
    }

    try {
      await inngest.send({
        name: 'weekly-checkin/submitted',
        data: { checkin_id: cand.id, rescued: true },
      })
      refired.push({ id: cand.id, client_id: cand.client_id, week_number: cand.week_number })
    } catch (err) {
      console.error('Rescue re-fire failed:', cand.id, err)
      skipped.push({ id: cand.id, reason: `re-fire failed: ${err instanceof Error ? err.message : String(err)}` })
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    refired: refired.length,
    skipped: skipped.length,
    refired_details: refired,
    skipped_details: skipped,
  })
}
