'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRunbookForDate, getUpcomingDecisions, RUNBOOK } from '@/lib/today-runbook'
import { nextUpStep, phaseGateReview } from '@/lib/saas-buildout-manifest'
import { getLeadStatusLabel } from '@/lib/utils'
import { Zap, Calendar, Camera, Target, BarChart3, Gavel, Inbox, BookOpen, Palmtree, Construction, Clock, UserCheck } from 'lucide-react'

interface FollowUpLead {
  id: string
  name: string | null
  status: string
  next_follow_up_at: string
  follow_up_note: string | null
}

/** A warm lead who asked for time. Their follow-up date has not arrived yet. */
interface DecidingLead {
  id: string
  name: string | null
  status: string
  next_follow_up_at: string
  follow_up_note: string | null
  zoom_1_date: string | null
}

interface CalendarPost {
  id: string
  date: string
  time: string | null
  brand: string | null
  platform: string | null
  type: string
  title: string
  caption: string | null
  graphic: string | null
  scheduled: boolean
  posted_at: string | null
  scheduled_publish_at: string | null
  ig_post_url: string | null
}

interface FeedbackRow {
  id: string
  created_at: string
  stage: string
  moment: string
  response_text: string | null
  coach_seen_at: string | null
  permission_status: string
}

interface WaveStatus {
  current: { number: number; label: string; cap: number | null }
  taken: number
  remaining: number | null
  isFull: boolean
  isEvergreen: boolean
  nextWave: { number: number; label: string } | null
}

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function timeRemaining(targetTime: string): { mins: number; label: string } {
  const now = new Date()
  const [h, m] = targetTime.split(':').map(Number)
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  const mins = Math.round((target.getTime() - now.getTime()) / 60000)
  if (mins < 0) return { mins, label: 'overdue' }
  if (mins < 60) return { mins, label: `in ${mins}min` }
  const hours = Math.floor(mins / 60)
  const r = mins % 60
  return { mins, label: `in ${hours}h${r ? ` ${r}m` : ''}` }
}

