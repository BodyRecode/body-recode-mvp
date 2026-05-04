import { createClient } from '@/lib/supabase/server'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import { Users, Workflow, UserCheck, ClipboardCheck, FileText, MessageCircle } from 'lucide-react'
import AdminButtons from './admin-buttons'
import TodayWidget from './today'
import {
  Card,
  PageHeader,
  SectionLabel,
  StatCard,
  DataRow,
  Pill,
  EmptyState,
  MONO_FONT,
} from '@/components/dashboard/ui'

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

  const statusAccent: Record<string, 'teal' | 'amber' | 'red' | 'neutral'> = {
    new_check_in: 'teal',
    report_sent: 'teal',
    cold_no_booking: 'neutral',
    zoom_booked: 'amber',
    zoom_1_booked: 'amber',
    zoom_completed: 'amber',
    closed_no_show: 'red',
    closed_declined: 'red',
    commencement_fee_paid: 'teal',
  }

  const todayLabel = today.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow={`Overview · ${todayLabel}`}
        title="Good morning, Kade."
        subtitle="Here is what is happening in your coaching system."
      />

      <TodayWidget />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatCard
          label="Total Leads"
          value={totalLeads}
          sub={newLeads7d > 0 ? `+${newLeads7d} in last 7 days` : 'No new leads this week'}
          accent="neutral"
          href="/dashboard/leads"
          icon={Users}
        />
        <StatCard
          label="In Pipeline"
          value={pipelineLeads}
          sub={zoomBooked > 0 ? `${zoomBooked} Zoom${zoomBooked === 1 ? '' : 's'} booked` : 'No calls booked'}
          accent="amber"
          href="/dashboard/leads"
          icon={Workflow}
        />
        <StatCard
          label="Active Clients"
          value={activeClients}
          sub={scheduledClients > 0 ? `${scheduledClients} starting soon` : 'No upcoming starts'}
          accent="teal"
          href="/dashboard/coaching"
          icon={UserCheck}
        />
        <StatCard
          label="Check-Ins This Week"
          value={checkinsThisWeek}
          sub="Across all active clients"
          accent="teal"
          href="/dashboard/coaching"
          icon={ClipboardCheck}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-10">
        <Card>
          <SectionLabel
            cta={
              <a href="/dashboard/leads" className="text-[12px] text-[#14b8a6] hover:text-[#5eead4] transition-colors">
                View all →
              </a>
            }
          >
            Recent Leads
          </SectionLabel>
          {recentLeads && recentLeads.length > 0 ? (
            <div className="space-y-1">
              {recentLeads.map(lead => (
                <DataRow
                  key={lead.id}
                  href={`/dashboard/leads/${lead.id}`}
                  primary={lead.name}
                  secondary={lead.email}
                  trailing={
                    <Pill accent={statusAccent[lead.status] ?? 'neutral'}>
                      {statusLabel[lead.status] ?? lead.status}
                    </Pill>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title="No leads yet." />
          )}
        </Card>

        <Card>
          <SectionLabel
            cta={
              <a href="/dashboard/coaching" className="text-[12px] text-[#14b8a6] hover:text-[#5eead4] transition-colors">
                View coaching →
              </a>
            }
          >
            Recent Check-Ins
          </SectionLabel>
          {recentCheckins && recentCheckins.length > 0 ? (
            <div className="space-y-1">
              {recentCheckins.map((ci: { id: string; form_type: string; week_number: number; submitted_at: string; clients: { name: string }[] | { name: string } | null; client_id: string }) => (
                <DataRow
                  key={ci.id}
                  href={`/dashboard/clients/${ci.client_id}`}
                  primary={Array.isArray(ci.clients) ? ci.clients[0]?.name : ci.clients?.name ?? 'Unknown'}
                  secondary={`Week ${ci.week_number} · Form ${ci.form_type}`}
                  trailing={
                    <span
                      className="text-[10px] text-[#a8a29e]"
                      style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
                    >
                      {new Date(ci.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </span>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={MessageCircle} title="No check-ins yet." />
          )}
        </Card>
      </div>

      <Card>
        <SectionLabel accent="amber" meta="Use with care">
          Admin Actions
        </SectionLabel>
        <AdminButtons />
      </Card>
    </div>
  )
}
