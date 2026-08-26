import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import FixedSlotsManager from './fixed-slots-manager'
import AddSessionForm from './add-session-form'

export default async function FixedSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, fixed_session_duration')
    .eq('id', id)
    .single()

  if (!client) return notFound()

  const { data: slots } = await admin
    .from('client_fixed_slots')
    .select('id, day_of_week, session_time, duration_minutes')
    .eq('client_id', id)
    .order('day_of_week', { ascending: true })

  const { data: sessions } = await admin
    .from('client_sessions')
    .select('id, scheduled_at, duration_minutes, status, confirmed_at')
    .eq('client_id', id)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })

  const defaultDuration = slots?.[0]?.duration_minutes ?? client.fixed_session_duration ?? 60

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href={`/dashboard/clients/${id}`} className="text-[12.5px] text-[#666D7A] hover:text-[#141821] transition-colors block mb-4">
          ← Back to {client.name}
        </Link>
        <h1 className="text-xl font-semibold text-[#141821]">Face-to-Face Sessions</h1>
        <p className="text-[#666D7A] text-sm mt-1">Set recurring weekly slots and manage individual bookings.</p>
      </div>

      {/* Fixed recurring slots */}
      <FixedSlotsManager clientId={id} slots={slots ?? []} />

      {/* Individual session bookings */}
      <div className="mt-6 bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-5">
        <p className="text-[12.5px] text-[#666D7A] mb-4">Booked Sessions</p>

        {(sessions ?? []).length === 0 ? (
          <p className="text-sm text-[#98A0AD]">No sessions booked yet.</p>
        ) : (
          <div className="space-y-2 mb-2">
            {sessions!.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-[#E8EAEE] last:border-0">
                <div>
                  <span className="text-sm text-[#141821]">
                    {new Date(s.scheduled_at).toLocaleDateString('en-AU', {
                      timeZone: 'Australia/Brisbane',
                      weekday: 'short', day: 'numeric', month: 'short',
                    })}
                  </span>
                  <span className="text-[12.5px] text-[#666D7A] ml-2">
                    {new Date(s.scheduled_at).toLocaleTimeString('en-AU', {
                      timeZone: 'Australia/Brisbane',
                      hour: 'numeric', minute: '2-digit', hour12: true,
                    })} · {s.duration_minutes} min
                  </span>
                </div>
                <span className={`text-xs ${s.confirmed_at ? 'text-blue-500' : 'text-[#666D7A]'}`}>
                  {s.confirmed_at ? 'Confirmed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}

        <AddSessionForm clientId={id} defaultDuration={defaultDuration} />
      </div>
    </div>
  )
}
