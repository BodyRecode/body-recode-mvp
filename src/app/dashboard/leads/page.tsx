'use server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight, UserPlus, Users } from 'lucide-react'
import { formatDate, getLeadStatusLabel, getLeadStatusColour, getLeadSourceLabel } from '@/lib/utils'
import type { Lead } from '@/types'
import { PageHeader, Btn, EmptyState, Avatar, MONO_FONT } from '@/components/dashboard/ui'

// A GOOD LEAD SHOULD SAY SO (10 Sep 2026).
//
// Only a red flag used to get a worded badge. A green lead carried nothing but
// a 12px dot on the corner of their avatar, so the board read as "some people
// are a problem and everyone else is unremarkable" — Komang came through green
// and looked identical to a lead who had answered nothing at all.
//
// The badge also conflated two different things. `red_flag` is true at ONE
// concern, so a yellow lead wore the same "Red Flag" wording as someone who
// raised both. The count is now on the badge, so one concern and two are
// visibly different.
//
// Driven by lead_quality (not red_flag) so all three states are covered, and a
// lead who answered no qualifiers still shows nothing rather than a false green.
const QUALITY_BADGE: Record<'green' | 'yellow' | 'red', { label: string; title: string; className: string }> = {
  green: {
    label: 'Green Flag',
    title: 'No concerns — answered well on both how she responds when progress stalls and on readiness to invest.',
    className: 'bg-[#E6F4EA] border border-[#BFE3CA] text-[#16A34A]',
  },
  yellow: {
    label: '1 Red Flag',
    title: 'One concern — either how she responds when progress stalls, or readiness to invest. The other answer was fine.',
    className: 'bg-[#FEF3E2] border border-[#F5DCB3] text-[#D97706]',
  },
  red: {
    label: '2 Red Flags',
    title: 'Concerns on both — how she responds when progress stalls AND readiness to invest. Historically half show rate, half close rate.',
    className: 'bg-[#FEE7E7] border border-[#F5C6C6] text-[#DC2626]',
  },
}

const STATUS_GROUPS = [
  { label: 'Pipeline', statuses: ['new_check_in', 'report_sent', 'cold_no_booking'] },
  { label: 'Zoom', statuses: ['zoom_booked', 'zoom_1_booked', 'zoom_completed', 'zoom_1_completed', 'zoom_2_booked', 'zoom_2_completed', 'closed_no_show', 'closed_declined'] },
  { label: 'Entry', statuses: ['commencement_fee_paid', 'active_deliberate_start', 'active_coaching'] },
]

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string; view?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const showInactive = params.view === 'inactive'

  let query = supabase
    .from('leads')
    .select('*')
    .order('updated_at', { ascending: false })

  if (showInactive) {
    query = query.eq('active', false)
  } else {
    query = query.or('active.eq.true,active.is.null')
  }

  if (params.status) query = query.eq('status', params.status)
  if (params.source) query = query.eq('source', params.source)

  const { data: leads } = await query
  const allLeads: Lead[] = leads || []

  const counts: Record<string, number> = {}
  allLeads.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1 })

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Pipeline"
        title="Leads"
        subtitle={`${allLeads.length} ${showInactive ? 'inactive' : 'active'} ${allLeads.length === 1 ? 'lead' : 'leads'}`}
        cta={
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center bg-[#FFFFFF] border border-[#E8EAEE] rounded-lg p-0.5">
              <Link
                href="/dashboard/leads"
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  !showInactive ? 'bg-[#1B6DFC] text-[#FFFFFF]' : 'text-[#666D7A] hover:text-[#141821]'
                }`}
              >
                Active
              </Link>
              <Link
                href="/dashboard/leads?view=inactive"
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  showInactive ? 'bg-[#EFF1F4] text-[#141821]' : 'text-[#666D7A] hover:text-[#141821]'
                }`}
              >
                Inactive
              </Link>
            </div>
            <Btn href="/dashboard/leads/new" variant="primary" icon={UserPlus} size="sm">
              New Lead
            </Btn>
          </div>
        }
      />

      {/* Status filter */}
      <div className="flex flex-wrap gap-x-8 gap-y-5 mb-8">
        {STATUS_GROUPS.map(group => (
          <div key={group.label}>
            <p
              className="text-[10px] font-medium text-[#98A0AD] mb-2.5"
            >
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.statuses.map(s => {
                const active = params.status === s
                return (
                  <Link
                    key={s}
                    href={active ? '/dashboard/leads' : `/dashboard/leads?status=${s}`}
                    className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                      active
                        ? getLeadStatusColour(s)
                        : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)] hover:text-[#1B6DFC] bg-[#FFFFFF]'
                    }`}
                  >
                    {getLeadStatusLabel(s)}
                    {counts[s] ? <span className="ml-1.5 opacity-60">{counts[s]}</span> : null}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Leads list */}
      {allLeads.length === 0 ? (
        <div className="br-card">
          <EmptyState
            icon={Users}
            title="No leads yet"
            hint="Add a lead manually or wait for scorecard submissions"
          />
        </div>
      ) : (
        <div className="grid gap-2">
          {allLeads.map(lead => (
            <Link
              key={lead.id}
              href={`/dashboard/leads/${lead.id}`}
              className="br-card px-5 py-4 flex items-center justify-between br-card-hover transition-shadow group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  <Avatar name={lead.name} size={36} />
                  {lead.lead_quality && (
                    <span
                      title={QUALITY_BADGE[lead.lead_quality].title}
                      className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#FFFFFF] ${
                        lead.lead_quality === 'red' ? 'bg-[#DC2626]' :
                        lead.lead_quality === 'yellow' ? 'bg-[#D97706]' :
                        'bg-[#16A34A]'
                      }`}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#141821] truncate group-hover:text-[#1B6DFC] transition-colors">{lead.name}</p>
                  <p className="text-[12px] text-[#98A0AD] truncate mt-0.5">
                    {lead.email}
                    {lead.phone ? ` · ${lead.phone}` : ''}
                    {' · '}
                    {getLeadSourceLabel(lead.source)}
                    {' · '}
                    {formatDate(lead.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                {lead.lead_quality && (
                  <span
                    className={`text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap ${QUALITY_BADGE[lead.lead_quality].className}`}
                    title={QUALITY_BADGE[lead.lead_quality].title}
                  >
                    {QUALITY_BADGE[lead.lead_quality].label}
                  </span>
                )}
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${getLeadStatusColour(lead.status)}`}>
                  {getLeadStatusLabel(lead.status)}
                </span>
                <ChevronRight size={16} className="text-[#98A0AD] group-hover:text-[#1B6DFC] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
