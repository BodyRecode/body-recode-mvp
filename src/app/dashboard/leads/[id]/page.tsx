import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ChevronLeft, AlertTriangle, Video, CalendarClock } from 'lucide-react'
import { formatDate, getLeadStatusLabel, getLeadStatusColour, getLeadSourceLabel } from '@/lib/utils'
import LeadActions from './lead-actions'
import LeadDangerActions from './lead-danger-actions'
import EditContact from './edit-contact'
import ConvertButton from './convert-button'
import CancelSequenceButton from './cancel-sequence-button'
import PreCallRead from './pre-call-read'
import LeadTabs, { type LeadTab } from './lead-tabs'
import CopyField from './copy-field'
import NoShowSequenceButton from '@/components/noshow-sequence-button'
import Zoom1DeclinedButton from '@/components/zoom1-declined-button'
import CommencementFeeButton from '@/components/commencement-fee-button'
import DownsellButton from '@/components/downsell-button'
import BookingActionButtons from '@/components/booking-action-buttons'
import Link from 'next/link'
import { MONO_FONT } from '@/components/dashboard/ui'
import { buildLeadBrief } from '@/lib/lead-brief'
import BriefCard from './brief-card'
import PrepAnswers from '@/components/prep-answers'

const EVENT_LABELS: Record<string, string> = {
  check_in_submitted: 'Check-in submitted',
  report_scheduled: 'Performance report scheduled',
  followup_scheduled: 'Follow-up email scheduled',
  followup_cancelled: 'Follow-up sequence cancelled',
  zoom_declined: 'Declined after Zoom',
  reengagement_sent: 'Re-engagement email sent',
  zoom_booked: 'Zoom call booked',
  noshow_sequence_scheduled: 'No-show re-engagement scheduled',
  scorecard_completed: 'Scorecard completed',
  email_sent: 'Email sent',
  downsell_purchased: 'Self-Guided Program purchased',
  downsell_reentry: 'Re-entered funnel via Self-Guided Program',
  challenge_enrolled: 'Challenge enrolled',
  challenge_welcome_sent: 'Challenge welcome sent',
  challenge_coach_notified: 'Coach notified of enrollment',
  day_zero_intake_completed: 'Day 0 intake completed',
  custom_time_requested: 'Custom call time requested',
  custom_time_coach_notified: 'Coach notified of time request',
  booking_confirmation_sent: 'Booking confirmation sent',
  prep_form_completed: 'Pre-call form completed',
  prep_form_reminder_sent: 'Pre-call form reminder sent',
  orientation_sent: 'Orientation sent',
}

const EVENT_COLOURS: Record<string, string> = {
  prep_form_completed: 'bg-[#1B6DFC]',
  scorecard_completed: 'bg-[#1B6DFC]',
  day_zero_intake_completed: 'bg-[#1B6DFC]',
  zoom_booked: 'bg-green-500',
  challenge_enrolled: 'bg-green-500',
  downsell_purchased: 'bg-green-500',
  custom_time_requested: 'bg-amber-500',
  followup_cancelled: 'bg-red-400',
  zoom_declined: 'bg-red-400',
}

const STATE_COLOUR: Record<string, string> = {
  'Depleted State': '#DC2626',
  'Transitioning State': '#B7791F',
  'Ready State': '#1B6DFC',
}

