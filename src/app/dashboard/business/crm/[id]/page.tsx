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
  'zoom_1_booked',
  'zoom_1_completed',
  'zoom_2_booked',
  'zoom_2_completed',
  'commencement_fee_paid',
  'active_client',
]

const stageLabel: Record<string, string> = {
  new: 'New Lead',
  report_sent: 'Report Sent',
  zoom_1_booked: 'Zoom 1 Booked',
  zoom_1_completed: 'Zoom 1 Completed',
  zoom_2_booked: 'Zoom 2 Booked',
  zoom_2_completed: 'Zoom 2 Completed',
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
      <div className="flex items-center gap-2 text-stone-500 text-sm mb-6">
        <Link href="/dashboard/business/crm" className="hover:text-stone-300 transition-colors">CRM</Link>
        <span>/</span>
        <span className="text-stone-300">{lead.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{lead.name}</h1>
          <p className="text-stone-400 text-sm">
            {getLeadSourceLabel(lead.source)}
            {lead.source_detail ? ` — ${lead.source_detail}` : ''}
            {' · Added '}
            {new Date(lead.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <Link
          href={`/dashboard/leads/${lead.id}`}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white border border-stone-700 hover:border-stone-500 px-3 py-1.5 rounded-lg transition-colors"
        >
          Coaching Tools
          <ArrowUpRight size={12} />
        </Link>
      </div>

      {/* Contact info */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-4">
        <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">Contact</h2>
        <div className="space-y-3">
          {lead.email && (
            <div className="flex items-center gap-3">
              <Mail size={14} className="text-stone-500 shrink-0" />
              <a href={`mailto:${lead.email}`} className="text-sm text-white hover:text-teal-400 transition-colors">
                {lead.email}
              </a>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-3">
              <Phone size={14} className="text-stone-500 shrink-0" />
              <a href={`tel:${lead.phone}`} className="text-sm text-white hover:text-teal-400 transition-colors">
                {lead.phone}
              </a>
            </div>
          )}
          {!lead.email && !lead.phone && (
            <p className="text-stone-500 text-sm">No contact details.</p>
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
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-4">
        <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">Pipeline Stage</h2>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-5">
          {stageOrder.map((stage, i) => (
            <div
              key={stage}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= currentStageIndex ? 'bg-teal-500' : 'bg-stone-800'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-white">
            {stageLabel[lead.status] ?? lead.status}
          </span>
          <span className="text-xs text-stone-500">
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
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-4">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">Quick Links</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/leads/${lead.id}/report`}
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-white border border-stone-700 hover:border-stone-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              <FileText size={12} />
              Performance Report
            </Link>
            <Link
              href={`/dashboard/leads/${lead.id}/zoom-1`}
              className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-white border border-stone-700 hover:border-stone-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Calendar size={12} />
              Zoom 1 Companion
            </Link>
            <Link
              href={`/dashboard/leads/${lead.id}/zoom-2`}
              className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-white border border-stone-700 hover:border-stone-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Calendar size={12} />
              Zoom 2 Companion
            </Link>
            {lead.converted_to_client_id && (
              <Link
                href={`/dashboard/clients/${lead.converted_to_client_id}`}
                className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 border border-teal-500/30 hover:border-teal-500/60 px-3 py-1.5 rounded-lg transition-colors"
              >
                <ArrowUpRight size={12} />
                View Client Profile
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
        <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">Notes</h2>
        <NotesEditor leadId={lead.id} initialNotes={lead.notes || ''} />
      </div>
    </div>
  )
}
