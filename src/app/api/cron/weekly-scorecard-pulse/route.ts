import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { appUrlFor } from '@/lib/app-url'
import {
  writeWeeklySnapshot, readSnapshotMap, priorWeekStartKey, buildWeeklyPulse,
} from '@/lib/scorecard'
import { buildWeeklyPulseEmail } from '@/lib/scorecard-pulse-email'
import { coach } from '@/config/tenant'

/**
 * Weekly Pulse — the CEO Dashboard's notification + pre-read.
 *
 * Cron (vercel.json): "0 21 * * 0" = Sunday 21:00 UTC = Monday 07:00 Brisbane
 * (AEST = UTC+10, no DST). Fires the morning after the ISO week closes.
 *
 * Flow each run:
 *   1. Read the PREVIOUS week's snapshot (comparison baseline) BEFORE writing.
 *   2. Compute the scorecard + persist this (just-closed) week's snapshot.
 *   3. Build the week-over-week digest and email it to kade@bodyrecode.au.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()

  // 1. Baseline = the week before the one that just closed (written last run).
  const priorMap = await readSnapshotMap(admin, priorWeekStartKey(now))

  // 2. Compute + persist this week's snapshot.
  const { data } = await writeWeeklySnapshot(admin, now)

  // 3. Digest + email.
  const pulse = buildWeeklyPulse(data, priorMap)
  const runAt = now.toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  })
  const { subject, html, headline } = buildWeeklyPulseEmail(data, pulse, {
    dashboardUrl: appUrlFor('/dashboard/scorecard'),
    runAt,
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: `Body Recode System <${coach().email}>`,
    to: coach().email,
    subject,
    html,
  })

  return NextResponse.json({
    ok: true,
    weekStart: pulse.weekStart,
    headline,
    redCount: pulse.redCount,
    worsened: pulse.worsened.map(l => l.key),
    improved: pulse.improved.map(l => l.key),
    snapshotRows: data.flow.length + data.snapshots.length,
  })
}
