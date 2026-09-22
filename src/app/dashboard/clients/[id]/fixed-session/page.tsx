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
      <div className="br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#2A2F39] bg-[#14171D]/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <Link href={`/dashboard/clients/${id}`} className="text-[12.5px] text-[#8A9099] hover:text-[#FAFAF8] transition-colors block mb-4">
          ← Back to {client.name}
        </Link>
        <h1 className="text-[20px] font-semibold text-[#FAFAF8] tracking-[-0.025em]">Face-to-Face Sessions</h1>
        <p className="text-[#8A9099] text-sm mt-1">Set recurring weekly slots and manage individual bookings.</p>
      </div>

      {/* Fixed recurring slots */}
      <FixedSlotsManager clientId={id} slots={slots ?? []} />

      {/* Individual session bookings */}
      <div className="mt-6 bg-[#14171D] br-card p-5">
        <p className="text-[12.5px] text-[#8A9099] mb-4">Booked Sessions</p>

        {(sessions ?? []).length === 0 ? (
          <p className="text-sm text-[#676D76]">No sessions booked yet.</p>
        ) : (
          <div className="space-y-2 mb-2">
            {sessions!.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-[#2A2F39] last:border-0">
                <div>
                  <span className="text-sm text-[#FAFAF8]">
                    {new Date(s.scheduled_at).toLocaleDateString('en-AU', {
                      timeZone: 'Australia/Brisbane',
                      weekday: 'short', day: 'numeric', month: 'short',
                    })}
                  </span>
                  <span className="text-[12.5px] text-[#8A9099] ml-2">
                    {new Date(s.scheduled_at).toLocaleTimeString('en-AU', {
                      timeZone: 'Australia/Brisbane',
                      hour: 'numeric', minute: '2-digit', hour12: true,
                    })} · {s.duration_minutes} min
                  </span>
                </div>
                <span className={`text-xs ${s.confirmed_at ? 'text-[#FAFAF8]' : 'text-[#8A9099]'}`}>
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
