'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'overview' | 'positioning' | 'content' | 'prelaunch' | 'organic' | 'ads' | 'linkedin' | 'timeline' | 'pages' | 'calendar'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'positioning', label: 'Positioning' },
  { id: 'content', label: 'Content System' },
  { id: 'prelaunch', label: 'Pre-Launch' },
  { id: 'organic', label: 'Organic → Ads' },
  { id: 'ads', label: 'Paid Ads' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'timeline', label: 'Launch Timeline' },
  { id: 'pages', label: 'Pages' },
  { id: 'calendar', label: 'Content Calendar' },
]

// ── CALENDAR ────────────────────────────────────────────────

type PostType = 'authority' | 'pattern' | 'contrarian' | 'coach' | 'diagnostic' | 'ad' | 'prelaunch' | 'thread' | 'video'
type CampaignPhase = 'prelaunch' | 'ads' | 'optimise' | 'scale'
type Brand = 'body_recode' | 'personal_brand' | 'ai_cofounder' | 'studio_of_ten'
type Platform = 'instagram' | 'facebook' | 'linkedin'

const PLATFORM_STYLES: Record<Platform, { label: string; badge: string }> = {
  instagram: { label: 'Instagram', badge: 'bg-pink-500/15 text-pink-400 border-pink-500/25' },
  facebook:  { label: 'Facebook',  badge: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  linkedin:  { label: 'LinkedIn',  badge: 'bg-sky-500/15 text-sky-400 border-sky-500/25' },
}

interface ScheduledPost {
  id: string
  date: string // YYYY-MM-DD
  time?: string // HH:MM
  brand?: Brand
  platform?: Platform
  type: PostType
  phase: CampaignPhase
  title: string
  notes?: string
  caption?: string
  graphic?: string
  scheduled?: boolean
}

const POST_TYPE_DEFAULT_TIMES: Record<PostType, string> = {
  authority:  '07:00',
  pattern:    '12:00',
  contrarian: '07:00',
  coach:      '18:00',
  diagnostic: '08:00',
  ad:         '07:00',
  prelaunch:  '07:00',
  thread:     '07:00',
  video:      '07:00',
}

function isAicmPost(p: { title?: string; notes?: string }): boolean {
  return (p.title ?? '').startsWith('AICM ') || (p.notes ?? '').toUpperCase().includes('AICM')
}

const AICM_BADGE_CLASS = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'

const BRAND_STYLES: Record<Brand, { label: string; handle: string; dot: string; filter: string }> = {
  body_recode:    { label: 'Body Recode',    handle: 'body_recode_',       dot: 'bg-teal-400',   filter: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
  personal_brand: { label: 'Personal Brand', handle: 'kade_dunstone_',     dot: 'bg-violet-400', filter: 'bg-violet-500/10 text-violet-400 border-violet-500/30' },
  ai_cofounder:   { label: 'AI Co-Founder',  handle: 'aicofoundermethod.com', dot: 'bg-amber-400',  filter: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  studio_of_ten:  { label: 'Studio of Ten',  handle: 'studiooften.com',    dot: 'bg-blue-400',   filter: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
}

const POST_TYPE_STYLES: Record<PostType, { label: string; color: string; bg: string; border: string }> = {
  authority:   { label: 'Authority',    color: '#14b8a6', bg: 'rgba(20,184,166,0.12)',  border: 'rgba(20,184,166,0.3)' },
  pattern:     { label: 'Pattern',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  contrarian:  { label: 'Contrarian',   color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)' },
  coach:       { label: 'Coach',        color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  diagnostic:  { label: 'Diagnostic',   color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
  ad:          { label: 'Paid Ad',      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)' },
  prelaunch:   { label: 'Pre-Launch',   color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)' },
  thread:      { label: 'Thread',       color: '#e879f9', bg: 'rgba(232,121,249,0.12)', border: 'rgba(232,121,249,0.3)' },
  video:       { label: 'Video/Reel',   color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.3)' },
}

const PHASE_STYLES: Record<CampaignPhase, { label: string; color: string }> = {
  prelaunch: { label: 'Pre-Launch',    color: 'text-stone-400' },
  ads:       { label: 'Ads Launch',    color: 'text-blue-400' },
  optimise:  { label: 'Optimise',      color: 'text-amber-400' },
  scale:     { label: 'Scale',         color: 'text-teal-400' },
}

// Phase date ranges for calendar highlighting
const PHASE_RANGES: { phase: CampaignPhase; start: string; end: string; topBorder: string }[] = [
  { phase: 'prelaunch', start: '2026-04-08', end: '2026-04-21', topBorder: 'border-t-2 border-t-stone-500/60' },
  { phase: 'ads',       start: '2026-04-22', end: '2026-05-06', topBorder: 'border-t-2 border-t-blue-500/60' },
  { phase: 'optimise',  start: '2026-05-07', end: '2026-05-23', topBorder: 'border-t-2 border-t-amber-500/60' },
  { phase: 'scale',     start: '2026-05-24', end: '2026-12-31', topBorder: 'border-t-2 border-t-teal-500/60' },
]

function getPhaseForDate(ds: string): string {
  return PHASE_RANGES.find(r => ds >= r.start && ds <= r.end)?.topBorder ?? ''
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function ContentCalendar() {
  const supabase = createClient()
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [activePost, setActivePost] = useState<ScheduledPost | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<ScheduledPost>>({ type: 'authority', phase: 'prelaunch', brand: 'body_recode', time: POST_TYPE_DEFAULT_TIMES['authority'] })
  const [editId, setEditId] = useState<string | null>(null)
  const [brandFilter, setBrandFilter] = useState<Brand | 'all'>('all')

  useEffect(() => {
    supabase
      .from('calendar_posts')
      .select('*')
      .order('date', { ascending: true })
      .then(({ data }) => {
        if (data) setPosts(data as ScheduledPost[])
        setLoading(false)
      })
  }, [])

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
    return posts.filter(p => p.date === dateStr(day) && (brandFilter === 'all' || (p.brand ?? 'body_recode') === brandFilter))
  }

  async function savePost() {
    if (!form.date || !form.title || !form.type || !form.phase) return
    setSaving(true)
    const brandVal = form.brand ?? 'body_recode'
    const platformVal = form.platform ?? 'instagram'
    if (editId) {
      const { error } = await supabase
        .from('calendar_posts')
        .update({ date: form.date, time: form.time ?? null, brand: brandVal, platform: platformVal, type: form.type, phase: form.phase, title: form.title, notes: form.notes ?? null, caption: form.caption ?? null, graphic: form.graphic ?? null })
        .eq('id', editId)
      if (!error) setPosts(ps => ps.map(p => p.id === editId ? { ...p, ...form } as ScheduledPost : p))
      setEditId(null)
    } else {
      const { data, error } = await supabase
        .from('calendar_posts')
        .insert({ date: form.date, time: form.time ?? null, brand: brandVal, platform: platformVal, type: form.type, phase: form.phase, title: form.title, notes: form.notes ?? null, caption: form.caption ?? null, graphic: form.graphic ?? null })
        .select()
        .single()
      if (!error && data) setPosts(ps => [...ps, data as ScheduledPost])
    }
    setForm({ type: 'authority', phase: 'prelaunch', brand: 'body_recode', platform: 'instagram', time: POST_TYPE_DEFAULT_TIMES['authority'] })
    setShowForm(false)
    setSaving(false)
  }

  async function deletePost(id: string) {
    await supabase.from('calendar_posts').delete().eq('id', id)
    setPosts(ps => ps.filter(p => p.id !== id))
  }

  async function toggleScheduled(p: ScheduledPost) {
    const next = !p.scheduled
    setPosts(ps => ps.map(x => x.id === p.id ? { ...x, scheduled: next } : x))
    await supabase.from('calendar_posts').update({ scheduled: next }).eq('id', p.id)
  }

  function startEdit(p: ScheduledPost) {
    setForm({ ...p })
    setEditId(p.id)
    setShowForm(true)
  }

  if (loading) return <div className="text-sm text-stone-500 py-8 text-center">Loading calendar...</div>

  const filteredSelectedPosts = selected
    ? posts.filter(p => p.date === selected && (brandFilter === 'all' || (p.brand ?? 'body_recode') === brandFilter))
    : []

  return (
    <div className="space-y-4">
      {/* Brand filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setBrandFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${brandFilter === 'all' ? 'bg-stone-700 text-white border-stone-600' : 'text-stone-500 border-stone-800 hover:text-stone-300'}`}
        >All brands</button>
        {(Object.entries(BRAND_STYLES) as [Brand, typeof BRAND_STYLES[Brand]][]).map(([k, s]) => (
          <button
            key={k}
            onClick={() => setBrandFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${brandFilter === k ? s.filter : 'text-stone-500 border-stone-800 hover:text-stone-300'}`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${s.dot}`} />
            {s.label}
          </button>
        ))}
      </div>

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

        {/* Phase legend strip */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 pb-3 border-b border-stone-800">
          {PHASE_RANGES.map(r => {
            const style = PHASE_STYLES[r.phase]
            const start = new Date(r.start + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
            const end = r.phase === 'scale' ? 'onwards' : new Date(r.end + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
            return (
              <div key={r.phase} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm border-t-2 ${r.topBorder.replace('border-t-2 ', '')} bg-stone-800`} />
                <span className={`text-xs ${style.color}`}>{style.label}</span>
                <span className="text-xs text-stone-700">{start}{r.phase !== 'scale' ? ` – ${end}` : '+'}</span>
              </div>
            )
          })}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-stone-600 uppercase tracking-wider py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-px bg-stone-800">
          {/* Empty cells for first day - Monday-first: Sun(0)→6, Mon(1)→0, Tue(2)→1... */}
          {Array.from({ length: (firstDay + 6) % 7 }).map((_, i) => (
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
                onClick={() => { const newDs = isSelected ? null : ds; setSelected(newDs); const firstPost = newDs ? posts.filter(p => p.date === newDs)[0] ?? null : null; setActivePost(firstPost) }}
                className={`bg-stone-950 min-h-[80px] p-1.5 cursor-pointer transition-colors hover:bg-stone-900 ${getPhaseForDate(ds)} ${isSelected ? 'ring-1 ring-teal-500 ring-inset' : ''}`}
              >
                <div className={`text-xs font-semibold mb-1 w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-teal-500 text-stone-950' : 'text-stone-500'}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 3).map(p => {
                    const s = POST_TYPE_STYLES[p.type] ?? POST_TYPE_STYLES['authority']
                    const bd = BRAND_STYLES[(p.brand ?? 'body_recode') as Brand]
                    const pl = PLATFORM_STYLES[(p.platform ?? 'instagram') as Platform]
                    return (
                      <div key={p.id} className={`text-[10px] font-medium px-1 py-0.5 rounded truncate flex items-center gap-1 ${p.scheduled ? 'opacity-50 line-through decoration-1' : ''}`} style={{ color: s.color, background: s.bg }}>
                        <span className={`inline-block w-1 h-1 rounded-full shrink-0 ${bd.dot}`} />
                        {isAicmPost(p) && <span className="inline-block w-1 h-1 rounded-full shrink-0 bg-indigo-400" />}
                        {p.scheduled && <span className="text-teal-400 shrink-0">✓</span>}
                        <span className="opacity-70 mr-0.5">{p.time ?? POST_TYPE_DEFAULT_TIMES[p.type as PostType] ?? '07:00'}</span>
                        <span className="truncate">{p.title}</span>
                        <span className={`shrink-0 text-[9px] px-1 rounded border ${pl.badge}`}>{pl.label}</span>
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
              onClick={() => { setForm({ type: 'authority', phase: 'prelaunch', brand: brandFilter !== 'all' ? brandFilter : 'body_recode', platform: 'instagram', date: selected, time: POST_TYPE_DEFAULT_TIMES['authority'] }); setEditId(null); setShowForm(true) }}
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium"
            >
              + Add post
            </button>
          </div>
          {filteredSelectedPosts.length === 0 ? (
            <p className="text-sm text-stone-600">Nothing scheduled. Click &ldquo;+ Add post&rdquo; to schedule something.</p>
          ) : (
            <div className="space-y-2">
              {filteredSelectedPosts.map(p => {
                const s = POST_TYPE_STYLES[p.type] ?? POST_TYPE_STYLES['authority']
                const ph = PHASE_STYLES[p.phase] ?? PHASE_STYLES['prelaunch']
                return (
                  <div key={p.id} className={`flex items-start justify-between gap-3 p-3 rounded-lg border cursor-pointer hover:opacity-90 transition-opacity ${p.scheduled ? 'opacity-50' : ''}`} style={{ background: s.bg, borderColor: s.border }} onClick={() => setActivePost(p)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold" style={{ color: s.color }}>{s.label}</span>
                        <span className={`text-xs ${ph.color}`}>· {ph.label}</span>
                        {(() => { const bd = BRAND_STYLES[(p.brand ?? 'body_recode') as Brand]; return <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${bd.filter}`}>{bd.label}</span> })()}
                        {isAicmPost(p) && <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${AICM_BADGE_CLASS}`}>AICM</span>}
                        {(() => { const pl = PLATFORM_STYLES[(p.platform ?? 'instagram') as Platform]; return <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${pl.badge}`}>{pl.label}</span> })()}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{p.title}</p>
                        <span className="text-xs font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full shrink-0">{p.time ?? POST_TYPE_DEFAULT_TIMES[p.type]}</span>
                      </div>
                      {p.caption && <p className="text-xs text-stone-400 mt-1 line-clamp-2">{p.caption}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleScheduled(p)} className={`text-xs transition-colors px-2 py-1 rounded border font-medium ${p.scheduled ? 'bg-teal-500/15 text-teal-400 border-teal-500/40' : 'text-stone-500 border-stone-700 hover:text-teal-400 hover:border-teal-500/30'}`} title={p.scheduled ? 'Mark as unscheduled' : 'Mark as scheduled'}>
                        {p.scheduled ? '✓ Scheduled' : 'Schedule'}
                      </button>
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

      {/* Full post detail */}
      {activePost && (() => {
        const s = POST_TYPE_STYLES[activePost.type] ?? POST_TYPE_STYLES['authority']
        const ph = PHASE_STYLES[activePost.phase] ?? PHASE_STYLES['prelaunch']
        const dateLabel = new Date(activePost.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        const graphicUrls = activePost.graphic
          ? activePost.graphic.split(',').map((u: string) => u.trim()).filter((u: string) => u.startsWith('/') || u.startsWith('http'))
          : []
        const isCarousel = graphicUrls.length > 1
        const isSingleGraphic = graphicUrls.length === 1
        const CAROUSEL_LABELS = ['Slide 1 - Depleted', 'Slide 2 - Transitioning', 'Slide 3 - Ready']
        return (
          <Card>
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded border" style={{ color: s.color, background: s.bg, borderColor: s.border }}>{s.label}</span>
                  <span className={`text-xs font-medium ${ph.color}`}>{ph.label}</span>
                  {(() => { const pl = PLATFORM_STYLES[(activePost.platform ?? 'instagram') as Platform]; return <span className={`text-xs px-2 py-0.5 rounded border font-medium ${pl.badge}`}>{pl.label}</span> })()}
                  <span className="text-xs text-stone-600">{dateLabel}</span>
                  <span className="text-xs font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">{activePost.time ?? POST_TYPE_DEFAULT_TIMES[activePost.type]}</span>
                </div>
                <p className="text-base font-semibold text-white">{activePost.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setActivePost(null); startEdit(activePost) }} className="text-xs text-stone-500 hover:text-stone-300 transition-colors">Edit</button>
                <button onClick={() => setActivePost(null)} className="text-stone-500 hover:text-white transition-colors text-xl leading-none">×</button>
              </div>
            </div>

            {/* Instagram-style post preview */}
            <div className="grid sm:grid-cols-2 gap-5 items-start">

              {/* Left - graphic(s) */}
              <div>
              {isCarousel ? (
                // Carousel - multiple slides
                <div className="space-y-3">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">{graphicUrls.length} slides - download each</p>
                  {graphicUrls.map((url: string, i: number) => (
                    <div key={i}>
                      <a
                        href={url}
                        download={`${activePost.title.replace(/\s+/g, '-').toLowerCase()}-slide-${i + 1}.png`}
                        className="flex items-center justify-center gap-1.5 w-full mb-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-xs font-medium text-stone-300 transition-colors"
                      >
                        ↓ {CAROUSEL_LABELS[i] ?? `Slide ${i + 1}`}
                      </a>
                      <div className="rounded-xl overflow-hidden bg-stone-950 border border-stone-800" style={{ aspectRatio: '1/1', position: 'relative', minHeight: '180px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Slide ${i + 1}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                {isSingleGraphic && (
                  <a
                    href={graphicUrls[0]}
                    download={`${activePost.title.replace(/\s+/g, '-').toLowerCase()}.png`}
                    className="flex items-center justify-center gap-1.5 w-full mb-2 px-3 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-xs font-medium text-stone-300 transition-colors"
                  >
                    ↓ Download graphic
                  </a>
                )}
                <div className="rounded-xl overflow-hidden bg-stone-950 border border-stone-800" style={{ aspectRatio: '1/1', position: 'relative', minHeight: '280px' }}>
                  {isSingleGraphic ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={graphicUrls[0]} alt={activePost.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                      {activePost.graphic ? (
                        <>
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Graphic Brief</p>
                          <p className="text-sm text-stone-400 leading-relaxed">{activePost.graphic}</p>
                        </>
                      ) : (
                        <p className="text-sm text-stone-700">No graphic set</p>
                      )}
                    </div>
                  )}
                </div>
                </>
              )}
              </div>

              {/* Right - caption */}
              <div className="space-y-3">
                {/* Profile row */}
                {(() => {
                  const bd = BRAND_STYLES[(activePost.brand ?? 'body_recode') as Brand]
                  return (
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${bd.filter}`}>
                        <span className="text-xs font-bold">@</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{bd.handle}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-stone-600">{bd.label}</p>
                          {isAicmPost(activePost) && <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${AICM_BADGE_CLASS}`}>AICM</span>}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {activePost.caption ? (
                  <div className="bg-stone-950 border border-stone-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-stone-600 uppercase tracking-widest">Caption</p>
                      <button
                        onClick={() => {
                          const full = [activePost.caption, activePost.notes].filter(Boolean).join('\n\n')
                          navigator.clipboard.writeText(full)
                        }}
                        className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium"
                      >Copy all</button>
                    </div>
                    <p className="text-sm text-stone-200 leading-relaxed whitespace-pre-line">{activePost.caption}</p>
                    {activePost.notes && (
                      <p className="text-xs text-stone-500 mt-3 pt-3 border-t border-stone-800 leading-relaxed">{activePost.notes}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-stone-950 border border-stone-700/40 border-dashed rounded-xl p-5 text-center">
                    <p className="text-sm text-stone-600 mb-1">No caption written yet.</p>
                    <button
                      onClick={() => { setActivePost(null); startEdit(activePost) }}
                      className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                    >Add caption →</button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )
      })()}

      {/* Add/Edit form */}
      {showForm && (
        <Card>
          <p className="text-sm font-semibold text-white mb-4">{editId ? 'Edit Post' : 'Schedule Post'}</p>
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1">Brand</label>
                <select value={form.brand ?? 'body_recode'} onChange={e => setForm(f => ({ ...f, brand: e.target.value as Brand }))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500">
                  {(Object.entries(BRAND_STYLES) as [Brand, typeof BRAND_STYLES[Brand]][]).map(([k, s]) => (
                    <option key={k} value={k}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Platform</label>
                <select value={form.platform ?? 'instagram'} onChange={e => setForm(f => ({ ...f, platform: e.target.value as Platform }))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500">
                  {(Object.entries(PLATFORM_STYLES) as [Platform, typeof PLATFORM_STYLES[Platform]][]).map(([k, s]) => (
                    <option key={k} value={k}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Date</label>
                <input type="date" value={form.date ?? ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Post Time</label>
                <input type="time" value={form.time ?? '07:00'} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Content Type</label>
                <select value={form.type ?? 'authority'} onChange={e => {
                  const t = e.target.value as PostType
                  setForm(f => ({ ...f, type: t, time: f.time && f.time !== POST_TYPE_DEFAULT_TIMES[f.type as PostType] ? f.time : POST_TYPE_DEFAULT_TIMES[t] }))
                }}
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
              <label className="block text-xs text-stone-500 mb-1">Graphic Brief</label>
              <input type="text" value={form.graphic ?? ''} onChange={e => setForm(f => ({ ...f, graphic: e.target.value }))}
                placeholder="e.g. Insight card. Label: The Real Problem. Text: Your body isn't broken."
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Caption</label>
              <textarea rows={6} value={form.caption ?? ''} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
                placeholder="Write the full post caption here..."
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-teal-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Hashtags (optional)</label>
              <input type="text" value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="#bodyrecode #bodystate ..."
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-teal-500" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={savePost} disabled={!form.date || !form.title || saving}
                className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-stone-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                {saving ? 'Saving...' : editId ? 'Save Changes' : 'Schedule Post'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm({ type: 'authority', phase: 'prelaunch', brand: 'body_recode', platform: 'instagram', time: POST_TYPE_DEFAULT_TIMES['authority'] }) }}
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

function Body({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-stone-400 leading-relaxed${className ? ` ${className}` : ''}`}>{children}</p>
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
          <span className="text-teal-500 mt-0.5 shrink-0">-</span>
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

type PostStatus = 'not_started' | 'drafted' | 'scheduled' | 'published'

const POST_STATUS_CYCLE: PostStatus[] = ['not_started', 'drafted', 'scheduled', 'published']

const POST_STATUS_CONFIG: Record<PostStatus, { label: string; color: string; bg: string; border: string }> = {
  not_started: { label: 'Not Started', color: 'text-stone-500',  bg: 'bg-stone-800/50',    border: 'border-stone-700' },
  drafted:     { label: 'Drafted',     color: 'text-amber-400',  bg: 'bg-amber-400/10',    border: 'border-amber-400/30' },
  scheduled:   { label: 'Scheduled',   color: 'text-blue-400',   bg: 'bg-blue-400/10',     border: 'border-blue-400/30' },
  published:   { label: 'Published',   color: 'text-teal-400',   bg: 'bg-teal-400/10',     border: 'border-teal-400/30' },
}

const PRELAUNCH_POSTS = [
  { id: 'post1', post: 'Post 1', day: 'Day 1', date: 'Wed 8 Apr',  title: 'Brand Arrival',    temp: 'Cold' as const },
  { id: 'post2', post: 'Post 2', day: 'Day 2', date: 'Thu 9 Apr',  title: 'Who You Are',      temp: 'Cold' as const },
  { id: 'post3', post: 'Post 3', day: 'Day 4', date: 'Sat 11 Apr', title: 'The Problem',      temp: 'Cold' as const },
  { id: 'post4', post: 'Post 4', day: 'Day 6', date: 'Mon 13 Apr', title: 'The Three States', temp: 'Cold' as const },
  { id: 'post5', post: 'Post 5', day: 'Day 8', date: 'Wed 15 Apr', title: 'Scorecard CTA',    temp: 'Hot'  as const },
]

export default function StrategyPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [postStatuses, setPostStatuses] = useState<Record<string, PostStatus>>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem('prelaunch_post_statuses')
      if (saved) setPostStatuses(JSON.parse(saved))
    } catch {}
  }, [])

  function cycleStatus(id: string) {
    setPostStatuses(prev => {
      const current = prev[id] ?? 'not_started'
      const nextIndex = (POST_STATUS_CYCLE.indexOf(current) + 1) % POST_STATUS_CYCLE.length
      const next = { ...prev, [id]: POST_STATUS_CYCLE[nextIndex] }
      try { localStorage.setItem('prelaunch_post_statuses', JSON.stringify(next)) } catch {}
      return next
    })
  }

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
            <Body>Social media is not the funnel - it feeds the funnel. Every piece of content drives curiosity. The scorecard converts that curiosity into qualified leads.</Body>
          </Card>

          {/* Funnel flow */}
          <Card>
            <SectionLabel>The Funnel</SectionLabel>
            <div className="flex items-center gap-2 flex-wrap">
              {['Content / Ad', 'Curiosity', 'Scorecard', 'Zoom 1 Booking', 'Zoom 1 → Zoom 2', 'Client'].map((step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-300">{step}</div>
                  {i < arr.length - 1 && <span className="text-stone-600 text-xs">→</span>}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card>
              <SectionLabel>Primary Channels</SectionLabel>
              <p className="text-white font-semibold">Instagram + LinkedIn</p>
              <p className="text-xs text-stone-500 mt-1">IG 5×/wk (scorecard funnel, Meta ads). LinkedIn 1-2×/wk (executive reframe, no ads).</p>
            </Card>
            <Card>
              <SectionLabel>Posting Frequency</SectionLabel>
              <p className="text-white font-semibold">5× IG + 1-2× LI</p>
              <p className="text-xs text-stone-500 mt-1">IG: 3 graphics/carousels + 2 reels. LinkedIn: short essays Tue/Thu morning.</p>
            </Card>
            <Card>
              <SectionLabel>Ad Budget</SectionLabel>
              <p className="text-white font-semibold">$20–30/day AUD</p>
              <p className="text-xs text-stone-500 mt-1">Meta only. LinkedIn stays organic.</p>
            </Card>
          </div>

          <Card>
            <SectionLabel>Revenue Sequence</SectionLabel>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {[
                  { label: 'Attraction', value: 'Scorecard', note: 'Free', color: 'text-stone-300' },
                  { label: 'Upsell', value: '$37 Report', note: 'Immediate', color: 'text-amber-400' },
                  { label: 'Commencement', value: '$240 Fee', note: 'On conversion', color: 'text-teal-400' },
                  { label: 'Continuity', value: '$299–$409/wk', note: 'Recurring', color: 'text-teal-400' },
                  { label: 'Downsell', value: '$97 Program', note: 'Zoom 1 decline', color: 'text-violet-400' },
                ].map(item => (
                  <div key={item.label} className="bg-stone-800/50 border border-stone-700 rounded-lg px-3 py-2.5 text-center">
                    <p className="text-xs text-stone-500 mb-1">{item.label}</p>
                    <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-stone-600 mt-0.5">{item.note}</p>
                  </div>
                ))}
              </div>
              <div className="bg-stone-800/30 border border-stone-700/50 rounded-lg px-4 py-3">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">LTV Optimisation - 2x to 3x Upgrade</p>
                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-stone-400 text-xs font-semibold mb-1">When</p>
                    <p className="text-stone-300 text-xs">Week 8+ on 2x package. Client recovering well, consistently completing sessions, body state progressing.</p>
                  </div>
                  <div>
                    <p className="text-stone-400 text-xs font-semibold mb-1">The offer</p>
                    <p className="text-stone-300 text-xs">Move from 2 to 3 sessions per week. $299 → $409/week. Same check-ins, same interpretation. More training contact, faster compounding.</p>
                  </div>
                  <div>
                    <p className="text-stone-400 text-xs font-semibold mb-1">How</p>
                    <p className="text-stone-300 text-xs">Use the Upgrade Companion (linked from client profile). Raise it in a regular session. Data-led, not sales-led.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <SectionLabel>Primary Objective</SectionLabel>
            <div className="flex items-center gap-2 mb-2"><Tag color="teal">Performance Coaching</Tag></div>
            <Heading>Ongoing Acquisition</Heading>
            <Body>Cold traffic → Scorecard → Zoom 1 booking → Zoom 2 → client. Two channels feeding the same scorecard: Instagram (consumer funnel, Meta ads) and LinkedIn (executive reframe, organic only). Both attributed separately in the CRM.</Body>
          </Card>

          <Card>
            <SectionLabel>What to Ignore Right Now</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {['TikTok', 'YouTube', 'Twitter / X', 'Podcasts', 'Email newsletters'].map(p => (
                <span key={p} className="text-xs text-stone-600 bg-stone-800/50 border border-stone-800 px-2.5 py-1 rounded-full line-through">{p}</span>
              ))}
            </div>
            <p className="text-xs text-stone-600 mt-3">Two channels done well outperform five done badly. Lock Instagram + LinkedIn + Meta ads first.</p>
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
                <Heading>Primary - Women 35–50</Heading>
                <BulletList items={[
                  'High-functioning, disciplined, consistent',
                  'Training and eating well - getting nothing back',
                  'Corporate, finance, law, medical, consulting',
                  '$100K–$180K+ AUD income',
                  'Frustrated, not lazy',
                ]} />
              </div>
              <div>
                <Heading>Secondary - Men 35–55</Heading>
                <BulletList items={[
                  'Ex-athletes, corporate professionals',
                  'Body stopped responding - no explanation',
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
            <SectionLabel>Tone of Voice - 6 Principles</SectionLabel>
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
                  <span className="text-stone-600 text-sm">-</span>
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
                { n: '1', label: 'Body State', desc: 'Depleted / Transitioning / Ready. Why body state determines everything - training, fat loss, and what the body will and won\'t respond to.' },
                { n: '2', label: 'Why Effort Isn\'t Working', desc: 'The training harder / eating less trap. Why doing more makes things worse in the wrong state. The effort paradox.' },
                { n: '3', label: 'Cortisol and Fat Storage', desc: 'Stress belt, protection mode, why the body resists fat loss under load. The mechanism most coaches ignore entirely.' },
                { n: '4', label: 'Prescription Without Interpretation', desc: 'The fundamental flaw in mainstream fitness. Being told what to do before anyone has read what the body is actually doing.' },
                { n: '5', label: 'The Intelligent Approach', desc: 'What reading the body first actually looks like. The Body Recode system as the solution - interpretation before prescription.' },
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
            <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">LinkedIn channel</p>
              <p className="text-xs text-stone-300 leading-relaxed">The same intellectual territory drives LinkedIn content through 4 reframed pillars: <strong className="text-white">State over Discipline</strong>, <strong className="text-white">The Effort Trap</strong>, <strong className="text-white">Physiology and Decision-Making</strong>, <strong className="text-white">Interpretation over Prescription</strong>. Same physiology, executive vocabulary. See the <strong className="text-blue-400">LinkedIn tab</strong> for the full breakdown.</p>
            </div>
          </Card>

          <Card>
            <SectionLabel>What Every Piece of Content Must Do</SectionLabel>
            <div className="space-y-2">
              {[
                { label: 'Make them feel', value: '"Finally, someone gets it."' },
                { label: 'Then make them think', value: '"I need to take that scorecard."' },
                { label: 'CTA rule — Instagram', value: 'One CTA per post. Take the scorecard. One job per post.' },
                { label: 'CTA rule — LinkedIn', value: 'CTA every 4-5 posts only. Most posts build credibility without selling.' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-3 py-2 border-b border-stone-800 last:border-0">
                  <span className="text-xs text-stone-500 w-44 shrink-0 mt-0.5">{label}</span>
                  <span className="text-sm text-white">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5">
            <SectionLabel>Never Say or Do</SectionLabel>
            <BulletList items={[
              '"Crush it", "no excuses", "grind", "hustle" - no fitness clichés',
              'Blame the client for biological symptoms',
              'Shame-based or guilt-based messaging',
              'Hype or exaggerated promises',
              'Long-winded clinical explanations',
              'Direct selling - always guide, never push',
            ]} />
          </Card>

          <Card>
            <SectionLabel>Messaging Framework - Every Post</SectionLabel>
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
                    <span className="text-sm text-stone-400">- {desc}</span>
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
          <Card className="border-pink-500/30 bg-pink-500/5">
            <SectionLabel>Instagram Content System</SectionLabel>
            <p className="text-sm text-stone-300 leading-relaxed">Everything in this tab is the <strong className="text-white">Instagram</strong> content system - temperature ladder, weekly cadence, post types, production tools. LinkedIn runs a different cadence (1-2/wk vs 5/wk), different format (short essays, no carousels), and different tone (executive reframe, no fat-loss language). See the <strong className="text-blue-400">LinkedIn tab</strong> for that system.</p>
          </Card>

          <Card>
            <SectionLabel>Content Temperature - Hormozi Engagement Ladder</SectionLabel>
            <Body className="mb-4">Every post targets one temperature level. Cold content moves people from unaware to problem aware. Warm content moves them from problem aware to solution aware. Hot content pushes them to act. The ratio should be roughly 60% cold, 30% warm, 10% hot.</Body>
            <div className="space-y-2">
              {[
                { temp: 'Cold', colour: 'text-blue-400', bg: 'bg-blue-400/5 border-blue-400/20', ratio: '~60% of posts', desc: 'Unaware → Problem aware. Education and pattern recognition. No CTA or soft "does this sound familiar?" Never ask for action.', types: 'Authority, Pattern Recognition, Coach Perspective' },
                { temp: 'Warm', colour: 'text-amber-400', bg: 'bg-amber-400/5 border-amber-400/20', ratio: '~30% of posts', desc: 'Problem aware → Solution aware. Introduce the system. "There is a reason for this and it can be read." Soft CTA - link in bio.', types: 'Coach Perspective, Diagnostic (soft)' },
                { temp: 'Hot', colour: 'text-red-400', bg: 'bg-red-400/5 border-red-400/20', ratio: '~10% of posts', desc: 'Solution aware → Ready to act. Direct CTA. "Take the scorecard. 2 minutes. Free. Find out your state." One job: get them to the scorecard.', types: 'Diagnostic / Funnel' },
              ].map(row => (
                <div key={row.temp} className={`p-3 rounded-lg border ${row.bg}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${row.colour}`}>{row.temp}</span>
                    <span className="text-xs text-stone-500">{row.ratio}</span>
                  </div>
                  <p className="text-sm text-stone-300 leading-relaxed mb-1">{row.desc}</p>
                  <p className="text-xs text-stone-500">Post types: {row.types}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-teal-500/5 border border-teal-500/20 rounded-lg">
              <p className="text-xs text-teal-400 font-medium">Primary lead getter: organic Instagram → scorecard. Go deep here before ads. Ads are the multiplier on a system that already converts.</p>
              <p className="text-xs text-stone-500 mt-1.5">Secondary: LinkedIn (executive reframe, organic only, slow-burn). Same scorecard, separate attribution.</p>
            </div>
          </Card>

          <Card>
            <SectionLabel>Weekly Structure</SectionLabel>
            <div className="space-y-2">
              {[
                { day: 'Monday', type: 'Authority', temp: 'Cold', goal: 'Make people think differently about their body', format: 'Carousel (5–7 slides) or short video', cta: 'None' },
                { day: 'Tuesday', type: 'Contrarian', temp: 'Cold', goal: 'Challenge the standard fitness narrative', format: 'Short video or statement graphic', cta: 'None' },
                { day: 'Wednesday', type: 'Pattern Recognition', temp: 'Cold', goal: 'Trigger self-recognition - "that\'s exactly me"', format: 'Carousel or graphic card', cta: 'Soft' },
                { day: 'Friday', type: 'Coach Perspective', temp: 'Warm', goal: 'Build trust, introduce the system', format: 'Talking video or photo card', cta: 'Soft' },
                { day: 'Sunday', type: 'Diagnostic / Funnel', temp: 'Hot', goal: 'Drive to the scorecard', format: 'Graphic card or reel', cta: 'Hard - scorecard link' },
              ].map(row => (
                <div key={row.day} className="grid grid-cols-5 gap-3 p-3 bg-stone-950 rounded-lg border border-stone-800 text-xs">
                  <div><p className="text-stone-600 mb-0.5">Day</p><p className="font-semibold text-white">{row.day}</p></div>
                  <div><p className="text-stone-600 mb-0.5">Type</p><p className="font-medium text-teal-400">{row.type}</p></div>
                  <div><p className="text-stone-600 mb-0.5">Temp</p><p className={row.temp === 'Hot' ? 'text-red-400' : row.temp === 'Warm' ? 'text-amber-400' : 'text-blue-400'}>{row.temp}</p></div>
                  <div><p className="text-stone-600 mb-0.5">Format</p><p className="text-stone-400">{row.format}</p></div>
                  <div><p className="text-stone-600 mb-0.5">CTA</p><p className="text-stone-400">{row.cta}</p></div>
                </div>
              ))}
            </div>
          </Card>

          {[
            {
              type: 'Type 1 - Authority',
              day: 'Monday',
              color: 'teal' as const,
              temp: 'Cold',
              tempColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
              tempDesc: 'Unaware → Problem aware',
              goal: 'Position Body Recode as a different philosophy from the fitness industry. Make people think: "This coach understands the body differently." No CTA - plant the idea.',
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
              type: 'Type 2 - Pattern Recognition',
              day: 'Wednesday',
              color: 'amber' as const,
              temp: 'Cold',
              tempColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
              tempDesc: 'Unaware → Problem aware',
              goal: 'Show people the patterns they are already stuck in. They read it and think: "That\'s exactly me." Recognition creates engagement. Soft CTA at most - "does this sound familiar?"',
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
              type: 'Type 3 - Coach Perspective',
              day: 'Friday',
              color: 'violet' as const,
              temp: 'Warm',
              tempColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
              tempDesc: 'Problem aware → Solution aware',
              goal: 'Build personal authority and trust. Introduce the system through experience-based storytelling. People buy the person guiding the system. Soft CTA - link in bio.',
              topics: [
                '"After years of coaching, I keep seeing the same pattern…"',
                '"The biggest mistake people make when trying to lose fat"',
                '"The moment I know someone will struggle with dieting"',
                '"What most coaches misunderstand about metabolism"',
                '"Why I stopped writing generic programs"',
                '"The client who did everything right and got nothing back - here\'s what was actually happening"',
                '"What changes when you read the body before prescribing to it"',
              ],
              format: 'Talking-head video (face to camera, gym or clean background) or photo card with caption',
            },
            {
              type: 'Type 4 - Contrarian',
              day: 'Tuesday (5th post)',
              color: 'amber' as const,
              temp: 'Cold / Warm',
              tempColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
              tempDesc: 'Unaware → Problem aware (challenges existing belief)',
              goal: 'Challenge the standard fitness narrative. Make people question what they\'ve been told. Highest share potential. No direct CTA - let the idea do the work.',
              topics: [
                '"More training and less food is making it worse."',
                '"Discipline is not the problem. The prescription is."',
                '"Your body isn\'t broken. It\'s being misread."',
                '"The reason your results stopped has nothing to do with effort."',
                '"Most coaches are trained to prescribe. Nobody trained them to read the body first."',
                '"Losing fat has almost nothing to do with how hard you train."',
              ],
              format: 'Short talking video (15–30 sec) or bold statement graphic card',
            },
            {
              type: 'Type 5 - Diagnostic / Funnel',
              day: 'Sunday',
              color: 'red' as const,
              temp: 'Hot',
              tempColor: 'text-red-400 bg-red-400/10 border-red-400/20',
              tempDesc: 'Solution aware → Ready to act',
              goal: 'Drive people to the scorecard. One job: get them to take it. This is the conversion post. Hard CTA - link in bio.',
              topics: [
                '"Your body is operating in one of three states right now. Find out which one."',
                '"I built a free tool that tells you which state your body is in. 2 minutes. Link in bio."',
                '"The Body State Scorecard. 2 minutes. Free. Find out why you\'re stuck."',
                '"Before I prescribe anything, I read the body first. You can do the same - link in bio."',
                '"Find out your body state in 2 minutes. Free. No email until you see your result."',
              ],
              format: 'Single graphic (photo card or scorecard-style card) + strong caption. Can also be a short reel.',
            },
          ].map(ct => (
            <Card key={ct.type}>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <Tag color={ct.color}>{ct.type}</Tag>
                <span className="text-xs text-stone-600">{ct.day}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ct.tempColor}`}>{ct.temp} - {ct.tempDesc}</span>
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
                { type: 'Authority carousel', effort: 'Low', tool: 'Content Engine - graphic + carousel generator' },
                { type: 'Pattern recognition carousel', effort: 'Low', tool: 'Content Engine - carousel generator' },
                { type: 'Coach perspective video', effort: 'Medium', tool: 'iPhone + tripod in gym. 30–60 sec.' },
                { type: 'Diagnostic graphic', effort: 'Low', tool: 'Content Engine - photo card or scorecard card' },
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

          {/* Tracker */}
          {(() => {
            const publishedCount = PRELAUNCH_POSTS.filter(p => (postStatuses[p.id] ?? 'not_started') === 'published').length
            const allDone = publishedCount === PRELAUNCH_POSTS.length
            return (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel>Pre-Launch Tracker</SectionLabel>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${(publishedCount / PRELAUNCH_POSTS.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-stone-500">{publishedCount}/{PRELAUNCH_POSTS.length}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {PRELAUNCH_POSTS.map(p => {
                    const status = postStatuses[p.id] ?? 'not_started'
                    const cfg = POST_STATUS_CONFIG[status]
                    return (
                      <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-stone-950 border border-stone-800">
                        <div className="shrink-0 w-24">
                          <p className="text-stone-300 text-xs font-medium">{p.date}</p>
                          <p className="text-stone-600 text-xs">{p.day}</p>
                        </div>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded border shrink-0 ${p.temp === 'Hot' ? 'text-red-400 bg-red-400/10 border-red-400/20' : 'text-blue-400 bg-blue-400/10 border-blue-400/20'}`}>{p.temp}</span>
                        <span className="text-stone-300 text-sm flex-1">{p.title}</span>
                        <button
                          onClick={() => cycleStatus(p.id)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${cfg.bg} ${cfg.color} ${cfg.border}`}
                        >
                          {cfg.label}
                        </button>
                      </div>
                    )
                  })}
                </div>
                {allDone && (
                  <div className="mt-3 p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                    <p className="text-xs text-teal-400 font-semibold">All 5 posts published. Ready to drop the Founding Client offer and launch ads.</p>
                  </div>
                )}
              </Card>
            )
          })()}

          <Card>
            <SectionLabel>Pre-Launch Goal</SectionLabel>
            <Body>Post 5 times over 8 days before any ads go live. Goal: profile looks established and intentional. No hashtags until Post 5. No CTA until Post 5.</Body>
            <div className="mt-3 space-y-1.5">
              {[
                { post: 'Post 1', temp: 'Cold', desc: 'Brand arrival - no CTA, no explanation yet. Intrigue only.' },
                { post: 'Post 2', temp: 'Cold', desc: 'Who you are - introduce the philosophy, not the offer.' },
                { post: 'Post 3', temp: 'Cold', desc: 'The problem - name the pain. Body state problem, not effort problem.' },
                { post: 'Post 4', temp: 'Cold', desc: 'The three states - educate. Still no CTA.' },
                { post: 'Post 5', temp: 'Hot', desc: 'Scorecard CTA - first time asking for action. Profile is now established.' },
              ].map(r => (
                <div key={r.post} className="flex items-center gap-3 text-xs p-2 rounded-lg bg-stone-950 border border-stone-800">
                  <span className="text-stone-500 w-10 shrink-0">{r.post}</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded border shrink-0 ${r.temp === 'Hot' ? 'text-red-400 bg-red-400/10 border-red-400/20' : 'text-blue-400 bg-blue-400/10 border-blue-400/20'}`}>{r.temp}</span>
                  <span className="text-stone-400">{r.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-teal-500/5 border border-teal-500/20 rounded-lg">
              <p className="text-xs text-teal-400 font-medium">After Post 5 - drop the Founding Client Program offer. Then launch ads.</p>
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
            format="Photo Split"
            graphic="/api/content/graphic?style=photo-split&label=Body+Recode&text=I+don%27t+prescribe+until+I%27ve+read+the+body.&sub=Most+coaches+skip+this+step.+It%27s+why+most+programs+fail."
            caption={`My name is Kade Dunstone. I'm a performance coach based in Brisbane.\n\nI work with high-functioning adults whose bodies have stopped responding to effort. People who are doing everything right and getting nothing back.\n\nBefore I build anyone a program, I do one thing first.\n\nI read the body.\n\nMost coaches skip this step. It's why most programs fail.`}
          />

          <PostBlock
            number={3}
            title="The Problem"
            day="Day 4"
            format="Insight card"
            graphic="Insight card. Label: The Real Problem. Text: Your body isn't broken. It's being misread. Use: /api/content/graphic?style=insight&label=The+Real+Problem&text=Your+body+isn%27t+broken.+It%27s+being+misread."
            caption={`You're training. You're eating well. You're consistent.\n\nAnd nothing is moving.\n\nThat's not a discipline problem. That's a body state problem.\n\nYour biology operates in one of three states. In two of those states, adding more training and cutting more food makes things worse - not better.\n\nNobody told you that. That's the problem.`}
          />

          <PostBlock
            number={4}
            title="The Three Body States"
            day="Day 6"
            format="Carousel - 3 body-state cards"
            graphic="3 separate body-state cards. Red (Depleted), Amber (Transitioning), Teal (Ready). Use the body-state graphic style with accent=red/amber/teal."
            caption={`Your body is operating in one of three states right now.\n\nDepleted. Transitioning. Ready.\n\nEach one requires a completely different approach. The same program that gets results in Ready State will make things worse in Depleted State.\n\nThis is why generic programs fail. They don't read the state first.\n\nSwipe to find out what each one means.`}
          />

          <PostBlock
            number={5}
            title="Scorecard CTA"
            day="Day 8"
            format="Photo card (photo-split or photo-top)"
            graphic='Photo card. Label: "Body Recode™". Text: "Find out which state your body is in." Sub: "Free. 2 minutes." Use: /api/content/graphic?style=photo-split&label=Body+Recode™&text=Find+out+which+state+your+body+is+in.&sub=Free.+2+minutes.'
            caption={`I built a free tool that tells you which state your body is currently operating in.\n\n5 sections. 2 minutes. No email required until you see your result.\n\nIt tells you:\n- Which body state you're in\n- Why your body is responding the way it is\n- What that means for your training and fat loss right now\n\nTake the Body State Scorecard - link in bio.`}
            hashtags="#bodyrecode #bodystate #fatlosss #performancecoaching #cortisol #fatloss #trainingresponse #brisbanecoach #onlinecoaching #hormones #metabolichealth #interpretation"
          />
        </div>
      )}

      {/* ── ORGANIC → ADS ── */}
      {tab === 'organic' && (
        <div className="space-y-4">

          {/* Goal */}
          <Card className="border-teal-500/20 bg-teal-500/5">
            <SectionLabel>The Goal</SectionLabel>
            <p className="text-teal-300 font-semibold text-sm">3 scorecard submissions per week from organic, for 2 consecutive weeks. That&apos;s the signal that the funnel converts. Then ads go on.</p>
            <p className="text-stone-400 text-sm mt-2">Ads placed on a funnel that doesn&apos;t convert waste money. Ads placed on a funnel that already converts multiply what&apos;s working. Organic proves the model first.</p>
          </Card>

          {/* Three levers */}
          <Card>
            <SectionLabel>The Three Conversion Levers</SectionLabel>
            <div className="grid sm:grid-cols-3 gap-3 mt-1">
              {[
                {
                  num: '1',
                  title: 'Content',
                  color: 'text-blue-400',
                  border: 'border-blue-400/20',
                  bg: 'bg-blue-400/5',
                  items: [
                    '5x/week - Cold builds audience, Hot converts',
                    'Sunday Diagnostic post always drives to scorecard',
                    'Hook quality determines reach - first line is everything',
                    'Consistency over 4 weeks before judging results',
                  ],
                },
                {
                  num: '2',
                  title: 'Profile',
                  color: 'text-amber-400',
                  border: 'border-amber-400/20',
                  bg: 'bg-amber-400/5',
                  items: [
                    'Bio link goes directly to the scorecard - not homepage',
                    'Bio copy: one problem statement, one action',
                    'Highlight covers: Body States, Method, Scorecard',
                    'Profile photo: clear face, not a logo',
                  ],
                },
                {
                  num: '3',
                  title: 'Warm Outreach',
                  color: 'text-teal-400',
                  border: 'border-teal-400/20',
                  bg: 'bg-teal-400/5',
                  items: [
                    'Reply to every comment within 1 hour of posting',
                    'DM every new follower - short welcome, no pitch',
                    'DM anyone who replies to a story or saves a post',
                    'DM story viewers who have watched 3+ stories',
                  ],
                },
              ].map(l => (
                <div key={l.num} className={`border ${l.border} ${l.bg} rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${l.color} bg-stone-800`}>{l.num}</span>
                    <p className={`text-sm font-semibold ${l.color}`}>{l.title}</p>
                  </div>
                  <ul className="space-y-1.5">
                    {l.items.map((item, i) => (
                      <li key={i} className="text-xs text-stone-400 leading-relaxed flex gap-2">
                        <span className="text-stone-700 shrink-0">·</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          {/* Weekly action plan */}
          <Card>
            <SectionLabel>Weekly Action Plan</SectionLabel>
            <div className="flex items-start gap-3 mb-3 p-3 rounded-lg bg-amber-400/5 border border-amber-400/20">
              <p className="text-xs text-amber-300 leading-relaxed">This rhythm starts <strong>after the pre-launch is complete</strong> (after Post 5 on April 15). Don&apos;t try to force it during pre-launch - those posts run on their own Day 1/2/4/6/8 schedule. First Monday of this rhythm: <strong>April 20</strong>.</p>
            </div>
            <p className="text-stone-500 text-xs mb-3">What to do each week - beyond just posting.</p>
            <div className="space-y-2">
              {[
                { day: 'Mon', post: true,  action: 'Post (Pattern Recognition - Cold). Reply to all weekend comments within 1hr.' },
                { day: 'Tue', post: true,  action: 'Post (Contrarian - Cold). DM the last 5 new followers - soft intro, no pitch.' },
                { day: 'Wed', post: true,  action: 'Post (Coach Perspective - Warm). Check story viewers from last 48hrs - DM anyone warm.' },
                { day: 'Thu', post: false, action: 'No post. DM anyone who saved a post this week. Review engagement on last 3 posts - note what performed.' },
                { day: 'Fri', post: true,  action: 'Post (Authority - Cold). Reply to all comments. DM anyone who replies to stories.' },
                { day: 'Sat', post: false, action: 'No post. Review the week: profile visits, scorecard submissions, follower growth. Note in weekly log.' },
                { day: 'Sun', post: true,  action: 'Post (Diagnostic/Funnel - Hot → Scorecard CTA). Actively DM anyone who comments asking how to do it.' },
              ].map(r => (
                <div key={r.day} className="flex items-start gap-3 p-2.5 rounded-lg bg-stone-950 border border-stone-800">
                  <span className="text-xs font-bold text-stone-500 w-7 shrink-0 pt-0.5">{r.day}</span>
                  {r.post
                    ? <span className="text-xs font-semibold text-teal-500 shrink-0 pt-0.5">Post</span>
                    : <span className="text-xs font-semibold text-stone-700 shrink-0 pt-0.5">Rest</span>
                  }
                  <p className="text-xs text-stone-400 leading-relaxed">{r.action}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Conversion milestones */}
          <Card>
            <SectionLabel>Conversion Milestones</SectionLabel>
            <p className="text-stone-500 text-xs mb-3">What the numbers should look like over 6 weeks. Track scorecard submissions per week in the CRM.</p>
            <div className="space-y-2">
              {[
                { weeks: 'Week 1–2', subs: '0–1/week', label: 'Normal', color: 'text-stone-400', bg: 'bg-stone-800/50', border: 'border-stone-700', note: 'Profile is new. No audience yet. Keep posting and doing outreach.' },
                { weeks: 'Week 3–4', subs: '1–2/week', label: 'Traction', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', note: 'Content is landing. Warm outreach is working. Dial in hook quality.' },
                { weeks: 'Week 5–6', subs: '3+/week', label: 'Converting', color: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/20', note: 'Funnel is proven. Hold for 2 consecutive weeks at this level, then launch ads.' },
              ].map(m => (
                <div key={m.weeks} className={`border ${m.border} ${m.bg} rounded-xl p-4`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-500">{m.weeks}</span>
                      <span className={`text-sm font-bold ${m.color}`}>{m.subs}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${m.border} ${m.color}`}>{m.label}</span>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed">{m.note}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Daily engagement routine */}
          <Card>
            <SectionLabel>Daily Engagement Routine - 20 Min/Day</SectionLabel>
            <p className="text-stone-500 text-xs mb-4">Do this every day, separate from posting. The algorithm reads engagement signal - an account that only posts but never interacts gets suppressed. This is how you grow without ads.</p>
            <div className="space-y-3">

              <div className="p-3 bg-stone-950 rounded-lg border border-stone-800">
                <p className="text-xs font-semibold text-white mb-2">Step 1 - Comment on hashtag posts (10 min)</p>
                <p className="text-xs text-stone-500 mb-2">Browse these hashtags and leave 5–8 genuine comments on recent posts. Comments that add value get profile clicks.</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-semibold text-stone-600 uppercase tracking-widest mb-1.5">Primary</p>
                    <div className="flex flex-wrap gap-1">
                      {['#performancecoaching','#fatlosscoachin','#strengthcoaching','#bodyrecode','#brisbanefitness','#brisbanept','#brisbanecoach'].map(h => (
                        <span key={h} className="text-[10px] text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded">{h}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-stone-600 uppercase tracking-widest mb-1.5">Secondary</p>
                    <div className="flex flex-wrap gap-1">
                      {['#fatlosstips','#trainingplateau','#metabolichealth','#compositioncoach','#hormonehealth','#womenshealth35','#cortisol'].map(h => (
                        <span key={h} className="text-[10px] text-stone-400 bg-stone-800 border border-stone-700 px-1.5 py-0.5 rounded">{h}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-stone-950 rounded-lg border border-stone-800">
                <p className="text-xs font-semibold text-white mb-2">Step 2 - Engage with target accounts (5 min)</p>
                <p className="text-xs text-stone-500 mb-2">Follow and comment on accounts your target client already follows. Your comment appears in their feed - that&apos;s a free impression on a warm audience.</p>
                <div className="space-y-1.5">
                  {[
                    { type: 'Brisbane PTs and coaches', why: 'Your direct audience watches these accounts' },
                    { type: 'Functional medicine practitioners', why: 'Cortisol, hormones, metabolic health - adjacent content' },
                    { type: "Women's health coaches (35–50)", why: 'Your primary demographic is already engaged here' },
                    { type: 'Exercise science and sports nutrition accounts', why: 'Establishes you as a peer, not a follower' },
                    { type: 'Corporate wellness and productivity accounts', why: 'High-functioning professionals in your target income bracket' },
                  ].map(r => (
                    <div key={r.type} className="flex items-start gap-2 text-xs">
                      <span className="text-teal-500 shrink-0 mt-0.5">-</span>
                      <div>
                        <span className="text-stone-300 font-medium">{r.type}</span>
                        <span className="text-stone-600"> - {r.why}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-stone-950 rounded-lg border border-stone-800">
                <p className="text-xs font-semibold text-white mb-2">Step 3 - React to stories (5 min)</p>
                <p className="text-xs text-stone-500">React to stories from people in your target audience. A reaction opens a DM thread - low friction, high visibility. Don&apos;t force a conversation. Just a reaction is enough to put your name in front of them.</p>
              </div>

              <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                <p className="text-xs font-semibold text-red-400 mb-2">Comment quality rules - non-negotiable</p>
                <div className="space-y-1">
                  {[
                    { bad: '"Great post!" / "Love this!" / "So true!"', good: 'Never. Generic comments are invisible and signal a bot.' },
                    { bad: 'Always add something real', good: 'A point of agreement, a related insight, a question - 2–3 sentences. Comments that show expertise get profile clicks.' },
                    { bad: 'Example of a good comment', good: '"The cortisol-fat loss connection is underrated. Most people push harder when they\'re stuck and wonder why nothing moves. Usually the opposite is needed."' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs py-1 border-b border-red-500/10 last:border-0">
                      <span className="text-red-400 shrink-0 mt-0.5">-</span>
                      <div>
                        <span className="text-stone-400 font-medium">{r.bad}: </span>
                        <span className="text-stone-500">{r.good}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </Card>

          {/* Content designed to grow */}
          <Card>
            <SectionLabel>Content Designed to Grow - Not Just Post</SectionLabel>
            <p className="text-stone-500 text-xs mb-3">The algorithm rewards saves and shares above all else. These signals tell Instagram the post is worth distributing beyond your followers.</p>
            <div className="space-y-2">
              {[
                { signal: 'Saves', how: 'Reference content - "save this for next time your fat loss stalls". The body states carousel is a save magnet. Any post with a framework, checklist, or explainer gets saved.' },
                { signal: 'Shares', how: 'Pattern recognition content - "if you know someone doing everything right and getting nothing back, send this". People share content that describes someone they know.' },
                { signal: 'Reels', how: 'Reels get 3–5x the reach of static posts on a new account. One 20-second talking head reel per week minimum once the pre-launch is done. Low production - face to camera, gym background, one clear point.' },
                { signal: 'Comments', how: 'Posts that ask a direct question at the end get more comments. More comments = more reach. End every Pattern Recognition post with one question.' },
                { signal: 'Story polls', how: 'Use Instagram Stories polls 2–3x per week. Simple yes/no questions about symptoms ("Do you train consistently but feel like nothing is changing?"). Each response is a warm signal - that person is your audience.' },
              ].map(r => (
                <div key={r.signal} className="flex items-start gap-3 p-3 bg-stone-950 rounded-lg border border-stone-800">
                  <span className="text-xs font-bold text-teal-400 w-14 shrink-0 pt-0.5">{r.signal}</span>
                  <p className="text-xs text-stone-400 leading-relaxed">{r.how}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* What NOT to do */}
          <Card className="border-red-500/20 bg-red-500/5">
            <SectionLabel>What Not to Do</SectionLabel>
            <BulletList items={[
              'Follow/unfollow strategy - it works short-term and destroys trust long-term. Your audience is intelligent. They notice.',
              'Engagement pods - fake reciprocal engagement inflates vanity metrics, not real reach or leads.',
              'Buying followers - dead weight. Kills your engagement rate and signals the algorithm to suppress you.',
              'Commenting on competitor accounts to poach their followers - it reads as desperate, not authoritative.',
              'Posting the same content twice to get more reach - Instagram suppresses reposted content.',
            ]} />
          </Card>

          {/* If not converting */}
          <Card>
            <SectionLabel>If You&apos;re Not Converting by Week 6</SectionLabel>
            <p className="text-stone-400 text-sm mb-3">Don&apos;t launch ads. Diagnose first.</p>
            <div className="space-y-2">
              {[
                { check: 'Hook quality', fix: 'Read back your last 10 first lines. If they don\'t stop your own scroll, they won\'t stop anyone else\'s. Rewrite the weakest 3.' },
                { check: 'Profile link', fix: 'Check the bio link goes directly to the scorecard. Open it yourself on mobile. If there\'s friction, fix it.' },
                { check: 'Outreach frequency', fix: 'Are you actually DMing new followers and story viewers? If you\'re only posting without outreach, the posts alone won\'t convert in week 5.' },
                { check: 'CTA clarity', fix: 'Every Sunday post must have one clear action: take the scorecard. Not "follow", not "save" - one action. Check the last 4 Sunday posts.' },
                { check: 'Content temperature mix', fix: 'If every post is Cold (educational), there\'s nothing pulling people toward an action. Hot posts (Sunday Diagnostic) must run every week without exception.' },
              ].map(r => (
                <div key={r.check} className="p-3 rounded-lg bg-stone-950 border border-stone-800">
                  <p className="text-xs font-semibold text-white mb-1">{r.check}</p>
                  <p className="text-xs text-stone-500 leading-relaxed">{r.fix}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* The trigger */}
          <Card className="border-teal-500/20 bg-teal-500/5">
            <SectionLabel>The Ads Trigger</SectionLabel>
            <p className="text-teal-300 font-semibold text-sm mb-2">3 scorecard submissions/week for 2 consecutive weeks. Then go to the Paid Ads tab and launch.</p>
            <p className="text-stone-500 text-xs">At that point you have proof that cold traffic can find you, the profile converts them, and the scorecard holds attention. Ads buy more of that. Without those two weeks of data, you&apos;re paying to test whether the funnel works instead of to scale what already does.</p>
          </Card>

        </div>
      )}

      {/* ── ADS ── */}
      {tab === 'ads' && (
        <div className="space-y-4">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <SectionLabel>Sequence Rule</SectionLabel>
            <Body>Organic first. Ads second. Ads are a multiplier on a system that already converts - not a replacement for proving the funnel works. Run organic until you have consistent scorecard submissions from content. Then add ads to scale what's working.</Body>
          </Card>

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
              <div><Heading>Objective</Heading><Body>Cold traffic → Scorecard. Never direct to purchase.</Body></div>
              <div><Heading>Audience</Heading><Body>Cold - women and men 35–55. Interests: health, fitness, fat loss, body composition, wellness, personal development.</Body></div>
              <div><Heading>Placement</Heading><Body>Instagram feed + Reels + Facebook feed. Start broad, let Meta optimise.</Body></div>
              <div><Heading>Traffic type</Heading><Body>Cold only for now. Retargeting layer added at Day 30+ once pixel has enough data.</Body></div>
            </div>
          </Card>

          <Card>
            <SectionLabel>Creative Format</SectionLabel>
            <BulletList items={[
              'Primary: 15–30 sec talking head reel (face to camera, gym background)',
              'Secondary: Static graphic card (scorecard-style or photo card)',
              'No music on primary ads - calm and direct tone IS the differentiator',
              'No jump cuts every 2 seconds - this audience responds to calm authority',
              'Vertical 9:16 for Reels/Stories, horizontal 16:9 for feed where possible',
            ]} />
          </Card>

          <div className="space-y-3">
            <SectionLabel>3 Ad Angles - Test Simultaneously</SectionLabel>
            <ScriptBlock
              number={1}
              angle="Silent Frustration"
              hook="You're training. You're eating well. Nothing is moving. Here's why."
              duration="~22 sec"
              script="If you're training consistently, eating well, and your body has stopped responding - that's not a discipline problem. That's a body state problem. Your biology is in protection mode. And when it's there, adding more training and cutting more food makes it worse. Before I give anyone a program, I read their body first. Take the free Body State Scorecard - link in bio. Two minutes. Find out which state your body is in."
            />
            <ScriptBlock
              number={2}
              angle="Contrarian"
              hook="More training and less food is making it worse."
              duration="~20 sec"
              script="The standard advice when fat loss stalls - train harder, eat less. That's also the advice that drives cortisol up, suppresses your metabolism, and locks your body into a state where it actively resists fat loss. I've seen it hundreds of times. The problem was never effort. The problem was that nobody read the body before prescribing to it. Take the free Body State Scorecard - link in bio. Two minutes."
            />
            <ScriptBlock
              number={3}
              angle="Diagnosis"
              hook="Your body is in one of three states right now. Find out which one."
              duration="~23 sec"
              script="Your body is operating in one of three states right now. Ready - it can respond to training and nutrition. Transitioning - mixed signals, inconsistent results. Or Depleted - in protection mode, actively resisting fat loss and performance. Most people who feel stuck are in Depleted and don't know it. Find out which state you're in. Take the free Body State Scorecard - link in bio. Two minutes. No cost."
            />
          </div>

          {/* Ad Graphics */}
          <Card>
            <SectionLabel>Image Ad Graphics - Download</SectionLabel>
            <p className="text-stone-500 text-xs mb-4">Ready-to-use 1080×1080 graphics for Meta image ads. Download and upload directly to Ads Manager. All point to the Body State Scorecard.</p>
            <div className="space-y-6">

              {/* Graphic 1 - Statement card */}
              <div>
                <p className="text-xs font-semibold text-white mb-1">Ad 1 - Statement</p>
                <p className="text-xs text-stone-500 mb-3">Angle: Silent Frustration. Clean text card, no photo.</p>
                <div className="grid sm:grid-cols-2 gap-3 items-start">
                  <div className="rounded-xl overflow-hidden border border-stone-800 bg-stone-950" style={{ aspectRatio: '1/1' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/api/content/graphic?style=insight&label=Body+State+Problem&text=Your+body+stopped+responding.+Here%27s+why.&sub=Training+consistently.+Eating+well.+Nothing+moving.+That%27s+not+a+discipline+problem.+Take+the+free+Body+State+Scorecard.+Link+in+bio." alt="Ad 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="space-y-2">
                    <a href="/api/content/graphic?style=insight&label=Body+State+Problem&text=Your+body+stopped+responding.+Here%27s+why.&sub=Training+consistently.+Eating+well.+Nothing+moving.+That%27s+not+a+discipline+problem.+Take+the+free+Body+State+Scorecard.+Link+in+bio." download="ad-statement.png" className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-teal-500 hover:bg-teal-400 text-stone-950 text-xs font-semibold rounded-lg transition-colors">↓ Download 1080×1080</a>
                    <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 text-xs text-stone-400 leading-relaxed">
                      <p className="text-stone-600 mb-1 font-semibold uppercase tracking-widest text-[10px]">Ad copy</p>
                      Your body stopped responding. Here&apos;s why.<br /><br />Training consistently. Eating well. Nothing moving. That&apos;s not a discipline problem. That&apos;s a body state problem.<br /><br />Take the free Body State Scorecard. Link in bio. Two minutes.
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphic 2 - Photo card */}
              <div>
                <p className="text-xs font-semibold text-white mb-1">Ad 2 - Photo</p>
                <p className="text-xs text-stone-500 mb-3">Angle: Contrarian. Face + statement. Higher trust signal.</p>
                <div className="grid sm:grid-cols-2 gap-3 items-start">
                  <div className="rounded-xl overflow-hidden border border-stone-800 bg-stone-950" style={{ aspectRatio: '1/1' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/api/content/graphic?style=photo-split&text=More+training+and+less+food+is+making+it+worse.&sub=Take+the+free+Body+State+Scorecard.+Link+in+bio." alt="Ad 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="space-y-2">
                    <a href="/api/content/graphic?style=photo-split&text=More+training+and+less+food+is+making+it+worse.&sub=Take+the+free+Body+State+Scorecard.+Link+in+bio." download="ad-photo.png" className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-teal-500 hover:bg-teal-400 text-stone-950 text-xs font-semibold rounded-lg transition-colors">↓ Download 1080×1080</a>
                    <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 text-xs text-stone-400 leading-relaxed">
                      <p className="text-stone-600 mb-1 font-semibold uppercase tracking-widest text-[10px]">Ad copy</p>
                      More training and less food is making it worse.<br /><br />The standard advice when fat loss stalls drives cortisol up and locks your body into a state where it actively resists change.<br /><br />Take the free Body State Scorecard. Link in bio. Two minutes.
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphic 3 - Body states carousel */}
              <div>
                <p className="text-xs font-semibold text-white mb-1">Ad 3 - Body States (3 slides)</p>
                <p className="text-xs text-stone-500 mb-3">Angle: Diagnosis. Carousel ad - swipe to find your state.</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { accent: 'red', label: 'Depleted State | Score 5–8', text: 'Your body is in protection mode.', sub: 'Cortisol is elevated, metabolism is suppressed. Adding more training and less food will make this worse.' },
                    { accent: 'amber', label: 'Transitioning State | Score 9–11', text: 'Mixed signals. Something is blocking your response.', sub: 'Sleep, stress, or a mismatch between training load and current biological state.' },
                    { accent: 'teal', label: 'Ready State | Score 12–15', text: 'Your biology is in a position to respond.', sub: 'If fat loss or performance isn\'t happening at this score, the issue is in the prescription.' },
                  ].map((s, i) => (
                    <div key={i} className="space-y-1">
                      <div className="rounded-xl overflow-hidden border border-stone-800" style={{ aspectRatio: '1/1' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/content/graphic?style=body-state&accent=${s.accent}&label=${encodeURIComponent(s.label)}&text=${encodeURIComponent(s.text)}&sub=${encodeURIComponent(s.sub)}`} alt={`Slide ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <a href={`/api/content/graphic?style=body-state&accent=${s.accent}&label=${encodeURIComponent(s.label)}&text=${encodeURIComponent(s.text)}&sub=${encodeURIComponent(s.sub)}`} download={`ad-body-state-slide-${i + 1}.png`} className="flex items-center justify-center w-full px-2 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-semibold rounded-lg transition-colors">↓ Slide {i + 1}</a>
                    </div>
                  ))}
                </div>
                <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 text-xs text-stone-400 leading-relaxed">
                  <p className="text-stone-600 mb-1 font-semibold uppercase tracking-widest text-[10px]">Ad copy</p>
                  Your body is operating in one of three states right now. Swipe to find out which one and what it means for your training and fat loss.<br /><br />Take the free Body State Scorecard. Link in bio. Two minutes. No cost.
                </div>
              </div>

            </div>
          </Card>

          <Card>
            <SectionLabel>Filming Guide - Gym Session</SectionLabel>
            <BulletList items={[
              'Film vertical (9:16) AND horizontal (16:9) for each script',
              'Clean background - rack of weights or open floor, not cluttered',
              'Natural light or face a window - avoid harsh overhead gym lighting',
              'Earbuds out, record audio directly to camera',
              'iPhone on a tripod or ask someone to hold it',
              'Film each script 3–4 times so you have options',
              'Speak at 80% of normal pace - slower than you think',
              'Pause after the first sentence of each script',
              'Look directly into the lens, not the screen',
            ]} />
          </Card>

          <Card>
            <SectionLabel>What to Do With the Footage</SectionLabel>
            <div className="space-y-2">
              {[
                '1. Review takes - pick the best one per script',
                '2. Add captions using CapCut (free) - body text, on-screen hook line',
                '3. Upload best take to Content Engine → Generate Reel for AI avatar variations',
                '4. Upload to Meta Ads Manager - create 3 separate ad sets, one per angle',
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

      {/* ── LINKEDIN ── */}
      {tab === 'linkedin' && (
        <div className="space-y-4">

          {/* Overview */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <SectionLabel>LinkedIn — Body Recode Channel</SectionLabel>
            <Body>Opened as a parallel funnel into the same scorecard, reaching the same demographic (high-functioning adults, executives, founders, professionals) through a different channel with different language. Instagram strategy stays locked. LinkedIn is additive, not a replacement.</Body>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-stone-950 border border-stone-800">
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Posted from</p>
                <p className="text-xs text-white font-medium">Kade Dunstone personal profile</p>
                <p className="text-[11px] text-stone-500 mt-1">No separate Body Recode LinkedIn page. Audience follows the person.</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-950 border border-stone-800">
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Source tracking</p>
                <p className="text-xs text-teal-400 font-mono">?source=linkedin</p>
                <p className="text-[11px] text-stone-500 mt-1">Leads tagged separately from Instagram in CRM.</p>
              </div>
            </div>
          </Card>

          {/* Cadence */}
          <Card>
            <SectionLabel>Cadence</SectionLabel>
            <div className="space-y-1.5">
              {[
                { channel: 'Studio of Ten',    freq: '2-3 posts/week', note: 'Already running' },
                { channel: 'Personal Brand',   freq: '1 post/week',    note: '4 personal pillars (Body, Thinking, AI, Rebuild)' },
                { channel: 'Body Recode (NEW)', freq: '1-2 posts/week', note: 'Executive/performance reframe' },
                { channel: 'TOTAL FEED',        freq: '4-6 posts/week', note: 'Sustainable for one person' },
              ].map(r => (
                <div key={r.channel} className={`flex items-center gap-3 text-xs py-2 px-3 rounded-lg ${r.channel === 'TOTAL FEED' ? 'bg-teal-500/5 border border-teal-500/20' : 'border border-stone-800'}`}>
                  <span className={`w-44 shrink-0 font-medium ${r.channel === 'TOTAL FEED' ? 'text-teal-400' : 'text-white'}`}>{r.channel}</span>
                  <span className={`w-32 shrink-0 ${r.channel === 'TOTAL FEED' ? 'text-teal-300' : 'text-stone-300'}`}>{r.freq}</span>
                  <span className="text-stone-500 flex-1">{r.note}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-600 mt-3">BR slot rotates Tue or Thu morning (~7am Brisbane) — when executives scroll before work.</p>
          </Card>

          {/* Four pillars */}
          <Card>
            <SectionLabel>The Four Content Pillars</SectionLabel>
            <div className="space-y-3 mt-2">
              {[
                {
                  num: '01',
                  title: 'State over Discipline',
                  color: 'teal' as const,
                  desc: 'Why high performers do not have a willpower problem, they have a physiology problem.',
                  hook: '"Discipline is a symptom. State is the variable."',
                },
                {
                  num: '02',
                  title: 'The Effort Trap',
                  color: 'violet' as const,
                  desc: 'Why adding more input fails when the body cannot convert it. Contrarian to LinkedIn\'s hustle default.',
                  hook: '"When the system stops responding, the instinct is to add more effort. That\'s the problem."',
                },
                {
                  num: '03',
                  title: 'Physiology and Decision-Making',
                  color: 'amber' as const,
                  desc: 'How depleted state degrades executive function, judgement, energy. Career-relevant angle.',
                  hook: '"The decisions you make at 2pm are not made by the same person who made them at 9am."',
                },
                {
                  num: '04',
                  title: 'Interpretation over Prescription',
                  color: 'orange' as const,
                  desc: 'The methodology layer. How BR actually works. Bridges into B2B/licensable later.',
                  hook: '"Most coaches prescribe before they read. That\'s why most programs fail high performers."',
                },
              ].map(p => {
                const colorMap = {
                  teal:   { border: 'border-teal-500/30',   bg: 'bg-teal-500/5',   accent: 'text-teal-400' },
                  violet: { border: 'border-violet-500/30', bg: 'bg-violet-500/5', accent: 'text-violet-400' },
                  amber:  { border: 'border-amber-500/30',  bg: 'bg-amber-500/5',  accent: 'text-amber-400' },
                  orange: { border: 'border-orange-500/30', bg: 'bg-orange-500/5', accent: 'text-orange-400' },
                }[p.color]
                return (
                  <div key={p.num} className={`p-4 rounded-lg border ${colorMap.border} ${colorMap.bg}`}>
                    <div className="flex items-start gap-3">
                      <span className={`text-lg font-bold font-mono ${colorMap.accent} opacity-60`}>{p.num}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${colorMap.accent} mb-1`}>{p.title}</p>
                        <p className="text-xs text-stone-400 mb-2 leading-relaxed">{p.desc}</p>
                        <p className="text-xs text-stone-300 italic leading-relaxed">{p.hook}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-stone-600 mt-3">Each pillar has 8-12 angles in the bank. We don't burn them all in month one.</p>
          </Card>

          {/* Tone */}
          <Card>
            <SectionLabel>Tone Rules</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-teal-500/60 mb-2 font-bold">Always</p>
                <div className="space-y-1.5">
                  {[
                    'Performance, recovery, decision-making language',
                    'Short essay format, 150-250 words',
                    'One specific reframe per post',
                    'CTA every 4-5 posts only',
                    'First-person, structured, no fluff',
                  ].map(t => (
                    <div key={t} className="flex items-start gap-2 text-xs text-stone-300">
                      <span className="text-teal-500/60 mt-0.5">+</span> {t}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-red-500/60 mb-2 font-bold">Never</p>
                <div className="space-y-1.5">
                  {[
                    'Fat loss / weight loss / body composition language',
                    'Scorecard-funnel hooks ("your body is in 3 states")',
                    'Carousels (LinkedIn does not reward them)',
                    'Links in post body (kills reach — put in profile)',
                    'A separate Body Recode LinkedIn page',
                  ].map(t => (
                    <div key={t} className="flex items-start gap-2 text-xs text-stone-500">
                      <span className="text-red-500/60 mt-0.5">−</span> {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* How IG and LinkedIn coexist */}
          <Card>
            <SectionLabel>How Instagram and LinkedIn Coexist</SectionLabel>
            <Body>Both feed the same scorecard. Both reach the same demographic. Different language for the same physiology.</Body>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-pink-500/5 border border-pink-500/20">
                <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-2">Instagram</p>
                <p className="text-xs text-stone-300 mb-2 font-medium">Body state, fat loss, depleted/transitioning/ready</p>
                <p className="text-[11px] text-stone-500 leading-relaxed">5×/week, scorecard funnel, Meta ads running, consumer voice</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">LinkedIn</p>
                <p className="text-xs text-stone-300 mb-2 font-medium">Performance, recovery, decision-making, executive function</p>
                <p className="text-[11px] text-stone-500 leading-relaxed">1-2×/week, organic only, no ads, executive voice</p>
              </div>
            </div>
            <p className="text-xs text-stone-600 mt-3">Same physiology underneath. Different surface. The IG audience and LinkedIn audience are largely distinct, so no copy-paste between channels.</p>
          </Card>

          {/* Honest constraint */}
          <Card className="border-amber-500/20 bg-amber-500/5">
            <SectionLabel>Honest Constraint</SectionLabel>
            <Body>LinkedIn is a slow-burn channel. It will not fill the AF Newstead diary this week or month. Realistic ramp: first BR LinkedIn booking probably 6-10 weeks in. Compounds from there.</Body>
            <p className="text-xs text-stone-500 mt-3">Instagram funnel stays the conversion engine. LinkedIn is the brand-build and second-channel insurance.</p>
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
              phase: 'Phase 1 - Pre-Launch',
              days: 'Days 1–8',
              color: 'teal' as const,
              items: [
                'Post 5 profile establishment posts (logo, who you are, the problem, three states, scorecard CTA)',
                'No ads running yet',
                'Profile looks established before anyone is sent there',
              ],
            },
            {
              phase: 'Phase 2 - Ads Launch',
              days: 'Days 9–22',
              color: 'amber' as const,
              items: [
                'Start Meta ads at $20–30/day AUD',
                '3 ad angles running simultaneously (Silent Frustration / Contrarian / Diagnosis)',
                'All ads send to the Body State Scorecard',
                'Film gym reel session before this phase starts',
                'Continue 4×/week organic posting',
              ],
            },
            {
              phase: 'Phase 3 - Optimise',
              days: 'Days 23–45',
              color: 'stone' as const,
              items: [
                'Review ad performance - cut 2 underperforming angles',
                'Scale budget on winning angle to $40–50/day',
                'Continue organic content rhythm',
                'Review CPL in Ads dashboard',
              ],
            },
            {
              phase: 'Phase 4 - Scale',
              days: 'Days 46–60+',
              color: 'teal' as const,
              items: [
                'Add retargeting layer - people who visited check-in but didn\'t complete',
                'Increase budget on proven creative',
                'Produce 2nd round of ad creative from new scripts',
                'AI avatar variations of winning scripts via Content Engine',
                'Organic content continues - system is now a lead engine, not a full-time job',
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

      {/* ── PAGES ── */}
      {tab === 'pages' && (
        <div className="space-y-4">

          {/* Status Tracker */}
          <Card>
            <SectionLabel>Page Status</SectionLabel>
            <div className="space-y-2">
              {[
                {
                  platform: 'Instagram',
                  handle: '@body_recode_',
                  status: 'Live',
                  bioUpdated: true,
                  linkSet: 'bodyrecode.au/scorecard?source=instagram',
                  statusColor: 'teal' as const,
                },
                {
                  platform: 'Facebook',
                  handle: 'Body Recode',
                  status: 'Live',
                  bioUpdated: true,
                  linkSet: 'bodyrecode.au/scorecard?source=facebook',
                  statusColor: 'teal' as const,
                },
              ].map(row => (
                <div key={row.platform} className="grid grid-cols-4 gap-3 p-3 bg-stone-950 rounded-lg border border-stone-800 text-xs">
                  <div>
                    <p className="text-stone-600 mb-0.5">Platform</p>
                    <p className="font-semibold text-white">{row.platform}</p>
                    <p className="text-stone-500 mt-0.5">{row.handle}</p>
                  </div>
                  <div>
                    <p className="text-stone-600 mb-0.5">Status</p>
                    <Tag color={row.statusColor}>{row.status}</Tag>
                  </div>
                  <div>
                    <p className="text-stone-600 mb-0.5">Bio</p>
                    <p className={row.bioUpdated ? 'text-teal-400 font-medium' : 'text-red-400 font-medium'}>{row.bioUpdated ? 'Updated' : 'Needs update'}</p>
                  </div>
                  <div>
                    <p className="text-stone-600 mb-0.5">Link</p>
                    <p className="text-stone-400 break-all">{row.linkSet}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Instagram */}
          <Card>
            <SectionLabel>Instagram Profile</SectionLabel>
            <div className="space-y-4">
              <div>
                <Heading>Current Bio</Heading>
                <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 text-sm text-stone-300 leading-relaxed whitespace-pre-line font-mono">
                  {`Performance coaching for people whose bodies stopped responding.\nBody state interpretation. Training. Nutrition.\n↓ Find out which state you're in (2 min)`}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-950 rounded-lg border border-stone-800">
                  <p className="text-stone-600 mb-1">Username</p>
                  <p className="text-white font-medium">@body_recode_</p>
                </div>
                <div className="p-3 bg-stone-950 rounded-lg border border-stone-800">
                  <p className="text-stone-600 mb-1">Bio link</p>
                  <p className="text-teal-400">bodyrecode.au/scorecard?source=instagram</p>
                </div>
                <div className="p-3 bg-stone-950 rounded-lg border border-stone-800">
                  <p className="text-stone-600 mb-1">Account type</p>
                  <p className="text-white">Creator or Business</p>
                </div>
                <div className="p-3 bg-stone-950 rounded-lg border border-stone-800">
                  <p className="text-stone-600 mb-1">Link tool</p>
                  <p className="text-white">None - one link, one destination</p>
                </div>
              </div>
              <div>
                <Heading>Highlight Covers</Heading>
                <div className="space-y-1.5">
                  {[
                    { name: 'About', purpose: 'What Body Recode is, who it\'s for' },
                    { name: 'Body State', purpose: 'Explainer on Depleted / Transitioning / Ready' },
                    { name: 'Results', purpose: 'Client outcomes - add as they come in' },
                    { name: 'Scorecard', purpose: 'How it works, CTA to take it' },
                    { name: 'Program', purpose: 'What coaching looks like' },
                  ].map(h => (
                    <div key={h.name} className="flex items-center gap-3 text-xs p-2 bg-stone-950 rounded-lg border border-stone-800">
                      <span className="text-teal-400 font-semibold w-20 shrink-0">{h.name}</span>
                      <span className="text-stone-400">{h.purpose}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-stone-600 mt-2">Set up covers even if empty at launch. Dark background, teal icon or text.</p>
              </div>
            </div>
          </Card>

          {/* Facebook */}
          <Card>
            <SectionLabel>Facebook Page</SectionLabel>
            <div className="space-y-4">
              <div>
                <Heading>Current Bio (About field)</Heading>
                <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 text-sm text-stone-300 leading-relaxed">
                  Performance coaching for people whose bodies stopped responding. Body state interpretation. Training. Nutrition. Find out which state you&apos;re in - 2-min scorecard linked below.
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-950 rounded-lg border border-stone-800">
                  <p className="text-stone-600 mb-1">Page name</p>
                  <p className="text-white font-medium">Body Recode</p>
                </div>
                <div className="p-3 bg-stone-950 rounded-lg border border-stone-800">
                  <p className="text-stone-600 mb-1">Website field</p>
                  <p className="text-teal-400">performance.bodyrecode.au</p>
                </div>
                <div className="p-3 bg-stone-950 rounded-lg border border-stone-800">
                  <p className="text-stone-600 mb-1">CTA / scorecard link</p>
                  <p className="text-teal-400">bodyrecode.au/scorecard?source=facebook</p>
                </div>
                <div className="p-3 bg-stone-950 rounded-lg border border-stone-800">
                  <p className="text-stone-600 mb-1">Bio updated</p>
                  <p className="text-white">9 Apr 2026</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Terminology rule */}
          <Card className="border-amber-500/20 bg-amber-500/5">
            <SectionLabel>Public-Facing Terminology Rule</SectionLabel>
            <div className="space-y-2">
              {[
                { context: 'Instagram + scorecard (public)', terms: 'Depleted / Transitioning / Ready' },
                { context: 'CFFS coaching system (internal)', terms: 'Remediation / Optimisation / Post-Optimisation' },
              ].map(row => (
                <div key={row.context} className="flex items-start gap-3 text-xs py-2 border-b border-amber-500/10 last:border-0">
                  <span className="text-stone-500 w-52 shrink-0">{row.context}</span>
                  <span className="text-amber-300 font-medium">{row.terms}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-600 mt-3">Never use CFFS classification terms in public content. The scorecard gives a signal - the CFFS gives the real classification. That gap protects the value of the paid system.</p>
          </Card>

          {/* Launch checklist */}
          <Card>
            <SectionLabel>Pre-Launch Checklist</SectionLabel>
            <div className="space-y-1.5">
              {[
                { item: 'Username is @body_recode_', done: true },
                { item: 'Instagram bio matches spec exactly', done: true },
                { item: 'Bio link set to bodyrecode.au/scorecard?source=instagram', done: false },
                { item: 'Profile photo on-brand and high contrast', done: false },
                { item: 'Highlight covers set up (can be empty)', done: false },
                { item: 'Account is Creator or Business (not Personal)', done: false },
                { item: 'At least 1 post live before warm outreach begins', done: false },
                { item: 'Facebook bio updated', done: true },
                { item: 'Facebook website field set to performance.bodyrecode.au', done: false },
                { item: 'Facebook CTA button pointing to scorecard', done: false },
              ].map(({ item, done }) => (
                <div key={item} className="flex items-center gap-2.5 text-xs py-1.5 border-b border-stone-800 last:border-0">
                  <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${done ? 'bg-teal-500/20 border-teal-500/40' : 'bg-stone-900 border-stone-700'}`}>
                    {done && <span className="text-teal-400 text-[10px] font-bold">✓</span>}
                  </div>
                  <span className={done ? 'text-stone-400 line-through' : 'text-stone-300'}>{item}</span>
                </div>
              ))}
            </div>
          </Card>

        </div>
      )}

      {/* ── CALENDAR ── */}
      {tab === 'calendar' && <ContentCalendar />}
    </div>
  )
}
