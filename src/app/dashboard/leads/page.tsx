'use server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, getLeadStatusLabel, getLeadStatusColour, getLeadSourceLabel } from '@/lib/utils'
import type { Lead } from '@/types'

const STATUS_GROUPS = [
  { label: 'Pipeline', statuses: ['new_check_in', 'report_sent', 'cold_no_booking'] },
  { label: 'Zoom', statuses: ['zoom_1_booked', 'zoom_1_completed', 'closed_no_show', 'zoom_2_booked', 'zoom_2_completed', 'closed_declined'] },
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
    .eq('active', !showInactive)
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status)
  if (params.source) query = query.eq('source', params.source)

  const { data: leads } = await query
  const allLeads: Lead[] = leads || []

  const counts: Record<string, number> = {}
  allLeads.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1 })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-stone-400 text-sm mt-1">{allLeads.length} {showInactive ? 'inactive' : 'active'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5">
            <Link
              href="/dashboard/leads"
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${!showInactive ? 'bg-teal-500 text-black' : 'text-stone-400 hover:text-white'}`}
            >
              Active
            </Link>
            <Link
              href="/dashboard/leads?view=inactive"
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${showInactive ? 'bg-stone-600 text-white' : 'text-stone-400 hover:text-white'}`}
            >
              Inactive
            </Link>
          </div>
          <Link
            href="/dashboard/leads/new"
            className="bg-white text-stone-950 text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-100 transition-colors"
          >
            + Add Lead
          </Link>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-6 mb-8">
        {STATUS_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold tracking-widest text-stone-500 uppercase mb-2">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.statuses.map(s => (
                <Link
                  key={s}
                  href={params.status === s ? '/dashboard/leads' : `/dashboard/leads?status=${s}`}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    params.status === s
                      ? getLeadStatusColour(s)
                      : 'border-stone-700 text-stone-400 hover:border-stone-500'
                  }`}
                >
                  {getLeadStatusLabel(s)}
                  {counts[s] ? <span className="ml-1.5 opacity-60">{counts[s]}</span> : null}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Leads list */}
      {allLeads.length === 0 ? (
        <div className="text-center py-20 text-stone-500">
          <p className="text-lg mb-2">No leads yet</p>
          <p className="text-sm">Add a lead manually or wait for quiz submissions to come in</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {allLeads.map(lead => (
            <Link
              key={lead.id}
              href={`/dashboard/leads/${lead.id}`}
              className="bg-stone-900 border border-stone-800 rounded-xl px-5 py-4 flex items-center justify-between hover:border-stone-600 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-stone-700 flex items-center justify-center text-sm font-medium text-stone-300 shrink-0">
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-white">{lead.name}</p>
                  <p className="text-stone-500 text-xs mt-0.5">
                    {lead.email}
                    {lead.phone ? ` · ${lead.phone}` : ''}
                    {' · '}
                    {getLeadSourceLabel(lead.source)}
                    {' · '}
                    {formatDate(lead.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getLeadStatusColour(lead.status)}`}>
                  {getLeadStatusLabel(lead.status)}
                </span>
                <span className="text-stone-600 group-hover:text-stone-400 transition-colors">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
