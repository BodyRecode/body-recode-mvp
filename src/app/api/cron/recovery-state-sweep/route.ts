/**
 * GET /api/cron/recovery-state-sweep
 *
 * Daily Vercel cron. Closes RRS recovery states that can no longer close
 * themselves, and emails Kade when any past-max state needs review.
 *
 * Why this exists: `exitState` is only reachable from the router, and the
 * router only runs when a client submits a check-in. A client who stops
 * checking in leaves their state open indefinitely. Found 2026-08-17 with
 * Amanda at 56 days in Sleep Disruption against a 14-day maximum, and
 * Ruby-Cate's state still active weeks after she offboarded.
 *
 * Doctrine note: a past-max state is closed as `system_review_required`, not
 * `resolved`. Per 12D_03 relief is not validation, and the system has no
 * evidence the exit criteria were met. Offboarded clients close as
 * `cancelled` and generate no review.
 *
 * Auth: Bearer ${CRON_SECRET}.
 * Schedule registered in vercel.json at "0 20 * * *" (6am Brisbane).
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { sweepStaleRecoveryStates } from '@/lib/recovery-state-machine'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { appUrl } from '@/lib/app-url'
import { fromBrand } from '@/lib/email-shell'
import { coach } from '@/config/tenant'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const closures = await sweepStaleRecoveryStates(admin)

  const needsReview = closures.filter(c => c.reason === 'past_max_duration')

  if (needsReview.length > 0 && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const details = needsReview.map(c => {
      const last = c.lastCheckinAt ? c.lastCheckinAt.slice(0, 10) : 'never'
      return `<strong>${c.clientName}</strong> was in ${c.playbookName} for ${c.daysActive} days (doctrine maximum ${c.maxDurationDays}). Last check-in: ${last}.`
    })

    const html = buildCoachNotificationEmail({
      eyebrow: 'RECOVERY',
      heading: `${needsReview.length} recovery state${needsReview.length === 1 ? '' : 's'} closed for review`,
      body: [
        `${needsReview.length === 1 ? 'A recovery state ran' : 'Recovery states ran'} past the doctrine maximum and ${needsReview.length === 1 ? 'has' : 'have'} been closed for review.`,
        'These were NOT marked resolved. The router only re-evaluates when a client submits a check-in, and these clients stopped, so the system has no evidence the exit criteria were met. Decide whether each one still applies.',
      ],
      details,
      ctaLabel: 'Open the coaching dashboard',
      ctaUrl: `${appUrl()}/dashboard/coaching`,
      accent: 'amber',
    })

    try {
      await resend.emails.send({
        from: fromBrand(),
        to: coach().email,
        subject: `${needsReview.length} recovery state${needsReview.length === 1 ? '' : 's'} closed for review`,
        html,
      })
    } catch (err) {
      console.error('[recovery-state-sweep] notification email failed:', err)
    }
  }

  return NextResponse.json({
    closed: closures.length,
    needs_review: needsReview.length,
    closures,
  })
}
