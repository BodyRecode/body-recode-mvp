/**
 * GET /api/cron/block-end-notifications
 *
 * Daily Vercel cron. Scans every active program, calculates days until the
 * current block ends, and fires:
 *
 *   - "block_end_warning_7d"  when days_until_end is exactly 7
 *   - "block_complete"        when days_until_end is exactly 0
 *
 * Idempotent via the block_end_notifications_sent unique index on
 * (client_id, program_id, event_type) — won't re-send for the same block
 * even if the cron runs multiple times. If the coach generates a new program
 * (new program_id), notifications fire fresh against the new block.
 *
 * Auth: Bearer ${CRON_SECRET}.
 * Schedule registered in vercel.json at "30 21 * * *" (7:30am Brisbane).
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { daysUntilBlockEnd } from '@/lib/workout-logging'
import { appUrl } from '@/lib/app-url'
import { fromBrand } from '@/lib/email-shell'
import { coach } from '@/config/tenant'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

  // Pull every active program with its client
  const { data: programs, error } = await admin
    .from('programs')
    .select('id, client_id, block_name, week_duration, generated_at, clients!inner(id, name, ended_at)')
    .eq('is_active', true)
    // Offboarded clients receive nothing. Inner join so they drop out entirely
    // rather than being filtered after the fact and missed.
    .is('clients.ended_at', null)

  if (error) {
    console.error('[block-end-notifications] programs query failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!programs || programs.length === 0) {
    return NextResponse.json({ scanned: 0, sent: 0, skipped: 0 })
  }

  const APP_URL = appUrl()
  const COACH_EMAIL = coach().email

  let sent = 0
  let skipped = 0
  const events: Array<{ client: string; event: string; days: number }> = []

  for (const program of programs) {
    if (!program.generated_at || !program.week_duration) continue
    const days = daysUntilBlockEnd(program.generated_at, program.week_duration)
    const client = (program.clients as unknown) as { id: string; name: string } | null
    if (!client) continue

    let eventType: 'block_end_warning_7d' | 'block_complete' | null = null
    if (days === 7) eventType = 'block_end_warning_7d'
    else if (days === 0) eventType = 'block_complete'
    if (!eventType) {
      skipped++
      continue
    }

    // Idempotency check — skip if we've already sent this event for this program
    const { data: existing } = await admin
      .from('block_end_notifications_sent')
      .select('id')
      .eq('client_id', client.id)
      .eq('program_id', program.id)
      .eq('event_type', eventType)
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    if (!resend) {
      console.warn('[block-end-notifications] Resend not configured; would have sent:', { client: client.name, event: eventType })
      skipped++
      continue
    }

    const firstName = client.name.split(' ')[0]
    const blockLabel = program.block_name ?? 'Current block'
    const clientUrl = `${APP_URL}/dashboard/clients/${client.id}`

    const subject = eventType === 'block_end_warning_7d'
      ? `${client.name}: block ends in 7 days`
      : `${client.name}: block complete - reassessment review`

    const heading = eventType === 'block_end_warning_7d'
      ? `${firstName}'s block ends in 7 days`
      : `${firstName}'s block is complete`

    const body = eventType === 'block_end_warning_7d'
      ? `${firstName}'s block "${blockLabel}" reaches its end in 7 days. Plan the reassessment now: review CFWS history, decide whether the next block continues the macro arc or pivots based on observed signals.`
      : `${firstName}'s block "${blockLabel}" has completed today. Per Signal Monitoring v1.0, the block end is one of the reassessment triggers. Generate the next block from the macro plan only after the reassessment review.`

    const ctaLabel = eventType === 'block_end_warning_7d' ? 'Open client profile' : 'Review and generate next block'

    try {
      await resend.emails.send({
        from: fromBrand(),
        to: COACH_EMAIL,
        subject,
        html: buildCoachNotificationEmail({
          eyebrow: eventType === 'block_end_warning_7d' ? 'Block Ending Soon' : 'Block Complete',
          heading,
          body,
          ctaLabel,
          ctaUrl: clientUrl,
        }),
      })
    } catch (err) {
      console.error('[block-end-notifications] resend send failed:', err)
      skipped++
      continue
    }

    // Write the idempotency row
    await admin.from('block_end_notifications_sent').insert({
      client_id: client.id,
      program_id: program.id,
      event_type: eventType,
      days_until_block_end_at_send: days,
    })

    sent++
    events.push({ client: client.name, event: eventType, days })
  }

  return NextResponse.json({ scanned: programs.length, sent, skipped, events })
}
