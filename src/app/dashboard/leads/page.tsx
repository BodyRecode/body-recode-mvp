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
const QUALITY_BADGE: Record<'green' | 'yellow' | 'red', { label: string; className: string }> = {
  green: {
    label: 'Green Flag',
    className: 'bg-[#E6F4EA] border border-[#BFE3CA] text-[#16A34A]',
  },
  yellow: {
    label: '1 Red Flag',
    className: 'bg-[#FEF3E2] border border-[#F5DCB3] text-[#D97706]',
  },
  red: {
    label: '2 Red Flags',
    className: 'bg-[#FEE7E7] border border-[#F5C6C6] text-[#D4817E]',
  },
}

// THE HOVER TEXT IS ABOUT A REAL PERSON (10 Sep 2026).
//
// This copy shipped hardcoded to "she", because the audience is ~90% female.
// Matthew came through the same day and the badge described him as her. A male
// lead is rare, not hypothetical, and a coach reading a brief about the wrong
// person is exactly the kind of small wrongness that costs trust on a call.
//
// Sex comes from the scorecard (`biological_sex`). It is null for anyone who
// answered before the question existed, so the neutral form is the fallback,
// never a guess.
//
// Written with POSSESSIVES only — his / her / their — so there is no verb to
// agree with and the three forms drop into identical sentences.
function qualityTitle(quality: 'green' | 'yellow' | 'red', sex: 'M' | 'F' | null | undefined): string {
  const poss = sex === 'M' ? 'his' : sex === 'F' ? 'her' : 'their'
  switch (quality) {
    case 'green':
      return `No concerns — good answers on ${poss} response when progress stalls and on readiness to invest.`
    case 'yellow':
      return `One concern — either ${poss} response when progress stalls or ${poss} readiness to invest. The other answer was fine.`
    case 'red':
      return `Concerns on both — ${poss} response when progress stalls AND ${poss} readiness to invest. Historically half show rate, half close rate.`
  }
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
    <div className="w-full">
      <PageHeader
        eyebrow="Pipeline"
        title="Leads"
        subtitle={`${allLeads.length} ${showInactive ? 'inactive' : 'active'} ${allLeads.length === 1 ? 'lead' : 'leads'}`}
        cta={
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center bg-[#14171D] border border-[#2A2F39] rounded-lg p-0.5">
              <Link
                href="/dashboard/leads"
                className={`text-[12.5px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  !showInactive ? 'bg-[#FAFAF8] text-[#14171D]' : 'text-[#8A9099] hover:text-[#FAFAF8]'
                }`}
              >
                Active
              </Link>
              <Link
                href="/dashboard/leads?view=inactive"
                className={`text-[12.5px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  showInactive ? 'bg-[#1F242C] text-[#FAFAF8]' : 'text-[#8A9099] hover:text-[#FAFAF8]'
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
              className="text-[10px] font-medium text-[#676D76] mb-2.5"
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
                        : 'border-[#2A2F39] text-[#8A9099] hover:border-[#FAFAF8] hover:bg-[rgba(27,109,252,0.06)] hover:text-[#FAFAF8] bg-[#14171D]'
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
                      title={qualityTitle(lead.lead_quality, lead.biological_sex)}
                      className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#14171D] ${
                        lead.lead_quality === 'red' ? 'bg-[#D4817E]' :
                        lead.lead_quality === 'yellow' ? 'bg-[#D97706]' :
                        'bg-[#16A34A]'
                      }`}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium text-[#FAFAF8] truncate group-hover:text-[#FAFAF8] transition-colors">{lead.name}</p>
                  <p className="text-[12.5px] text-[#676D76] truncate mt-0.5">
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
                    title={qualityTitle(lead.lead_quality, lead.biological_sex)}
                  >
                    {QUALITY_BADGE[lead.lead_quality].label}
                  </span>
                )}
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${getLeadStatusColour(lead.status)}`}>
                  {getLeadStatusLabel(lead.status)}
                </span>
                <ChevronRight size={16} className="text-[#676D76] group-hover:text-[#FAFAF8] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
