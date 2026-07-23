import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSms, formatPhone } from '@/lib/twilio'
import { logClientCommunication } from '@/lib/client-communications'
import { appUrl } from '@/lib/app-url'
import { parsePrescribedSessions, currentBlockWeek, todayBrisbaneDayName } from '@/lib/workout-logging'

/**
 * Evening SMS nudge: if TODAY is a client's prescribed training day and they
 * haven't logged (or started) that session yet, text a gentle reminder with a
 * link to the log screen. Part of the logging "carrot" — the point is to make
 * logging a habit, not to punish.
 *
 * Scheduled ~8:30pm Brisbane (vercel.json: "30 10 * * *" UTC) — after most
 * evening training, before the 10pm quiet-hours cutoff.
 *
 * SMS is our one-way alphanumeric sender ("BodyRecode") — recipients CANNOT
 * reply, so the message carries NO reply CTA, only a portal link. Clients have
 * no per-channel SMS consent column (that model is leads-only), so — matching
 * the existing checkin-window crons — we gate on the client having a phone,
 * and add our own dedup + decency cap here: at most 1 nudge/day and 3/7 days.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = todayBrisbaneDayName()

  // Active programs keyed by client.
  const { data: activePrograms } = await admin
    .from('programs')
    .select('id, client_id, sessions, generated_at, week_duration')
    .eq('is_active', true)

  type ProgramRow = { id: string; client_id: string; sessions: unknown; generated_at: string; week_duration: number }
  const programByClient = new Map<string, ProgramRow>()
  for (const p of (activePrograms ?? []) as ProgramRow[]) programByClient.set(p.client_id, p)

  if (programByClient.size === 0) {
    return NextResponse.json({ smsSent: 0, skippedNotTrainingDay: 0, skippedAlreadyLogged: 0, skippedNoProgram: 0, skippedCapped: 0 })
  }

  // Clients with a phone + portal token who have started coaching.
  const { data: clients } = await admin
    .from('clients')
    .select('id, name, phone, onboarding_token, coaching_started_at')
    .not('onboarding_token', 'is', null)
    .not('phone', 'is', null)

  let smsSent = 0
  let skippedNotTrainingDay = 0
  let skippedAlreadyLogged = 0
  let skippedNoProgram = 0
  let skippedCapped = 0

  const nowMs = Date.now()
  const dayAgo = new Date(nowMs - 20 * 60 * 60 * 1000).toISOString()
  const weekAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString()

  for (const client of clients ?? []) {
    if (!client.phone || !client.onboarding_token) continue
    if (!client.coaching_started_at || new Date(client.coaching_started_at) > new Date()) continue

    const program = programByClient.get(client.id)
    if (!program) {
      skippedNoProgram++
      continue
    }

    // Is today one of their prescribed training days? (Only matches when the
    // program uses weekday day_labels; "Day 1" style labels never match, so no
    // nudge fires — which is the safe default.)
    const sessions = parsePrescribedSessions(program.sessions)
    const todayIndex = sessions.findIndex(s => s.day_label.toLowerCase() === today.toLowerCase())
    if (todayIndex < 0) {
      skippedNotTrainingDay++
      continue
    }

    const blockWeek = currentBlockWeek(program.generated_at)

    // Already logged or in progress? Any non-abandoned completion row for
    // today's session means they've engaged — don't nag.
    const { data: existing } = await admin
      .from('session_completions')
      .select('id')
      .eq('client_id', client.id)
      .eq('program_id', program.id)
      .eq('week_number_in_block', blockWeek)
      .eq('session_index', todayIndex)
      .neq('status', 'abandoned')
      .limit(1)
    if (existing && existing.length > 0) {
      skippedAlreadyLogged++
      continue
    }

    // Dedup + decency cap: at most 1 nudge in the last ~day, 3 in the last week.
    const { count: sentToday } = await admin
      .from('client_communications')
      .select('id', { head: true, count: 'exact' })
      .eq('client_id', client.id)
      .eq('kind', 'program_log_nudge')
      .eq('channel', 'sms')
      .gte('sent_at', dayAgo)
    if ((sentToday ?? 0) >= 1) {
      skippedCapped++
      continue
    }

    const { count: sentThisWeek } = await admin
      .from('client_communications')
      .select('id', { head: true, count: 'exact' })
      .eq('client_id', client.id)
      .eq('kind', 'program_log_nudge')
      .eq('channel', 'sms')
      .gte('sent_at', weekAgo)
    if ((sentThisWeek ?? 0) >= 3) {
      skippedCapped++
      continue
    }

    const firstName = client.name.split(' ')[0]
    const logUrl = `${appUrl()}/portal/${client.onboarding_token}/program/log`
    const message = `Hi ${firstName}, log today's session while it's fresh so your numbers carry into next week: ${logUrl}`

    await sendSms({ to: formatPhone(client.phone), message })
    await logClientCommunication(admin, {
      clientId: client.id,
      kind: 'program_log_nudge',
      channel: 'sms',
      subject: null,
      toAddress: client.phone,
      meta: { url: logUrl, trigger: 'cron', session_index: todayIndex, block_week: blockWeek },
    })
    smsSent++
  }

  return NextResponse.json({ smsSent, skippedNotTrainingDay, skippedAlreadyLogged, skippedNoProgram, skippedCapped })
}
