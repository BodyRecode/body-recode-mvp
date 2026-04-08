import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import SessionsClient from './sessions-client'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getFixedSlotDates(
  dayOfWeek: number,
  sessionTime: string,
  durationMinutes: number,
  count = 8
): { startUtc: string; displayDate: string; displayTime: string }[] {
  const BRISBANE_OFFSET_MS = 10 * 60 * 60 * 1000
  const now = new Date()
  const sessions = []
  let checked = 0

  while (sessions.length < count && checked < 90) {
    const candidate = new Date(now.getTime() + checked * 24 * 60 * 60 * 1000)
    const brisbaneMidnight = new Date(candidate.getTime() + BRISBANE_OFFSET_MS)
    brisbaneMidnight.setUTCHours(0, 0, 0, 0)

    if (brisbaneMidnight.getUTCDay() === dayOfWeek) {
      const [h, m] = sessionTime.split(':').map(Number)
      const startUtc = new Date(brisbaneMidnight.getTime() + (h * 60 + m) * 60 * 1000 - BRISBANE_OFFSET_MS)

      if (startUtc.getTime() > now.getTime() + 60 * 60 * 1000) {
        sessions.push({
          startUtc: startUtc.toISOString(),
          displayDate: startUtc.toLocaleDateString('en-AU', {
            timeZone: 'Australia/Brisbane', weekday: 'short', day: 'numeric', month: 'short',
          }),
          displayTime: startUtc.toLocaleTimeString('en-AU', {
            timeZone: 'Australia/Brisbane', hour: 'numeric', minute: '2-digit', hour12: true,
          }),
        })
      }
    }
    checked++
  }
  return sessions
}

export default async function SessionsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, fixed_session_day, fixed_session_time, fixed_session_duration, session_type')
    .eq('onboarding_token', token)
    .ilike('email', user.email!)
    .single()

  if (!client) return notFound()

  const hasFixedSlot = client.fixed_session_day !== null && client.fixed_session_time !== null
  const duration = client.fixed_session_duration ?? 60

  // All confirmed bookings for this client
  const { data: confirmedBookings } = await admin
    .from('client_sessions')
    .select('id, scheduled_at, duration_minutes')
    .eq('client_id', client.id)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })

  const confirmedSet = new Set((confirmedBookings ?? []).map(b => {
    // Normalise to minute precision for matching
    return new Date(b.scheduled_at).toISOString().slice(0, 16)
  }))

  // Build unified upcoming list: confirmed bookings + fixed slot dates not yet booked
  const fixedDates = hasFixedSlot
    ? getFixedSlotDates(client.fixed_session_day!, client.fixed_session_time!, duration, 8)
    : []

  const fixedDateKeys = new Set(fixedDates.map(s => s.startUtc.slice(0, 16)))

  // Confirmed bookings that are NOT fixed slot dates (extra sessions)
  const extraBookings = (confirmedBookings ?? []).filter(
    b => !fixedDateKeys.has(new Date(b.scheduled_at).toISOString().slice(0, 16))
  )

  // Merge: fixed slot rows (with confirmed flag) + extra bookings
  type SessionRow = { startUtc: string; displayDate: string; displayTime: string; confirmed: boolean; durMin: number }

  const allSessions: SessionRow[] = [
    ...fixedDates.map(s => ({
      startUtc: s.startUtc,
      displayDate: s.displayDate,
      displayTime: s.displayTime,
      confirmed: confirmedSet.has(s.startUtc.slice(0, 16)),
      durMin: duration,
    })),
    ...extraBookings.map(b => ({
      startUtc: b.scheduled_at,
      displayDate: new Date(b.scheduled_at).toLocaleDateString('en-AU', {
        timeZone: 'Australia/Brisbane', weekday: 'short', day: 'numeric', month: 'short',
      }),
      displayTime: new Date(b.scheduled_at).toLocaleTimeString('en-AU', {
        timeZone: 'Australia/Brisbane', hour: 'numeric', minute: '2-digit', hour12: true,
      }),
      confirmed: true,
      durMin: b.duration_minutes ?? duration,
    })),
  ].sort((a, b) => new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime())

  const dayLabel = hasFixedSlot ? DAYS[client.fixed_session_day!] : null
  const timeLabel = hasFixedSlot
    ? new Date(`1970-01-01T${client.fixed_session_time}`).toLocaleTimeString('en-AU', {
        hour: 'numeric', minute: '2-digit', hour12: true,
      })
    : null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}`} className="text-xs text-stone-500 hover:text-stone-300 transition-colors mb-4 block">
            ← Back to portal
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Your Sessions</h1>
          <p className="text-stone-400 text-sm">Face-to-face coaching at AF Newstead.</p>
        </div>

        {!hasFixedSlot ? (
          <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-6">
            <p className="text-sm font-semibold text-stone-400 mb-1">No fixed session assigned yet</p>
            <p className="text-xs text-stone-600 leading-relaxed">Your coach will assign your fixed session slot. You will see your schedule here once it is set up.</p>
          </div>
        ) : (
          <>
            {/* Fixed slot card */}
            <div className="rounded-2xl border border-teal-400/20 bg-teal-400/5 p-5 mb-8">
              <p className="text-xs font-bold tracking-widest text-teal-500 uppercase mb-3">Your fixed slot</p>
              <p className="text-lg font-bold text-white">{dayLabel}s · {timeLabel}</p>
              <p className="text-sm text-stone-400 mt-1">{duration} minutes · AF Newstead</p>
            </div>

            {/* All upcoming sessions */}
            <div className="mb-8">
              <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Upcoming sessions</p>
              <div className="space-y-2">
                {allSessions.slice(0, 8).map((session, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-stone-900 border border-stone-800 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{session.displayDate}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{session.displayTime} · {session.durMin} min</p>
                    </div>
                    {session.confirmed ? (
                      <span className="text-xs font-bold text-teal-400 bg-teal-400/10 px-2.5 py-1 rounded-full">Confirmed</span>
                    ) : (
                      <span className="text-xs text-stone-600">Scheduled</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Book a session */}
            <SessionsClient token={token} clientId={client.id} />
          </>
        )}
      </div>
    </div>
  )
}
