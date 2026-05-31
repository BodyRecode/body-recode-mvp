'use client'

import { useMemo } from 'react'
import { ExternalLink, Mail, MessageSquare, CheckCircle2, Clock, AlertCircle, ChevronRight, User, Phone, MapPin, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/ui'

type Enrollment = {
  id: string
  token: string
  status: string | null
  enrolled_at: string
  parq_completed_at: string | null
  health_dec_completed_at: string | null
  quiz_completed_at: string | null
  quiz_result: string | null
  quiz_answers: Record<string, string> | null
}

type Lead = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  body_state: string | null
  scorecard_total: number | null
  source: string | null
  created_at: string
} | null

type LeadEvent = {
  id: string
  type: string
  subject: string | null
  resend_email_id: string | null
  notes: string | null
  sent_at: string
}

const PATTERN_LABELS: Record<string, string> = {
  a: 'Stress-Stored',
  b: 'Insulin-Drift',
  c: 'Estrogen-Shift',
  d: 'Androgen-Decline',
  'stress-stored': 'Stress-Stored',
  'metabolic-drift': 'Insulin-Drift',
  'hormonal-shift': 'Estrogen-Shift',
  'system-overload': 'Androgen-Decline',
}

const PATTERN_COLOURS: Record<string, string> = {
  a: '#DC2626', b: '#B7791F', c: '#8b5cf6', d: '#1B6DFC',
  'stress-stored': '#DC2626', 'metabolic-drift': '#B7791F', 'hormonal-shift': '#8b5cf6', 'system-overload': '#1B6DFC',
}

// SMS Minimal Pulse cadence — must mirror SMS_MORNING + SMS_AFTERNOON_BOOST
// in src/lib/inngest-functions.ts. Keep in lockstep when that changes.
const SMS_MORNING_TITLES: Record<number, string> = {
  1: 'Day 1 welcome + setup',
  2: 'Day 2 first training day',
  3: 'Day 3 rhythm holds',
  4: 'Day 4 rest day · sleep',
  5: 'Day 5 halfway · Week One Progress Session lands',
  6: 'Day 6 training day',
  7: 'Day 7 end of Week 1 · Check-In unlocks',
  8: 'Day 8 Week 2 begins',
  9: 'Day 9 stay steady',
  10: 'Day 10 training day',
  11: 'Day 11 three days to go',
  12: 'Day 12 training day',
  13: 'Day 13 one day to go',
  14: 'Day 14 final day · Body Decode Report drops today',
}

const SMS_AFTERNOON_BOOST_TITLES: Record<number, string> = {
  5: 'Day 5 afternoon · Watch the Progress Session',
  7: 'Day 7 afternoon · Have you done your Check-In?',
  14: 'Day 14 afternoon · Body Decode Report in your inbox',
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtDateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}

function addDays(iso: string, days: number): Date {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d
}

function addHours(iso: string, hours: number): Date {
  const d = new Date(iso)
  d.setHours(d.getHours() + hours)
  return d
}

