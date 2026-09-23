import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLeadSourceLabel } from '@/lib/utils'
import { Phone, Mail, ArrowUpRight, Calendar, FileText } from 'lucide-react'
import StageMover from './stage-mover'
import NotesEditor from './notes-editor'
import ContactEditor from './contact-editor'

const stageOrder = [
  'new',
  'report_sent',
  'zoom_booked',
  'zoom_1_booked',
  'zoom_1_completed',
  'commencement_fee_paid',
  'active_client',
]

const stageLabel: Record<string, string> = {
  new: 'New Lead',
  report_sent: 'Report Sent',
  zoom_booked: 'Zoom Booked',
  zoom_1_booked: 'Zoom Booked',
  zoom_1_completed: 'Zoom Completed',
  commencement_fee_paid: 'Commencement Fee Paid',
  active_client: 'Active Client',
}

export default async function CRMContactPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (!lead) notFound()

  const currentStageIndex = stageOrder.indexOf(lead.status)

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[#8A9099] text-sm mb-6">
        <Link href="/dashboard/business/crm" className="hover:text-[#FAFAF8] transition-colors">CRM</Link>
        <span>/</span>
        <span className="text-[#FAFAF8]">{lead.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#2A2F39] bg-[#14171D]/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.025em] mb-1">{lead.name}</h1>
          <p className="text-[#8A9099] text-sm">
            {getLeadSourceLabel(lead.source)}
            {lead.source_detail ? ` - ${lead.source_detail}` : ''}
            {' · Added '}
            {new Date(lead.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <Link
          href={`/dashboard/leads/${lead.id}`}
          className="flex items-center gap-1.5 text-[12.5px] text-[#8A9099] hover:text-[#FAFAF8] border border-[#2A2F39] hover:border-[#2A2F39] px-3 py-1.5 rounded-lg transition-colors"
        >
          Coaching Tools
          <ArrowUpRight size={12} />
        </Link>
      </div>

      {/* Contact info */}
      <div className="bg-[#1A1E26] br-card p-5 mb-4">
        <h2 className="text-[12.5px] font-semibold text-[#8A9099] mb-4">Contact</h2>
        <div className="space-y-3">
          {lead.email && (
            <div className="flex items-center gap-3">
              <Mail size={14} className="text-[#8A9099] shrink-0" />
              <a href={`mailto:${lead.email}`} className="text-sm text-[#FAFAF8] hover:text-[#FAFAF8] transition-colors">
                {lead.email}
              </a>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-3">
              <Phone size={14} className="text-[#8A9099] shrink-0" />
              <a href={`tel:${lead.phone}`} className="text-sm text-[#FAFAF8] hover:text-[#FAFAF8] transition-colors">
                {lead.phone}
              </a>
            </div>
          )}
          {!lead.email && !lead.phone && (
            <p className="text-[#8A9099] text-sm">No contact details.</p>
          )}
        </div>
        <ContactEditor
          leadId={lead.id}
          initialName={lead.name}
          initialEmail={lead.email}
          initialPhone={lead.phone}
        />
      </div>

      {/* Pipeline stage */}
      <div className="bg-[#1A1E26] br-card p-5 mb-4">
        <h2 className="text-[12.5px] font-semibold text-[#8A9099] mb-4">Pipeline Stage</h2>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-5">
          {stageOrder.map((stage, i) => (
            <div
              key={stage}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= currentStageIndex ? 'bg-[#FAFAF8]' : 'bg-[#1F242C]'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-[#FAFAF8]">
            {stageLabel[lead.status] ?? lead.status}
          </span>
          <span className="text-[12.5px] text-[#8A9099]">
            {currentStageIndex + 1} of {stageOrder.length}
          </span>
        </div>

        <StageMover
          leadId={lead.id}
          currentStatus={lead.status}
          stageOrder={stageOrder}
          stageLabel={stageLabel}
        />
      </div>

      {/* Quick links */}
      {lead.check_in_answers && Object.keys(lead.check_in_answers as object).length > 0 && (
        <div className="bg-[#1A1E26] br-card p-5 mb-4">
          <h2 className="text-[12.5px] font-semibold text-[#8A9099] mb-4">Quick Links</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/leads/${lead.id}/report`}
              target="_blank"
              className="flex items-center gap-1.5 text-[12.5px] text-[#FAFAF8] hover:text-[#FAFAF8] border border-[#2A2F39] hover:border-[#2A2F39] px-3 py-1.5 rounded-lg transition-colors"
            >
              <FileText size={12} />
              Performance Report
            </Link>
            {/* Both of these used to point at their own companions: one a
                superseded copy, the other a route that does not exist. The lead
                page has always linked the live companion at /companion/[id]/zoom
                and this now matches it, so there is one companion, not three. */}
            <Link
              href={`/companion/${lead.id}/zoom`}
              target="_blank"
              className="flex items-center gap-1.5 text-[12.5px] text-[#FAFAF8] hover:text-[#FAFAF8] border border-[#2A2F39] hover:border-[#2A2F39] px-3 py-1.5 rounded-lg transition-colors"
            >
              <Calendar size={12} />
              Call Companion
            </Link>
            {lead.converted_to_client_id && (
              <Link
                href={`/dashboard/clients/${lead.converted_to_client_id}`}
                className="flex items-center gap-1.5 text-[12.5px] text-[#FAFAF8] hover:text-[#1056D6] border border-[#2A2F39] hover:border-[#FAFAF8]/60 px-3 py-1.5 rounded-lg transition-colors"
              >
                <ArrowUpRight size={12} />
                View Client Profile
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-[#1A1E26] br-card p-5">
        <h2 className="text-[12.5px] font-semibold text-[#8A9099] mb-4">Notes</h2>
        <NotesEditor leadId={lead.id} initialNotes={lead.notes || ''} />
      </div>
    </div>
  )
}
