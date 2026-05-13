import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import {
  Users,
  Workflow,
  UserCheck,
  ClipboardCheck,
  FileText,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react'
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
  accentColour,
} from '@/components/dashboard/ui'
import { derivePaymentSignal } from '@/lib/payment-signal'

export default async function DashboardHomePage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const [
    { data: leads },
    { data: clients },
    { data: recentLeads },
    { data: recentCheckins },
    { data: subscriptions },
    { data: paymentPlans },
  ] = await Promise.all([
    supabase.from('leads').select('id, status, created_at'),
    supabase.from('clients').select('id, name, coaching_started_at, active, package'),
    supabase.from('leads').select('id, name, email, status, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('weekly_checkins').select('id, client_id, form_type, week_number, submitted_at, clients(name)').order('submitted_at', { ascending: false }).limit(5),
    admin
      .from('client_subscriptions')
      .select('client_id, status, amount, currency, billing_interval, current_period_end, canceled_at, created_at')
      .order('created_at', { ascending: false }),
    admin
      .from('client_payment_plan')
      .select('client_id, commencement_fee_paid_at'),
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

  // ── Payments status: binary "current" or "N overdue" ─────────────────────
  // Mirrors the per-client signal rules used by Today's Focus so the two
  // surfaces never disagree. A client is "overdue" if Stripe says past_due
  // /unpaid, the sub was canceled while they're still active, or the
  // commencement fee hasn't been received 7+ days in.
  type SubRow = NonNullable<typeof subscriptions>[number]
  const primarySubByClient = new Map<string, SubRow>()
  for (const s of subscriptions ?? []) {
    const existing = primarySubByClient.get(s.client_id)
    // Prefer active/trialing; subscriptions already arrive ordered created_at desc.
    if (!existing) {
      primarySubByClient.set(s.client_id, s)
    } else if (
      (s.status === 'active' || s.status === 'trialing') &&
      existing.status !== 'active' &&
      existing.status !== 'trialing'
    ) {
      primarySubByClient.set(s.client_id, s)
    }
  }
  const paymentPlanByClient = new Map<string, NonNullable<typeof paymentPlans>[number]>()
  for (const p of paymentPlans ?? []) paymentPlanByClient.set(p.client_id, p)

  const overdueClientNames: string[] = []
  for (const c of clients ?? []) {
    if (c.active === false) continue
    const hasStarted = c.coaching_started_at
      ? new Date(c.coaching_started_at) <= today
      : false
    const { paymentSignal } = derivePaymentSignal({
      hasStarted,
      coachingStartedAt: c.coaching_started_at ?? null,
      clientPackage: c.package ?? null,
      primarySub: primarySubByClient.get(c.id) ?? null,
      paymentPlan: paymentPlanByClient.get(c.id) ?? null,
      today,
    })
    if (paymentSignal) overdueClientNames.push(c.name)
  }
  const paymentsOverdueCount = overdueClientNames.length

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow={`Overview · ${todayLabel}`}
        title="Good morning, Kade."
        subtitle="Here is what is happening in your coaching system."
      />

      <TodayWidget />

      <PaymentsStatusCard
        overdueCount={paymentsOverdueCount}
        overdueNames={overdueClientNames}
      />

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

/* ───────────────────────────────────────────────────────────────────────── */

/**
 * One-line binary payments indicator. Green when every active client's
 * subscription is current; red with a count + name preview when one or
 * more are past_due / unpaid / canceled / missing commencement fee.
 *
 * Click anywhere on the card to jump to the per-client payments view.
 */
function PaymentsStatusCard({
  overdueCount,
  overdueNames,
}: {
  overdueCount: number
  overdueNames: string[]
}) {
  const isCurrent = overdueCount === 0
  const accent = isCurrent ? 'teal' : 'red'
  const a = accentColour(accent)
  const Icon = isCurrent ? CheckCircle2 : AlertTriangle

  const nameList = overdueNames.slice(0, 3).join(', ')
  const namePreview =
    overdueNames.length > 3 ? `${nameList}, +${overdueNames.length - 3} more` : nameList

  return (
    <Link
      href="/dashboard/business/payments/clients"
      className="block mb-6 group"
    >
      <div
        className="rounded-2xl border bg-[#111110] px-5 py-4 flex items-center gap-4 transition-colors group-hover:border-[#292524]"
        style={{ borderColor: '#1c1917' }}
      >
        <span className="w-1 h-10 rounded-full" style={{ background: a.bar }} />
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
          style={{ background: a.bg, borderColor: a.ring }}
        >
          <Icon size={16} style={{ color: a.text }} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-[10px] text-[#a8a29e] uppercase mb-0.5"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.12em' }}
          >
            Payments
          </p>
          <p
            className="text-[14px] font-bold truncate"
            style={{ color: a.text }}
          >
            {isCurrent
              ? 'All clients current'
              : `${overdueCount} ${overdueCount === 1 ? 'client' : 'clients'} overdue`}
          </p>
          {!isCurrent && namePreview && (
            <p className="text-[12px] text-[#a8a29e] truncate mt-0.5">{namePreview}</p>
          )}
        </div>
        <ArrowUpRight
          size={16}
          className="text-[#57534e] group-hover:text-[#14b8a6] transition-colors shrink-0"
        />
      </div>
    </Link>
  )
}
