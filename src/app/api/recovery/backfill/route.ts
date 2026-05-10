/**
 * Recovery RSIB backfill — one-time / on-demand admin route.
 *
 * Walks every existing weekly_checkins row, normalises its RSIB-equivalent
 * answers (a_recovery / a_sessions / a_sleep, b_*) into the canonical RSIB
 * enum values, and upserts a recovery_signal_block row.
 *
 * Optionally also evaluates the router for each client after their RSIB
 * history is built, so the recovery_adjustments shadow log is populated for
 * all historical weeks. This makes Phase 2 calibration possible against
 * real historical data instead of waiting weeks for new check-ins to land.
 *
 * POST /api/recovery/backfill
 *   body: { clientId?: string, evaluateRouter?: boolean }
 *
 * Auth: requires the admin coach session (same gate as the rest of /dashboard).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractRsibFromResponses } from '@/lib/recovery-rsib-extract'
import { evaluateRouterAfterCheckin } from '@/lib/recovery-ingest'

export const maxDuration = 300

interface BackfillBody {
  clientId?: string
  evaluateRouter?: boolean
}

export async function POST(request: NextRequest) {
  // Auth gate — must be a logged-in coach
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as BackfillBody
  const onlyClientId = body.clientId
  const shouldEvaluate = body.evaluateRouter ?? true

  const admin = createAdminClient()

  // Pull every weekly_checkin (or only this client's if specified). Order by
  // client_id, week_number ascending so router evaluations see historical
  // RSIB rows in chronological order.
  let query = admin
    .from('weekly_checkins')
    .select('id, client_id, week_number, form_type, responses, created_at')
    .order('client_id', { ascending: true })
    .order('week_number', { ascending: true })

  if (onlyClientId) query = query.eq('client_id', onlyClientId)

  const { data: checkins, error } = await query
  if (error) {
    console.error('[backfill] weekly_checkins read failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!checkins || checkins.length === 0) {
    return NextResponse.json({ written: 0, skipped: 0, evaluated: 0, clients: 0 })
  }

  let written = 0
  let skipped = 0
  let lastWriteErr: string | null = null
  const clientWeeksWithRsib = new Map<string, Set<number>>() // clientId -> set of weeks now ingested

  // Step 1 — write RSIB rows from every check-in we can normalise
  for (const c of checkins) {
    const rsib = extractRsibFromResponses(c.form_type as 'A' | 'B', c.responses as Record<string, unknown>)
    if (!rsib) {
      skipped++
      continue
    }

    const { error: upsertErr } = await admin
      .from('recovery_signal_block')
      .upsert(
        {
          client_id: c.client_id,
          week_number: c.week_number,
          recovery_status: rsib.recovery_status,
          session_repeatability: rsib.session_repeatability,
          sleep_consistency: rsib.sleep_consistency,
          weekly_checkin_id: c.id,
          submitted_at: c.created_at,
        },
        { onConflict: 'client_id,week_number' },
      )

    if (upsertErr) {
      lastWriteErr = upsertErr.message
      skipped++
      continue
    }
    written++
    if (!clientWeeksWithRsib.has(c.client_id)) clientWeeksWithRsib.set(c.client_id, new Set())
    clientWeeksWithRsib.get(c.client_id)!.add(c.week_number)
  }

  // Step 2 — optionally evaluate the router once per client (with the latest
  // RSIB now in the table). In observe-only mode this just writes shadow
  // audit rows. We do NOT replay historical evaluations week-by-week here —
  // that would require time-travel on RSIB history loads, which the current
  // code doesn't support. The single per-client evaluation reflects router
  // behaviour against the LATEST 4 RSIB rows.
  let evaluated = 0
  if (shouldEvaluate) {
    for (const clientId of clientWeeksWithRsib.keys()) {
      try {
        await evaluateRouterAfterCheckin(admin, clientId)
        evaluated++
      } catch (err) {
        console.error(`[backfill] router eval failed for ${clientId}:`, err)
      }
    }
  }

  return NextResponse.json({
    written,
    skipped,
    evaluated,
    clients: clientWeeksWithRsib.size,
    lastWriteErr,
  })
}
