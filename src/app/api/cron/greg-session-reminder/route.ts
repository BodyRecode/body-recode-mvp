import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSms, formatPhone } from '@/lib/twilio'
import { logClientCommunication } from '@/lib/client-communications'

/**
 * SMS reminder for Greg's standing in-person sessions with Kade.
 *
 * Greg trains face-to-face with Kade on a fixed weekly schedule:
 *   Mon 2:00pm, Wed 2:00pm, Fri 9:00am (Australia/Brisbane).
 * He wants a text 30 minutes before each one, so this fires at:
 *   Mon 1:30pm, Wed 1:30pm, Fri 8:30am Brisbane.
 *
 * Brisbane is UTC+10 with no daylight saving, so the vercel.json crons are:
 *   "30 3 * * 1,3"  -> 03:30 UTC Mon/Wed = 13:30 Brisbane (Mon/Wed sessions)
 *   "30 22 * * 4"   -> 22:30 UTC Thu     = 08:30 Fri Brisbane (Fri session)
 * Both crons point at this same path (Vercel allows one path with multiple
 * schedules; the x-vercel-cron-schedule header says which one fired).
 *
 * This is deliberately a standing per-client reminder, NOT the event-driven
 * session-reminders cron (which emails ~24h before rows in client_sessions).
 * Greg has no session rows; his schedule is fixed, so we drive it off the clock.
 *
 * SMS goes out on our one-way alphanumeric sender ("BodyRecode") — Greg cannot
 * reply, so the message carries no reply CTA. A dedup guard prevents a double
 * fire from texting twice.
 */

// Greg McDonald — looked up once from clients.name. Phone is fetched fresh at
// runtime by id, so a number change in the DB is picked up automatically.
const GREG_CLIENT_ID = '027cabc0-42ef-4b1e-b9b7-c7827ba113e1'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: greg } = await admin
    .from('clients')
    .select('id, name, phone')
    .eq('id', GREG_CLIENT_ID)
    .maybeSingle()

  if (!greg?.phone) {
    return NextResponse.json({ sent: 0, reason: 'no-phone' })
  }

  // Dedup: skip if we already sent this reminder in the last ~25 minutes
  // (guards against a retry / double fire on the same schedule tick).
  const since = new Date(Date.now() - 25 * 60 * 1000).toISOString()
  const { count: recent } = await admin
    .from('client_communications')
    .select('id', { head: true, count: 'exact' })
    .eq('client_id', greg.id)
    .eq('kind', 'in_person_session_reminder')
    .eq('channel', 'sms')
    .gte('sent_at', since)

  if ((recent ?? 0) > 0) {
    return NextResponse.json({ sent: 0, reason: 'already-sent' })
  }

  const firstName = greg.name.split(' ')[0]
  const message = `Hi ${firstName}, you're on with Kade in 30 minutes at AF Newstead. Come ready to work, see you there.`

  await sendSms({ to: formatPhone(greg.phone), message })
  await logClientCommunication(admin, {
    clientId: greg.id,
    kind: 'in_person_session_reminder',
    channel: 'sms',
    subject: null,
    toAddress: greg.phone,
    meta: { trigger: 'cron', schedule: request.headers.get('x-vercel-cron-schedule') ?? null },
  })

  return NextResponse.json({ sent: 1 })
}
