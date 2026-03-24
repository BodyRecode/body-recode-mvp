import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate, getLeadStatusLabel, getLeadStatusColour, getLeadSourceLabel } from '@/lib/utils'
import LeadActions from './lead-actions'
import ConvertButton from './convert-button'
import CancelSequenceButton from './cancel-sequence-button'
import SendOrientationButton from '@/components/send-orientation-button'
import Link from 'next/link'

const CHECK_IN_QUESTIONS: Record<string, string> = {
  effort_vs_result: 'Effort relative to result',
  consistency: 'Consistency pattern',
  training_response: 'Training response',
  recovery_predictability: 'Recovery predictability',
  planning_vs_reality: 'Planning vs reality',
  week_variability: 'Week-to-week variability',
  body_signals: 'Body signals',
  external_load: 'External load',
  adjustments: 'Navigating adjustments',
  support: 'Support as a category',
}

const CHECK_IN_OPTIONS: Record<string, string[]> = {
  effort_vs_result: ['Rarely — effort and response feel aligned', 'Occasionally — some sessions require more than expected', 'Often — effort feels higher relative to the result', 'Frequently — it regularly feels harder than it seems it should'],
  consistency: ['Largely consistent with minor interruptions', 'Mostly consistent, with some start–stop periods', 'Variable, with frequent changes in routine', 'Difficult to maintain a steady pattern'],
  training_response: ['Settled and able to return to the day without much disruption', 'Noticeably worked, but manageable with some recovery', 'Variable — sometimes fine, sometimes harder to bounce back', 'Often carrying fatigue that lingers longer than expected'],
  recovery_predictability: ['Fairly predictable from week to week', 'Predictable most of the time, with occasional fluctuations', 'Inconsistent — recovery can vary without a clear pattern', 'Hard to predict — recovery often feels different session to session'],
  planning_vs_reality: ['Usually matches closely', 'Mostly matches, with some adjustments', 'Often requires changes as the week unfolds', 'Rarely matches as planned'],
  week_variability: ['Fairly similar from one week to the next', 'Mostly similar, with occasional changes', 'Often different, depending on the week', 'Rarely similar — weeks tend to look quite different'],
  body_signals: ['Occasionally, without affecting training much', 'Regularly, but usually manageable', 'Frequently, requiring adjustments more often than not', 'Very frequently, shaping how sessions are approached'],
  external_load: ['Generally steady and manageable', 'Manageable, with some periods of higher demand', 'Often busy or demanding, requiring ongoing adjustment', 'Frequently demanding, with little consistency week to week'],
  adjustments: ['Comfortable making adjustments when needed', 'Somewhat comfortable, but not always sure', 'Often uncertain about how to adjust', 'Rarely confident making changes on my own'],
  support: ['I mostly prefer to manage things independently', 'I occasionally look for guidance or input', 'I often benefit from having someone to sense-check decisions', 'I rely on external support to help navigate training'],
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (!lead) notFound()

  const answers = lead.check_in_answers as Record<string, number> | null

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold">{lead.name}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getLeadStatusColour(lead.status)}`}>
              {getLeadStatusLabel(lead.status)}
            </span>
          </div>
          <p className="text-stone-400 text-sm">
            {getLeadSourceLabel(lead.source)}
            {lead.source_detail ? ` — ${lead.source_detail}` : ''}
            {' · Added '}
            {formatDate(lead.created_at)}
          </p>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-4">Contact</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-stone-500 mb-1">Email</p>
            <p className="text-white text-sm">{lead.email || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500 mb-1">Phone</p>
            <p className="text-white text-sm">{lead.phone || '—'}</p>
          </div>
        </div>
      </div>

      {/* Zoom 1 companion */}
      {answers && Object.keys(answers).length > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-1">Zoom 1</h2>
            <p className="text-stone-500 text-sm">
              {lead.zoom_meeting_url ? 'Opens companion screen and Zoom call.' : 'Open the consultation companion screen for this call.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lead.zoom_meeting_url && (
              <Link
                href={lead.zoom_meeting_url}
                target="_blank"
                className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 border border-stone-700 text-stone-300 rounded-lg hover:border-stone-500 hover:text-white transition-colors"
              >
                Join Zoom ↗
              </Link>
            )}
            <Link
              href={`/dashboard/leads/${lead.id}/zoom-1`}
              target="_blank"
              className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 bg-[#10E1C2] text-black rounded-lg hover:bg-[#0ecfb2] transition-colors"
            >
              Open Call Companion ↗
            </Link>
          </div>
        </div>
      )}

      {/* Orientation */}
      {answers && Object.keys(answers).length > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-1">Orientation</h2>
            <p className="text-stone-500 text-sm">
              {lead.orientation_sent_at
                ? `Sent ${new Date(lead.orientation_sent_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : 'Send the orientation guide for the client to read before Zoom 2.'}
            </p>
          </div>
          <SendOrientationButton leadId={lead.id} alreadySent={!!lead.orientation_sent_at} />
        </div>
      )}

      {/* Zoom 2 companion */}
      {answers && Object.keys(answers).length > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-1">Zoom 2</h2>
            <p className="text-stone-500 text-sm">Orientation review, hot spot framing, and pricing conversation.</p>
          </div>
          <div className="flex items-center gap-2">
            {lead.zoom_meeting_url && (
              <Link
                href={lead.zoom_meeting_url}
                target="_blank"
                className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 border border-stone-700 text-stone-300 rounded-lg hover:border-stone-500 hover:text-white transition-colors"
              >
                Join Zoom ↗
              </Link>
            )}
            <Link
              href={`/dashboard/leads/${lead.id}/zoom-2`}
              target="_blank"
              className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 bg-[#10E1C2] text-black rounded-lg hover:bg-[#0ecfb2] transition-colors"
            >
              Open Call Companion ↗
            </Link>
          </div>
        </div>
      )}

      {/* Convert to client */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-4">Coaching Entry</h2>
        <p className="text-stone-500 text-sm mb-4">
          Once commencement fee is paid and the coaching agreement is signed, convert this lead to an active client. This creates their client profile and generates their intake link.
        </p>
        <ConvertButton
          leadId={lead.id}
          leadName={lead.name}
          alreadyConverted={!!lead.converted_to_client_id}
          clientId={lead.converted_to_client_id}
        />
      </div>

      {/* Actions */}
      <LeadActions lead={lead} />

      {/* Check-in answers */}
      {answers && Object.keys(answers).length > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-4">
          <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-4">Performance Check-In Answers</h2>
          <div className="space-y-4">
            {Object.entries(CHECK_IN_QUESTIONS).map(([key, label]) => {
              const val = answers[key]
              const optionText = CHECK_IN_OPTIONS[key]?.[val]
              if (val === undefined) return null
              return (
                <div key={key} className="border-b border-stone-800 pb-4 last:border-0 last:pb-0">
                  <p className="text-xs text-stone-400 mb-1">{label}</p>
                  <p className="text-white text-sm">{optionText || `Option ${val}`}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Scheduled Report */}
      {lead.report_html && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider">Scheduled Report</h2>
            {lead.report_scheduled_at && (
              <span className="text-xs text-teal-400 font-medium">
                Sends {new Date(lead.report_scheduled_at).toLocaleString('en-AU', {
                  timeZone: 'Australia/Brisbane',
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })} Brisbane
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <Link
              href={`/dashboard/leads/${lead.id}/report`}
              target="_blank"
              className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg hover:bg-teal-500/20 transition-colors"
            >
              View report ↗
            </Link>
            {lead.followup_email_ids && (lead.followup_email_ids as string[]).length > 0 && (
              <div className="text-right">
                <p className="text-xs text-stone-500 mb-1">{(lead.followup_email_ids as string[]).length} follow-up{(lead.followup_email_ids as string[]).length > 1 ? 's' : ''} scheduled</p>
                <CancelSequenceButton leadId={lead.id} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-4">Notes</h2>
        <p className="text-stone-400 text-sm leading-relaxed whitespace-pre-wrap">
          {lead.notes || 'No notes yet.'}
        </p>
      </div>
    </div>
  )
}
