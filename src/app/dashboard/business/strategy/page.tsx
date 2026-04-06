'use client'

import { useState } from 'react'

type Tab = 'overview' | 'positioning' | 'content' | 'prelaunch' | 'ads' | 'founder' | 'timeline' | 'calendar'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'positioning', label: 'Positioning' },
  { id: 'content', label: 'Content System' },
  { id: 'prelaunch', label: 'Pre-Launch' },
  { id: 'ads', label: 'Paid Ads' },
  { id: 'founder', label: 'Founder Program' },
  { id: 'timeline', label: 'Launch Timeline' },
  { id: 'calendar', label: 'Content Calendar' },
]

// ── CALENDAR ────────────────────────────────────────────────

type PostType = 'authority' | 'pattern' | 'coach' | 'diagnostic' | 'founder' | 'ad' | 'prelaunch'
type CampaignPhase = 'prelaunch' | 'founder' | 'ads' | 'optimise' | 'scale'

interface ScheduledPost {
  id: string
  date: string // YYYY-MM-DD
  type: PostType
  phase: CampaignPhase
  title: string
  notes?: string
}

const POST_TYPE_STYLES: Record<PostType, { label: string; color: string; bg: string; border: string }> = {
  authority:   { label: 'Authority',    color: '#14b8a6', bg: 'rgba(20,184,166,0.12)',  border: 'rgba(20,184,166,0.3)' },
  pattern:     { label: 'Pattern',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  coach:       { label: 'Coach',        color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  diagnostic:  { label: 'Diagnostic',   color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
  founder:     { label: 'Founder',      color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.3)' },
  ad:          { label: 'Paid Ad',      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)' },
  prelaunch:   { label: 'Pre-Launch',   color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)' },
}

const PHASE_STYLES: Record<CampaignPhase, { label: string; color: string }> = {
  prelaunch: { label: 'Pre-Launch',    color: 'text-stone-400' },
  founder:   { label: 'Founder',       color: 'text-violet-400' },
  ads:       { label: 'Ads Launch',    color: 'text-blue-400' },
  optimise:  { label: 'Optimise',      color: 'text-amber-400' },
  scale:     { label: 'Scale',         color: 'text-teal-400' },
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function ContentCalendar() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [selected, setSelected] = useState<string | null>(null) // YYYY-MM-DD
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<ScheduledPost>>({ type: 'authority', phase: 'prelaunch' })
  const [editId, setEditId] = useState<string | null>(null)

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('en-AU', { month: 'long', year: 'numeric' })

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function dateStr(day: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function postsForDay(day: number) {
    return posts.filter(p => p.date === dateStr(day))
  }

  function savePost() {
    if (!form.date || !form.title || !form.type || !form.phase) return
    if (editId) {
      setPosts(ps => ps.map(p => p.id === editId ? { ...p, ...form } as ScheduledPost : p))
      setEditId(null)
    } else {
      setPosts(ps => [...ps, { id: crypto.randomUUID(), ...form } as ScheduledPost])
    }
    setForm({ type: 'authority', phase: 'prelaunch' })
    setShowForm(false)
  }

  function deletePost(id: string) {
    setPosts(ps => ps.filter(p => p.id !== id))
  }

  function startEdit(p: ScheduledPost) {
    setForm({ ...p })
    setEditId(p.id)
    setShowForm(true)
  }

  const selectedPosts = selected ? posts.filter(p => p.date === selected) : []

  return (
    <div className="space-y-4">
      {/* Legend */}
      <Card>
        <SectionLabel>Content Types</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(POST_TYPE_STYLES) as [PostType, typeof POST_TYPE_STYLES[PostType]][]).map(([key, s]) => (
            <span key={key} className="text-xs font-medium px-2.5 py-1 rounded-full border" style={{ color: s.color, background: s.bg, borderColor: s.border }}>{s.label}</span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {(Object.entries(PHASE_STYLES) as [CampaignPhase, typeof PHASE_STYLES[CampaignPhase]][]).map(([key, s]) => (
            <span key={key} className={`text-xs font-medium ${s.color}`}>● {s.label}</span>
          ))}
        </div>
      </Card>

      {/* Calendar */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 text-stone-500 hover:text-stone-300 transition-colors text-lg">‹</button>
          <p className="text-sm font-semibold text-white">{monthName}</p>
          <button onClick={nextMonth} className="p-1.5 text-stone-500 hover:text-stone-300 transition-colors text-lg">›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-stone-600 uppercase tracking-wider py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-px bg-stone-800">
          {/* Empty cells for first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-stone-950 min-h-[80px]" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const ds = dateStr(day)
            const dayPosts = postsForDay(day)
            const isToday = ds === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
            const isSelected = ds === selected
            return (
              <div
                key={day}
                onClick={() => setSelected(isSelected ? null : ds)}
                className={`bg-stone-950 min-h-[80px] p-1.5 cursor-pointer transition-colors hover:bg-stone-900 ${isSelected ? 'ring-1 ring-teal-500 ring-inset' : ''}`}
              >
                <div className={`text-xs font-semibold mb-1 w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-teal-500 text-stone-950' : 'text-stone-500'}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 3).map(p => {
                    const s = POST_TYPE_STYLES[p.type]
                    return (
                      <div key={p.id} className="text-[10px] font-medium px-1 py-0.5 rounded truncate" style={{ color: s.color, background: s.bg }}>
                        {p.title}
                      </div>
                    )
                  })}
                  {dayPosts.length > 3 && <div className="text-[10px] text-stone-600">+{dayPosts.length - 3} more</div>}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Selected day detail */}
      {selected && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">
              {new Date(selected + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <button
              onClick={() => { setForm({ type: 'authority', phase: 'prelaunch', date: selected }); setEditId(null); setShowForm(true) }}
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium"
            >
              + Add post
            </button>
          </div>
          {selectedPosts.length === 0 ? (
            <p className="text-sm text-stone-600">Nothing scheduled. Click &ldquo;+ Add post&rdquo; to schedule something.</p>
          ) : (
            <div className="space-y-2">
              {selectedPosts.map(p => {
                const s = POST_TYPE_STYLES[p.type]
                const ph = PHASE_STYLES[p.phase]
                return (
                  <div key={p.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border" style={{ background: s.bg, borderColor: s.border }}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold" style={{ color: s.color }}>{s.label}</span>
                        <span className={`text-xs ${ph.color}`}>· {ph.label}</span>
                      </div>
                      <p className="text-sm font-medium text-white">{p.title}</p>
                      {p.notes && <p className="text-xs text-stone-400 mt-0.5">{p.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEdit(p)} className="text-xs text-stone-500 hover:text-stone-300 transition-colors px-2 py-1">Edit</button>
                      <button onClick={() => deletePost(p.id)} className="text-xs text-stone-500 hover:text-red-400 transition-colors px-2 py-1">Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <Card>
          <p className="text-sm font-semibold text-white mb-4">{editId ? 'Edit Post' : 'Schedule Post'}</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1">Date</label>
                <input type="date" value={form.date ?? ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Content Type</label>
                <select value={form.type ?? 'authority'} onChange={e => setForm(f => ({ ...f, type: e.target.value as PostType }))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500">
                  {(Object.entries(POST_TYPE_STYLES) as [PostType, typeof POST_TYPE_STYLES[PostType]][]).map(([k, s]) => (
                    <option key={k} value={k}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1">Campaign Phase</label>
                <select value={form.phase ?? 'prelaunch'} onChange={e => setForm(f => ({ ...f, phase: e.target.value as CampaignPhase }))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500">
                  {(Object.entries(PHASE_STYLES) as [CampaignPhase, typeof PHASE_STYLES[CampaignPhase]][]).map(([k, s]) => (
                    <option key={k} value={k}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Post Title</label>
                <input type="text" value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Three body states carousel"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-teal-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Notes (optional)</label>
              <input type="text" value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Use body-state graphic cards, red/amber/teal"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-teal-500" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={savePost} disabled={!form.date || !form.title}
                className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-stone-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                {editId ? 'Save Changes' : 'Schedule Post'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm({ type: 'authority', phase: 'prelaunch' }) }}
                className="text-xs text-stone-500 hover:text-stone-300 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-stone-900 border border-stone-800 rounded-xl p-5 ${className}`}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500 mb-3">{children}</p>
  )
}

function Heading({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-white mb-1">{children}</p>
}

function Body({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-stone-400 leading-relaxed">{children}</p>
}

function Tag({ children, color = 'teal' }: { children: React.ReactNode; color?: 'teal' | 'amber' | 'red' | 'violet' | 'stone' }) {
  const colors = {
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    stone: 'bg-stone-800 text-stone-400 border-stone-700',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${colors[color]}`}>{children}</span>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-stone-400">
          <span className="text-teal-500 mt-0.5 shrink-0">—</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function ScriptBlock({ number, angle, hook, script, duration }: { number: number; angle: string; hook: string; script: string; duration: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <Card>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-xs font-bold text-teal-400 shrink-0">{number}</div>
          <div>
            <p className="text-sm font-semibold text-white">{angle}</p>
            <p className="text-xs text-stone-500 mt-0.5 italic">&ldquo;{hook}&rdquo;</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Tag color="stone">{duration}</Tag>
          <button onClick={() => setExpanded(e => !e)} className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium">
            {expanded ? 'Hide' : 'View script'}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="bg-stone-950 border border-stone-800 rounded-lg p-4 text-sm text-stone-300 leading-relaxed italic">
          &ldquo;{script}&rdquo;
        </div>
      )}
    </Card>
  )
}

function PostBlock({ number, title, day, format, graphic, caption, hashtags }: {
  number: number; title: string; day: string; format: string; graphic: string; caption: string; hashtags?: string
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-xs font-bold text-stone-400 shrink-0">{number}</div>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <div className="flex items-center gap-2 mt-1">
              <Tag color="stone">{day}</Tag>
              <Tag color="stone">{format}</Tag>
            </div>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium shrink-0">
          {expanded ? 'Hide' : 'View copy'}
        </button>
      </div>
      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="bg-stone-950 border border-stone-800 rounded-lg p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-600 mb-1">Graphic</p>
            <p className="text-xs text-stone-400">{graphic}</p>
          </div>
          <div className="bg-stone-950 border border-stone-800 rounded-lg p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-600 mb-2">Caption</p>
            <p className="text-sm text-stone-300 leading-relaxed whitespace-pre-line">{caption}</p>
          </div>
          {hashtags && (
            <div className="bg-stone-950 border border-stone-800 rounded-lg p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-600 mb-1">Hashtags</p>
              <p className="text-xs text-stone-500">{hashtags}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default function StrategyPage() {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Marketing Strategy</h1>
        <p className="text-stone-400 text-sm">The complete acquisition system for Body Recode Performance Coaching.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-stone-800 pb-0 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <Card>
            <SectionLabel>Mission</SectionLabel>
            <p className="text-lg font-semibold text-white leading-snug mb-2">Interpretation before prescription.</p>
            <Body>Social media is not the funnel — it feeds the funnel. Every piece of content drives curiosity. The Performance Check-In converts that curiosity into qualified leads.</Body>
          </Card>

          {/* Funnel flow */}
          <Card>
            <SectionLabel>The Funnel</SectionLabel>
            <div className="flex items-center gap-2 flex-wrap">
              {['Content / Ad', 'Curiosity', 'Scorecard', 'Performance Check-In', 'Consultation', 'Client'].map((step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-300">{step}</div>
                  {i < arr.length - 1 && <span className="text-stone-600 text-xs">→</span>}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card>
              <SectionLabel>Primary Platform</SectionLabel>
              <p className="text-white font-semibold">Instagram</p>
              <p className="text-xs text-stone-500 mt-1">Facebook auto cross-post. Meta ads on both.</p>
            </Card>
            <Card>
              <SectionLabel>Posting Frequency</SectionLabel>
              <p className="text-white font-semibold">5× per week</p>
              <p className="text-xs text-stone-500 mt-1">3 graphics / carousels + 2 reels</p>
            </Card>
            <Card>
              <SectionLabel>Ad Budget</SectionLabel>
              <p className="text-white font-semibold">$20–30/day AUD</p>
              <p className="text-xs text-stone-500 mt-1">Run minimum 2 weeks before judging</p>
            </Card>
          </div>

          <Card>
            <SectionLabel>Two Parallel Objectives</SectionLabel>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2"><Tag color="teal">Objective 1</Tag></div>
                <Heading>Performance Coaching — Ongoing Acquisition</Heading>
                <Body>Cold traffic → Performance Check-In → consultation → client. Driven by Meta ads and organic content simultaneously.</Body>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><Tag color="violet">Objective 2</Tag></div>
                <Heading>Founding Client Program — 20 Spots</Heading>
                <Body>Parallel track. Separate content angles. Application-based. Urgency through finite positions. People must feel selected, not sold to.</Body>
              </div>
            </div>
          </Card>

          <Card>
            <SectionLabel>What to Ignore Right Now</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {['TikTok', 'YouTube', 'LinkedIn', 'Twitter / X', 'Podcasts', 'Email newsletters'].map(p => (
                <span key={p} className="text-xs text-stone-600 bg-stone-800/50 border border-stone-800 px-2.5 py-1 rounded-full line-through">{p}</span>
              ))}
            </div>
            <p className="text-xs text-stone-600 mt-3">One platform done well outperforms five done badly. Lock Instagram + Meta ads for 90 days first.</p>
          </Card>
        </div>
      )}

      {/* ── POSITIONING ── */}
      {tab === 'positioning' && (
        <div className="space-y-4">
          <Card>
            <SectionLabel>Target Audience</SectionLabel>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Heading>Primary — Women 35–50</Heading>
                <BulletList items={[
                  'High-functioning, disciplined, consistent',
                  'Training and eating well — getting nothing back',
                  'Corporate, finance, law, medical, consulting',
                  '$100K–$180K+ AUD income',
                  'Frustrated, not lazy',
                ]} />
              </div>
              <div>
                <Heading>Secondary — Men 35–55</Heading>
                <BulletList items={[
                  'Ex-athletes, corporate professionals',
                  'Body stopped responding — no explanation',
                  'Seek logic and structure, not hype',
                  'Have tried harder and got worse results',
                  'Need the system explained before they commit',
                ]} />
              </div>
            </div>
          </Card>

          <Card>
            <SectionLabel>The Core Problem You Solve</SectionLabel>
            <p className="text-base font-semibold text-white mb-2">People are being prescribed to before they have been interpreted.</p>
            <Body>Every trainer, program, and app tells them what to do before reading what their body is actually doing. The problem is not effort. Nobody has read the body first. Body Recode fixes that.</Body>
          </Card>

          <Card>
            <SectionLabel>Tone of Voice — 6 Principles</SectionLabel>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { a: 'Intelligent', b: 'not complicated' },
                { a: 'Confident', b: 'not arrogant' },
                { a: 'Direct', b: 'not blunt' },
                { a: 'Warm', b: 'not soft' },
                { a: 'Scientific', b: 'not clinical' },
                { a: 'Forward-thinking', b: 'not abstract' },
              ].map(({ a, b }) => (
                <div key={a} className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{a}</span>
                  <span className="text-stone-600 text-sm">—</span>
                  <span className="text-sm text-stone-400">{b}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>The 5 Topics You Own</SectionLabel>
            <Body className="mb-4">Every piece of content maps to one of these five topics. Nothing outside these. This is your intellectual territory.</Body>
            <div className="space-y-3">
              {[
                { n: '1', label: 'Body State', desc: 'Depleted / Transitioning / Ready. Why body state determines everything — training, fat loss, and what the body will and won\'t respond to.' },
                { n: '2', label: 'Why Effort Isn\'t Working', desc: 'The training harder / eating less trap. Why doing more makes things worse in the wrong state. The effort paradox.' },
                { n: '3', label: 'Cortisol and Fat Storage', desc: 'Stress belt, protection mode, why the body resists fat loss under load. The mechanism most coaches ignore entirely.' },
                { n: '4', label: 'Prescription Without Interpretation', desc: 'The fundamental flaw in mainstream fitness. Being told what to do before anyone has read what the body is actually doing.' },
                { n: '5', label: 'The Intelligent Approach', desc: 'What reading the body first actually looks like. The Body Recode system as the solution — interpretation before prescription.' },
              ].map(({ n, label, desc }) => (
                <div key={n} className="flex items-start gap-3 p-3 bg-stone-950 rounded-lg border border-stone-800">
                  <span className="text-sm font-bold text-teal-500 w-5 shrink-0 mt-0.5">{n}</span>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">{label}</p>
                    <p className="text-xs text-stone-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>What Every Piece of Content Must Do</SectionLabel>
            <div className="space-y-2">
              {[
                { label: 'Make them feel', value: '"Finally, someone gets it."' },
                { label: 'Then make them think', value: '"I need to take that scorecard."' },
                { label: 'CTA funnel', value: 'Content → Scorecard → Performance Check-In → Booking call' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-3 py-2 border-b border-stone-800 last:border-0">
                  <span className="text-xs text-stone-500 w-36 shrink-0 mt-0.5">{label}</span>
                  <span className="text-sm text-white">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5">
            <SectionLabel>Never Say or Do</SectionLabel>
            <BulletList items={[
              '"Crush it", "no excuses", "grind", "hustle" — no fitness clichés',
              'Blame the client for biological symptoms',
              'Shame-based or guilt-based messaging',
              'Hype or exaggerated promises',
              'Long-winded clinical explanations',
              'Direct selling — always guide, never push',
              '"Discount" or "reduction in fees" for the Founding Client Program — it is a trade',
            ]} />
          </Card>

          <Card>
            <SectionLabel>Messaging Framework — Every Post</SectionLabel>
            <div className="space-y-2">
              {[
                { n: '1', label: 'Insight', desc: 'State the physiological truth' },
                { n: '2', label: 'Signal', desc: 'What that truth means for the client' },
                { n: '3', label: 'Shift', desc: 'Reframe their understanding' },
                { n: '4', label: 'Solution', desc: 'Present Body Recode system or action' },
                { n: '5', label: 'Momentum', desc: 'End with clarity or direction' },
              ].map(({ n, label, desc }) => (
                <div key={n} className="flex items-start gap-3">
                  <span className="text-xs font-bold text-teal-500 w-4 shrink-0 mt-0.5">{n}</span>
                  <div>
                    <span className="text-sm font-semibold text-white">{label} </span>
                    <span className="text-sm text-stone-400">— {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>The 3 Body States (Public-Facing Language)</SectionLabel>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-stone-950 rounded-lg border border-red-500/20">
                <Tag color="red">Depleted</Tag>
                <Body>Body in protection mode. Cortisol elevated, metabolism suppressed. Adding more training makes this worse. Score: 5–8.</Body>
              </div>
              <div className="flex items-start gap-3 p-3 bg-stone-950 rounded-lg border border-amber-500/20">
                <Tag color="amber">Transitioning</Tag>
                <Body>Mixed signals. Has capacity but not consistent. Something is blocking the response. Score: 9–11.</Body>
              </div>
              <div className="flex items-start gap-3 p-3 bg-stone-950 rounded-lg border border-teal-500/20">
                <Tag color="teal">Ready</Tag>
                <Body>Biology in a position to respond. If results aren&apos;t happening at this score, the issue is in the prescription. Score: 12–15.</Body>
              </div>
            </div>
            <p className="text-xs text-stone-600 mt-3">Note: Remediation / Optimisation / Post-Optimisation are CFFS-only terms. Use Depleted / Transitioning / Ready in all public-facing content.</p>
          </Card>
        </div>
      )}

      {/* ── CONTENT SYSTEM ── */}
      {tab === 'content' && (
        <div className="space-y-4">
          <Card>
            <SectionLabel>Weekly Structure</SectionLabel>
            <div className="space-y-2">
              {[
                { day: 'Monday', type: 'Authority', goal: 'Make people think differently about their body', format: 'Carousel (5–7 slides) or short video', cta: 'None — plant the idea' },
                { day: 'Wednesday', type: 'Pattern Recognition', goal: 'Trigger self-recognition — "that\'s exactly me"', format: 'Carousel or graphic card', cta: 'Soft — "this might be you"' },
                { day: 'Friday', type: 'Coach Perspective', goal: 'Build personal authority and trust', format: 'Talking video or photo card', cta: 'Soft — credibility build' },
                { day: 'Sunday', type: 'Diagnostic / Funnel', goal: 'Drive people into the check-in', format: 'Graphic card or reel', cta: 'Hard — link in bio → Scorecard / Check-In' },
              ].map(row => (
                <div key={row.day} className="grid grid-cols-4 gap-3 p-3 bg-stone-950 rounded-lg border border-stone-800 text-xs">
                  <div><p className="text-stone-600 mb-0.5">Day</p><p className="font-semibold text-white">{row.day}</p></div>
                  <div><p className="text-stone-600 mb-0.5">Type</p><p className="font-medium text-teal-400">{row.type}</p></div>
                  <div><p className="text-stone-600 mb-0.5">Format</p><p className="text-stone-400">{row.format}</p></div>
                  <div><p className="text-stone-600 mb-0.5">CTA</p><p className="text-stone-400">{row.cta}</p></div>
                </div>
              ))}
            </div>
          </Card>

          {[
            {
              type: 'Type 1 — Authority',
              day: 'Monday',
              color: 'teal' as const,
              goal: 'Position Body Recode as a different philosophy from the fitness industry. Make people think: "This coach understands the body differently."',
              topics: [
                'Why fat loss is not just calories',
                'Why stress influences metabolism and fat storage',
                'Why recovery capacity matters more than intensity',
                'Why bodies stop responding to training over time',
                'Why dieting harder often makes fat loss harder',
                'How cortisol drives abdominal fat storage',
                'What the body is actually doing when it "stops responding"',
                'Why the same program gets different results on different people',
              ],
              format: 'Carousel (5–7 slides) or short talking video (30–60 sec)',
            },
            {
              type: 'Type 2 — Pattern Recognition',
              day: 'Wednesday',
              color: 'amber' as const,
              goal: 'Show people the patterns they are already stuck in. They read it and think: "That\'s exactly me." Recognition creates engagement.',
              topics: [
                '"If your stomach fat won\'t move despite training consistently…"',
                '"If you gain fat easily when life gets stressful…"',
                '"If your energy crashes every afternoon…"',
                '"If you feel exhausted after workouts instead of energised…"',
                '"If your weight fluctuates dramatically week to week…"',
                '"If your motivation to train disappears suddenly…"',
                '"10 signs your body is under too much stress to lose fat"',
                '"Why your body isn\'t responding to training"',
              ],
              format: 'Carousel (hook slide + pattern slides + reframe + CTA) or graphic card',
            },
            {
              type: 'Type 3 — Coach Perspective',
              day: 'Friday',
              color: 'violet' as const,
              goal: 'Build personal authority and trust. People buy the person guiding the system, not just the system. Experience-based storytelling.',
              topics: [
                '"After years of coaching, I keep seeing the same pattern…"',
                '"The biggest mistake people make when trying to lose fat"',
                '"The moment I know someone will struggle with dieting"',
                '"What most coaches misunderstand about metabolism"',
                '"Why I stopped writing generic programs"',
                '"The client who did everything right and got nothing back — here\'s what was actually happening"',
                '"What changes when you read the body before prescribing to it"',
              ],
              format: 'Talking-head video (face to camera, gym or clean background) or photo card with caption',
            },
            {
              type: 'Type 4 — Diagnostic / Funnel',
              day: 'Sunday',
              color: 'red' as const,
              goal: 'Drive people into the funnel. Introduce the Scorecard or Performance Check-In without pressure. This is the conversion post.',
              topics: [
                '"Your body is operating in one of three states right now. Find out which one."',
                '"If your body feels inconsistent despite effort — run the free Performance Check-In."',
                '"I built a free tool that tells you exactly what your body needs right now."',
                '"The Body State Scorecard. 2 minutes. Free. Find out why you\'re stuck."',
                '"Before I prescribe anything, I read the body first. You can do the same — link in bio."',
              ],
              format: 'Single graphic (photo card or scorecard-style card) + strong caption. Can also be a short reel.',
            },
          ].map(ct => (
            <Card key={ct.type}>
              <div className="flex items-center gap-2 mb-3">
                <Tag color={ct.color}>{ct.type}</Tag>
                <span className="text-xs text-stone-600">{ct.day}</span>
              </div>
              <Body>{ct.goal}</Body>
              <div className="mt-4">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Post Ideas</p>
                <BulletList items={ct.topics} />
              </div>
              <div className="mt-4 p-3 bg-stone-950 rounded-lg border border-stone-800">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-1">Format</p>
                <p className="text-xs text-stone-400">{ct.format}</p>
              </div>
            </Card>
          ))}

          <Card>
            <SectionLabel>Content Production Guide</SectionLabel>
            <div className="space-y-2">
              {[
                { type: 'Authority carousel', effort: 'Low', tool: 'Content Engine — graphic + carousel generator' },
                { type: 'Pattern recognition carousel', effort: 'Low', tool: 'Content Engine — carousel generator' },
                { type: 'Coach perspective video', effort: 'Medium', tool: 'iPhone + tripod in gym. 30–60 sec.' },
                { type: 'Diagnostic graphic', effort: 'Low', tool: 'Content Engine — photo card or scorecard card' },
                { type: 'Ad reel (talking head)', effort: 'Medium', tool: 'iPhone + tripod in gym. 15–30 sec.' },
                { type: 'AI avatar reel (variation)', effort: 'Low', tool: 'ElevenLabs + HeyGen via Content Engine' },
              ].map(row => (
                <div key={row.type} className="flex items-center justify-between gap-4 py-2 border-b border-stone-800 last:border-0 text-sm">
                  <span className="text-stone-300">{row.type}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <Tag color={row.effort === 'Low' ? 'teal' : 'amber'}>{row.effort} effort</Tag>
                    <span className="text-xs text-stone-500 hidden sm:block">{row.tool}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── PRE-LAUNCH ── */}
      {tab === 'prelaunch' && (
        <div className="space-y-4">
          <Card>
            <SectionLabel>Pre-Launch Goal</SectionLabel>
            <Body>Post 5 times over 8 days before any ads or the Founder Program offer goes live. Goal: profile looks established and intentional. No hashtags until Post 5. No CTA until Post 5.</Body>
            <div className="mt-4 p-3 bg-teal-500/5 border border-teal-500/20 rounded-lg">
              <p className="text-xs text-teal-400 font-medium">After Post 5 — drop the Founding Client Program offer. Then launch ads.</p>
            </div>
          </Card>

          <PostBlock
            number={1}
            title="Brand Arrival"
            day="Day 1"
            format="Logo graphic (logo-only card)"
            graphic="Logo only. Teal logo centred on dark background. Nothing else. Use: /api/content/graphic?style=logo-only"
            caption={`Interpretation before prescription.\n\nMost people are being told what to do before anyone has read what their body is actually doing. That's the problem.\n\nBody Recode is built to fix that.\n\nMore coming.`}
          />

          <PostBlock
            number={2}
            title="Who You Are"
            day="Day 2"
            format="Statement card"
            graphic="Statement card. Text: I don't prescribe until I've read the body. Use: /api/content/graphic?style=statement&text=I+don%27t+prescribe+until+I%27ve+read+the+body."
            caption={`My name is Kade Dunstone. I'm a performance coach based in Brisbane.\n\nI work with high-functioning adults whose bodies have stopped responding to effort. Not people who are lazy. People who are doing everything right and getting nothing back.\n\nBefore I build anyone a program, I do one thing first.\n\nI read the body.\n\nMost coaches skip this step. It's why most programs fail.`}
          />

          <PostBlock
            number={3}
            title="The Problem"
            day="Day 4"
            format="Insight card"
            graphic="Insight card. Label: The Real Problem. Text: Your body isn't broken. It's being misread. Use: /api/content/graphic?style=insight&label=The+Real+Problem&text=Your+body+isn%27t+broken.+It%27s+being+misread."
            caption={`You're training. You're eating well. You're consistent.\n\nAnd nothing is moving.\n\nThat's not a discipline problem. That's a body state problem.\n\nYour biology operates in one of three states. In two of those states, adding more training and cutting more food makes things worse — not better.\n\nNobody told you that. That's the problem.`}
          />

          <PostBlock
            number={4}
            title="The Three Body States"
            day="Day 6"
            format="Carousel — 3 body-state cards"
            graphic="3 separate body-state cards. Red (Depleted), Amber (Transitioning), Teal (Ready). Use the body-state graphic style with accent=red/amber/teal."
            caption={`Your body is operating in one of three states right now.\n\nDepleted. Transitioning. Ready.\n\nEach one requires a completely different approach. The same program that gets results in Ready State will make things worse in Depleted State.\n\nThis is why generic programs fail. They don't read the state first.\n\nSwipe to find out what each one means.`}
          />

          <PostBlock
            number={5}
            title="Scorecard CTA"
            day="Day 8"
            format="Photo card (photo-split or photo-top)"
            graphic='Photo card. Label: "Body Recode™". Text: "Find out which state your body is in." Sub: "Free. 2 minutes." Use: /api/content/graphic?style=photo-split&label=Body+Recode™&text=Find+out+which+state+your+body+is+in.&sub=Free.+2+minutes.'
            caption={`I built a free tool that tells you which state your body is currently operating in.\n\n5 sections. 2 minutes. No email required until you see your result.\n\nIt tells you:\n— Which body state you're in\n— Why your body is responding the way it is\n— What that means for your training and fat loss right now\n\nTake the Body State Scorecard — link in bio.`}
            hashtags="#bodyrecode #bodystate #fatlosss #performancecoaching #cortisol #fatloss #trainingresponse #brisbanecoach #onlinecoaching #hormones #metabolichealth #interpretation"
          />
        </div>
      )}

      {/* ── ADS ── */}
      {tab === 'ads' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Card>
              <SectionLabel>Daily Budget</SectionLabel>
              <p className="text-xl font-semibold text-white">$20–30</p>
              <p className="text-xs text-stone-500 mt-1">AUD per day to start</p>
            </Card>
            <Card>
              <SectionLabel>Minimum Test Period</SectionLabel>
              <p className="text-xl font-semibold text-white">2 weeks</p>
              <p className="text-xs text-stone-500 mt-1">Before judging any results</p>
            </Card>
            <Card>
              <SectionLabel>Initial Spend</SectionLabel>
              <p className="text-xl font-semibold text-white">~$400</p>
              <p className="text-xs text-stone-500 mt-1">First real data read</p>
            </Card>
          </div>

          <Card>
            <SectionLabel>Ad Objective & Audience</SectionLabel>
            <div className="space-y-3">
              <div><Heading>Objective</Heading><Body>Cold traffic → Performance Check-In. Never direct to purchase.</Body></div>
              <div><Heading>Audience</Heading><Body>Cold — women and men 35–55. Interests: health, fitness, fat loss, body composition, wellness, personal development.</Body></div>
              <div><Heading>Placement</Heading><Body>Instagram feed + Reels + Facebook feed. Start broad, let Meta optimise.</Body></div>
              <div><Heading>Traffic type</Heading><Body>Cold only for now. Retargeting layer added at Day 30+ once pixel has enough data.</Body></div>
            </div>
          </Card>

          <Card>
            <SectionLabel>Creative Format</SectionLabel>
            <BulletList items={[
              'Primary: 15–30 sec talking head reel (face to camera, gym background)',
              'Secondary: Static graphic card (scorecard-style or photo card)',
              'No music on primary ads — calm and direct tone IS the differentiator',
              'No jump cuts every 2 seconds — this audience responds to calm authority',
              'Vertical 9:16 for Reels/Stories, horizontal 16:9 for feed where possible',
            ]} />
          </Card>

          <div className="space-y-3">
            <SectionLabel>3 Ad Angles — Test Simultaneously</SectionLabel>
            <ScriptBlock
              number={1}
              angle="Silent Frustration"
              hook="You're training. You're eating well. Nothing is moving. Here's why."
              duration="~22 sec"
              script="If you're training consistently, eating well, and your body has stopped responding — that's not a discipline problem. That's a body state problem. Your biology is in protection mode. And when it's there, adding more training and cutting more food makes it worse. Before I give anyone a program, I read their body first. Run the free Performance Check-In — link in bio. It takes three minutes and tells you exactly what your body needs right now."
            />
            <ScriptBlock
              number={2}
              angle="Contrarian"
              hook="More training and less food is making it worse."
              duration="~20 sec"
              script="The standard advice when fat loss stalls — train harder, eat less. That's also the advice that drives cortisol up, suppresses your metabolism, and locks your body into a state where it actively resists fat loss. I've seen it hundreds of times. The problem was never effort. The problem was that nobody read the body before prescribing to it. Run the free Performance Check-In — link in bio."
            />
            <ScriptBlock
              number={3}
              angle="Diagnosis"
              hook="Your body is in one of three states right now. Find out which one."
              duration="~23 sec"
              script="Your body is operating in one of three states right now. Ready — it can respond to training and nutrition. Transitioning — mixed signals, inconsistent results. Or Depleted — in protection mode, actively resisting fat loss and performance. Most people who feel stuck are in Depleted and don't know it. Find out which state you're in. Run the free Performance Check-In — link in bio. Three minutes. No cost."
            />
          </div>

          <Card>
            <SectionLabel>Filming Guide — Gym Session</SectionLabel>
            <BulletList items={[
              'Film vertical (9:16) AND horizontal (16:9) for each script',
              'Clean background — rack of weights or open floor, not cluttered',
              'Natural light or face a window — avoid harsh overhead gym lighting',
              'Earbuds out, record audio directly to camera',
              'iPhone on a tripod or ask someone to hold it',
              'Film each script 3–4 times so you have options',
              'Speak at 80% of normal pace — slower than you think',
              'Pause after the first sentence of each script',
              'Look directly into the lens, not the screen',
            ]} />
          </Card>

          <Card>
            <SectionLabel>What to Do With the Footage</SectionLabel>
            <div className="space-y-2">
              {[
                '1. Review takes — pick the best one per script',
                '2. Add captions using CapCut (free) — body text, on-screen hook line',
                '3. Upload best take to Content Engine → Generate Reel for AI avatar variations',
                '4. Upload to Meta Ads Manager — create 3 separate ad sets, one per angle',
                '5. Run for 14 days at $20–30/day',
                '6. Cut the 2 underperforming angles. Scale the winner.',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-teal-500 font-bold shrink-0 text-xs mt-0.5">{i + 1}</span>
                  <span className="text-stone-400">{step.replace(/^\d+\. /, '')}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── FOUNDER ── */}
      {tab === 'founder' && (
        <div className="space-y-4">
          <Card>
            <SectionLabel>The Program</SectionLabel>
            <p className="text-base font-semibold text-white mb-2">Founding Client Program — 20 positions</p>
            <Body>A limited, selective participation model. Half the standard coaching fee in exchange for the client&apos;s documented participation in a structured case study process. This is a trade — not a discount, not a fee reduction. That framing is intentional and strategic.</Body>
          </Card>

          <div className="grid sm:grid-cols-2 gap-3">
            <Card>
              <SectionLabel>Online Rate</SectionLabel>
              <p className="text-2xl font-bold text-white">$74.50<span className="text-base text-stone-500 font-normal">/week</span></p>
              <p className="text-xs text-stone-500 mt-1">Standard rate: $149/week</p>
            </Card>
            <Card>
              <SectionLabel>In-Person 2× Rate</SectionLabel>
              <p className="text-2xl font-bold text-white">$149.50<span className="text-base text-stone-500 font-normal">/week</span></p>
              <p className="text-xs text-stone-500 mt-1">Standard rate: $299/week</p>
            </Card>
            <Card>
              <SectionLabel>In-Person 3× Rate</SectionLabel>
              <p className="text-2xl font-bold text-white">$204.50<span className="text-base text-stone-500 font-normal">/week</span></p>
              <p className="text-xs text-stone-500 mt-1">Standard rate: $409/week</p>
            </Card>
            <Card>
              <SectionLabel>Positions Available</SectionLabel>
              <p className="text-2xl font-bold text-white">20</p>
              <p className="text-xs text-stone-500 mt-1">Open until filled. Decrement on accept, not on apply.</p>
            </Card>
          </div>

          <Card>
            <SectionLabel>3 Entry Paths</SectionLabel>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1"><Tag color="teal">Path A</Tag><Heading>Online Application</Heading></div>
                <Body>Person finds the landing page at performance.bodyrecode.au/founder, reads the offer, completes the Performance Check-In as step one of the application. Lead arrives tagged as Founder Program. Review check-in answers on lead detail page. Set application status: Under Review → Accepted / Declined / Waitlisted.</Body>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1"><Tag color="amber">Path B</Tag><Heading>Objection-Triggered at Zoom 2</Heading></div>
                <Body>Full rate offer made first at Stage 5. If lead objects to price, introduce the Founding Client program as the second offer. Use the Objection-Triggered tab in the Zoom 2 companion.</Body>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1"><Tag color="violet">Path C</Tag><Heading>Manual Override at Zoom 2</Heading></div>
                <Body>For a high-suitability lead with strong case study potential. Proactively offer before any objection. All four criteria on the checklist must be true. Use sparingly — positions are finite.</Body>
              </div>
            </div>
          </Card>

          <Card>
            <SectionLabel>Founder Content Angles</SectionLabel>
            <div className="space-y-3">
              {[
                { title: 'The Offer', copy: '"I\'m taking 20 people through Body Recode at a founder rate. Here\'s exactly what that means."' },
                { title: 'Why Founder', copy: '"This isn\'t a discount. It\'s a trade. I want the right 20 people — not just 20 people. Your case study becomes part of how the system is validated."' },
                { title: 'What They Get', copy: 'Full 1:1 coaching system, direct access, founder participation trade — rate locked as long as active.' },
                { title: 'Authority', copy: '"Here\'s what I\'ve seen happen when the body is read correctly before a program is written…"' },
                { title: 'Scarcity', copy: '"X of 20 positions taken." Post as spots fill. Never fake urgency — update it as it actually happens.' },
              ].map(angle => (
                <div key={angle.title} className="p-3 bg-stone-950 rounded-lg border border-stone-800">
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">{angle.title}</p>
                  <p className="text-sm text-stone-300 italic">{angle.copy}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <SectionLabel>Critical Framing Rule</SectionLabel>
            <Body>Presenting it as a trade also screens out the wrong leads. Someone who responds well to the framing understands the nature of the program. Someone who immediately treats it as a price negotiation tool is likely the wrong fit. The positions are finite — use them with intent.</Body>
          </Card>
        </div>
      )}

      {/* ── TIMELINE ── */}
      {tab === 'timeline' && (
        <div className="space-y-4">
          <Card>
            <SectionLabel>60-Day Launch Plan</SectionLabel>
            <Body>Consistent for 60–90 days while the funnel launches. After that, ads and retargeting carry acquisition. Organic content maintains authority and warm audience.</Body>
          </Card>

          {[
            {
              phase: 'Phase 1 — Pre-Launch',
              days: 'Days 1–8',
              color: 'teal' as const,
              items: [
                'Post 5 profile establishment posts (logo, who you are, the problem, three states, scorecard CTA)',
                'No ads running yet',
                'No Founder Program offer yet',
                'Profile looks established before anyone is sent there',
              ],
            },
            {
              phase: 'Phase 2 — Founder Launch',
              days: 'Days 9–14',
              color: 'violet' as const,
              items: [
                'Drop the Founding Client Program offer post',
                'Organic only — no ads yet',
                'Applications open at performance.bodyrecode.au/founder',
                'Post 1–2 founder-specific posts (the offer, why founder)',
                'Begin regular 4×/week posting rhythm',
              ],
            },
            {
              phase: 'Phase 3 — Ads Launch',
              days: 'Days 15–28',
              color: 'amber' as const,
              items: [
                'Start Meta ads at $20–30/day AUD',
                '3 ad angles running simultaneously (Silent Frustration / Contrarian / Diagnosis)',
                'All ads send to Performance Check-In',
                'Film gym reel session before this phase starts',
                'Continue 4×/week organic posting',
              ],
            },
            {
              phase: 'Phase 4 — Optimise',
              days: 'Days 29–45',
              color: 'stone' as const,
              items: [
                'Review ad performance — cut 2 underperforming angles',
                'Scale budget on winning angle to $40–50/day',
                'Continue organic content rhythm',
                'Update founder spots counter as positions are accepted',
                'Review CPL in Ads dashboard',
              ],
            },
            {
              phase: 'Phase 5 — Scale',
              days: 'Days 46–60+',
              color: 'teal' as const,
              items: [
                'Add retargeting layer — people who visited check-in but didn\'t complete',
                'Increase budget on proven creative',
                'Produce 2nd round of ad creative from new scripts',
                'AI avatar variations of winning scripts via Content Engine',
                'Organic content continues — system is now a lead engine, not a full-time job',
              ],
            },
          ].map(phase => (
            <Card key={phase.phase}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">{phase.phase}</p>
                <Tag color={phase.color}>{phase.days}</Tag>
              </div>
              <BulletList items={phase.items} />
            </Card>
          ))}

          <Card className="border-teal-500/20 bg-teal-500/5">
            <SectionLabel>The Rule</SectionLabel>
            <p className="text-sm text-teal-300 font-medium">You don&apos;t need to be consistent forever. You need to be consistent for 60–90 days while the funnel launches. After that, the ads carry acquisition and content maintains trust.</p>
          </Card>
        </div>
      )}

      {/* ── CALENDAR ── */}
      {tab === 'calendar' && <ContentCalendar />}
    </div>
  )
}
