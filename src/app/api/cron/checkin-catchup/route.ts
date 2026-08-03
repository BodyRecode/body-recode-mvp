import { NextRequest, NextResponse } from 'next/server'
import { runCheckinCatchup, PRE_DEPLOY_CUTOFF } from '@/lib/checkin-catchup'

/**
 * Daily Body Decode Check-In catch-up for the pre-deploy cohort.
 *
 * `challengeCheckinPromptFunction` (Inngest) handles the Day 7 + Day 11
 * Check-In prompts, but only for enrolments created after it shipped on
 * 2026-08-03. Everyone already mid-challenge at that point is invisible to it
 * permanently, and they cross into the Day 7-13 window over the following days
 * rather than all at once. This fires daily to pick them up as they do.
 *
 * SELF-LIMITING BY DESIGN. runCheckinCatchup() filters on
 * enrolled_at < PRE_DEPLOY_CUTOFF, so once that cohort clears Day 13 (about
 * 2026-08-13) this job can never send another email no matter how often it
 * runs. It needs no cleanup deploy and cannot touch future signups - without
 * that cutoff it would double-email every new enrollee who already received
 * the Day 7 email from Inngest.
 *
 * Runs 21:00 UTC = 07:00 Brisbane, matching the 7am AEST anchor every other
 * challenge touchpoint uses.
 *
 * Auth: Bearer ${CRON_SECRET}.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runCheckinCatchup({ live: true })

    return NextResponse.json({
      ok: true,
      cutoff: PRE_DEPLOY_CUTOFF.toISOString(),
      cohortRemaining: result.cohortRemaining,
      eligible: result.eligible,
      alreadyCaughtUp: result.alreadyCaughtUp,
      notYetDay7: result.notYetDay7,
      sent: result.sent.length,
      failed: result.failed.length,
      details: { sent: result.sent, failed: result.failed },
      // Once this is 0 the cohort has cleared and the cron can be removed from
      // vercel.json. It is harmless if left in place.
      stillToCome: result.notYetDay7,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}
