import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import FixedSessionForm from './fixed-session-form'
import AddSessionForm from './add-session-form'

export default async function FixedSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, fixed_session_day, fixed_session_time, fixed_session_duration, session_type')
    .eq('id', id)
    .single()

  if (!client) return notFound()

  const { data: sessions } = await admin
    .from('client_sessions')
    .select('id, scheduled_at, duration_minutes, status')
    .eq('client_id', id)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href={`/dashboard/clients/${id}`} className="text-xs text-stone-500 hover:text-stone-300 transition-colors block mb-4">
          ← Back to {client.name}
        </Link>
        <h1 className="text-xl font-semibold text-white">Face-to-Face Sessions</h1>
        <p className="text-stone-400 text-sm mt-1">Set the recurring weekly slot and manage individual bookings.</p>
      </div>

      {/* Recurring slot */}
      <FixedSessionForm
        clientId={id}
        currentDay={client.fixed_session_day}
        currentTime={client.fixed_session_time}
        currentDuration={client.fixed_session_duration ?? 60}
        currentSessionType={client.session_type}
      />

      {/* Individual session bookings */}
      <div className="mt-6 bg-stone-900 border border-stone-800 rounded-xl p-5">
        <p className="text-xs uppercase tracking-wider text-stone-500 mb-4">Booked Sessions</p>

        {(sessions ?? []).length === 0 ? (
          <p className="text-sm text-stone-600">No sessions booked yet.</p>
        ) : (
          <div className="space-y-2 mb-2">
            {sessions!.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-stone-800 last:border-0">
                <div>
                  <span className="text-sm text-white">
                    {new Date(s.scheduled_at).toLocaleDateString('en-AU', {
                      timeZone: 'Australia/Brisbane',
                      weekday: 'short', day: 'numeric', month: 'short',
                    })}
                  </span>
                  <span className="text-xs text-stone-500 ml-2">
                    {new Date(s.scheduled_at).toLocaleTimeString('en-AU', {
                      timeZone: 'Australia/Brisbane',
                      hour: 'numeric', minute: '2-digit', hour12: true,
                    })} · {s.duration_minutes} min
                  </span>
                </div>
                <span className="text-xs text-teal-400">Confirmed</span>
              </div>
            ))}
          </div>
        )}

        <AddSessionForm clientId={id} defaultDuration={client.fixed_session_duration ?? 60} />
      </div>
    </div>
  )
}
