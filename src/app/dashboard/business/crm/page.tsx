import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Plus } from 'lucide-react'

const stageOrder = [
  'new_check_in',
  'report_sent',
  'zoom_booked',
  'zoom_1_booked',
  'zoom_completed',
  'commencement_fee_paid',
  'active_coaching',
]

const stageLabel: Record<string, string> = {
  new_check_in: 'New Lead',
  report_sent: 'Report Sent',
  cold_no_booking: 'Cold',
  zoom_booked: 'Zoom Booked',
  zoom_1_booked: 'Zoom Booked',
  zoom_completed: 'Zoom Done',
  commencement_fee_paid: 'Fee Paid',
  active_coaching: 'Active Client',
}

export default async function CRMPage() {
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, email, phone, status, source, created_at')
    .not('status', 'in', '("closed_declined","closed_no_show")')
    .order('created_at', { ascending: false })

  const byStage = stageOrder.reduce((acc, stage) => {
    acc[stage] = (leads || []).filter((l) => l.status === stage)
    return acc
  }, {} as Record<string, typeof leads>)

  const total = leads?.length || 0

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">CRM</h1>
          <p className="text-stone-400 text-sm">{total} active lead{total !== 1 ? 's' : ''} in pipeline</p>
        </div>
        <Link
          href="/dashboard/leads/new"
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-stone-950 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} />
          New Lead
        </Link>
      </div>

      {/* Pipeline board */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minWidth: 0 }}>
        {stageOrder.map((stage) => {
          const cards = byStage[stage] || []
          return (
            <div key={stage} className="shrink-0 w-52">
              {/* Stage header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  {stageLabel[stage]}
                </p>
                <span className="text-xs text-stone-600 bg-stone-800 px-1.5 py-0.5 rounded-full">
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {cards.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/dashboard/business/crm/${lead.id}`}
                    className="block bg-stone-900 border border-stone-800 rounded-lg p-3 hover:border-stone-700 transition-colors group"
                  >
                    <p className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors truncate">
                      {lead.name}
                    </p>
                    {lead.email && (
                      <p className="text-xs text-stone-500 truncate mt-0.5">{lead.email}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-stone-600 uppercase tracking-wider">
                        {lead.source || 'direct'}
                      </span>
                      <span className="text-[10px] text-stone-600">
                        {new Date(lead.created_at).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </Link>
                ))}

                {cards.length === 0 && (
                  <div className="bg-stone-900/50 border border-dashed border-stone-800 rounded-lg p-3">
                    <p className="text-xs text-stone-700 text-center">Empty</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Closed leads link */}
      <div className="mt-6 pt-6 border-t border-stone-800">
        <Link
          href="/dashboard/leads"
          className="text-xs text-stone-500 hover:text-stone-300 transition-colors flex items-center gap-1"
        >
          <Users size={12} />
          View all leads including closed →
        </Link>
      </div>
    </div>
  )
}
