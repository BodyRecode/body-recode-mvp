/**
 * Background jobs, recorded and alerted.
 *
 * 20 September 2026. Nineteen scheduled jobs run this business and none of them
 * said anything when it broke. Two failures matter and they are not the same:
 *
 *   A job runs and throws. Nobody hears it, and the work it was supposed to do
 *   simply does not happen: a check-in window never opens, a subscription link
 *   never sends.
 *
 *   A job stops being scheduled at all. Nobody hears that either, and there is
 *   no error to find afterwards, because nothing ran. This is the one that hid
 *   the weekly synthesis going quiet after a model change; it was found by a
 *   person noticing, not by the system.
 *
 * So both are covered here. A failed run emails immediately. A job that has not
 * completed inside its own window is reported by the daily health check, which
 * is the only way the second kind is ever visible.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { coach } from '@/config/tenant'
import { appUrlFor } from '@/lib/app-url'

type Admin = ReturnType<typeof createAdminClient>

/**
 * Every scheduled job, with how long it may stay quiet before something is
 * wrong. The quiet window is deliberately longer than the gap between runs:
 * a daily job gets 26 hours so a late run or a deploy does not cry wolf, and
 * a weekly job gets eight days.
 *
 * A job missing from this map still records its runs; it just cannot be
 * reported as silent, because nothing knows when it was due. Adding a cron
 * without adding it here is the gap that lets a job die quietly, so the daily
 * health check names any recorded job that is not listed.
 */
export const JOB_SCHEDULES: Record<string, { label: string; quietHours: number }> = {
  'weekly-scorecard-pulse': { label: 'Weekly scorecard pulse', quietHours: 8 * 24 },
  'coaching-start-reminders': { label: 'Coaching start reminders', quietHours: 26 },
  'onboarding-reminders': { label: 'Onboarding reminders', quietHours: 26 },
  'checkin-window-open': { label: 'Check-in window opens', quietHours: 8 * 24 },
  'checkin-window-closing': { label: 'Check-in window closing', quietHours: 8 * 24 },
  'session-reminders': { label: 'Session reminders', quietHours: 26 },
  'send-scheduled-subscriptions': { label: 'Scheduled subscription links', quietHours: 26 },
  'daily-health-check': { label: 'Daily health check', quietHours: 26 },
  'block-end-notifications': { label: 'Block end notifications', quietHours: 26 },
  'weekly-checkin-auto-rescue': { label: 'Check-in auto rescue', quietHours: 6 },
  'program-log-nudge': { label: 'Training log nudge', quietHours: 26 },
  'greg-session-reminder': { label: 'Greg session reminder', quietHours: 5 * 24 },
  'checkin-catchup': { label: 'Check-in catch-up', quietHours: 26 },
  'day0-completion-check': { label: 'Day 0 completion check', quietHours: 26 },
  'recovery-state-sweep': { label: 'Recovery state sweep', quietHours: 26 },
  'progress-check-invites': { label: 'Progress check invites', quietHours: 26 },
  'funnel-week-advance': { label: 'Funnel week advance', quietHours: 26 },
}

/**
 * How long to stay quiet after alerting on the same job. A job that runs every
 * four hours and fails every time would otherwise send six emails a day, and an
 * alert that arrives six times a day is an alert nobody opens.
 */
const ALERT_QUIET_HOURS = 6

export type JobSummary = Record<string, unknown>

/**
 * Wrap a scheduled route so its run is recorded either way.
 *
 * The route keeps its own authorisation check inside the handler, deliberately:
 * an unauthorised request is not a job run and must not be recorded as one, and
 * moving auth out here would change 17 routes' security in one edit.
 *
 * Never throws on its own account. A recording failure must not take down the
 * job it is recording, which would turn monitoring into an outage.
 */
export function withJobRun(
  job: string,
  handler: (request: NextRequest) => Promise<Response>,
): (request: NextRequest) => Promise<Response> {
  return async (request: NextRequest) => {
    const started = Date.now()
    let response: Response
    try {
      response = await handler(request)
    } catch (e) {
      await recordFailure(job, started, e instanceof Error ? e.message : String(e))
      throw e
    }

    // An unauthorised call is somebody knocking, not a run. Recording it would
    // reset the quiet window and hide a job that has actually stopped.
    if (response.status === 401 || response.status === 403) return response

    if (response.status >= 400) {
      await recordFailure(job, started, `Returned ${response.status}`, await peekBody(response))
      return response
    }

    await recordSuccess(job, started, await peekSummary(response))
    return response
  }
}

/** Read a response body without consuming it for the caller. */
async function peekBody(response: Response): Promise<string | undefined> {
  try {
    return (await response.clone().text()).slice(0, 500)
  } catch {
    return undefined
  }
}

async function peekSummary(response: Response): Promise<JobSummary | undefined> {
  try {
    const body = await response.clone().json()
    return body && typeof body === 'object' ? (body as JobSummary) : undefined
  } catch {
    return undefined
  }
}

