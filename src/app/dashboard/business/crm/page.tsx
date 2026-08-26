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
      <div className="flex items-center justify-between br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] mb-1">CRM</h1>
          <p className="text-[#666D7A] text-sm">{total} active lead{total !== 1 ? 's' : ''} in pipeline</p>
        </div>
        <Link
          href="/dashboard/leads/new"
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-500 text-[#FBFCFD] text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
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
                <p className="text-[12.5px] font-semibold text-[#666D7A]">
                  {stageLabel[stage]}
                </p>
                <span className="text-[12.5px] text-[#98A0AD] bg-[#EFF1F4] px-1.5 py-0.5 rounded-full">
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {cards.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/dashboard/business/crm/${lead.id}`}
                    className="block bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg p-3 hover:border-[#E8EAEE] transition-colors group"
                  >
                    <p className="text-sm font-medium text-[#141821] group-hover:text-blue-500 transition-colors truncate">
                      {lead.name}
                    </p>
                    {lead.email && (
                      <p className="text-[12.5px] text-[#666D7A] truncate mt-0.5">{lead.email}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-[#98A0AD]">
                        {lead.source || 'direct'}
                      </span>
                      <span className="text-[10px] text-[#98A0AD]">
                        {new Date(lead.created_at).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </Link>
                ))}

                {cards.length === 0 && (
                  <div className="bg-[#F4F6F9]/50 border border-dashed border-[#E8EAEE] rounded-lg p-3">
                    <p className="text-[12.5px] text-[#141821] text-center">Empty</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Closed leads link */}
      <div className="mt-6 pt-6 border-t border-[#E8EAEE]">
        <Link
          href="/dashboard/leads"
          className="text-[12.5px] text-[#666D7A] hover:text-[#141821] transition-colors flex items-center gap-1"
        >
          <Users size={12} />
          View all leads including closed →
        </Link>
      </div>
    </div>
  )
}