const SCORECARD_SECTIONS: Record<string, string> = {
  '01': 'Energy', '02': 'Sleep', '03': 'Stress', '04': 'Training', '05': 'Fat Loss',
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-[#E5E5E5] rounded-2xl p-5 ${className}`}>{children}</div>
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-6 h-[3px] rounded-full bg-[#1B6DFC]" />
      <h2 className="text-[11px] font-bold text-[#1A1A1A] uppercase" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>
        {children}
      </h2>
    </div>
  )
}

function bne(d: string, withTime = true) {
  return new Date(d).toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'short', day: 'numeric', month: 'short',
    ...(withTime ? { hour: 'numeric', minute: '2-digit', hour12: true } : {}),
  })
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const [{ data: lead }, { data: events }, { data: bookings }] = await Promise.all([
    supabase.from('leads').select('*').eq('id', id).single(),
    supabase.from('lead_events').select('id, type, subject, notes, sent_at').eq('lead_id', id).order('sent_at', { ascending: false }),
    supabase.from('be_bookings').select('id, scheduled_at, duration_minutes, status, meeting_link').eq('lead_id', id).order('scheduled_at', { ascending: false }),
  ])

  if (!lead) notFound()

  const [{ data: enrollment }, { data: scorecardReport }] = await Promise.all([
    supabase.from('challenge_enrollments').select('token, status, enrolled_at, quiz_result, quiz_completed_at, quiz_answers, body_decode_intake_completed_at').eq('lead_id', id).maybeSingle(),
    lead.email
      ? supabase.from('scorecard_reports').select('score, body_state, token').eq('email', lead.email).order('created_at', { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const nextBooking = (bookings ?? []).find(b => b.status === 'scheduled' && new Date(b.scheduled_at).getTime() > Date.now())
    ?? (bookings ?? []).find(b => b.status === 'scheduled')

  const { brief, supplement, prepNotes, scopeFlags, summary, isStoredFallback } = buildLeadBrief(
    lead,
    events,
    nextBooking ? `${bne(nextBooking.scheduled_at)} Brisbane` : null,
  )

  const stateColour = lead.scorecard_body_state ? STATE_COLOUR[lead.scorecard_body_state] : '#6B6B6B'
  const qualityColour = lead.lead_quality === 'red' ? '#DC2626' : lead.lead_quality === 'yellow' ? '#D97706' : '#16A34A'
  const sections = lead.scorecard_section_scores as Record<string, number> | null
  const checkInAnswers = lead.check_in_answers as Record<string, number> | null

  // ── Command bar ──────────────────────────────────────────────────────
  const commandBar = (
    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 mb-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight">{lead.name}</h1>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getLeadStatusColour(lead.status)}`}>
              {getLeadStatusLabel(lead.status)}
            </span>
            {lead.lead_quality && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ color: qualityColour, background: `${qualityColour}14`, border: `1px solid ${qualityColour}40` }}
              >
                {lead.lead_quality}{lead.red_flag ? ' · flag' : ''}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
            {lead.email && <CopyField value={lead.email} label="email" />}
            {lead.phone && <CopyField value={lead.phone} label="phone" />}
          </div>
          <p className="text-[11px] text-[#999999]" style={{ fontFamily: MONO_FONT, letterSpacing: '0.02em' }}>
            {getLeadSourceLabel(lead.source)}
            {lead.source_detail ? ` · ${lead.source_detail}` : ''}
            {lead.utm_campaign ? ` · ${lead.utm_campaign}` : ''}
            {' · added '}{formatDate(lead.created_at)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {lead.scorecard_score != null && lead.scorecard_body_state && (
            <div className="text-right">
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="text-3xl font-black leading-none" style={{ color: stateColour }}>{lead.scorecard_score}</span>
                <span className="text-xs text-[#999999]">/ 15</span>
              </div>
              <p className="text-[11px] font-bold mt-0.5" style={{ color: stateColour }}>
                {lead.scorecard_body_state.replace(' State', '')}
              </p>
              {lead.scorecard_profile && (
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                  {lead.scorecard_profile}
                  {lead.scorecard_profile_confidence === 'low' && <span className="text-[#B7791F]"> · provisional</span>}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Next action strip */}
      <div className="mt-4 pt-4 border-t border-[#E5E5E5] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px]">
          {nextBooking ? (
            <>
              <CalendarClock size={14} className="text-[#1B6DFC]" />
              <span className="font-semibold text-[#1A1A1A]">{bne(nextBooking.scheduled_at)} Brisbane</span>
              <span className="text-[#999999]">· {nextBooking.duration_minutes} min</span>
            </>
          ) : (
            <span className="text-[#999999]">No call booked</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {nextBooking?.meeting_link && (
            <Link href={nextBooking.meeting_link} target="_blank"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold px-3 py-1.5 border border-[#E5E5E5] text-[#3A3A3A] rounded-lg hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors">
              <Video size={13} /> Join Zoom
            </Link>
          )}
          <Link href={`/companion/${lead.id}/zoom`} target="_blank"
            className="text-[13px] font-bold px-3 py-1.5 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#5390FF] transition-colors">
            Call companion ↗
          </Link>
        </div>
      </div>

      {scopeFlags.length > 0 && (
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-300 p-3.5">
          <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <AlertTriangle size={12} /> Scope flags from their own words
          </p>
          <p className="text-[13px] text-amber-900 leading-relaxed">
            {scopeFlags.map(f => f.flag).join(' · ')}
            <span className="text-amber-800"> — what to do about each is in the Brief tab.</span>
          </p>
        </div>
      )}
    </div>
  )

  // ── Tabs ─────────────────────────────────────────────────────────────
  const tabs: LeadTab[] = []

  tabs.push({
    id: 'brief',
    label: 'Brief',
    alert: scopeFlags.length > 0,
    content: (
      <div className="space-y-4">
        {isStoredFallback && (
          <p className="text-[12px] text-[#B7791F] bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Showing the stored brief. Not enough scorecard data on file to rebuild it live.
          </p>
        )}
        {summary && <BriefCard summary={summary} scopeFlags={scopeFlags} />}
        {brief
          ? <PreCallRead leadId={lead.id} initialBrief={brief} />
          : <Card><p className="text-sm text-[#6B6B6B]">No brief yet. It builds automatically once a scorecard is on file.</p></Card>}
        {supplement && (
          <details className="bg-white border border-[#E5E5E5] rounded-2xl group">
            <summary className="px-5 py-3.5 cursor-pointer select-none text-[13px] font-semibold text-[#6B6B6B] hover:text-[#1A1A1A]">
              In-person session supplement
              <span className="font-normal text-[#999999]"> — only if you are running this at AF Newstead</span>
            </summary>
            <pre className="mx-5 mb-5 text-[12px] leading-relaxed text-[#3A3A3A] whitespace-pre-wrap font-sans bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-4 max-h-[420px] overflow-y-auto">
              {supplement}
            </pre>
          </details>
        )}
      </div>
    ),
  })

  tabs.push({
    id: 'words',
    label: 'Their words',
    badge: prepNotes ? '✓' : null,
    content: (
      <div className="space-y-4">
        {prepNotes ? (
          <Card>
            <CardTitle>Pre-call form</CardTitle>
            <PrepAnswers notes={prepNotes} />
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-[#6B6B6B]">
              Pre-call form not completed. It is sent with their booking confirmation, and chased at 24 and 72 hours.
            </p>
          </Card>
        )}
        {lead.situation_text && (
          <Card>
            <CardTitle>In their own words, from the scorecard</CardTitle>
            <p className="text-[13px] leading-relaxed text-[#3A3A3A] whitespace-pre-wrap">{lead.situation_text}</p>
          </Card>
        )}
        {enrollment?.quiz_answers && (
          <Card>
            <CardTitle>Day 7 Check-In answers</CardTitle>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {Object.entries(enrollment.quiz_answers as Record<string, string>).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 text-[12px] border-b border-[#F4F4F4] py-1">
                  <span className="text-[#999999]">{k}</span>
                  <span className="text-[#3A3A3A] font-medium">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    ),
  })

  tabs.push({
    id: 'timeline',
    label: 'Timeline',
    badge: events?.length ?? 0,
    content: (
      <Card>
        {events && events.length > 0 ? (
          <div className="space-y-0">
            {events.map(e => (
              <div key={e.id} className="flex gap-3 py-2.5 border-b border-[#F4F4F4] last:border-0">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${EVENT_COLOURS[e.type] ?? 'bg-[#D4D4D4]'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[13px] font-semibold text-[#1A1A1A]">
                      {e.subject || EVENT_LABELS[e.type] || e.type}
                    </p>
                    <span className="text-[11px] text-[#999999] shrink-0" style={{ fontFamily: MONO_FONT }}>
                      {bne(e.sent_at)}
                    </span>
                  </div>
                  {e.subject && EVENT_LABELS[e.type] && (
                    <p className="text-[11px] text-[#999999]">{EVENT_LABELS[e.type]}</p>
                  )}
                  {e.notes && e.type !== 'prep_form_completed' && (
                    <p className="text-[12px] text-[#6B6B6B] mt-0.5 whitespace-pre-wrap">{e.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6B6B6B]">Nothing recorded yet.</p>
        )}
      </Card>
    ),
  })

  tabs.push({
    id: 'scorecard',
    label: 'Scorecard',
    content: (
      <div className="space-y-4">
        {lead.scorecard_score != null ? (
          <Card>
            <CardTitle>Body State Scorecard</CardTitle>
            {sections && (
              <div className="grid grid-cols-5 gap-2 mb-4">
                {Object.entries(SCORECARD_SECTIONS).map(([key, title]) => {
                  const s = sections[key]
                  const color = s === 1 ? '#DC2626' : s === 2 ? '#B7791F' : s === 3 ? '#1B6DFC' : '#999999'
                  const bg = s === 1 ? '#FEE7E7' : s === 2 ? '#FEF6E7' : s === 3 ? '#F3F7FF' : '#F4F4F4'
                  return (
                    <div key={key} className="rounded-lg p-2.5 text-center" style={{ background: bg, border: `1px solid ${color}33` }}>
                      <div className="text-xl font-black" style={{ color }}>{s ?? '-'}</div>
                      <div className="text-[10px] font-medium text-[#6B6B6B] mt-0.5">{title}</div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] pt-3 border-t border-[#E5E5E5]">
              {[
                ['Body state', lead.scorecard_body_state],
                ['Pattern', lead.scorecard_profile ? `${lead.scorecard_profile}${lead.scorecard_profile_confidence === 'low' ? ' (provisional)' : ''}` : null],
                ['Sex', lead.biological_sex], ['Age band', lead.age_band?.replace('_', '-')],
                ['Fat storage', lead.fat_storage?.replace('_', ' ')], ['Cycle', lead.cycle_status],
                ['Approach', lead.approach_response], ['Investment', lead.investment_readiness],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-3 border-b border-[#F4F4F4] py-1">
                  <span className="text-[#999999]">{k}</span>
                  <span className="text-[#3A3A3A] font-medium">{v}</span>
                </div>
              ))}
            </div>
            {scorecardReport?.token && (
              <Link href={`/report/${scorecardReport.token}`} target="_blank"
                className="inline-block mt-4 text-[13px] font-bold text-[#1B6DFC] hover:underline">
                Open their scorecard report ↗
              </Link>
            )}
          </Card>
        ) : (
          <Card><p className="text-sm text-[#6B6B6B]">No scorecard on file.</p></Card>
        )}

        {enrollment && (
          <Card>
            <CardTitle>14-Day Challenge</CardTitle>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px]">
              {[
                ['Status', enrollment.status],
                ['Enrolled', bne(enrollment.enrolled_at, false)],
                ['Day 0 intake', enrollment.body_decode_intake_completed_at ? bne(enrollment.body_decode_intake_completed_at, false) : 'Not done'],
                ['Check-In', enrollment.quiz_completed_at ? bne(enrollment.quiz_completed_at, false) : 'Not done'],
                ['Check-In pattern', enrollment.quiz_result ?? '-'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-[#F4F4F4] py-1">
                  <span className="text-[#999999]">{k}</span>
                  <span className="text-[#3A3A3A] font-medium">{v}</span>
                </div>
              ))}
            </div>
            {enrollment.token && (
              <Link href={`/challenge/${enrollment.token}`} target="_blank"
                className="inline-block mt-3 text-[13px] font-bold text-[#1B6DFC] hover:underline">
                Open their Challenge portal ↗
              </Link>
            )}
          </Card>
        )}

        {checkInAnswers && Object.keys(checkInAnswers).length > 0 && (
          <Card>
            <CardTitle>Legacy performance check-in</CardTitle>
            <p className="text-[12px] text-[#6B6B6B]">{Object.keys(checkInAnswers).length} answers on file from the old check-in form.</p>
          </Card>
        )}
      </div>
    ),
  })

  tabs.push({
    id: 'actions',
    label: 'Actions',
    content: (
      <div className="space-y-4">
        <Card>
          <CardTitle>Booking</CardTitle>
          <BookingActionButtons leadId={lead.id} leadName={lead.name} leadEmail={lead.email ?? undefined} hasZoomDate={!!lead.zoom_1_date || !!nextBooking} />
          {bookings && bookings.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#E5E5E5] space-y-1.5">
              {bookings.map(b => (
                <div key={b.id} className="flex items-center justify-between text-[12px]">
                  <span className="text-[#3A3A3A]">{bne(b.scheduled_at)} · {b.duration_minutes} min</span>
                  <span className={b.status === 'scheduled' ? 'text-[#1B6DFC] font-semibold' : 'text-[#999999]'}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Coaching entry</CardTitle>
          <div className="flex flex-wrap gap-2">
            <ConvertButton leadId={lead.id} leadName={lead.name} alreadyConverted={!!lead.converted_to_client_id} clientId={lead.converted_to_client_id} />
            <CommencementFeeButton leadId={lead.id} />
            <DownsellButton leadId={lead.id} alreadyPurchased={!!lead.downsell_purchased} />
          </div>
        </Card>

        <Card>
          <CardTitle>Sequences</CardTitle>
          <div className="flex flex-wrap gap-2">
            <NoShowSequenceButton leadId={lead.id} />
            <Zoom1DeclinedButton leadId={lead.id} />
            <CancelSequenceButton leadId={lead.id} />
          </div>
          <p className="text-[11px] text-[#999999] mt-3 leading-relaxed">
            No-show re-engagement only applies once the status is Closed - No Show. Cancel stops any scheduled follow-up emails.
          </p>
        </Card>
      </div>
    ),
  })

  tabs.push({
    id: 'admin',
    label: 'Admin',
    content: (
      <div className="space-y-4">
        <Card>
          <CardTitle>Contact</CardTitle>
          <EditContact leadId={lead.id} name={lead.name} email={lead.email} phone={lead.phone} />
        </Card>
        <Card>
          <CardTitle>Lead management</CardTitle>
          <LeadActions lead={lead} />
        </Card>
        {lead.notes && (
          <Card>
            <CardTitle>Notes</CardTitle>
            <p className="text-[13px] text-[#3A3A3A] whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
          </Card>
        )}
        <Card>
          <CardTitle>Danger zone</CardTitle>
          <LeadDangerActions leadId={lead.id} isActive={lead.active !== false} />
        </Card>
      </div>
    ),
  })

  return (
    <div className="max-w-[900px]">
      <Link href="/dashboard/leads" className="inline-flex items-center gap-1 text-[12px] text-[#999999] hover:text-[#3A3A3A] transition-colors mb-3">
        <ChevronLeft size={13} /> All Leads
      </Link>
      {commandBar}
      <LeadTabs tabs={tabs} />
    </div>
  )
}
