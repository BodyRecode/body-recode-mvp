import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { coach } from '@/config/tenant'
import {
  fromBrand,
  darkEmailShell,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailStatusCard, emailFeaturedCard,
  EMAIL_FF, EMAIL_BODY_SOFT, EMAIL_MUTED,
} from '@/lib/email-shell'

/**
 * Day 0 scorecard completion check.
 *
 * Reports how many recent Challenge enrollers have completed the in-portal Day 0
 * Body Decode Intake. That intake gates the ENTIRE portal, so anyone sitting
 * behind it has joined a 14-day programme and can see none of it.
 *
 * Moved off launchd 2026-08-12. It previously ran as `au.bodyrecode.day0check`
 * on Kade's Mac, which meant it silently did not run whenever the laptop was
 * closed or asleep, and nothing anywhere said so. The audit that day also found
 * it was invisible in the dashboard. Now a Vercel cron like the other thirteen.
 *
 * The one-off "nudged cohort" tracking from the original script is deliberately
 * dropped. That was a July 2026 experiment and it has served its purpose.
 */
export async function GET() {
  const supabase = createAdminClient()

  const since = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rows, error } = await supabase
    .from('challenge_enrollments')
    .select('enrolled_at, status, body_decode_intake_completed_at, leads(name)')
    .eq('status', 'active')
    .gte('enrolled_at', since)
    .order('enrolled_at', { ascending: false })

  if (error) {
    console.error('[day0-completion-check] query failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const all = rows ?? []
  const done = all.filter(r => r.body_decode_intake_completed_at)
  const pending = all.filter(r => !r.body_decode_intake_completed_at)
  const rate = all.length ? Math.round((done.length / all.length) * 100) : 0

  // Nothing to say when nobody has enrolled in three weeks. Silence beats a
  // daily "0 of 0" email, especially while the ads are paused.
  if (all.length === 0) {
    return NextResponse.json({ skipped: 'no active enrolments in the last 21 days' })
  }

  const nameOf = (r: (typeof all)[number]) => {
    const lead = Array.isArray(r.leads) ? r.leads[0] : r.leads
    return (lead as { name?: string } | null)?.name ?? 'Unknown'
  }

  const row = (label: string, value: string, valueColor: string) =>
    `<div style="font-family:${EMAIL_FF};font-size:15px;line-height:1.6;color:${EMAIL_BODY_SOFT};padding:6px 0;border-bottom:1px solid #EEEEEE;">
       <span>${label}</span>
       <span style="float:right;font-weight:700;color:${valueColor};">${value}</span>
     </div>`

  const pendingInner = pending.length
    ? pending.map(r => row(nameOf(r), 'Pending', EMAIL_MUTED)).join('')
    : `<div style="font-family:${EMAIL_FF};font-size:15px;color:${EMAIL_MUTED};padding:6px 0;">Nobody pending. Everyone who enrolled has completed it.</div>`

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Challenge · Day 0 Scorecard')}
${emailHeading(`${done.length} of ${all.length} enrollers have completed`)}
${emailDivider()}
${emailBody('Daily read on the in-portal Day 0 scorecard. Anyone pending cannot see their training, nutrition, Day 5, Check-In or Day 14 reveal until they finish it.')}
${emailStatusCard({
    eyebrow: 'Completion rate',
    headline: `${rate}%`,
    body: `${done.length} of ${all.length} active enrollers (last 21 days) have done the scorecard. ${pending.length} still pending.`,
  })}
${emailFeaturedCard(pendingInner, { eyebrow: 'Still pending' })}
`, { previewText: `${done.length}/${all.length} completed (${rate}%)` })

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: fromBrand(),
        to: coach().email,
        subject: `Day 0 scorecard: ${done.length}/${all.length} completed (${rate}%)`,
        html,
      })
    } catch (e) {
      console.error('[day0-completion-check] email failed:', e)
    }
  }

  return NextResponse.json({ total: all.length, done: done.length, pending: pending.length, rate })
}