async function recordSuccess(job: string, started: number, summary?: JobSummary) {
  try {
    const admin = createAdminClient()
    await admin.from('job_runs').insert({
      job,
      started_at: new Date(started).toISOString(),
      finished_at: new Date().toISOString(),
      status: 'ok',
      duration_ms: Date.now() - started,
      summary: summary ?? null,
    })
  } catch {
    // Deliberately silent. See the note on withJobRun.
  }
}

async function recordFailure(job: string, started: number, error: string, detail?: string) {
  try {
    const admin = createAdminClient()
    const message = detail ? `${error} — ${detail}` : error
    const { data } = await admin
      .from('job_runs')
      .insert({
        job,
        started_at: new Date(started).toISOString(),
        finished_at: new Date().toISOString(),
        status: 'failed',
        duration_ms: Date.now() - started,
        error: message.slice(0, 2000),
      })
      .select('id')
      .single()

    if (await shouldAlert(admin, job)) {
      await alert(job, message)
      if (data?.id) {
        await admin.from('job_runs').update({ alerted_at: new Date().toISOString() }).eq('id', data.id)
      }
    }
  } catch {
    // Deliberately silent. See the note on withJobRun.
  }
}

async function shouldAlert(admin: Admin, job: string): Promise<boolean> {
  const since = new Date(Date.now() - ALERT_QUIET_HOURS * 60 * 60 * 1000).toISOString()
  const { data } = await admin
    .from('job_runs')
    .select('id')
    .eq('job', job)
    .not('alerted_at', 'is', null)
    .gte('alerted_at', since)
    .limit(1)
  return !data || data.length === 0
}

async function alert(job: string, message: string) {
  if (!process.env.RESEND_API_KEY) return
  const label = JOB_SCHEDULES[job]?.label ?? job
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: `Body Recode System <${coach().email}>`,
    to: coach().email,
    subject: `Background job failed: ${label}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#141821">
        <p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8A909B;margin:0 0 8px">Background job</p>
        <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(label)} failed</h1>
        <p style="font-size:14px;line-height:1.6;margin:0 0 16px">This job did not finish. Whatever it was due to do has not happened, and will not happen by itself before its next run.</p>
        <div style="background:#F7F8FA;border-left:3px solid #D94F4F;padding:12px 14px;border-radius:4px;font-size:13px;line-height:1.5;margin:0 0 16px">${escapeHtml(message)}</div>
        <p style="font-size:13px;line-height:1.6;color:#43474F;margin:0 0 16px">Repeat failures of this same job stay quiet for ${ALERT_QUIET_HOURS} hours, so this is one email and not one per attempt.</p>
        <p style="font-size:13px;margin:0"><a href="${appUrlFor('/dashboard/business/automations')}" style="color:#1B6DFC">Automations</a></p>
      </div>
    `,
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/* ── What the daily health check reads ──────────────────────────────────── */

export type JobHealth = {
  failures: { job: string; label: string; error: string; at: string }[]
  silent: { job: string; label: string; lastOk: string | null; quietHours: number }[]
  unlisted: string[]
  ranOk: number
}

/**
 * Both kinds of failure in one read.
 *
 * A job is "silent" when nothing has completed successfully inside its own
 * window. A job that has NEVER run is silent too, and is reported with no last
 * run rather than skipped, because a job that has never run since this started
 * recording is exactly the case worth seeing.
 */
export async function jobHealth(admin: Admin, hours = 24): Promise<JobHealth> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  const { data: recent } = await admin
    .from('job_runs')
    .select('job, status, error, started_at')
    .gte('started_at', since)
    .order('started_at', { ascending: false })

  const failures = (recent ?? [])
    .filter((r) => r.status === 'failed')
    .map((r) => ({
      job: r.job as string,
      label: JOB_SCHEDULES[r.job as string]?.label ?? (r.job as string),
      error: (r.error as string) ?? 'No detail recorded',
      at: r.started_at as string,
    }))

  const ranOk = (recent ?? []).filter((r) => r.status === 'ok').length

  const silent: JobHealth['silent'] = []
  for (const [job, schedule] of Object.entries(JOB_SCHEDULES)) {
    const { data } = await admin
      .from('job_runs')
      .select('started_at')
      .eq('job', job)
      .eq('status', 'ok')
      .order('started_at', { ascending: false })
      .limit(1)
    const lastOk = data?.[0]?.started_at as string | undefined
    const cutoff = Date.now() - schedule.quietHours * 60 * 60 * 1000
    if (!lastOk || new Date(lastOk).getTime() < cutoff) {
      silent.push({ job, label: schedule.label, lastOk: lastOk ?? null, quietHours: schedule.quietHours })
    }
  }

  const seen = new Set((recent ?? []).map((r) => r.job as string))
  const unlisted = [...seen].filter((j) => !JOB_SCHEDULES[j])

  return { failures, silent, unlisted, ranOk }
}

/** Kept so a route can record a run without being wrapped. */
export async function recordJobRun(job: string, startedAt: number, summary?: JobSummary) {
  await recordSuccess(job, startedAt, summary)
}

export { NextResponse }
