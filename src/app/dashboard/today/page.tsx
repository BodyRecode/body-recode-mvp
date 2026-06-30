'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRunbookForDate, getUpcomingDecisions, RUNBOOK } from '@/lib/today-runbook'

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
  const [wave, setWave] = useState<WaveStatus | null>(null)
  const [enrolmentsLast24h, setEnrolmentsLast24h] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  async function load() {
    setLoading(true)
    const [postsRes, feedbackRes, waveRes, enrolRes] = await Promise.all([
      supabase.from('calendar_posts').select('id, date, time, brand, platform, type, title, caption, graphic, scheduled, posted_at, scheduled_publish_at, ig_post_url').eq('date', date).order('time', { ascending: true, nullsFirst: false }),
      supabase.from('feedback_responses').select('id, created_at, stage, moment, response_text, coach_seen_at, permission_status').is('coach_seen_at', null).order('created_at', { ascending: false }).limit(10),
      fetch('/api/challenge/wave-status').then(r => r.json()).catch(() => null),
      supabase.from('challenge_enrollments').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ])
    setPosts((postsRes.data ?? []) as CalendarPost[])
    setFeedback((feedbackRes.data ?? []) as FeedbackRow[])
    setWave(waveRes as WaveStatus | null)
    setEnrolmentsLast24h(enrolRes.count ?? 0)
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
    <div className="min-h-screen bg-stone-50 text-[#1A1A1A]">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Today</span>
            {runbookEntry && <span className="text-xs font-semibold text-stone-600 bg-white border border-stone-300 px-2 py-0.5 rounded">{runbookEntry.label}</span>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{dateLabel}</h1>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button onClick={() => setDate(dateOffset(-1))} className="text-xs bg-white border border-stone-300 px-3 py-1.5 rounded font-medium hover:bg-stone-100">← Yesterday</button>
            <button onClick={() => setDate(todayIso())} className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-600">Today</button>
            <button onClick={() => setDate(dateOffset(1))} className="text-xs bg-white border border-stone-300 px-3 py-1.5 rounded font-medium hover:bg-stone-100">Tomorrow →</button>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-xs bg-white border border-stone-300 px-2 py-1 rounded font-medium" />
            <button onClick={load} className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-700 px-3 py-1.5 rounded font-medium ml-auto">↻ Refresh</button>
          </div>
        </div>

        {loading && <p className="text-sm text-stone-500">Loading…</p>}

        {!loading && (
          <>
            {/* ⚡ TIME-SENSITIVE */}
            {timeSensitive.length > 0 && (
              <Section title="⚡ Time-sensitive" tone="urgent">
                {timeSensitive.map(({ post, tr }) => (
                  <Row key={post.id}>
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${tr.mins < 0 ? 'bg-red-100 text-red-700' : tr.mins < 30 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{post.time}</span>
                      <span className={`text-xs font-semibold ${tr.mins < 0 ? 'text-red-700' : 'text-stone-600'}`}>{tr.label}</span>
                      <span className="text-xs text-stone-500 uppercase tracking-wide">{post.type}</span>
                    </div>
                    <p className="text-sm font-medium mt-1">{post.title}</p>
                  </Row>
                ))}
              </Section>
            )}

            {/* 📅 SCHEDULED FEED POSTS */}
            {feedPosts.length > 0 && (
              <Section title="📅 Feed posts today" tone="default">
                {feedPosts.map(p => {
                  const status = p.posted_at ? 'posted' : p.scheduled_publish_at ? 'scheduled' : p.scheduled ? 'marked_scheduled' : 'pending'
                  const statusEl = status === 'posted'
                    ? <a href={p.ig_post_url ?? '#'} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-green-700 bg-green-50 border border-green-300 px-2 py-0.5 rounded">✓ Posted</a>
                    : status === 'scheduled' ? <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-300 px-2 py-0.5 rounded">⏱ Scheduled</span>
                    : status === 'marked_scheduled' ? <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-300 px-2 py-0.5 rounded">⏱ Marked</span>
                    : <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">Pending</span>
                  return (
                    <Row key={p.id}>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold text-blue-500 bg-blue-50 border border-blue-500/20 px-2 py-0.5 rounded">{p.time ?? '—'}</span>
                        <span className="text-[10px] font-medium text-stone-600 bg-stone-100 border border-stone-300 px-1.5 py-0.5 rounded uppercase">{p.brand?.replace('_', ' ') ?? 'br'}</span>
                        <span className="text-[10px] font-medium text-stone-600 bg-stone-100 border border-stone-300 px-1.5 py-0.5 rounded uppercase">{p.platform ?? 'ig'}</span>
                        <span className="text-[10px] font-medium text-stone-600 bg-stone-100 border border-stone-300 px-1.5 py-0.5 rounded uppercase">{p.type}</span>
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
              <Section title={`📸 Stories today (${stories.length})`} tone="default">
                {stories.map(s => {
                  const checked = checkedItems.has(`story:${s.id}`)
                  return (
                    <Row key={s.id} onClick={() => toggle(`story:${s.id}`)} interactive>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={checked} onChange={() => toggle(`story:${s.id}`)} className="cursor-pointer" />
                        <span className="text-xs font-semibold text-blue-500 bg-blue-50 border border-blue-500/20 px-2 py-0.5 rounded">{s.time ?? '—'}</span>
                        <span className={`text-sm font-medium ${checked ? 'line-through text-stone-400' : ''}`}>{s.title}</span>
                      </div>
                    </Row>
                  )
                })}
              </Section>
            )}

            {/* 🎯 OPS CHECKS */}
            {runbookEntry && runbookEntry.checks.length > 0 && (
              <Section title="🎯 Ops checks today" tone="default">
                {runbookEntry.checks.map((check, i) => {
                  const key = `check:${date}:${i}`
                  const checked = checkedItems.has(key)
                  return (
                    <Row key={i} onClick={() => toggle(key)} interactive>
                      <div className="flex items-start gap-2">
                        <input type="checkbox" checked={checked} onChange={() => toggle(key)} className="cursor-pointer mt-0.5" />
                        <span className={`text-sm ${checked ? 'line-through text-stone-400' : 'text-stone-800'}`}>{check}</span>
                      </div>
                    </Row>
                  )
                })}
              </Section>
            )}

            {/* 📊 LIVE METRICS */}
            <Section title="📊 Live metrics" tone="default">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {wave && !wave.isEvergreen && (
                  <Metric label={`Wave ${wave.current.number}`} value={`${wave.taken}/${wave.current.cap ?? '—'}`} sub={`${wave.remaining} left`} tone={wave.isFull ? 'urgent' : 'default'} />
                )}
                {wave?.isEvergreen && <Metric label="Wave" value="Evergreen" sub="No cap" tone="success" />}
                <Metric label="Enrolments 24h" value={String(enrolmentsLast24h)} sub="last day" tone="default" />
                <Metric label="Unseen feedback" value={String(feedback.length)} sub="triage queue" tone={feedback.length > 0 ? 'urgent' : 'default'} />
                <Metric label="Posts today" value={String(posts.length)} sub={`${feedPosts.length} feed + ${stories.length} stories`} tone="default" />
              </div>
            </Section>

            {/* 🚦 DECISIONS DUE */}
            {(decisionsToday.length > 0 || upcomingDecisions.length > 1) && (
              <Section title="🚦 Decisions" tone={decisionsToday.length > 0 ? 'urgent' : 'default'}>
                {decisionsToday.map((d, i) => (
                  <Row key={`today-${i}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded shrink-0">TODAY</span>
                      <span className="text-sm text-stone-800">{d}</span>
                    </div>
                  </Row>
                ))}
                {upcomingDecisions.filter(u => u.date !== date).slice(0, 3).map((entry, i) => (
                  <div key={`up-${i}`} className="border-t border-stone-200 pt-2 mt-2">
                    <p className="text-xs font-semibold text-stone-600 mb-1">{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} · {entry.label}</p>
                    {entry.decisions.map((d, j) => <p key={j} className="text-xs text-stone-600 leading-relaxed pl-3">{d}</p>)}
                  </div>
                ))}
              </Section>
            )}

            {/* 📨 UNSEEN FEEDBACK */}
            {feedback.length > 0 && (
              <Section title={`📨 Unseen feedback (${feedback.length})`} tone="default">
                {feedback.slice(0, 5).map(f => (
                  <Row key={f.id}>
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">{f.stage}</span>
                      <span className="text-xs text-stone-500">{f.moment}</span>
                      <span className="text-xs text-stone-400 ml-auto">{new Date(f.created_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {f.response_text && <p className="text-xs text-stone-700 mt-1 line-clamp-2 italic">&ldquo;{f.response_text}&rdquo;</p>}
                  </Row>
                ))}
                <Row>
                  <a href="/dashboard/feedback" className="text-xs font-semibold text-blue-600 hover:text-blue-700">→ Open feedback triage</a>
                </Row>
              </Section>
            )}

            {/* 📚 RUNBOOK CONTEXT */}
            {runbookEntry && (
              <Section title="📚 Runbook context" tone="default">
                <p className="text-xs text-stone-600 mb-2">Phase: <strong>{runbookEntry.phase.replace('_', ' ')}</strong></p>
                {runbookEntry.notes?.map((n, i) => <p key={i} className="text-sm text-stone-700 leading-relaxed">{n}</p>)}
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
              <Section title="🌴 Light day" tone="default">
                <p className="text-sm text-stone-600">No runbook items for this date. No posts scheduled. {date < todayIso() ? 'Past date.' : 'Take the day.'}</p>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, tone, children }: { title: string; tone: 'urgent' | 'default' | 'success'; children: React.ReactNode }) {
  const border = tone === 'urgent' ? 'border-red-300' : tone === 'success' ? 'border-green-300' : 'border-stone-200'
  return (
    <div className={`bg-white border ${border} rounded-xl p-4 sm:p-5 mb-4`}>
      <h2 className="text-sm font-bold text-stone-700 mb-3 uppercase tracking-wide">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ children, onClick, interactive }: { children: React.ReactNode; onClick?: () => void; interactive?: boolean }) {
  return (
    <div onClick={onClick} className={`py-2 ${interactive ? 'cursor-pointer hover:bg-stone-50 -mx-2 px-2 rounded' : ''}`}>
      {children}
    </div>
  )
}

// RunbookLink - clickable open + copy-path button.
// Browsers block file:// from https:// origins for security, so the open link
// usually only works in Safari (which is more permissive). Copy-path button
// is the reliable fallback: paste into Finder ⌘+Shift+G to jump to the file.
function RunbookLink({ label, path }: { label: string; path: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(path)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // navigator.clipboard fails in some contexts; user falls back to right-click
    }
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <a
        href={`file://${path}`}
        className="text-blue-600 hover:text-blue-700 underline font-medium"
        title="Click to open (works in Safari; if it does nothing, use the Copy button instead)"
      >
        {label}
      </a>
      <button onClick={copy} className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${copied ? 'bg-green-50 text-green-700 border-green-300' : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'}`}>
        {copied ? '✓ Copied path' : 'Copy path'}
      </button>
    </div>
  )
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: 'urgent' | 'success' | 'default' }) {
  const valueColor = tone === 'urgent' ? 'text-red-700' : tone === 'success' ? 'text-green-700' : 'text-[#1A1A1A]'
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueColor} leading-none`}>{value}</p>
      <p className="text-[10px] text-stone-500 mt-1">{sub}</p>
    </div>
  )
}
