import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import AdminButtons from './admin-buttons'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

export default async function DashboardHomePage() {
  const supabase = await createClient()

  const [
    { data: leads },
    { data: clients },
    { data: recentLeads },
    { data: recentCheckins },
  ] = await Promise.all([
    supabase.from('leads').select('id, status, created_at'),
    supabase.from('clients').select('id, name, coaching_started_at'),
    supabase.from('leads').select('id, name, email, status, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('weekly_checkins').select('id, client_id, form_type, week_number, submitted_at, clients(name)').order('submitted_at', { ascending: false }).limit(5),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const totalLeads = leads?.length || 0
  const newLeads7d = leads?.filter(l => l.created_at && new Date(l.created_at) >= sevenDaysAgo).length || 0
  const pipelineLeads = leads?.filter(l => !['commencement_fee_paid', 'closed_declined', 'closed_no_show'].includes(l.status)).length || 0
  const zoomBooked = leads?.filter(l => l.status === 'zoom_booked' || l.status === 'zoom_1_booked').length || 0
  const activeClients = clients?.filter(c => {
    if (!c.coaching_started_at) return false
    return new Date(c.coaching_started_at) <= today
  }).length || 0
  const scheduledClients = clients?.filter(c => {
    if (!c.coaching_started_at) return false
    return new Date(c.coaching_started_at) > today
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

  const todayLabel = today.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const stats: Array<{ label: string; value: number; sub: string; accent: string; href?: string }> = [
    {
      label: 'Total Leads',
      value: totalLeads,
      sub: newLeads7d > 0 ? `+${newLeads7d} in last 7 days` : 'No new leads this week',
      accent: '#57534e',
      href: '/dashboard/leads',
    },
    {
      label: 'In Pipeline',
      value: pipelineLeads,
      sub: zoomBooked > 0 ? `${zoomBooked} Zoom${zoomBooked === 1 ? '' : 's'} booked` : 'No calls booked',
      accent: '#f59e0b',
      href: '/dashboard/leads',
    },
    {
      label: 'Active Clients',
      value: activeClients,
      sub: scheduledClients > 0 ? `${scheduledClients} starting soon` : 'No upcoming starts',
      accent: '#14b8a6',
      href: '/dashboard/coaching',
    },
    {
      label: 'Check-Ins This Week',
      value: checkinsThisWeek,
      sub: 'Across all active clients',
      accent: '#14b8a6',
      href: '/dashboard/coaching',
    },
  ]

  return (
    <div className="max-w-[1100px]">

      {/* Header */}
      <div className="relative mb-12 pb-8">
        {/* dotted grid */}
        <div
          aria-hidden
          className="absolute inset-0 -mx-6 -mt-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #1c1917 1px, transparent 0)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(ellipse 60% 80% at 20% 0%, black 0%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 80% at 20% 0%, black 0%, transparent 70%)',
          }}
        />
        {/* teal glow */}
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-[420px] h-[420px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(20, 184, 166, 0.12) 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
        />
        <div className="relative">
          <div
            className="inline-flex items-center gap-2 text-[10px] text-[#a8a29e] uppercase mb-5 px-2.5 py-1 rounded-full border border-[#1c1917] bg-[#111110]"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.12em' }}
          >
            <span className="w-1 h-1 rounded-full bg-[#14b8a6]" />
            Overview · {todayLabel}
          </div>
          <h1 className="text-[34px] font-extrabold text-white tracking-tight leading-[1.1] mb-2">
            Good morning, Kade.
          </h1>
          <p className="text-[15px] text-[#a8a29e]">
            Here is what is happening in your coaching system.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {stats.map(stat => {
          const Inner = (
            <div className="relative bg-[#111110] border border-[#1c1917] rounded-2xl p-5 overflow-hidden h-full transition-colors hover:border-[#292524]">
              <div
                className="absolute top-5 left-5 w-7 h-[3px] rounded-full"
                style={{ background: stat.accent }}
              />
              <p
                className="text-[10px] text-[#78716c] uppercase mt-4 mb-3"
                style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
              >
                {stat.label}
              </p>
              <p
                className="text-[40px] font-extrabold text-white tracking-tight leading-none mb-2.5"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {stat.value}
              </p>
              <p className="text-[11px] text-[#57534e] truncate">{stat.sub}</p>
            </div>
          )
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="block">{Inner}</Link>
          ) : (
            <div key={stat.label}>{Inner}</div>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-10">

        {/* Recent Leads */}
        <div className="bg-[#111110] border border-[#1c1917] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-[3px] rounded-full bg-[#14b8a6]" />
              <h2
                className="text-[11px] font-bold text-white uppercase"
                style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
              >
                Recent Leads
              </h2>
            </div>
            <Link
              href="/dashboard/leads"
              className="text-[12px] text-[#14b8a6] hover:text-[#5eead4] transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-1">
            {recentLeads?.map(lead => (
              <Link
                key={lead.id}
                href={`/dashboard/leads/${lead.id}`}
                className="flex items-center justify-between group py-2.5 px-2 -mx-2 rounded-lg hover:bg-[#1c1917]/60 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-white group-hover:text-[#14b8a6] transition-colors truncate">
                    {lead.name}
                  </p>
                  <p className="text-[12px] text-[#57534e] truncate">{lead.email}</p>
                </div>
                <span
                  className="text-[10px] text-[#a8a29e] bg-[#0c0a09] border border-[#1c1917] px-2 py-0.5 rounded-full uppercase shrink-0 ml-3"
                  style={{ fontFamily: MONO_FONT, letterSpacing: '0.08em' }}
                >
                  {statusLabel[lead.status] ?? lead.status}
                </span>
              </Link>
            ))}
            {(!recentLeads || recentLeads.length === 0) && (
              <p className="text-[#57534e] text-[13px] py-2">No leads yet.</p>
            )}
          </div>
        </div>

        {/* Recent Check-Ins */}
        <div className="bg-[#111110] border border-[#1c1917] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-[3px] rounded-full bg-[#14b8a6]" />
              <h2
                className="text-[11px] font-bold text-white uppercase"
                style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
              >
                Recent Check-Ins
              </h2>
            </div>
            <Link
              href="/dashboard/coaching"
              className="text-[12px] text-[#14b8a6] hover:text-[#5eead4] transition-colors"
            >
              View coaching →
            </Link>
          </div>
          <div className="space-y-1">
            {recentCheckins?.map((ci: { id: string; form_type: string; week_number: number; submitted_at: string; clients: { name: string }[] | { name: string } | null; client_id: string }) => (
              <Link
                key={ci.id}
                href={`/dashboard/clients/${ci.client_id}`}
                className="flex items-center justify-between group py-2.5 px-2 -mx-2 rounded-lg hover:bg-[#1c1917]/60 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-white group-hover:text-[#14b8a6] transition-colors truncate">
                    {Array.isArray(ci.clients) ? ci.clients[0]?.name : ci.clients?.name ?? 'Unknown'}
                  </p>
                  <p className="text-[12px] text-[#57534e]">
                    Week {ci.week_number} · Form {ci.form_type}
                  </p>
                </div>
                <span
                  className="text-[10px] text-[#a8a29e] shrink-0 ml-3"
                  style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
                >
                  {new Date(ci.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </span>
              </Link>
            ))}
            {(!recentCheckins || recentCheckins.length === 0) && (
              <p className="text-[#57534e] text-[13px] py-2">No check-ins yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Admin Actions */}
      <div className="bg-[#111110] border border-[#1c1917] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-[3px] rounded-full bg-[#f59e0b]" />
            <h2
              className="text-[11px] font-bold text-white uppercase"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
            >
              Admin Actions
            </h2>
          </div>
          <span
            className="text-[10px] text-[#57534e]"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.1em' }}
          >
            Use with care
          </span>
        </div>
        <AdminButtons />
      </div>

    </div>
  )
}