export default function TodayDashboardPage() {
  const [date, setDate] = useState(todayIso())
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const [feedback, setFeedback] = useState<FeedbackRow[]>([])
  const [clientsAwaitingReply, setClientsAwaitingReply] = useState(0)
  const [followUps, setFollowUps] = useState<FollowUpLead[]>([])
  const [deciding, setDeciding] = useState<DecidingLead[]>([])
  const [wave, setWave] = useState<WaveStatus | null>(null)
  const [enrolmentsLast24h, setEnrolmentsLast24h] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  // Tick state persists to localStorage so refreshes don't lose progress.
  // Keys are unique per date (check:${date}:${i}) and per story-row (story:${uuid}),
  // so accumulation is bounded and old items self-expire when Kade views a different day.
  const CHECKED_STORAGE_KEY = 'today-dashboard-checked-items'
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = window.localStorage.getItem(CHECKED_STORAGE_KEY)
      if (raw) return new Set(JSON.parse(raw))
    } catch {
      /* localStorage unavailable in some contexts (private windows, quota) - fall through */
    }
    return new Set()
  })

  async function load() {
    setLoading(true)
    const [postsRes, feedbackRes, waveRes, enrolRes, unansweredRes, followUpRes, decidingRes] = await Promise.all([
      supabase.from('calendar_posts').select('id, date, time, brand, platform, type, title, caption, graphic, scheduled, posted_at, scheduled_publish_at, ig_post_url').eq('date', date).order('time', { ascending: true, nullsFirst: false }),
      supabase.from('feedback_responses').select('id, created_at, stage, moment, response_text, coach_seen_at, permission_status').is('coach_seen_at', null).order('created_at', { ascending: false }).limit(10),
      fetch('/api/challenge/wave-status').then(r => r.json()).catch(() => null),
      supabase.from('challenge_enrollments').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      // Offboarded clients are not owed a reply. Vicki S ended on 31 Jul and
      // her last message was her saying she was not going ahead, which kept
      // this metric sitting on 1 for a fortnight.
      supabase.from('client_messages')
        .select('client_id, clients!inner(ended_at)')
        .eq('sender', 'client')
        .is('responded_at', null)
        .is('handled_at', null)
        .is('clients.ended_at', null),
      // Warm leads whose follow-up date has arrived. Overdue ones stay in the
      // list rather than expiring, because a missed follow-up is still owed.
      supabase.from('leads')
        .select('id, name, status, next_follow_up_at, follow_up_note')
        .not('next_follow_up_at', 'is', null)
        .lte('next_follow_up_at', new Date(new Date(date + 'T23:59:59+10:00')).toISOString())
        .eq('active', true)
        .order('next_follow_up_at', { ascending: true }),
      // Warm leads still deciding, whose follow-up date has NOT arrived yet.
      //
      // Added 2026-08-17. The list above only surfaces someone once their date
      // lands, which meant a lead who asked for time disappeared for three
      // weeks. Dee Berry held her call on 13 Aug with a follow-up set for
      // 3 Sept and was invisible in between — long enough for the only emails
      // she received to be a cold sequence nobody had noticed was still running.
      // Silence you can see is a decision. Silence you cannot see is a leak.
      supabase.from('leads')
        .select('id, name, status, next_follow_up_at, follow_up_note, zoom_1_date')
        .not('next_follow_up_at', 'is', null)
        .gt('next_follow_up_at', new Date(new Date(date + 'T23:59:59+10:00')).toISOString())
        .is('converted_to_client_id', null)
        .eq('active', true)
        .order('next_follow_up_at', { ascending: true }),
    ])
    setPosts((postsRes.data ?? []) as CalendarPost[])
    setFeedback((feedbackRes.data ?? []) as FeedbackRow[])
    setWave(waveRes as WaveStatus | null)
    setEnrolmentsLast24h(enrolRes.count ?? 0)
    // Count distinct clients waiting, not raw messages: three questions from
    // one person is one conversation to answer, not three.
    setClientsAwaitingReply(
      new Set(((unansweredRes.data ?? []) as { client_id: string }[]).map(r => r.client_id)).size
    )
    setFollowUps((followUpRes.data ?? []) as FollowUpLead[])
    setDeciding((decidingRes.data ?? []) as DecidingLead[])
    setLoading(false)
  }

  useEffect(() => { load() }, [date]) // eslint-disable-line react-hooks/exhaustive-deps

  const runbookEntry = useMemo(() => getRunbookForDate(date), [date])
  const upcomingDecisions = useMemo(() => getUpcomingDecisions(date, 7), [date])

  // Categorise posts
  const stories = posts.filter(p => p.type === 'story')
  const feedPosts = posts.filter(p => p.type !== 'story')

  // Time-sensitive: stories due in next 90 min OR posts not yet scheduled+posted
  const now = new Date()
  const timeSensitive = posts
    .filter(p => p.time && !p.posted_at)
    .map(p => ({ post: p, tr: timeRemaining(p.time!) }))
    .filter(x => x.tr.mins >= -30 && x.tr.mins <= 90)
    .sort((a, b) => a.tr.mins - b.tr.mins)

  // Decisions due today (top of runbook entry) + upcoming
  const decisionsToday = runbookEntry?.decisions ?? []

  function toggle(key: string) {
    setCheckedItems(s => {
      const n = new Set(s)
      if (n.has(key)) n.delete(key); else n.add(key)
      // Persist immediately so refresh restores state.
      try {
        window.localStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(Array.from(n)))
      } catch {
        /* quota / private window - state still works in-memory for this session */
      }
      return n
    })
  }

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // Date navigation
  function dateOffset(days: number): string {
    const [y, m, d] = date.split('-').map(Number)
    const dt = new Date(y, m - 1, d + days)
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-[#FBFCFD] text-[#141821]">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2  flex-wrap br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
            <span className="text-[12.5px] font-medium text-blue-600">Today</span>
            {runbookEntry && <span className="text-[12.5px] font-semibold text-[#666D7A] bg-white border border-[#E8EAEE] px-2 py-0.5 rounded">{runbookEntry.label}</span>}
          </div>
          <h1 className="text-2xl sm:text-[26px] font-semibold tracking-[-0.035em] tracking-tight">{dateLabel}</h1>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button onClick={() => setDate(dateOffset(-1))} className="text-[12.5px] bg-white border border-[#E8EAEE] px-3 py-1.5 rounded font-medium hover:bg-[#F4F6F9]">← Yesterday</button>
            <button onClick={() => setDate(todayIso())} className="text-[12.5px] bg-blue-500 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-600">Today</button>
            <button onClick={() => setDate(dateOffset(1))} className="text-[12.5px] bg-white border border-[#E8EAEE] px-3 py-1.5 rounded font-medium hover:bg-[#F4F6F9]">Tomorrow →</button>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-[12.5px] bg-white border border-[#E8EAEE] px-2 py-1 rounded font-medium" />
            <button onClick={load} className="text-[12.5px] bg-[#EFF1F4] hover:bg-[#E8EAEE] text-[#141821] px-3 py-1.5 rounded font-medium ml-auto">↻ Refresh</button>
          </div>
        </div>

        {loading && <p className="text-sm text-[#666D7A]">Loading…</p>}

        {!loading && (
          <>
            {/* ⚡ TIME-SENSITIVE */}
            {timeSensitive.length > 0 && (
              <Section icon={Zap} title="Time-sensitive" tone="urgent">
                {timeSensitive.map(({ post, tr }) => (
                  <Row key={post.id}>
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${tr.mins < 0 ? 'bg-red-100 text-red-700' : tr.mins < 30 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{post.time}</span>
                      <span className={`text-xs font-semibold ${tr.mins < 0 ? 'text-red-700' : 'text-[#666D7A]'}`}>{tr.label}</span>
                      <span className="text-[12.5px] text-[#666D7A]">{post.type}</span>
                    </div>
                    <p className="text-sm font-medium mt-1">{post.title}</p>
                  </Row>
                ))}
              </Section>
            )}

            {/* 📅 SCHEDULED FEED POSTS */}
            {feedPosts.length > 0 && (
              <Section icon={Calendar} title="Feed posts today" tone="default">
                {feedPosts.map(p => {
                  const status = p.posted_at ? 'posted' : p.scheduled_publish_at ? 'scheduled' : p.scheduled ? 'marked_scheduled' : 'pending'
                  const statusEl = status === 'posted'
                    ? <a href={p.ig_post_url ?? '#'} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-semibold text-green-700 bg-green-50 border border-green-300 px-2 py-0.5 rounded">✓ Posted</a>
                    : status === 'scheduled' ? <span className="text-[12.5px] font-semibold text-blue-700 bg-blue-50 border border-blue-300 px-2 py-0.5 rounded inline-flex items-center gap-1"><Clock size={11} strokeWidth={2.5} /> Scheduled</span>
                    : status === 'marked_scheduled' ? <span className="text-[12.5px] font-semibold text-blue-700 bg-blue-50 border border-blue-300 px-2 py-0.5 rounded inline-flex items-center gap-1"><Clock size={11} strokeWidth={2.5} /> Marked</span>
                    : <span className="text-[12.5px] font-semibold text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">Pending</span>
                  return (
                    <Row key={p.id}>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[12.5px] font-semibold text-blue-500 bg-blue-50 border border-blue-500/20 px-2 py-0.5 rounded">{p.time ?? '—'}</span>
                        <span className="text-[10px] font-medium text-[#666D7A] bg-[#F4F6F9] border border-[#E8EAEE] px-1.5 py-0.5 rounded">{p.brand?.replace('_', ' ') ?? 'br'}</span>
                        <span className="text-[10px] font-medium text-[#666D7A] bg-[#F4F6F9] border border-[#E8EAEE] px-1.5 py-0.5 rounded">{p.platform ?? 'ig'}</span>
                        <span className="text-[10px] font-medium text-[#666D7A] bg-[#F4F6F9] border border-[#E8EAEE] px-1.5 py-0.5 rounded">{p.type}</span>
                        <span className="ml-auto">{statusEl}</span>
                      </div>
                      <p className="text-sm font-medium">{p.title}</p>
                    </Row>
                  )
                })}
              </Section>
            )}

            {/* 📸 STORIES */}
            {stories.length > 0 && (
              <Section icon={Camera} title={`Stories today (${stories.length})`} tone="default">
                {stories.map(s => {
                  const checked = checkedItems.has(`story:${s.id}`)
                  return (
                    <Row key={s.id} onClick={() => toggle(`story:${s.id}`)} interactive>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={checked} onChange={() => toggle(`story:${s.id}`)} className="cursor-pointer" />
                        <span className="text-[12.5px] font-semibold text-blue-500 bg-blue-50 border border-blue-500/20 px-2 py-0.5 rounded">{s.time ?? '—'}</span>
                        <span className={`text-sm font-medium ${checked ? 'line-through text-[#98A0AD]' : ''}`}>{s.title}</span>
                      </div>
                    </Row>
                  )
                })}
              </Section>
            )}

            {/* 🎯 OPS CHECKS */}
            {runbookEntry && runbookEntry.checks.length > 0 && (
              <Section icon={Target} title="Ops checks today" tone="default">
                {runbookEntry.checks.map((check, i) => {
                  const key = `check:${date}:${i}`
                  const checked = checkedItems.has(key)
                  // Normalise: check can be a string OR { task, instructions }
                  const task = typeof check === 'string' ? check : check.task
                  const instructions = typeof check === 'string' ? null : check.instructions
                  return (
                    <Row key={i} interactive>
                      <div className="flex items-start gap-2" onClick={() => toggle(key)}>
                        <input type="checkbox" checked={checked} onChange={() => toggle(key)} className="cursor-pointer mt-0.5" />
                        <span className={`text-sm ${checked ? 'line-through text-[#98A0AD]' : 'text-[#141821] font-medium'}`}>{task}</span>
                      </div>
                      {instructions && !checked && (
                        <div className="mt-1.5 ml-6 text-[12.5px] text-[#666D7A] leading-relaxed whitespace-pre-line">
                          {renderInstructionsWithLinks(instructions)}
                        </div>
                      )}
                    </Row>
                  )
                })}
              </Section>
            )}

            {/* 📊 LIVE METRICS */}
            <Section icon={BarChart3} title="Live metrics" tone="default">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {wave && !wave.isEvergreen && (
                  <Metric label={`Wave ${wave.current.number}`} value={`${wave.taken}/${wave.current.cap ?? '—'}`} sub={`${wave.remaining} left`} tone={wave.isFull ? 'urgent' : 'default'} />
                )}
                {wave?.isEvergreen && <Metric label="Wave" value="Evergreen" sub="No cap" tone="success" />}
                <Metric label="Enrolments 24h" value={String(enrolmentsLast24h)} sub="last day" tone="default" />
                <Metric label="Unseen feedback" value={String(feedback.length)} sub="triage queue" tone={feedback.length > 0 ? 'urgent' : 'default'} />
                <Metric label="Awaiting reply" value={String(clientsAwaitingReply)} sub="client messages" tone={clientsAwaitingReply > 0 ? 'urgent' : 'default'} />
                <Metric label="Posts today" value={String(posts.length)} sub={`${feedPosts.length} feed + ${stories.length} stories`} tone="default" />
              </div>
            </Section>

            {/* 🤝 FOLLOW-UPS DUE */}
            {followUps.length > 0 && (
              <Section icon={UserCheck} title={`Follow up (${followUps.length})`} tone="urgent">
                {followUps.map(l => {
                  const due = new Date(l.next_follow_up_at)
                  const overdueDays = Math.floor((Date.now() - due.getTime()) / 86400000)
                  return (
                    <Row key={l.id}>
                      <div className="flex items-start gap-2">
                        {overdueDays > 0 && (
                          <span className="text-[12.5px] font-medium text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded shrink-0">
                            {overdueDays}d late
                          </span>
                        )}
                        <div className="min-w-0">
                          <a href={`/dashboard/leads/${l.id}`} className="text-sm font-semibold text-[#141821] hover:text-[#1B6DFC]">
                            {l.name ?? 'Unnamed lead'}
                          </a>
                          <span className="text-[12.5px] text-[#666D7A]"> · {getLeadStatusLabel(l.status)}</span>
                          {l.follow_up_note && (
                            <p className="text-[12.5px] text-[#666D7A] leading-relaxed mt-0.5">{l.follow_up_note}</p>
                          )}
                        </div>
                      </div>
                    </Row>
                  )
                })}
              </Section>
            )}

            {/* ⏳ STILL DECIDING — warm, waiting, not yet due */}
            {deciding.length > 0 && (
              <Section icon={Clock} title={`Still deciding (${deciding.length})`} tone="default">
                <p className="text-[12.5px] text-[#666D7A] mb-2 leading-relaxed">
                  Had a call, asked for time. Nothing is owed today, but they are warm and they are
                  waiting. Open one if something has changed.
                </p>
                {deciding.map(l => {
                  const due = new Date(l.next_follow_up_at)
                  const daysUntil = Math.ceil((due.getTime() - Date.now()) / 86400000)
                  const daysSinceCall = l.zoom_1_date
                    ? Math.floor((Date.now() - new Date(l.zoom_1_date).getTime()) / 86400000)
                    : null
                  return (
                    <Row key={l.id}>
                      <div className="min-w-0">
                        <a
                          href={`/dashboard/leads/${l.id}`}
                          className="text-sm font-semibold text-[#141821] hover:text-[#1B6DFC]"
                        >
                          {l.name ?? 'Unnamed lead'}
                        </a>
                        <span className="text-[12.5px] text-[#666D7A]">
                          {' '}· {getLeadStatusLabel(l.status)} · you follow up in {daysUntil}d
                          {daysSinceCall !== null ? ` · call was ${daysSinceCall}d ago` : ''}
                        </span>
                        {l.follow_up_note && (
                          <p className="text-[12.5px] text-[#666D7A] leading-relaxed mt-0.5">{l.follow_up_note}</p>
                        )}
                      </div>
                    </Row>
                  )
                })}
              </Section>
            )}

            {/* 🚦 DECISIONS DUE */}
            {(decisionsToday.length > 0 || upcomingDecisions.length > 1) && (
              <Section icon={Gavel} title="Decisions" tone={decisionsToday.length > 0 ? 'urgent' : 'default'}>
                {decisionsToday.map((d, i) => (
                  <Row key={`today-${i}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-[12.5px] font-medium text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded shrink-0">TODAY</span>
                      <span className="text-sm text-[#141821]">{d}</span>
                    </div>
                  </Row>
                ))}
                {upcomingDecisions.filter(u => u.date !== date).slice(0, 3).map((entry, i) => (
                  <div key={`up-${i}`} className="border-t border-[#E8EAEE] pt-2 mt-2">
                    <p className="text-[12.5px] font-semibold text-[#666D7A] mb-1">{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} · {entry.label}</p>
                    {entry.decisions.map((d, j) => <p key={j} className="text-[12.5px] text-[#666D7A] leading-relaxed pl-3">{d}</p>)}
                  </div>
                ))}
              </Section>
            )}

            {/* 📨 UNSEEN FEEDBACK */}
            {feedback.length > 0 && (
              <Section icon={Inbox} title={`Unseen feedback (${feedback.length})`} tone="default">
                {feedback.slice(0, 5).map(f => (
                  <Row key={f.id}>
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-[12.5px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">{f.stage}</span>
                      <span className="text-[12.5px] text-[#666D7A]">{f.moment}</span>
                      <span className="text-[12.5px] text-[#98A0AD] ml-auto">{new Date(f.created_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {f.response_text && <p className="text-[12.5px] text-[#141821] mt-1 line-clamp-2 italic">&ldquo;{f.response_text}&rdquo;</p>}
                  </Row>
                ))}
                <Row>
                  <a href="/dashboard/feedback" target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-semibold text-blue-600 hover:text-blue-700">→ Open feedback triage</a>
                </Row>
              </Section>
            )}

            {/* 🏗 SAAS BUILDOUT — next up + phase gate (only shows when actionable) */}
            <SaasBuildoutSection />

            {/* 📚 RUNBOOK CONTEXT */}
            {runbookEntry && (
              <Section icon={BookOpen} title="Runbook context" tone="default">
                <p className="text-[12.5px] text-[#666D7A] mb-2">Phase: <strong>{runbookEntry.phase.replace('_', ' ')}</strong></p>
                {runbookEntry.notes?.map((n, i) => <p key={i} className="text-sm text-[#141821] leading-relaxed">{n}</p>)}
                <div className="mt-3 space-y-1.5">
                  <RunbookLink
                    label="Pre-Launch 12-Day Runbook (now → Sun 12 Jul)"
                    path="/Users/kadedunstone/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/00_LAUNCH_2026_07_13_FUNNEL_B/2026-07-01_FunnelB_Pre_Launch_12_Day_Runbook.pdf"
                  />
                  <RunbookLink
                    label="Launch Day Runbook (Mon 13 Jul)"
                    path="/Users/kadedunstone/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/00_LAUNCH_2026_07_13_FUNNEL_B/2026-06-29_FunnelB_Launch_Day_Runbook_Mon_13_Jul.pdf"
                  />
                  <RunbookLink
                    label="Post-Launch Operational Runbook (Tue 14 Jul → Sun 24 Aug)"
                    path="/Users/kadedunstone/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/00_LAUNCH_2026_07_13_FUNNEL_B/2026-06-30_FunnelB_Post_Launch_Operational_Runbook.pdf"
                  />
                  <RunbookLink
                    label="Post-Launch 6-Week Strategy"
                    path="/Users/kadedunstone/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/00_LAUNCH_2026_07_13_FUNNEL_B/2026-06-30_FunnelB_Post_Launch_6_Week_Strategy.pdf"
                  />
                </div>
              </Section>
            )}

            {/* Empty-day fallback */}
            {!runbookEntry && posts.length === 0 && (
              <Section icon={Palmtree} title="Light day" tone="default">
                <p className="text-sm text-[#666D7A]">No runbook items for this date. No posts scheduled. {date < todayIso() ? 'Past date.' : 'Take the day.'}</p>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SaasBuildoutSection() {
  const next = nextUpStep()
  const gate = phaseGateReview()
  if (!next && !gate) return null

  return (
    <Section icon={Construction} title="SaaS buildout" tone={gate ? 'success' : 'default'}>
      {gate && (
        <Row>
          <div className="flex items-start gap-2 mb-1">
            <span className="text-[12.5px] font-medium text-green-700 bg-green-100 border border-green-300 px-2 py-0.5 rounded shrink-0">GATE</span>
            <span className="text-sm font-semibold text-[#141821]">Phase {gate.id} complete — review before starting Phase {gate.id + 1}</span>
          </div>
          <p className="text-[12.5px] text-[#666D7A] leading-relaxed ml-14">
            All non-deferred steps in this phase have shipped. Take a beat to validate outcomes before absorbing the next phase&apos;s cost.
          </p>
        </Row>
      )}
      {next && (
        <Row>
          <div className="flex items-start gap-2 mb-1">
            <span className="text-[12.5px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded shrink-0">NEXT UP</span>
            <span className="text-sm font-semibold text-[#141821]">Phase {next.phase.id} · {next.step.title}</span>
          </div>
          <p className="text-[12.5px] text-[#666D7A] leading-relaxed ml-14">{next.step.description}</p>
        </Row>
      )}
      <Row>
        <a href="/dashboard/settings/platform-buildout" className="text-[12.5px] font-semibold text-blue-600 hover:text-blue-700">→ Open Platform Buildout</a>
      </Row>
    </Section>
  )
}

function Section({ icon: Icon, title, tone, children }: { icon?: React.ElementType; title: string; tone: 'urgent' | 'default' | 'success'; children: React.ReactNode }) {
  const border = tone === 'urgent' ? 'border-red-300' : tone === 'success' ? 'border-green-300' : 'border-[#E8EAEE]'
  const chip = tone === 'urgent' ? 'bg-red-500/10 text-red-600' : tone === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-[#1B6DFC]/10 text-[#1B6DFC]'
  return (
    <div className={`bg-white border ${border} rounded-xl p-4 sm:p-5 mb-4`}>
      <h2 className="text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em] mb-3 flex items-center gap-2">
        {Icon ? <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${chip}`}><Icon size={14} strokeWidth={2.5} /></span> : null}
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ children, onClick, interactive }: { children: React.ReactNode; onClick?: () => void; interactive?: boolean }) {
  return (
    <div onClick={onClick} className={`py-2 ${interactive ? 'cursor-pointer hover:bg-[#FBFCFD] -mx-2 px-2 rounded' : ''}`}>
      {children}
    </div>
  )
}

// Parse [label](url) markdown-style links in a string into React elements.
// Preserves newlines (each line rendered as a fragment with \n retained for
// whitespace-pre-line to break on). External URLs open in a new tab; internal
// paths (starting with /) open in-place.
function renderInstructionsWithLinks(text: string): React.ReactNode[] {
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    const [, label, href] = match
    // Always open in a new tab so the Today dashboard stays intact as the "home base"
    // Kade returns to between tasks (external URLs + internal dashboard routes both).
    nodes.push(
      <a
        key={key++}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-700 underline font-medium"
      >
        {label}
      </a>
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }
  return nodes
}

// RunbookLink - opens local PDF via server-side `open` command on localhost.
// Browsers block file:// links from http:// origins for security, so the
// only reliable way to open a local file from a web page is to spawn the
// OS handler server-side. See /api/dev/open-file (POST-only, localhost-only,
// path-whitelisted).
function RunbookLink({ label, path }: { label: string; path: string }) {
  const [status, setStatus] = useState<'idle' | 'opening' | 'opened' | 'copied' | 'error'>('idle')

  async function open() {
    setStatus('opening')
    try {
      const res = await fetch('/api/dev/open-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
      if (res.ok) {
        setStatus('opened')
        setTimeout(() => setStatus('idle'), 2000)
      } else {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
      }
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(path)
      setStatus('copied')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      // navigator.clipboard fails in some contexts
    }
  }

  const labelText =
    status === 'opening' ? 'Opening…' :
    status === 'opened' ? '✓ Opened' :
    status === 'error' ? '× Failed - try Copy path' :
    label

  return (
    <div className="flex items-center gap-2 text-[12.5px]">
      <button
        onClick={open}
        className="text-blue-600 hover:text-blue-700 underline font-medium text-left"
        title="Click to open the PDF in Preview"
      >
        {labelText}
      </button>
      <button onClick={copy} className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${status === 'copied' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-[#F4F6F9] text-[#666D7A] border-[#E8EAEE] hover:bg-[#EFF1F4]'}`}>
        {status === 'copied' ? '✓ Copied path' : 'Copy path'}
      </button>
    </div>
  )
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: 'urgent' | 'success' | 'default' }) {
  const valueColor = tone === 'urgent' ? 'text-red-700' : tone === 'success' ? 'text-green-700' : 'text-[#141821]'
  return (
    <div className="bg-[#FBFCFD] border border-[#E8EAEE] rounded-lg p-3">
      <p className="text-[10px] font-medium text-[#666D7A] mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueColor} leading-none`}>{value}</p>
      <p className="text-[10px] text-[#666D7A] mt-1">{sub}</p>
    </div>
  )
}
