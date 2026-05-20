'use server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight, UserPlus, Users } from 'lucide-react'
import { formatDate, getLeadStatusLabel, getLeadStatusColour, getLeadSourceLabel } from '@/lib/utils'
import type { Lead } from '@/types'
import { PageHeader, Btn, EmptyState, MONO_FONT } from '@/components/dashboard/ui'

const STATUS_GROUPS = [
  { label: 'Pipeline', statuses: ['new_check_in', 'report_sent', 'cold_no_booking'] },
  { label: 'Zoom', statuses: ['zoom_booked', 'zoom_1_booked', 'zoom_completed', 'closed_no_show', 'closed_declined'] },
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
            <div className="inline-flex items-center bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg p-0.5">
              <Link
                href="/dashboard/leads"
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  !showInactive ? 'bg-[#1B6DFC] text-[#FFFFFF]' : 'text-[#6B6B6B] hover:text-white'
                }`}
              >
                Active
              </Link>
              <Link
                href="/dashboard/leads?view=inactive"
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  showInactive ? 'bg-[#E5E5E5] text-[#1A1A1A]' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
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
              className="text-[10px] font-bold text-[#999999] uppercase mb-2.5"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
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
                        : 'border-[#E5E5E5] text-[#6B6B6B] hover:border-[#D4D4D4] hover:text-[#1A1A1A] bg-[#FFFFFF]'
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
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl">
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
              className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-5 py-4 flex items-center justify-between hover:border-[#D4D4D4] transition-colors group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  <div
                    className="w-9 h-9 rounded-full bg-[#E5E5E5] border border-[#D4D4D4] flex items-center justify-center text-[13px] font-medium text-[#3A3A3A]"
                    style={{ fontFamily: MONO_FONT }}
                  >
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  {lead.lead_quality && (
                    <span
                      title={`Lead quality: ${lead.lead_quality}${lead.red_flag ? ' (red flag)' : ''}`}
                      className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#FFFFFF] ${
                        lead.lead_quality === 'red' ? 'bg-[#DC2626]' :
                        lead.lead_quality === 'yellow' ? 'bg-[#B7791F]' :
                        'bg-[#1B6DFC]'
                      }`}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#1A1A1A] truncate group-hover:text-[#1B6DFC] transition-colors">{lead.name}</p>
                  <p className="text-[12px] text-[#999999] truncate mt-0.5">
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
                {lead.red_flag && (
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#FEE7E7] border border-[#F5C6C6] text-[#DC2626] uppercase"
                    style={{ fontFamily: MONO_FONT, letterSpacing: '0.08em' }}
                    title="Red flag - half show rate, half close rate historically"
                  >
                    Red Flag
                  </span>
                )}
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${getLeadStatusColour(lead.status)}`}>
                  {getLeadStatusLabel(lead.status)}
                </span>
                <ChevronRight size={16} className="text-[#999999] group-hover:text-[#1B6DFC] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
