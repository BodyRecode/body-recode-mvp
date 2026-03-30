import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate, getLeadStatusLabel, getLeadStatusColour, getLeadSourceLabel } from '@/lib/utils'
import LeadActions from './lead-actions'
import LeadDangerActions from './lead-danger-actions'
import EditContact from './edit-contact'
import ConvertButton from './convert-button'
import CancelSequenceButton from './cancel-sequence-button'
import SendOrientationButton from '@/components/send-orientation-button'
import NoShowSequenceButton from '@/components/noshow-sequence-button'
import CommencementFeeButton from '@/components/commencement-fee-button'
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

const EVENT_LABELS: Record<string, string> = {
  check_in_submitted: 'Check-in submitted',
  report_scheduled: 'Performance report scheduled',
  followup_scheduled: 'Follow-up email scheduled',
  followup_cancelled: 'Follow-up sequence cancelled',
  reengagement_sent: 'Re-engagement email sent',
  orientation_sent: 'Orientation guide sent',
  zoom_booked: 'Zoom call booked',
  noshow_sequence_scheduled: 'No-show re-engagement scheduled',
}

const EVENT_COLOURS: Record<string, string> = {
  check_in_submitted: 'bg-stone-600',
  report_scheduled: 'bg-teal-500',
  followup_scheduled: 'bg-stone-500',
  followup_cancelled: 'bg-red-500/60',
  reengagement_sent: 'bg-teal-500',
  orientation_sent: 'bg-teal-500',
  zoom_booked: 'bg-green-500',
  noshow_sequence_scheduled: 'bg-stone-500',
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const [{ data: lead }, { data: events }] = await Promise.all([
    supabase.from('leads').select('*').eq('id', id).single(),
    supabase
      .from('lead_events')
      .select('id, type, subject, notes, sent_at')
      .eq('lead_id', id)
      .order('sent_at', { ascending: false }),
  ])

  if (!lead) notFound()

  const answers = lead.check_in_answers as Record<string, number> | null

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
            <Link href="/dashboard/leads" className="hover:text-stone-300 transition-colors">Leads</Link>
            <span>/</span>
            <span className="text-stone-300">{lead.name}</span>
          </div>
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
      <EditContact leadId={lead.id} name={lead.name} email={lead.email} phone={lead.phone} />

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
              href={`/companion/${lead.id}/zoom-1`}
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
          <div className="flex items-center gap-2">
            <Link
              href="https://app.bodyrecode.au/orientation"
              target="_blank"
              className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 border border-stone-700 text-stone-300 rounded-lg hover:border-stone-500 hover:text-white transition-colors"
            >
              View Guide ↗
            </Link>
            <SendOrientationButton leadId={lead.id} alreadySent={!!lead.orientation_sent_at} />
          </div>
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
              href={`/companion/${lead.id}/zoom-2`}
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
          Generate a unique commencement fee link to send to the client. Once paid, their client profile and intake link are created automatically.
        </p>
        {!lead.converted_to_client_id ? (
          <div className="space-y-3">
            <CommencementFeeButton leadId={lead.id} />
            <p className="text-xs text-stone-600">Or convert manually once fee is confirmed:</p>
            <ConvertButton
              leadId={lead.id}
              leadName={lead.name}
              alreadyConverted={!!lead.converted_to_client_id}
              clientId={lead.converted_to_client_id}
            />
          </div>
        ) : (
          <ConvertButton
            leadId={lead.id}
            leadName={lead.name}
            alreadyConverted={!!lead.converted_to_client_id}
            clientId={lead.converted_to_client_id}
          />
        )}
      </div>

      {/* No-show re-engagement */}
      {lead.status === 'closed_no_show' && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-1">Re-engagement Sequence</h2>
            <p className="text-stone-500 text-sm">3 emails over 10 days. Day 1, Day 4, Day 10. Calm re-invitation to rebook.</p>
          </div>
          <NoShowSequenceButton leadId={lead.id} />
        </div>
      )}

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

      {/* Communications */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-5">Communications</h2>
        {events && events.length > 0 ? (
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-stone-800" />
            <div className="space-y-5">
              {events.map((event) => (
                <div key={event.id} className="flex gap-4 relative">
                  <div className={`w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 ${EVENT_COLOURS[event.type] ?? 'bg-stone-600'}`} />
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium">{EVENT_LABELS[event.type] ?? event.type}</p>
                    {event.subject && (
                      <p className="text-xs text-stone-500 mt-0.5 truncate">{event.subject}</p>
                    )}
                    {event.notes && (
                      <p className="text-xs text-stone-500 mt-0.5">{event.notes}</p>
                    )}
                    <p className="text-xs text-stone-600 mt-1">
                      {new Date(event.sent_at).toLocaleString('en-AU', {
                        timeZone: 'Australia/Brisbane',
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-stone-500 text-sm">No communications logged yet.</p>
        )}
      </div>

      {/* Lead Management */}
      <LeadDangerActions leadId={lead.id} isActive={lead.active !== false} />

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
