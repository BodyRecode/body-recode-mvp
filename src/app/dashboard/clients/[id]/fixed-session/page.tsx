import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import FixedSessionForm from './fixed-session-form'

export default async function FixedSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, fixed_session_day, fixed_session_time, fixed_session_duration, session_type')
    .eq('id', id)
    .single()

  if (!client) return notFound()

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href={`/dashboard/clients/${id}`} className="text-xs text-stone-500 hover:text-stone-300 transition-colors block mb-4">
          ← Back to {client.name}
        </Link>
        <h1 className="text-xl font-semibold text-white">Fixed Session Slot</h1>
        <p className="text-stone-400 text-sm mt-1">Set the recurring weekly session for this client.</p>
      </div>

      <FixedSessionForm
        clientId={id}
        currentDay={client.fixed_session_day}
        currentTime={client.fixed_session_time}
        currentDuration={client.fixed_session_duration ?? 60}
        currentSessionType={client.session_type}
      />
    </div>
  )
}
