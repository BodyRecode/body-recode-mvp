import Link from 'next/link'
import {
  Users,
  Workflow,
  UserCheck,
  ClipboardCheck,
  MessageCircle,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react'
import {
  Card,
  PageHeader,
  SectionLabel,
  StatCard,
  DataRow,
  Pill,
  MONO_FONT,
} from '@/components/dashboard/ui'
import { HARMONY, HARMONY_RECENT_LEADS, HARMONY_RECENT_CHECKINS, HARMONY_STUDENTS } from './_lib/brand'

/**
 * Mirror of /dashboard - the "Live" overview page. Same layout, same
 * components, Hermony's data. This is the visual sales artefact for
 * showing Melisa what her Body Recode-powered platform looks like.
 */
export default function HermonyHome() {
  const totalLeads = 14
  const newLeads7d = 5
  const pipelineLeads = 6
  const zoomBooked = 2
  const activeStudents = HARMONY_STUDENTS.length
  const checkinsThisWeek = 4

  const statusLabel: Record<string, string> = {
    new_check_in: 'New Check-In',
    report_sent: 'Report Sent',
    cold_no_booking: 'Cold',
    zoom_booked: 'Zoom Booked',
    commencement_fee_paid: 'Fee Paid',
  }

  const statusAccent: Record<string, 'terracotta' | 'amber' | 'red' | 'neutral'> = {
    new_check_in: 'terracotta',
    report_sent: 'terracotta',
    cold_no_booking: 'neutral',
    zoom_booked: 'amber',
    commencement_fee_paid: 'terracotta',
  }

  const todayLabel = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow={`Overview · ${todayLabel}`}
        title={`Good morning, ${HARMONY.founder}.`}
        subtitle="Here is what is happening in your coaching system."
        accent="terracotta"
      />

      {/* Payments status card - inline (mirrors PaymentsStatusCard) */}
      <Link href="#" className="block mb-6 group">
        <div
          className="rounded-xl border bg-[#FFFFFF] px-5 py-4 flex items-center gap-4 transition-colors group-hover:border-[#CFD4DC]"
          style={{ borderColor: '#E8EAEE' }}
        >
          <span className="w-1 h-10 rounded-full" style={{ background: HARMONY.accentBar }} />
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
            style={{ background: HARMONY.accentSoftBg, borderColor: HARMONY.accentRing }}
          >
            <CheckCircle2 size={16} style={{ color: HARMONY.accentText }} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] text-[#666D7A] mb-0.5"
            >
              Payments
            </p>
            <p className="text-[14px] font-bold truncate" style={{ color: HARMONY.accentText }}>
              All students current
            </p>
          </div>
          <ArrowUpRight
            size={16}
            className="text-[#98A0AD] group-hover:text-[#141821] transition-colors shrink-0"
          />
        </div>
      </Link>

      {/* Stat grid - identical to real dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatCard
          label="Total Leads"
          value={totalLeads}
          sub={`+${newLeads7d} in last 7 days`}
          accent="neutral"
          icon={Users}
        />
        <StatCard
          label="In Pipeline"
          value={pipelineLeads}
          sub={`${zoomBooked} Zooms booked`}
          accent="amber"
          icon={Workflow}
        />
        <StatCard
          label="Active Students"
          value={activeStudents}
          sub="of 10 in Founding tier"
          accent="terracotta"
          icon={UserCheck}
        />
        <StatCard
          label="Check-Ins This Week"
          value={checkinsThisWeek}
          sub="Across all active students"
          accent="terracotta"
          icon={ClipboardCheck}
        />
      </div>

      {/* Two-col: Recent Leads + Recent Check-Ins */}
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        <Card>
          <SectionLabel
            accent="terracotta"
            cta={
              <span className="text-[12px]" style={{ color: HARMONY.accentText }}>View all →</span>
            }
          >
            Recent Leads
          </SectionLabel>
          <div className="space-y-1">
            {HARMONY_RECENT_LEADS.map((lead) => (
              <DataRow
                key={lead.id}
                href="#"
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
        </Card>

        <Card>
          <SectionLabel
            accent="terracotta"
            cta={
              <span className="text-[12px]" style={{ color: HARMONY.accentText }}>View coaching →</span>
            }
          >
            Recent Check-Ins
          </SectionLabel>
          <div className="space-y-1">
            {HARMONY_RECENT_CHECKINS.map((ci) => (
              <DataRow
                key={ci.id}
                href="#"
                primary={ci.client_name}
                secondary={`Week ${ci.week} · Form ${ci.form_type}`}
                trailing={
                  <span
                    className="text-[10px] text-[#666D7A]"
                  >
                    {new Date(ci.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                  </span>
                }
              />
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionLabel accent="amber" meta="Use with care">
          Admin Actions
        </SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {['Send bulk email', 'Recalculate scores', 'Publish weekly brief', 'Roll block boundaries', 'Backfill readings', 'System diagnostics'].map((label) => (
            <button
              key={label}
              className="text-[12px] px-3 py-2 rounded-lg border border-[#E8EAEE] bg-[#FAFBFC] text-[#4B4B4B] hover:text-[#141821] hover:bg-[#EFF1F4] transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Sub-footer note about IP boundary */}
      <div className="mt-10 pt-6 border-t border-[#E8EAEE] flex items-center justify-between text-[10px] text-[#98A0AD]">
        <div className="uppercase">INTERPRETATION ENGINE · DOCTRINE · SAFETY FLOORS — POWERED BY BODY RECODE</div>
        <div className="uppercase">BRAND · VOICE · PRACTICE — {HARMONY.name.toUpperCase()}</div>
      </div>
    </div>
  )
}
