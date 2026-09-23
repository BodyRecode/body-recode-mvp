import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Plus } from 'lucide-react'

const stageOrder = [
  'new_check_in',
  'report_sent',
  'zoom_booked',
  'zoom_1_booked',
  'zoom_1_completed',
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
      <div className="flex items-center justify-between br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#2A2F39] bg-[#14171D]/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.025em] mb-1">CRM</h1>
          <p className="text-[#8A9099] text-sm">{total} active lead{total !== 1 ? 's' : ''} in pipeline</p>
        </div>
        <Link
          href="/dashboard/leads/new"
          className="flex items-center gap-2 bg-[#FAFAF8] hover:bg-[#E4E4E0] text-[#14171D] text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
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
                <p className="text-[12.5px] font-semibold text-[#8A9099]">
                  {stageLabel[stage]}
                </p>
                <span className="text-[12.5px] text-[#676D76] bg-[#1F242C] px-1.5 py-0.5 rounded-full">
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {cards.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/dashboard/business/crm/${lead.id}`}
                    className="block bg-[#1A1E26] border border-[#2A2F39] rounded-lg p-3 hover:border-[#2A2F39] transition-colors group"
                  >
                    <p className="text-sm font-medium text-[#FAFAF8] group-hover:text-[#FAFAF8] transition-colors truncate">
                      {lead.name}
                    </p>
                    {lead.email && (
                      <p className="text-[12.5px] text-[#8A9099] truncate mt-0.5">{lead.email}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-[#676D76]">
                        {lead.source || 'direct'}
                      </span>
                      <span className="text-[10px] text-[#676D76]">
                        {new Date(lead.created_at).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </Link>
                ))}

                {cards.length === 0 && (
                  <div className="bg-[#1A1E26]/50 border border-dashed border-[#2A2F39] rounded-lg p-3">
                    <p className="text-[12.5px] text-[#FAFAF8] text-center">Empty</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Closed leads link */}
      <div className="mt-6 pt-6 border-t border-[#2A2F39]">
        <Link
          href="/dashboard/leads"
          className="text-[12.5px] text-[#8A9099] hover:text-[#FAFAF8] transition-colors flex items-center gap-1"
        >
          <Users size={12} />
          View all leads including closed →
        </Link>
      </div>
    </div>
  )
}