export default function ParticipantView({
  enrollment, lead, events, currentDay,
}: {
  enrollment: Enrollment
  lead: Lead
  events: LeadEvent[]
  currentDay: number
}) {
  const name = lead?.name ?? '(no name on record)'
  const firstName = name.split(' ')[0] ?? ''
  const status = (enrollment.status ?? 'active').toLowerCase()
  const isComplete = status === 'completed'
  const quizCompleted = !!enrollment.quiz_completed_at

  // Compute progress score from quiz_answers (markers, non-sq prefix)
  const progressScore = useMemo(() => {
    if (!enrollment.quiz_answers) return null
    return Object.entries(enrollment.quiz_answers)
      .filter(([k]) => !k.startsWith('sq'))
      .filter(([, v]) => v === 'better')
      .length
  }, [enrollment.quiz_answers])

  // Build email audit timeline: scheduled vs actual
  const emailTimeline = useMemo(() => {
    const items: Array<{
      day: number
      label: string
      scheduledFor: Date
      status: 'scheduled' | 'sent' | 'overdue' | 'skipped'
      resendId?: string | null
      sentAt?: string
      note?: string
    }> = []

    const welcomeEvent = events.find(e => e.type === 'challenge_welcome_sent')
    items.push({
      day: 1,
      label: 'Welcome email (synchronous)',
      scheduledFor: new Date(enrollment.enrolled_at),
      status: welcomeEvent ? 'sent' : 'overdue',
      resendId: welcomeEvent?.resend_email_id ?? null,
      sentAt: welcomeEvent?.sent_at,
    })

    const coachEvent = events.find(e => e.type === 'challenge_coach_notified')
    items.push({
      day: 1,
      label: 'Coach enrollment notification (synchronous)',
      scheduledFor: new Date(enrollment.enrolled_at),
      status: coachEvent ? 'sent' : 'overdue',
      resendId: coachEvent?.resend_email_id ?? null,
      sentAt: coachEvent?.sent_at,
    })

    // Day 5 email — fires after 4-day Inngest sleep
    const day5Scheduled = addDays(enrollment.enrolled_at, 4)
    items.push({
      day: 5,
      label: 'Day 5 · Week One Progress Session email (Inngest)',
      scheduledFor: day5Scheduled,
      status: currentDay < 5 ? 'scheduled' : 'sent',
      note: currentDay >= 5 ? 'Inngest send not audited in lead_events. Verify in Inngest dashboard if needed.' : undefined,
    })

    // Day 7 progress email — fires on quiz submission if currentDay < 14
    items.push({
      day: 7,
      label: 'Day 7 · Progress email (on Check-In submission)',
      scheduledFor: addDays(enrollment.enrolled_at, 6),
      status: quizCompleted
        ? (new Date(enrollment.quiz_completed_at!).getTime() < addDays(enrollment.enrolled_at, 13).getTime() ? 'sent' : 'skipped')
        : currentDay < 7
          ? 'scheduled'
          : 'overdue',
      sentAt: enrollment.quiz_completed_at ?? undefined,
      note: quizCompleted && new Date(enrollment.quiz_completed_at!).getTime() >= addDays(enrollment.enrolled_at, 13).getTime()
        ? 'Late-taker — Day 7 progress email skipped, Body Decode Report sent instead.'
        : undefined,
    })

    // Day 14 — either Body Decode Report (if quiz completed) or plain ascension fallback
    const day14Scheduled = addDays(enrollment.enrolled_at, 13)
    if (quizCompleted) {
      items.push({
        day: 14,
        label: 'Day 14 · Body Decode Report email (Inngest)',
        scheduledFor: day14Scheduled,
        status: currentDay < 14 ? 'scheduled' : 'sent',
        note: currentDay >= 14 ? 'Inngest send not audited in lead_events. Verify in Inngest dashboard if needed.' : undefined,
      })
    } else {
      items.push({
        day: 14,
        label: 'Day 14 · Plain ascension fallback (Check-In not completed)',
        scheduledFor: day14Scheduled,
        status: currentDay < 14 ? 'scheduled' : 'sent',
        note: 'Will fire if Check-In is still not completed at Day 14.',
      })
    }

    return items
  }, [events, enrollment, currentDay, quizCompleted])

  // SMS Minimal Pulse audit
  const smsTimeline = useMemo(() => {
    const items: Array<{
      day: number
      window: 'morning' | 'afternoon'
      label: string
      scheduledFor: Date
      status: 'scheduled' | 'sent_inferred' | 'no_phone'
    }> = []
    const phone = lead?.phone?.trim()

    for (let day = 1; day <= 14; day++) {
      const morningScheduled = addHours(addDays(enrollment.enrolled_at, day - 1).toISOString(), 1)
      items.push({
        day,
        window: 'morning',
        label: SMS_MORNING_TITLES[day] ?? `Day ${day} morning`,
        scheduledFor: morningScheduled,
        status: !phone ? 'no_phone' : currentDay < day ? 'scheduled' : 'sent_inferred',
      })
      const boost = SMS_AFTERNOON_BOOST_TITLES[day]
      if (boost) {
        const boostScheduled = addHours(morningScheduled.toISOString(), 8)
        items.push({
          day,
          window: 'afternoon',
          label: boost,
          scheduledFor: boostScheduled,
          status: !phone ? 'no_phone' : currentDay < day ? 'scheduled' : 'sent_inferred',
        })
      }
    }
    return items
  }, [enrollment.enrolled_at, currentDay, lead?.phone])

  return (
    <>
      <PageHeader
        eyebrow={`Day ${currentDay} of 14`}
        title={name}
        subtitle={`Challenge enrollment · token ${enrollment.token.slice(0, 8)}…`}
      />

      {/* Identity strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <InfoTile icon={Mail} label="Email" value={lead?.email ?? '-'} />
        <InfoTile icon={Phone} label="Phone" value={lead?.phone ?? '-'} />
        <InfoTile icon={MapPin} label="Body state" value={lead?.body_state ?? '-'} />
        <InfoTile icon={Calendar} label="Enrolled" value={fmtDateOnly(enrollment.enrolled_at)} />
      </div>

      {/* Day timeline progress bar */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Day-by-day progress</p>
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: isComplete ? '#1B6DFC' : '#1A1A1A' }}>
            {isComplete ? 'Completed' : `Day ${currentDay} · ${14 - currentDay} day${14 - currentDay === 1 ? '' : 's'} to go`}
          </span>
        </div>
        <div className="relative h-2 bg-stone-100 rounded-full overflow-hidden mb-3">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{ width: `${Math.round((currentDay / 14) * 100)}%`, background: '#1B6DFC' }}
          />
        </div>
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(d => {
            const isPast = d <= currentDay
            const isToday = d === currentDay
            const isMilestone = d === 5 || d === 7 || d === 14
            return (
              <div key={d} className="flex flex-col items-center" style={{ width: '7.14%' }}>
                <div
                  className={`w-2 h-2 rounded-full ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                  style={{ background: isPast ? '#1B6DFC' : '#E5E5E5' }}
                />
                <span className={`text-[9px] font-bold mt-1 ${isMilestone ? 'text-stone-900' : 'text-stone-400'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {d}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Check-In status */}
      <Section title="Body Decode Check-In">
        {quizCompleted ? (
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue-700">Completed</span>
              </div>
              <span className="text-xs text-stone-500">{fmtDate(enrollment.quiz_completed_at!)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Stat label="Pattern" value={
                <span style={{ color: enrollment.quiz_result ? (PATTERN_COLOURS[enrollment.quiz_result] ?? '#1A1A1A') : '#999999' }}>
                  {enrollment.quiz_result ? (PATTERN_LABELS[enrollment.quiz_result] ?? enrollment.quiz_result) : '-'}
                </span>
              } />
              <Stat label="Progress score" value={progressScore !== null ? `${progressScore} / 8 improving` : '-'} />
              <Stat label="Status" value={currentDay >= 14 ? 'Body Decode Report unlocked' : 'Day 7 view (Report at Day 14)'} />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
            <div className="inline-flex items-center gap-2 mb-2">
              {currentDay < 7 ? <Clock className="w-4 h-4 text-stone-400" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: currentDay < 7 ? '#6B6B6B' : '#B7791F' }}>
                {currentDay < 7 ? 'Locked until Day 7' : 'Pending — Day 7+'}
              </span>
            </div>
            <p className="text-sm text-stone-600">
              {currentDay < 7
                ? `Check-In unlocks on Day 7. ${7 - currentDay} day${7 - currentDay === 1 ? '' : 's'} to go.`
                : `Check-In is unlocked but not yet submitted. Late-takers who submit on Day 14+ receive the Body Decode Report immediately instead of the Day 7 progress email.`}
            </p>
          </div>
        )}
      </Section>

      {/* Quick links */}
      <Section title="Coach actions">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionLink
            href={`/challenge/${enrollment.token}`}
            label="Open portal as participant"
            sub="See exactly what the participant sees"
            external
          />
          <ActionLink
            href={`/dashboard/leads/${enrollment.lead_id || ''}`}
            label="Open full lead record"
            sub="Pre-Challenge history, communications, source"
          />
        </div>
      </Section>

      {/* Email audit */}
      <Section title="Email audit">
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-500 px-4 py-2.5">Day</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-500 px-4 py-2.5">Send</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-500 px-4 py-2.5">Status</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-500 px-4 py-2.5">When</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-500 px-4 py-2.5">Resend ID</th>
              </tr>
            </thead>
            <tbody>
              {emailTimeline.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}>
                  <td className="px-4 py-3 text-xs font-bold text-stone-700" style={{ fontVariantNumeric: 'tabular-nums' }}>Day {item.day}</td>
                  <td className="px-4 py-3 text-stone-900">{item.label}{item.note && <div className="text-[11px] text-stone-500 mt-1">{item.note}</div>}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-stone-600 text-xs">
                    {item.sentAt ? fmtDate(item.sentAt) : fmtDate(item.scheduledFor.toISOString())}
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs font-mono">
                    {item.resendId ? item.resendId.slice(0, 12) + '…' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* SMS audit */}
      <Section title={`SMS Minimal Pulse (17 messages${lead?.phone ? '' : ' · no phone on file'})`}>
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-500 px-4 py-2.5">Day</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-500 px-4 py-2.5">Window</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-500 px-4 py-2.5">Title</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-500 px-4 py-2.5">Status</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-500 px-4 py-2.5">Scheduled</th>
              </tr>
            </thead>
            <tbody>
              {smsTimeline.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}>
                  <td className="px-4 py-3 text-xs font-bold text-stone-700" style={{ fontVariantNumeric: 'tabular-nums' }}>Day {item.day}</td>
                  <td className="px-4 py-3 text-xs uppercase tracking-wider text-stone-500">{item.window}</td>
                  <td className="px-4 py-3 text-stone-900">{item.label}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-stone-600 text-xs">{fmtDate(item.scheduledFor.toISOString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-stone-200 text-[11px] text-stone-500">
            Note: Inngest SMS sends are not currently audited per-send in <code>lead_events</code>. The &quot;sent (inferred)&quot; status reflects what should have fired based on the participant&apos;s current day. Verify actual Twilio delivery in the Twilio console if needed.
          </div>
        </div>
      </Section>

      {/* Raw lead events */}
      {events.length > 0 && (
        <Section title="Raw lead events (audit log)">
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-500 px-4 py-2.5">Type</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-500 px-4 py-2.5">Subject</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-500 px-4 py-2.5">When</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-widest text-stone-500 px-4 py-2.5">Notes</th>
                </tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 text-xs font-mono text-stone-700">{e.type}</td>
                    <td className="px-4 py-3 text-stone-900 text-xs">{e.subject ?? '-'}</td>
                    <td className="px-4 py-3 text-stone-600 text-xs">{fmtDate(e.sent_at)}</td>
                    <td className="px-4 py-3 text-stone-500 text-xs">{e.notes ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-3">{title}</h2>
      {children}
    </div>
  )
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3 h-3 text-stone-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{label}</span>
      </div>
      <p className="text-sm text-stone-900 font-medium truncate">{value}</p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">{label}</p>
      <p className="text-sm font-semibold text-stone-900">{value}</p>
    </div>
  )
}

function ActionLink({ href, label, sub, external }: { href: string; label: string; sub: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="group flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 hover:border-blue-300 hover:bg-blue-50 transition"
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-stone-900">{label}</p>
          {external && <ExternalLink className="w-3 h-3 text-stone-400" />}
        </div>
        <p className="text-xs text-stone-500 mt-1">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-blue-600 transition" />
    </a>
  )
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    sent: { label: 'Sent', color: '#1056D6', bg: 'rgba(27,109,252,0.10)' },
    sent_inferred: { label: 'Sent (inferred)', color: '#1056D6', bg: 'rgba(27,109,252,0.06)' },
    scheduled: { label: 'Scheduled', color: '#6B6B6B', bg: '#F5F5F5' },
    overdue: { label: 'Overdue', color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
    skipped: { label: 'Skipped', color: '#999999', bg: '#F5F5F5' },
    no_phone: { label: 'No phone', color: '#999999', bg: '#F5F5F5' },
  }
  const c = config[status] ?? config.scheduled
  return (
    <span
      className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded"
      style={{ color: c.color, background: c.bg }}
    >
      {c.label}
    </span>
  )
}
