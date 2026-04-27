import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import AdminButtons from './admin-buttons'

export default async function DashboardHomePage() {
  const supabase = await createClient()

  const [
    { data: leads },
    { data: clients },
    { data: recentLeads },
    { data: recentCheckins },
  ] = await Promise.all([
    supabase.from('leads').select('id, status'),
    supabase.from('clients').select('id, name, coaching_started_at'),
    supabase.from('leads').select('id, name, email, status, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('weekly_checkins').select('id, client_id, form_type, week_number, submitted_at, clients(name)').order('submitted_at', { ascending: false }).limit(5),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const totalLeads = leads?.length || 0
  const pipelineLeads = leads?.filter(l => !['commencement_fee_paid', 'closed_declined', 'closed_no_show'].includes(l.status)).length || 0
  const activeClients = clients?.filter(c => {
    if (!c.coaching_started_at) return false
    return new Date(c.coaching_started_at) <= today
  }).length || 0

  const checkinsThisWeek = clients?.reduce((count, client) => {
    if (!client.coaching_started_at) return count
    const weekNumber = getWeekNumber(client.coaching_started_at)
    const clientCheckins = (recentCheckins || []).filter(
      (ci: { client_id: string; week_number: number }) =>
        ci.client_id === client.id && ci.week_number === weekNumber
    )
    return count + clientCheckins.length
  }, 0) || 0

  const statusLabel: Record<string, string> = {
    new_check_in: 'New Check-In',
    report_sent: 'Report Sent',
    cold_no_booking: 'Cold',
    zoom_booked: 'Zoom Booked',
    zoom_1_booked: 'Zoom Booked',
    zoom_completed: 'Zoom Done',
    closed_no_show: 'No Show',
    closed_declined: 'Declined',
    commencement_fee_paid: 'Fee Paid',
  }

  return (
    <div className="max-w-4xl">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold mb-1">Good morning, Kade.</h1>
        <p className="text-stone-400 text-sm">Here is what is happening in your coaching system.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Total Leads</p>
          <p className="text-3xl font-bold text-white">{totalLeads}</p>
        </div>
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">In Pipeline</p>
          <p className="text-3xl font-bold text-white">{pipelineLeads}</p>
        </div>
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Active Clients</p>
          <p className="text-3xl font-bold text-white">{activeClients}</p>
        </div>
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Check-Ins This Week</p>
          <p className="text-3xl font-bold text-teal-400">{checkinsThisWeek}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">

        {/* Recent Leads */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider">Recent Leads</h2>
            <Link href="/dashboard/leads" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentLeads?.map(lead => (
              <Link
                key={lead.id}
                href={`/dashboard/leads/${lead.id}`}
                className="flex items-center justify-between group"
              >
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors">{lead.name}</p>
                  <p className="text-xs text-stone-500">{lead.email}</p>
                </div>
                <span className="text-xs text-stone-500 bg-stone-800 px-2 py-0.5 rounded-full">
                  {statusLabel[lead.status] ?? lead.status}
                </span>
              </Link>
            ))}
            {(!recentLeads || recentLeads.length === 0) && (
              <p className="text-stone-500 text-sm">No leads yet.</p>
            )}
          </div>
        </div>

        {/* Recent Check-Ins */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider">Recent Check-Ins</h2>
            <Link href="/dashboard/coaching" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">View coaching →</Link>
          </div>
          <div className="space-y-3">
            {recentCheckins?.map((ci: { id: string; form_type: string; week_number: number; submitted_at: string; clients: { name: string }[] | { name: string } | null; client_id: string }) => (
              <Link
                key={ci.id}
                href={`/dashboard/clients/${ci.client_id}`}
                className="flex items-center justify-between group"
              >
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors">
                    {Array.isArray(ci.clients) ? ci.clients[0]?.name : ci.clients?.name ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-stone-500">
                    Week {ci.week_number} · Form {ci.form_type}
                  </p>
                </div>
                <span className="text-xs text-stone-500">
                  {new Date(ci.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </span>
              </Link>
            ))}
            {(!recentCheckins || recentCheckins.length === 0) && (
              <p className="text-stone-500 text-sm">No check-ins yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-4">Admin Actions</h2>
        <AdminButtons />
      </div>

    </div>
  )
}
