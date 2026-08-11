'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BR_IG_FOOTER, appendBrFooter, stripBrFooter } from '@/lib/br-post-footer'
import { brand } from "@/config/tenant";
import { Clock, Handshake } from 'lucide-react'

type Tab = 'overview' | 'positioning' | 'content' | 'prelaunch' | 'organic' | 'ads' | 'linkedin' | 'timeline' | 'pages' | 'calendar' | 'docs'

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
  { id: 'docs', label: 'Strategy Docs' },
]

// Designed, shareable strategy documents per brand. Files live in
// public/docs/strategy/<brand>/ as .md + .docx + .pdf and are served statically,
// same pattern as the SaaS-buildout doc library. Regenerate the PDFs via
// ~/Dropbox/03_BODY_RECODE_COLLECTIVE/_pdf_build/build-sot-pattern-pdf.sh <md> "Title" "Category" "Version" "Subtitle" <brand>.
type StrategyDoc = { title: string; description: string; mdUrl: string; docxUrl: string; pdfUrl: string }
const STRATEGY_DOC_GROUPS: { label: string; dot: string; docs: StrategyDoc[] }[] = [
  {
    label: 'Body Recode', dot: 'bg-blue-500',
    docs: [{
      title: 'Body Recode — Consumer Marketing Strategy',
      description: 'One doc: strategy (positioning, body-state doctrine, the scorecard → Challenge → Blueprint funnel) + the Content Engine (stop teaching, start reading — signature formats, pillars × formats, weekly rhythm, comment-to-DM personalised reads, first plays to test).',
      mdUrl: '/docs/strategy/body-recode/body-recode-consumer-marketing-strategy-v1.md',
      docxUrl: '/docs/strategy/body-recode/body-recode-consumer-marketing-strategy-v1.docx',
      pdfUrl: '/docs/strategy/body-recode/body-recode-consumer-marketing-strategy-v1.pdf',
    }],
  },
  {
    label: 'Personal Brand', dot: 'bg-violet-400',
    docs: [{
      title: 'Kade Dunstone — Personal Brand Strategy',
      description: 'The @kade_dunstone_ personal brand: positioning, story, the four content pillars, cadence and launch sequence.',
      mdUrl: '/docs/strategy/personal-brand/kade-dunstone-personal-brand-strategy-v1.md',
      docxUrl: '/docs/strategy/personal-brand/kade-dunstone-personal-brand-strategy-v1.docx',
      pdfUrl: '/docs/strategy/personal-brand/kade-dunstone-personal-brand-strategy-v1.pdf',
    }],
  },
  {
    label: 'The Body Recode Collective', dot: 'bg-sky-400',
    docs: [{
      title: 'The Body Recode Collective — GTM & Content Strategy',
      description: 'The B2B licensing engine: positioning, demand-gen + waitlist posture, the Fit Scorecard funnel, five content pillars, the Emerging Coach lane, cadence and dependencies.',
      mdUrl: '/docs/strategy/collective/collective-gtm-content-strategy-v1.md',
      docxUrl: '/docs/strategy/collective/collective-gtm-content-strategy-v1.docx',
      pdfUrl: '/docs/strategy/collective/collective-gtm-content-strategy-v1.pdf',
    }],
  },
]

// ── CALENDAR ────────────────────────────────────────────────

type PostType = 'authority' | 'pattern' | 'contrarian' | 'coach' | 'diagnostic' | 'ad' | 'prelaunch' | 'thread' | 'video' | 'story'
type CampaignPhase = 'prelaunch' | 'ads' | 'optimise' | 'scale' | 'evergreen' | 'ascension' | 'membership_launch' | 'collective' | 'founder' | 'launch' | 'personal'
type Brand = 'body_recode' | 'personal_brand' | 'ai_cofounder' | 'collective'
type Platform = 'instagram' | 'facebook' | 'linkedin'

const PLATFORM_STYLES: Record<Platform, { label: string; badge: string }> = {
  instagram: { label: 'Instagram', badge: 'bg-pink-500/15 text-pink-400 border-pink-500/25' },
  facebook:  { label: 'Facebook',  badge: 'bg-blue-500/15 text-blue-700 border-blue-500/25' },
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
  // Native IG publishing tracking (2026-06-30)
  ig_container_id?: string | null
  ig_post_id?: string | null
  ig_post_url?: string | null
  posted_at?: string | null
  scheduled_publish_at?: string | null
  publish_error?: string | null
  publish_attempts?: number | null
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
  story:      '09:00',
}

function isAicmPost(p: { title?: string; notes?: string }): boolean {
  return (p.title ?? '').startsWith('AICM ') || (p.notes ?? '').toUpperCase().includes('AICM')
}

// A post is an Instagram Collab when its notes flag "IG COLLAB" (the founding-partner
// feed posts). Story tag-and-reshare notes say "cannot use Collab" and are excluded.
function isCollabPost(p: { notes?: string }): boolean {
  return (p.notes ?? '').toUpperCase().includes('IG COLLAB')
}

const COLLAB_BADGE_CLASS = 'bg-amber-500/15 text-amber-700 border-amber-500/30'

const AICM_BADGE_CLASS = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'

const BRAND_STYLES: Record<Brand, { label: string; handle: string; dot: string; filter: string }> = {
  body_recode:    { label: 'Body Recode',    handle: 'body_recode_',       dot: 'bg-blue-500',   filter: 'bg-blue-50 text-blue-500 border-blue-200' },
  personal_brand: { label: 'Personal Brand', handle: 'kade_dunstone_',     dot: 'bg-violet-400', filter: 'bg-violet-500/10 text-violet-700 border-violet-500/30' },
  ai_cofounder:   { label: 'AI Co-Founder',  handle: 'aicofoundermethod.com', dot: 'bg-amber-400',  filter: 'bg-amber-50 text-amber-700 border-amber-200' },
  collective:     { label: 'The Collective', handle: 'bodyrecode.au/collective', dot: 'bg-sky-500',  filter: 'bg-sky-50 text-sky-700 border-sky-200' },
}

const POST_TYPE_STYLES: Record<PostType, { label: string; color: string; bg: string; border: string }> = {
  authority:   { label: 'Authority',    color: '#1B6DFC', bg: 'rgba(27,109,252,0.12)',  border: 'rgba(27,109,252,0.3)' },
  pattern:     { label: 'Pattern',      color: '#B7791F', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  contrarian:  { label: 'Contrarian',   color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)' },
  coach:       { label: 'Coach',        color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  diagnostic:  { label: 'Diagnostic',   color: '#DC2626', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
  ad:          { label: 'Paid Ad',      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)' },
  prelaunch:   { label: 'Pre-Launch',   color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)' },
  thread:      { label: 'Thread',       color: '#e879f9', bg: 'rgba(232,121,249,0.12)', border: 'rgba(232,121,249,0.3)' },
  video:       { label: 'Video/Reel',   color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.3)' },
  story:       { label: 'IG Story',     color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  border: 'rgba(236,72,153,0.3)' },
}

const PHASE_STYLES: Record<CampaignPhase, { label: string; color: string }> = {
  prelaunch:         { label: 'Pre-Launch',      color: 'text-stone-600' },
  ads:               { label: 'Ads Launch',      color: 'text-blue-700' },
  optimise:          { label: 'Optimise',        color: 'text-amber-700' },
  scale:             { label: 'Scale',           color: 'text-blue-500' },
  evergreen:         { label: 'Evergreen',       color: 'text-emerald-600' },
  ascension:         { label: 'Blueprint Drive', color: 'text-blue-600' },
  membership_launch: { label: 'Membership',      color: 'text-violet-600' },
  collective:        { label: 'Collective',      color: 'text-teal-600' },
  founder:           { label: 'Founder',         color: 'text-amber-600' },
  launch:            { label: 'Launch',          color: 'text-rose-600' },
  personal:          { label: 'Personal',        color: 'text-orange-700' },
}

// Phase date ranges for calendar highlighting
const PHASE_RANGES: { phase: CampaignPhase; start: string; end: string; topBorder: string }[] = [
  { phase: 'prelaunch', start: '2026-04-08', end: '2026-04-21', topBorder: 'border-t-2 border-t-stone-500/60' },
  { phase: 'ads',       start: '2026-04-22', end: '2026-05-06', topBorder: 'border-t-2 border-t-blue-500/60' },
  { phase: 'optimise',  start: '2026-05-07', end: '2026-05-23', topBorder: 'border-t-2 border-t-amber-500/60' },
  { phase: 'scale',     start: '2026-05-24', end: '2026-12-31', topBorder: 'border-t-2 border-t-blue-500/60' },
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

function StrategyDocCard({ doc }: { doc: StrategyDoc }) {
  return (
    <div className="p-3 rounded-xl border border-stone-200 bg-white hover:border-blue-300 transition-colors">
      <div className="text-[13px] font-semibold text-stone-900 mb-1">{doc.title}</div>
      <p className="text-[11px] text-stone-600 leading-relaxed mb-2">{doc.description}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <a href={doc.pdfUrl} target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">View .pdf</a>
        <a href={doc.mdUrl} target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-stone-100 text-stone-700 hover:bg-blue-100 hover:text-blue-700">View .md</a>
        <a href={doc.docxUrl} download
          className="text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-stone-100 text-stone-700 hover:bg-blue-100 hover:text-blue-700">Download .docx</a>
      </div>
    </div>
  )
}

function StrategyDocs() {
  return (
    <Card>
      <SectionLabel>Strategy Documents</SectionLabel>
      <p className="text-sm text-stone-600 leading-relaxed mb-5">
        The full written strategy for each brand, as a designed PDF (share-ready), the editable Word version, and the raw markdown. Each PDF is branded to its own brand.
      </p>
      <div className="space-y-6">
        {STRATEGY_DOC_GROUPS.map(group => (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${group.dot}`} />
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">{group.label}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.docs.map(doc => <StrategyDocCard key={doc.pdfUrl} doc={doc} />)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
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
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all')

  useEffect(() => {
    supabase
      .from('calendar_posts')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        if (data) setPosts(data as ScheduledPost[])
        setLoading(false)
      })
  }, [])

  function sortPosts(ps: ScheduledPost[]): ScheduledPost[] {
    return [...ps].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      const at = a.time ?? '99:99'
      const bt = b.time ?? '99:99'
      return at.localeCompare(bt)
    })
  }

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
    return posts.filter(p =>
      p.date === dateStr(day) &&
      (brandFilter === 'all' || (p.brand ?? 'body_recode') === brandFilter) &&
      (platformFilter === 'all' || (p.platform ?? 'instagram') === platformFilter)
    )
  }

  async function savePost() {
    if (!form.date || !form.title || !form.type || !form.phase) return
    setSaving(true)
    const brandVal = form.brand ?? 'body_recode'
    const platformVal = form.platform ?? 'instagram'
    // Normalise the caption: strip any existing footer to get the raw body, then
    // re-stamp it for Body Recode IG posts. Keeps the founder follow line on
    // every BR IG caption, off other brands, and treats footer-only as empty.
    const isBrIg = brandVal === 'body_recode' && platformVal === 'instagram'
    const body = stripBrFooter(form.caption ?? '').trim()
    const captionVal = body ? (isBrIg ? appendBrFooter(body) : body) : null
    if (editId) {
      const { error } = await supabase
        .from('calendar_posts')
        .update({ date: form.date, time: form.time ?? null, brand: brandVal, platform: platformVal, type: form.type, phase: form.phase, title: form.title, notes: form.notes ?? null, caption: captionVal, graphic: form.graphic ?? null })
        .eq('id', editId)
      if (!error) setPosts(ps => sortPosts(ps.map(p => p.id === editId ? { ...p, ...form, caption: captionVal ?? undefined } as ScheduledPost : p)))
      setEditId(null)
    } else {
      const { data, error } = await supabase
        .from('calendar_posts')
        .insert({ date: form.date, time: form.time ?? null, brand: brandVal, platform: platformVal, type: form.type, phase: form.phase, title: form.title, notes: form.notes ?? null, caption: captionVal, graphic: form.graphic ?? null })
        .select()
        .single()
      if (!error && data) setPosts(ps => sortPosts([...ps, data as ScheduledPost]))
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

  // Apply a brand/platform change to the form and keep the founder follow line
  // in sync: present (footer visible in the textarea) only for Body Recode IG.
  function syncFooter(f: Partial<ScheduledPost>, patch: Partial<ScheduledPost>): Partial<ScheduledPost> {
    const next = { ...f, ...patch }
    const isBrIg = (next.brand ?? 'body_recode') === 'body_recode' && (next.platform ?? 'instagram') === 'instagram'
    const body = stripBrFooter(next.caption ?? '')
    const caption = isBrIg
      ? (body.trim() ? appendBrFooter(body) : `\n\n${BR_IG_FOOTER}`)
      : (body.trim() ? body : undefined)
    return { ...next, caption }
  }

  function startEdit(p: ScheduledPost) {
    // Seed the founder follow line for a BR IG post that has no caption yet, so
    // it's visible in the editor and you write your body text above it.
    const isBrIg = (p.brand ?? 'body_recode') === 'body_recode' && (p.platform ?? 'instagram') === 'instagram'
    const caption = p.caption ?? (isBrIg ? `\n\n${BR_IG_FOOTER}` : undefined)
    setForm({ ...p, caption })
    setEditId(p.id)
    setShowForm(true)
  }

  if (loading) return <div className="text-sm text-stone-500 py-8 text-center">Loading calendar...</div>

  const filteredSelectedPosts = selected
    ? posts.filter(p =>
        p.date === selected &&
        (brandFilter === 'all' || (p.brand ?? 'body_recode') === brandFilter) &&
        (platformFilter === 'all' || (p.platform ?? 'instagram') === platformFilter)
      )
    : []

  const platformChipStyles: Record<Platform, { label: string; dot: string; filter: string }> = {
    instagram: { label: 'Instagram', dot: 'bg-pink-400',   filter: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
    facebook:  { label: 'Facebook',  dot: 'bg-blue-500',   filter: 'bg-blue-50 text-blue-700 border-blue-200' },
    linkedin:  { label: 'LinkedIn',  dot: 'bg-blue-300',   filter: 'bg-blue-50 text-blue-700 border-blue-200' },
  }

  return (
    <div className="space-y-4">
      {/* Brand filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setBrandFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${brandFilter === 'all' ? 'bg-stone-300 text-[#1A1A1A] border-stone-400' : 'text-stone-500 border-stone-200 hover:text-stone-700'}`}
        >All brands</button>
        {(Object.entries(BRAND_STYLES) as [Brand, typeof BRAND_STYLES[Brand]][]).map(([k, s]) => (
          <button
            key={k}
            onClick={() => setBrandFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${brandFilter === k ? s.filter : 'text-stone-500 border-stone-200 hover:text-stone-700'}`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${s.dot}`} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Platform filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setPlatformFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${platformFilter === 'all' ? 'bg-stone-300 text-[#1A1A1A] border-stone-400' : 'text-stone-500 border-stone-200 hover:text-stone-700'}`}
        >All platforms</button>
        {(Object.entries(platformChipStyles) as [Platform, typeof platformChipStyles[Platform]][]).map(([k, s]) => (
          <button
            key={k}
            onClick={() => setPlatformFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${platformFilter === k ? s.filter : 'text-stone-500 border-stone-200 hover:text-stone-700'}`}
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
          <button onClick={prevMonth} className="p-1.5 text-stone-500 hover:text-stone-700 transition-colors text-lg">‹</button>
          <p className="text-sm font-semibold text-[#1A1A1A]">{monthName}</p>
          <button onClick={nextMonth} className="p-1.5 text-stone-500 hover:text-stone-700 transition-colors text-lg">›</button>
        </div>

        {/* Phase legend strip */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 pb-3 border-b border-stone-200">
          {PHASE_RANGES.map(r => {
            const style = PHASE_STYLES[r.phase]
            const start = new Date(r.start + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
            const end = r.phase === 'scale' ? 'onwards' : new Date(r.end + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
            return (
              <div key={r.phase} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm border-t-2 ${r.topBorder.replace('border-t-2 ', '')} bg-stone-200`} />
                <span className={`text-xs ${style.color}`}>{style.label}</span>
                <span className="text-xs text-stone-700">{start}{r.phase !== 'scale' ? ` – ${end}` : '+'}</span>
              </div>
            )
          })}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-stone-400 uppercase tracking-wider py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-px bg-stone-200">
          {/* Empty cells for first day - Monday-first: Sun(0)→6, Mon(1)→0, Tue(2)→1... */}
          {Array.from({ length: (firstDay + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-stone-50 min-h-[80px]" />
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
                className={`bg-stone-50 min-h-[80px] p-1.5 cursor-pointer transition-colors hover:bg-stone-100 ${getPhaseForDate(ds)} ${isSelected ? 'ring-1 ring-blue-500 ring-inset' : ''}`}
              >
                <div className={`text-xs font-semibold mb-1 w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-500 text-stone-50' : 'text-stone-500'}`}>
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
                        {isCollabPost(p) && <Handshake size={10} strokeWidth={2.5} className="shrink-0 text-amber-600" />}
                        {p.scheduled && <span className="text-blue-500 shrink-0">✓</span>}
                        <span className="opacity-70 mr-0.5">{p.time ?? POST_TYPE_DEFAULT_TIMES[p.type as PostType] ?? '07:00'}</span>
                        <span className="truncate">{p.title}</span>
                        <span className={`shrink-0 text-[9px] px-1 rounded border ${pl.badge}`}>{pl.label}</span>
                      </div>
                    )
                  })}
                  {dayPosts.length > 3 && <div className="text-[10px] text-stone-400">+{dayPosts.length - 3} more</div>}
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
            <p className="text-sm font-semibold text-[#1A1A1A]">
              {new Date(selected + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <button
              onClick={() => { const b = brandFilter !== 'all' ? brandFilter : 'body_recode'; setForm({ type: 'authority', phase: 'prelaunch', brand: b, platform: 'instagram', date: selected, time: POST_TYPE_DEFAULT_TIMES['authority'], caption: b === 'body_recode' ? `\n\n${BR_IG_FOOTER}` : undefined }); setEditId(null); setShowForm(true) }}
              className="text-xs text-blue-500 hover:text-blue-700 transition-colors font-medium"
            >
              + Add post
            </button>
          </div>
          {filteredSelectedPosts.length === 0 ? (
            <p className="text-sm text-stone-400">Nothing scheduled. Click &ldquo;+ Add post&rdquo; to schedule something.</p>
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
                        {isCollabPost(p) && <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border font-medium ${COLLAB_BADGE_CLASS}`}><Handshake size={10} strokeWidth={2.5} /> Collab</span>}
                        {(() => { const pl = PLATFORM_STYLES[(p.platform ?? 'instagram') as Platform]; return <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${pl.badge}`}>{pl.label}</span> })()}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-[#1A1A1A]">{p.title}</p>
                        <span className="text-xs font-semibold text-blue-500 bg-blue-50 border border-blue-500/20 px-2 py-0.5 rounded-full shrink-0">{p.time ?? POST_TYPE_DEFAULT_TIMES[p.type]}</span>
                        {p.posted_at && (
                          <a
                            href={p.ig_post_url ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs font-semibold text-green-700 bg-green-50 border border-green-300 px-2 py-0.5 rounded-full shrink-0 hover:bg-green-100 transition-colors"
                            title={`Posted ${new Date(p.posted_at).toLocaleString('en-AU')}${p.ig_post_url ? ' - click to open' : ''}`}
                          >
                            ✓ Posted
                          </a>
                        )}
                        {!p.posted_at && p.scheduled_publish_at && (
                          <span
                            className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-300 px-2 py-0.5 rounded-full shrink-0"
                            title={`Will publish via our cron at ${new Date(p.scheduled_publish_at).toLocaleString('en-AU')}`}
                          >
                            <Clock size={11} strokeWidth={2.5} className="inline mr-0.5 align-[-1px]" /> Scheduled
                          </span>
                        )}
                        {!p.posted_at && !p.scheduled_publish_at && p.scheduled && (
                          <span
                            className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-300 px-2 py-0.5 rounded-full shrink-0"
                            title="Marked as scheduled manually (you scheduled this in IG / Meta Business Suite / etc)"
                          >
                            <Clock size={11} strokeWidth={2.5} className="inline mr-0.5 align-[-1px]" /> Scheduled
                          </span>
                        )}
                        {!p.posted_at && p.publish_error && (
                          <span
                            className="text-xs font-semibold text-red-700 bg-red-50 border border-red-300 px-2 py-0.5 rounded-full shrink-0"
                            title={p.publish_error}
                          >
                            ✗ Publish error
                          </span>
                        )}
                      </div>
                      {p.caption && <p className="text-xs text-stone-600 mt-1 line-clamp-2">{p.caption}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleScheduled(p)} className={`text-xs transition-colors px-2 py-1 rounded border font-medium ${p.scheduled ? 'bg-blue-500/15 text-blue-500 border-blue-300' : 'text-stone-500 border-stone-300 hover:text-blue-500 hover:border-blue-200'}`} title={p.scheduled ? 'Mark as unscheduled' : 'Mark as scheduled'}>
                        {p.scheduled ? '✓ Scheduled' : 'Schedule'}
                      </button>
                      <button onClick={() => startEdit(p)} className="text-xs text-stone-500 hover:text-stone-700 transition-colors px-2 py-1">Edit</button>
                      <button onClick={() => deletePost(p.id)} className="text-xs text-stone-500 hover:text-red-700 transition-colors px-2 py-1">Delete</button>
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
        // Stories render at 1080×1920 (9:16). Feed posts/carousels at 1080×1350 (4:5).
        // Match the preview frame to the source aspect so heads + text don't get cropped.
        const isStory = activePost.type === 'story'
        const previewAspect = isStory ? '9/16' : '4/5'
        return (
          <Card>
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded border" style={{ color: s.color, background: s.bg, borderColor: s.border }}>{s.label}</span>
                  <span className={`text-xs font-medium ${ph.color}`}>{ph.label}</span>
                  {(() => { const pl = PLATFORM_STYLES[(activePost.platform ?? 'instagram') as Platform]; return <span className={`text-xs px-2 py-0.5 rounded border font-medium ${pl.badge}`}>{pl.label}</span> })()}
                  <span className="text-xs text-stone-400">{dateLabel}</span>
                  <span className="text-xs font-semibold text-blue-500 bg-blue-50 border border-blue-500/20 px-2 py-0.5 rounded-full">{activePost.time ?? POST_TYPE_DEFAULT_TIMES[activePost.type]}</span>
                </div>
                <p className="text-base font-semibold text-[#1A1A1A]">{activePost.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <PostToIgButton post={activePost} onPublished={(updated) => {
                  setPosts(ps => sortPosts(ps.map(p => p.id === updated.id ? { ...p, ...updated } : p)))
                  setActivePost({ ...activePost, ...updated })
                }} />
                <button onClick={() => { setActivePost(null); startEdit(activePost) }} className="text-xs text-stone-500 hover:text-stone-700 transition-colors">Edit</button>
                <button onClick={() => setActivePost(null)} className="text-stone-500 hover:text-[#1A1A1A] transition-colors text-xl leading-none">×</button>
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
                  {graphicUrls.map((url: string, i: number) => {
                    const dlName = `${activePost.title.replace(/\s+/g, '-').toLowerCase()}-slide-${i + 1}`
                    const dlUrl = `${url}${url.includes('?') ? '&' : '?'}download=1&filename=${encodeURIComponent(dlName)}`
                    return (
                    <div key={i}>
                      <a
                        href={dlUrl}
                        download={`${dlName}.png`}
                        className="flex items-center justify-center gap-1.5 w-full mb-1.5 px-3 py-2 bg-stone-200 hover:bg-stone-300 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 transition-colors"
                      >
                        ↓ Slide {i + 1}
                      </a>
                      <div className="rounded-xl overflow-hidden bg-stone-50 border border-stone-200" style={{ aspectRatio: '4/5', position: 'relative', minHeight: '225px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Slide ${i + 1}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </div>
                  )})}
                </div>
              ) : (
                <>
                {isSingleGraphic && (() => {
                  const dlName = activePost.title.replace(/\s+/g, '-').toLowerCase()
                  const dlUrl = `${graphicUrls[0]}${graphicUrls[0].includes('?') ? '&' : '?'}download=1&filename=${encodeURIComponent(dlName)}`
                  return (
                    <a
                      href={dlUrl}
                      download={`${dlName}.png`}
                      className="flex items-center justify-center gap-1.5 w-full mb-2 px-3 py-2 bg-stone-200 hover:bg-stone-300 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 transition-colors"
                    >
                      ↓ Download graphic
                    </a>
                  )
                })()}
                <div className="rounded-xl overflow-hidden bg-stone-50 border border-stone-200" style={{ aspectRatio: previewAspect, position: 'relative', minHeight: '350px' }}>
                  {isSingleGraphic ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={graphicUrls[0]} alt={activePost.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                      {activePost.graphic ? (
                        <>
                          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Graphic Brief</p>
                          <p className="text-sm text-stone-600 leading-relaxed">{activePost.graphic}</p>
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
                        <p className="text-xs font-semibold text-[#1A1A1A]">{bd.handle}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-stone-400">{bd.label}</p>
                          {isAicmPost(activePost) && <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${AICM_BADGE_CLASS}`}>AICM</span>}
                          {isCollabPost(activePost) && <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded border font-medium ${COLLAB_BADGE_CLASS}`}><Handshake size={10} strokeWidth={2.5} /> Collab</span>}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {activePost.caption ? (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Caption</p>
                      <button
                        onClick={() => {
                          const full = [activePost.caption, activePost.notes].filter(Boolean).join('\n\n')
                          navigator.clipboard.writeText(full)
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 transition-colors font-medium"
                      >Copy all</button>
                    </div>
                    <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-line">{activePost.caption}</p>
                    {activePost.notes && (
                      <p className="text-xs text-stone-500 mt-3 pt-3 border-t border-stone-200 leading-relaxed">{activePost.notes}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-stone-50 border border-stone-300/40 border-dashed rounded-xl p-5 text-center">
                    <p className="text-sm text-stone-400 mb-1">No caption written yet.</p>
                    <button
                      onClick={() => { setActivePost(null); startEdit(activePost) }}
                      className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
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
          <p className="text-sm font-semibold text-[#1A1A1A] mb-4">{editId ? 'Edit Post' : 'Schedule Post'}</p>
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1">Brand</label>
                <select value={form.brand ?? 'body_recode'} onChange={e => setForm(f => syncFooter(f, { brand: e.target.value as Brand }))}
                  className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500">
                  {(Object.entries(BRAND_STYLES) as [Brand, typeof BRAND_STYLES[Brand]][]).map(([k, s]) => (
                    <option key={k} value={k}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Platform</label>
                <select value={form.platform ?? 'instagram'} onChange={e => setForm(f => syncFooter(f, { platform: e.target.value as Platform }))}
                  className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500">
                  {(Object.entries(PLATFORM_STYLES) as [Platform, typeof PLATFORM_STYLES[Platform]][]).map(([k, s]) => (
                    <option key={k} value={k}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Date</label>
                <input type="date" value={form.date ?? ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Post Time</label>
                <input type="time" value={form.time ?? '07:00'} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Content Type</label>
                <select value={form.type ?? 'authority'} onChange={e => {
                  const t = e.target.value as PostType
                  setForm(f => ({ ...f, type: t, time: f.time && f.time !== POST_TYPE_DEFAULT_TIMES[f.type as PostType] ? f.time : POST_TYPE_DEFAULT_TIMES[t] }))
                }}
                  className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500">
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
                  className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500">
                  {(Object.entries(PHASE_STYLES) as [CampaignPhase, typeof PHASE_STYLES[CampaignPhase]][]).map(([k, s]) => (
                    <option key={k} value={k}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Post Title</label>
                <input type="text" value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Three body states carousel"
                  className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Graphic Brief</label>
              <input type="text" value={form.graphic ?? ''} onChange={e => setForm(f => ({ ...f, graphic: e.target.value }))}
                placeholder="e.g. Insight card. Label: The Real Problem. Text: Your body isn't broken."
                className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Caption</label>
              <textarea rows={6} value={form.caption ?? ''} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
                placeholder="Write the full post caption here..."
                className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Hashtags (optional)</label>
              <input type="text" value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="#bodyrecode #bodystate ..."
                className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={savePost} disabled={!form.date || !form.title || saving}
                className="bg-blue-500 hover:bg-blue-500 disabled:opacity-50 text-stone-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                {saving ? 'Saving...' : editId ? 'Save Changes' : 'Schedule Post'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm({ type: 'authority', phase: 'prelaunch', brand: 'body_recode', platform: 'instagram', time: POST_TYPE_DEFAULT_TIMES['authority'] }) }}
                className="text-xs text-stone-500 hover:text-stone-700 transition-colors">
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
    <div className={`bg-stone-100 border border-stone-200 rounded-xl p-5 ${className}`}>
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
  return <p className="text-sm font-semibold text-[#1A1A1A] mb-1">{children}</p>
}

function Body({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-stone-600 leading-relaxed${className ? ` ${className}` : ''}`}>{children}</p>
}

function Tag({ children, color = 'teal' }: { children: React.ReactNode; color?: 'teal' | 'amber' | 'red' | 'violet' | 'stone' }) {
  const colors = {
    teal: 'bg-blue-50 text-blue-500 border-blue-500/20',
    amber: 'bg-amber-50 text-amber-700 border-amber-500/20',
    red: 'bg-red-50 text-red-700 border-red-500/20',
    violet: 'bg-violet-500/10 text-violet-700 border-violet-500/20',
    stone: 'bg-stone-200 text-stone-600 border-stone-300',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${colors[color]}`}>{children}</span>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
          <span className="text-blue-500 mt-0.5 shrink-0">-</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

// CopyButton - click-to-copy field for Meta Ads Manager paste workflow.
// Shows brief "Copied" confirmation, then reverts. Used by every metadata
// field in the Cold Ad Library so Kade can paste straight into Meta UI.
function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        void navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded transition-colors ${
        copied ? 'bg-blue-500 text-stone-50' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
      }`}
    >
      {copied ? 'Copied' : (label ?? 'Copy')}
    </button>
  )
}

// ROUND1_ADS - the current cold paid creative, generated from
// ~/Dropbox/01_BODY_RECODE/07_ADS/BR_FUNNELB_ROUND1_LAUNCH.md (v1.4) so the
// dashboard cannot drift from the launch pack. Copy is verbatim from that doc,
// unwrapped from its markdown line breaks so the copy buttons paste clean.
// Images are the challenge-CTA creatives, committed to /public/creative/round1/.
// NOT /public/ads/ - a '/ads/' path segment is a standard ad-blocker filter
// rule (EasyList), so creatives served from there vanish for anyone running
// uBlock or similar. Renamed 2026-08-05.
//
// layer 'round1' - the four ads that go up first, inside one broad ad set
// layer 'layer2' - Ads 4, 8, 10, rewritten 5 Aug, held until Round 1 reads out
//
// The no-banner test carries Ad 6's exact fields on purpose: that test is void
// if any field other than the creative differs.
type Round1Ad = {
  slug: string; short: string; layer: 'round1' | 'layer2' | 'deferred' | 'variety'; audience: string
  img: string; headline: string; primaryText: string; description: string
}
// Bump this ONE constant when the launch pack is republished. It drives the card
// title, both download links and the 'verbatim from' line, which had already
// drifted apart once (card said v1.6 while the body text still said v1.4).
const LAUNCH_PACK_VERSION = 'v1.9'

const ROUND1_ADS: Round1Ad[] = [
  { slug: 'ad-5-four-patterns', short: 'Four patterns', layer: 'round1', audience: 'Either sex',
    img: '/creative/round1/ad5-creative-breaking-news.png',
    headline: `Twenty years of coaching, and effort was almost never the thing separating them`,
    primaryText: `Twenty years of coaching people, and the same thing kept showing up.

The ones whose body composition changed and the ones whose did not were not separated by effort. Both worked hard. Both were consistent. Plenty of the people who got nowhere were working harder than the people who got somewhere.

What separated them was whether the body was in a state that could use the effort going in.

Put a hard block of training into a body that is protecting itself and it does not come back as muscle and it does not come off as fat. It comes back as fatigue.

There are four patterns that do this, and each one holds fat in a different place.

Stress-Stored holds it on the front of the midsection while the arms and legs stay lean. Cortisol.

Insulin-Drift holds it across the mid-back, lower back and flanks, and deep in the abdomen, while the front stays relatively spared. Insulin.

Estrogen-Shift holds it at the hips, glutes and outer thighs, then starts moving it toward the middle. Oestrogen.

Androgen-Decline is not a location at all. Central fat rises while muscle, tone and drive fall together. Testosterone.

One of those four is running yours. Correct the wrong one and almost nothing moves, which is why so many plans half work.

Fourteen days is enough to find out which one it is.`,
    description: `Free 14 days. One of the four is running yours.` },
  { slug: 'ad-6-insulin-drift', short: 'Insulin drift', layer: 'round1', audience: 'Either sex, male-leaning',
    img: '/creative/round1/ad6-creative-B-headline-overlay.png',
    headline: `The afternoon crash, the evening cravings, and the fat that will not shift are one signal`,
    primaryText: `Not three problems. One.

And it is not about how many carbs are in the diet.

When insulin stays elevated longer after meals than it should, fat burning stays switched off and cravings get louder.

The tells line up in a specific order. Energy dips hard between 2 and 4pm. Heavy and foggy for about an hour after eating. Cravings hit hardest after dinner. Storage sits around the back and sides rather than the front.

Most common in people whose output has changed but whose fuelling has not.

It is not pre-diabetes. That is a diagnosis, this is a state.

It is not too many carbs. It is when they are eaten and what they sit next to.

It is not age. Insulin sensitivity is one of the most responsive systems in the body.

Sensitivity is a state, and states respond to inputs.`,
    description: `Free 14 days. The crash names the driver.` },
  { slug: 'ad-2-fat-map', short: 'Fat Map reveal', layer: 'round1', audience: 'Either sex',
    img: '/creative/round1/ad2-fatmap-F-MZ1-revealed.png',
    headline: `Where the fat sits tells you which hormone is holding it there`,
    primaryText: `Front of the middle. Back and sides. Hips and thighs.

Three places the fat sits, three completely different drivers.

Front of the midsection, while the arms and legs stay lean. That is cortisol. A stress load the system has not resolved, so it keeps a reserve close to the organs.

Mid-back, lower back and the flanks, with the front spared. That is insulin. Blood sugar handling has drifted, so fat burning stays switched off longer after meals than it should.

Hips, glutes and outer thighs, later moving toward the middle. That is oestrogen. A conservation state, common through perimenopause.

And one that is not a place at all: central fat rising while muscle, tone and drive fall.

Four drivers. Four different corrections. Run the cortisol fix on an insulin pattern and almost nothing happens, which is why so many plans half-work.

Where it sits narrows it. What comes with it decides.`,
    description: `Free 14 days. Which of the four is running it.` },
  { slug: 'ad-3-perimenopause', short: 'Perimenopause', layer: 'round1', audience: 'Female only',
    img: '/creative/round1/ad3-v2-squat-creative-B-headline-overlay.png',
    headline: `Hips and thighs will not shift, and eating less is making it worse`,
    primaryText: `When storage settles in the hips, glutes and outer thighs, restriction makes it worse.

Not slower. Worse.

This is an oestrogen-driven conservation state. The body holds on as a protective response to hormone signalling that is recalibrating.

It shows up most in women moving toward or through perimenopause, after coming off hormonal contraception, or after a long run of undereating.

Standard advice is eat less, train more. This pattern reads scarcity and conserves harder. So the harder the restriction, the tighter the hold, and the more it feels like a personal failure when it is a predictable response.

What it answers to instead: consistent fuelling, protected sleep, regular meal timing.

The tells. Storage settles low and outer, and later begins moving toward the middle. Bloating and water shift unpredictably across the month. Sleep gets lighter.

Menopause is a transition. This is a pattern inside it, and patterns respond to inputs.`,
    description: `Free 14 days. Why less food tightened the hold.` },
  { slug: 'ad-6-nobanner', short: 'Ad 6, no offer banner', layer: 'deferred', audience: 'Banner test',
    img: '/creative/round1/ad6-TEST-nobanner.png',
    headline: `The afternoon crash, the evening cravings, and the fat that will not shift are one signal`,
    primaryText: `Not three problems. One.

And it is not about how many carbs are in the diet.

When insulin stays elevated longer after meals than it should, fat burning stays switched off and cravings get louder.

The tells line up in a specific order. Energy dips hard between 2 and 4pm. Heavy and foggy for about an hour after eating. Cravings hit hardest after dinner. Storage sits around the back and sides rather than the front.

Most common in people whose output has changed but whose fuelling has not.

It is not pre-diabetes. That is a diagnosis, this is a state.

It is not too many carbs. It is when they are eaten and what they sit next to.

It is not age. Insulin sensitivity is one of the most responsive systems in the body.

Sensitivity is a state, and states respond to inputs.`,
    description: `Free 14 days. The crash names the driver.` },
  { slug: 'ad-4-day-7', short: 'The day 7 check-in', layer: 'layer2', audience: 'Either sex',
    img: '/creative/round1/ad4-creative-B-headline-overlay.png',
    headline: `Six of the eight markers moved in a week, and the two that did not are the read`,
    primaryText: `Fourteen days is not long enough to change how a body looks. It is long enough to find out why it is not changing.

Day 7 of the Challenge scores eight markers against where they sat on day one. Morning energy. Afternoon energy. Puffiness and bloating. Sleep. Cravings. Mental clarity. Mood. Digestion.

None of those are body composition. All of them decide it.

A body that is not sleeping, not clearing fluid and crashing at 3pm does not give up fat, whatever the training looks like. The markers move first. The shape follows.

Which is why the ones that improve are not the interesting part. The ones sitting flat are. Two markers refusing to move in a week is a pattern showing itself, and it points at which of the four drivers is holding the fat where it sits.

That is the point of the fortnight. Not a transformation. A read you can act on.`,
    description: `Free 14 days. The markers that refuse to move.` },
  { slug: 'ad-8-plan-down', short: 'The plan went down', layer: 'layer2', audience: 'Either sex',
    img: '/creative/round1/ad8-creative-B-headline-overlay.png',
    headline: `The check-in came back better, so the training went down, not up`,
    primaryText: `Most people read a good check-in as permission to push harder. It is usually the opposite.

If a body is holding fat while sleep is broken and energy is crashing, it is protecting. Adding a third or a fourth hard session to a protecting body does not change composition. It confirms the threat, and the body holds tighter.

The load has to drop far enough that adaptation switches back on. Then the training builds something. Then the composition moves.

This is the part that feels backwards. Fewer sessions, better result. It only makes sense once you accept the body is not being stubborn. It is responding exactly as it should to the signals it is being given.

The Challenge runs this over fourteen days. Intake on day 0, eight markers scored on day 7, the full pattern read on day 14.

Nothing to buy at the end of it. The read is the product.`,
    description: `Free 14 days. When less training moves more fat.` },
  { slug: 'ad-10-order', short: 'The order of operations', layer: 'layer2', audience: 'Either sex',
    img: '/creative/round1/ad10-creative-B-headline-overlay.png',
    headline: `Right actions, wrong order, and the body composition never moves`,
    primaryText: `Five days a week in the gym, food tracked, alcohol gone, and the shape of the body has not changed in a year.

That is not a discipline problem. The discipline is already proven. It is a sequencing problem.

Composition only changes when a body can afford to spend. A body in protection mode cannot. So the harder someone pushes against it the more it protects, and the exact effort that should be producing the result is what holds it in place.

The order that works is three steps.

One. Read the state, which is whether the body is currently able to change at all.

Two. Bring the foundation up. Sleep, energy and stress load, far enough that the body can act on what it is given.

Three. Correct the pattern. Where the fat sits and what comes with it names which of the four drivers is running it, and each one answers to a different correction.

Prescribing before reading is guessing, which is why so many plans half work.

The free fourteen days is step one and most of step two.`,
    description: `Free 14 days. The step almost everyone skips.` },
  { slug: 'ad-12-plate', short: 'Anatomical plate', layer: 'variety', audience: 'Composition in image',
    img: '/creative/formats/ad12-creative-anatomical-plate.png',
    headline: `Three of the four show up as a place on the body. The fourth does not.`,
    primaryText: `Fat does not settle at random. Where it sits narrows which driver is holding it.

Front of the midsection while the arms and legs stay lean. Cortisol.

Mid-back, lower back and the flanks, with the front spared. Insulin.

Hips, glutes and outer thighs, later moving central. Oestrogen.

And the fourth, which cannot be read from where it sits at all. It shows up as the middle filling while muscle, tone and drive fall together. That one is testosterone, and the giveaway is the muscle going rather than the fat arriving.

This is why two people carrying the same amount of fat need opposite corrections. Same effort, different target, completely different result.

Where it sits narrows it to one. What comes with it decides.`,
    description: `Free 14 days. Which plate is yours.` },
  { slug: 'ad-13-notes', short: 'Notes app', layer: 'variety', audience: 'Un-designed',
    img: '/creative/formats/ad13-creative-notes-app.png',
    headline: `The four patterns, written out in plain english`,
    primaryText: `Front of the middle, arms and legs still lean. That is cortisol. The body is holding a reserve close to the organs because the stress never resolved.

Mid-back, lower back, the flanks, front relatively spared. That is insulin. Fat burning stays switched off longer after meals than it should.

Hips, glutes, outer thighs, then it starts moving central. That is oestrogen. A conservation state, not a willpower failure.

No single place, the middle fills while muscle and drive drop together. That is testosterone. The giveaway is the muscle going, not the fat arriving.

The reason it matters: run the cortisol correction on an insulin pattern and almost nothing moves. Same effort, wrong target. That is most of why plans half work.

Fourteen days is enough to find out which one you are running.`,
    description: `Free 14 days. Which one are you running.` },
  { slug: 'ad-14-plain', short: 'Plain type', layer: 'variety', audience: 'No photo, no blue',
    img: '/creative/formats/ad14-creative-plain-type.png',
    headline: `It was never discipline. It was the target.`,
    primaryText: `Five days a week, food handled, alcohol gone, and the body has not changed shape in a year. That is not a discipline problem. The discipline is already proven.

Four different drivers hold fat in four different ways, and each answers to a different correction.

Correct the wrong one and the effort still goes in. It just does not come back out as a change in composition. That is most of why plans half work, and why it feels so unfair when they do.

Cortisol holds it on the front of the middle while the limbs stay lean.

Insulin holds it across the mid-back, lower back and flanks, sparing the front.

Oestrogen holds it at the hips and thighs, then starts moving it central.

Testosterone is not a place at all. The middle fills while muscle and drive fall together.

Fourteen days is enough to find out which one is yours. Nothing to buy at the end of it.`,
    description: `Free 14 days. Same effort, right target.` },
]

// ARCHIVED 2026-08-05. COLD_ADS - the 9-variant cold paid Meta ad library. Source of truth for
// the dashboard reference + the per-ad metadata Kade pastes into Meta Ads
// Manager. Captions follow the Amanda-audited Cold Ad Copy Doctrine:
// "Decode" terminology, audience-named hooks (no personal-attribute claims),
// 2-sentence rhythm, locked CTA. Images are rendered from /public/creative/
// (committed). Hooks here mirror the on-image hook copy.
type ColdAd = {
  slug: string; archetype: string; format: 'Statement' | 'Photo'; photo: string | null
  hook: string; primaryText: string; headline: string; description: string
}
const COLD_ADS: ColdAd[] = [
  // 01 Stressed Executive Woman
  { slug: 'ad-001-stressed-exec-discipline', archetype: 'Stressed Executive Woman', format: 'Statement', photo: null,
    hook: "Training hard. Eating clean. Body won't shift?",
    primaryText: "When effort stops moving the needle, the answer isn't more effort. There's a specific pattern your body has settled into - and it can be decoded in 14 days. Free.",
    headline: "Free 14-Day Body Decode Challenge",
    description: "Find your pattern. No payment." },
  { slug: 'ad-002-stressed-exec-doing-everything-right', archetype: 'Stressed Executive Woman', format: 'Photo', photo: 'kade-10',
    hook: "Doing everything right. Nothing is working.",
    primaryText: "Most high-performers who hit this wall assume the answer is to push harder. It's almost never the answer. There's a specific pattern in how your body's responding - decode it in 14 days, free.",
    headline: "The pattern is the problem, not your effort.",
    description: "Free 14-day diagnostic." },
  { slug: 'ad-003-stressed-exec-cortisol-storage', archetype: 'Stressed Executive Woman', format: 'Statement', photo: null,
    hook: "Stressed and over 40? Your body's rules just changed.",
    primaryText: "At 40+, ongoing stress rewires how your body stores fat, recovers, and responds to training. The old rules stop working. There's a specific pattern underneath - decode yours in 14 days, free.",
    headline: "Stress changes the rules. Decode yours.",
    description: "Free 14-day Challenge." },
  // 02 Perimenopausal Performer
  { slug: 'ad-004-peri-same-training', archetype: 'Perimenopausal Performer', format: 'Statement', photo: null,
    hook: "Perimenopause changed the rules. Most plans didn't.",
    primaryText: "Most training and nutrition plans were written for a hormonal environment that perimenopause has quietly changed. That's why the same effort stopped producing the same results. There's a specific pattern that works now - decode yours in 14 days, free.",
    headline: "Built for the body you have now.",
    description: "Free 14-day diagnostic." },
  { slug: 'ad-005-peri-fasted-cardio', archetype: 'Perimenopausal Performer', format: 'Statement', photo: null,
    hook: "Fasted cardio used to work. Now it makes you tired.",
    primaryText: "Fasted cardio at 30 and fasted cardio at 45 are not the same intervention. The same input lands on a different hormonal environment - and that's why it stopped working. Decode the new rules in 14 days, free.",
    headline: "Same effort. Different body. Different rules.",
    description: "Free 14-day Body Decode." },
  { slug: 'ad-006-peri-bloods-fine', archetype: 'Perimenopausal Performer', format: 'Photo', photo: 'kade-11',
    hook: "Bloods came back fine. You don't feel fine.",
    primaryText: "Standard bloodwork is built to catch disease, not to read the pattern your body is operating in day to day. When everything reads 'normal' but nothing feels normal, there's usually a specific pattern underneath. Decode yours in 14 days, free.",
    headline: "Normal bloods. Not-normal body.",
    description: "Free 14-day pattern diagnostic." },
  // 03 Slipping High Performer
  { slug: 'ad-007-slipping-trt', archetype: 'Slipping High Performer', format: 'Statement', photo: null,
    hook: "If recovery has changed, your plan should too.",
    primaryText: "When recovery time doubles and capacity slips despite doing the same work, the body is signaling a specific pattern. Most men keep training to the old standard and wonder why the wheels are coming off. Decode yours in 14 days, free.",
    headline: "Recovery changed. Your plan should too.",
    description: "Free 14-day diagnostic for men 40+." },
  { slug: 'ad-008-slipping-capacity-45', archetype: 'Slipping High Performer', format: 'Statement', photo: null,
    hook: "Over 40 and training harder for less?",
    primaryText: "At 40+, the gap between effort in and result out widens for a reason - and it's not just ageing. There's a specific pattern in how the body is responding to load, recovery, and fuel. Decode yours in 14 days, free.",
    headline: "More effort, less result. Decode why.",
    description: "Free 14-day Challenge." },
  { slug: 'ad-009-slipping-every-protocol', archetype: 'Slipping High Performer', format: 'Photo', photo: 'kade-12',
    hook: "If every protocol stalls, look at the starting point.",
    primaryText: "When every protocol - cut, fast, TRT, peptide - produces the same diminishing returns, the issue isn't the protocol. The issue is the body it's being prescribed to. Read the starting point first. Decode your pattern in 14 days, free.",
    headline: "Read the starting point before the next protocol.",
    description: "Free 14-day diagnostic." },
]

function destinationUrl(slug: string) {
  return `${brand().marketingDomain}/challenge?utm_source=meta&utm_campaign=funnelb_cold&utm_content=${slug}`
}

// PostToIgButton - immediate publish OR schedule for future. Calls
// /api/ig/publish, which validates the post, calls Meta Graph API, and
// persists the resulting IG post id + URL back to calendar_posts.
//
// For posts where we can't auto-publish (personal brand → different IG
// account, stories → API strips link stickers, LinkedIn → different
// platform entirely), renders a "Mark as scheduled" toggle that just
// flips the manual `scheduled` boolean so the day-view badge surfaces.
function PostToIgButton({ post, onPublished }: { post: ScheduledPost; onPublished: (updated: Partial<ScheduledPost> & { id: string }) => void }) {
  const [status, setStatus] = useState<'idle' | 'publishing' | 'scheduling' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const platform = post.platform ?? 'instagram'
  const brand = post.brand ?? 'body_recode'
  const canAutoPublish = platform === 'instagram' && post.type !== 'story' && brand === 'body_recode'

  // ── Manual-schedule mode (for posts we can't auto-publish) ──
  if (!canAutoPublish) {
    const isMarked = !!post.scheduled
    async function toggleMarked() {
      const next = !isMarked
      try {
        const res = await fetch('/api/calendar-posts/toggle-scheduled', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: post.id, scheduled: next }),
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          setErrorMsg(d.error ?? 'Toggle failed.')
          return
        }
        onPublished({ id: post.id, scheduled: next })
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'Network error.')
      }
    }
    if (errorMsg) return <span className="text-xs text-red-600 font-semibold" title={errorMsg}>✗ {errorMsg.slice(0, 40)}</span>
    return (
      <button
        onClick={toggleMarked}
        title={isMarked ? 'Mark this post as not yet scheduled' : 'Mark this post as scheduled (you scheduled it manually in IG / Meta Business Suite / etc)'}
        className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${isMarked ? 'bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100' : 'bg-stone-200 hover:bg-stone-300 text-stone-700'}`}
      >
        {isMarked ? <><Clock size={11} strokeWidth={2.5} className="inline mr-0.5 align-[-1px]" /> Marked scheduled</> : 'Mark as scheduled'}
      </button>
    )
  }

  // Already posted: show URL link
  if (post.posted_at && post.ig_post_url) {
    return (
      <a href={post.ig_post_url} target="_blank" rel="noopener noreferrer"
        className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors flex items-center gap-1">
        ✓ Posted
      </a>
    )
  }
  if (post.posted_at) {
    return <span className="text-xs font-semibold text-green-600">✓ Posted</span>
  }
  if (post.scheduled_publish_at) {
    const when = new Date(post.scheduled_publish_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    return <span className="text-xs font-semibold text-blue-600"><Clock size={11} strokeWidth={2.5} className="inline mr-0.5 align-[-1px]" /> Scheduled {when}</span>
  }

  async function publish(schedule: boolean) {
    setStatus(schedule ? 'scheduling' : 'publishing')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/ig/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendar_post_id: post.id, schedule }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.message ?? data.error ?? 'Publish failed.')
        return
      }
      setStatus('done')
      // Optimistic update to parent
      onPublished({
        id: post.id,
        ig_container_id: data.containerId,
        ig_post_id: data.postId ?? null,
        ig_post_url: data.postUrl ?? null,
        posted_at: data.scheduled ? null : new Date().toISOString(),
        scheduled_publish_at: data.scheduled ? new Date((post.scheduled_publish_at ?? `${post.date}T${post.time ?? '09:00'}:00+10:00`)).toISOString() : null,
      })
    } catch (e) {
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message : 'Network error.')
    }
  }

  if (status === 'publishing') return <span className="text-xs font-semibold text-blue-600">Publishing...</span>
  if (status === 'scheduling') return <span className="text-xs font-semibold text-blue-600">Scheduling...</span>
  if (status === 'error') {
    return (
      <div className="flex flex-col gap-1 items-end">
        <span className="text-xs text-red-600 font-semibold max-w-xs text-right" title={errorMsg ?? ''}>✗ {errorMsg?.slice(0, 60)}{(errorMsg?.length ?? 0) > 60 ? '...' : ''}</span>
        <button onClick={() => publish(false)} className="text-xs text-stone-500 hover:text-stone-700 underline">retry</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => publish(false)}
        title="Publish to Instagram immediately"
        className="text-xs font-semibold px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
      >
        Post now
      </button>
      <button
        onClick={() => publish(true)}
        title="Hand the post to Meta with the scheduled date+time. Meta publishes it automatically. Requires ≥10min in the future."
        className="text-xs font-semibold px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded transition-colors"
      >
        Schedule
      </button>
    </div>
  )
}

function WaveStatusCard() {
  const [data, setData] = useState<{ current: { number: number; label: string; cap: number | null }; taken: number; remaining: number | null; isFull: boolean; isEvergreen: boolean; nextWave: { number: number; label: string } | null } | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/challenge/wave-status').then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])
  if (loading) return <Card><SectionLabel>Wave Status</SectionLabel><p className="text-sm text-stone-500">Loading...</p></Card>
  if (!data) return <Card><SectionLabel>Wave Status</SectionLabel><p className="text-sm text-stone-500">Could not load.</p></Card>
  if (data.isEvergreen) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <SectionLabel>Wave Status · Evergreen</SectionLabel>
        <p className="text-2xl font-bold text-[#1A1A1A] mt-1">Open enrolment</p>
        <p className="text-xs text-stone-600 mt-2 leading-relaxed">All capped waves complete. Doors stay open - no cap, no cohort, evergreen as locked in the original spec.</p>
      </Card>
    )
  }
  const cap = data.current.cap ?? 0
  const pct = cap > 0 ? Math.min(100, (data.taken / cap) * 100) : 0
  const accent = data.isFull ? 'border-red-500/40 bg-red-500/5' : pct > 70 ? 'border-amber-500/40 bg-amber-500/5' : 'border-blue-500/30 bg-blue-500/5'
  const dot = data.isFull ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-blue-500'
  return (
    <Card className={accent}>
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Wave {data.current.number} · {data.current.label}</SectionLabel>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          {data.isFull ? 'FULL' : 'Open'}
        </span>
      </div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-3xl font-bold text-[#1A1A1A]">{data.taken}<span className="text-base font-medium text-stone-500"> / {cap}</span></p>
        <p className="text-xs text-stone-500">{data.remaining} spots left</p>
      </div>
      <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${data.isFull ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
      </div>
      {data.isFull && data.nextWave && (
        <p className="text-xs text-stone-700 mt-3 leading-relaxed">
          <strong>Wave {data.current.number} is full.</strong> Set <code className="text-xs bg-stone-200 px-1.5 py-0.5 rounded">CHALLENGE_CURRENT_WAVE={data.nextWave.number}</code> in Vercel + redeploy to open <strong>{data.nextWave.label}</strong> ({data.nextWave.number === 4 ? 'evergreen' : `${CHALLENGE_WAVES_CLIENT.find(w => w.number === data.nextWave!.number)?.cap ?? '?'} spots`}). Then fire the wave-{data.nextWave.number} broadcast email via <code className="text-xs bg-stone-200 px-1.5 py-0.5 rounded">scripts/launch-day-waitlist-email.ts --live --wave={data.nextWave.number}</code>.
        </p>
      )}
      {!data.isFull && (
        <p className="text-xs text-stone-600 mt-3 leading-relaxed">Real urgency, not fake. When this fills, /challenge auto-shows the waitlist for {data.nextWave?.label ?? 'the next wave'}.</p>
      )}
    </Card>
  )
}

// Mirror of CHALLENGE_WAVES from src/lib/challenge-waves.ts (caps only, for UI hints)
const CHALLENGE_WAVES_CLIENT = [
  { number: 1, cap: 50 },
  { number: 2, cap: 25 },
  { number: 3, cap: 25 },
  { number: 4, cap: null },
]

// Round1AdCard - the current creative. Differs from the archived ColdAdCard in
// two ways that matter: the image is click-to-open at full size (Kade uploads
// these to Meta, so he needs the real file, not a cropped preview) and the
// primary text keeps its paragraph breaks, because the line breaks are part of
// the format rather than incidental.
function Round1AdCard({ ad }: { ad: Round1Ad }) {
  const url = `${brand().marketingDomain}/challenge?utm_source=meta&utm_campaign=funnelb_broad_r1&utm_content=${ad.slug}`
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
      <a href={ad.img} target="_blank" rel="noopener noreferrer" className="block bg-stone-100 border-b border-stone-200 hover:opacity-90 transition-opacity" style={{ aspectRatio: '4 / 5' }} title="Open full size">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ad.img} alt={ad.short} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      </a>
      <div className="p-3 space-y-2.5 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{ad.short}</span>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${ad.layer === 'round1' ? 'bg-blue-500/10 text-blue-700' : 'bg-stone-200 text-stone-700'}`}>{ad.layer === 'round1' ? 'Round 1' : ad.layer === 'deferred' ? 'Round 2' : ad.layer === 'variety' ? 'Format test' : 'Layer 2'}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-800">{ad.audience}</span>
        </div>

        <div className="pt-1.5 border-t border-stone-200 space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1"><p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Headline</p><CopyButton value={ad.headline} /></div>
            <p className="text-stone-900 font-semibold leading-snug">{ad.headline}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1"><p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Primary text</p><CopyButton value={ad.primaryText} /></div>
            <div className={`text-stone-700 leading-relaxed whitespace-pre-line ${open ? '' : 'line-clamp-4'}`}>{ad.primaryText}</div>
            <button onClick={() => setOpen(o => !o)} className="mt-1 text-[10px] font-bold uppercase tracking-widest text-blue-700 hover:text-blue-900">{open ? 'Show less' : 'Show all'}</button>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1"><p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Link description</p><CopyButton value={ad.description} /></div>
            <p className="text-stone-700">{ad.description}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1"><p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Destination URL</p><CopyButton value={url} /></div>
            <p className="text-stone-700 break-all text-[11px] leading-relaxed">{url}</p>
          </div>
          <div className="flex items-center justify-between"><p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">CTA button</p><span className="text-stone-700 font-semibold">Learn More</span></div>
        </div>
      </div>
    </div>
  )
}

function ColdAdCard({ ad }: { ad: ColdAd }) {
  const url = destinationUrl(ad.slug)
  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
      {/* Image preview */}
      <div className="bg-stone-100 border-b border-stone-200" style={{ aspectRatio: '4 / 5' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/creative/${ad.slug}.png`} alt={ad.hook} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      {/* Metadata */}
      <div className="p-3 space-y-2.5 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{ad.slug.split('-')[0].toUpperCase()} {ad.slug.split('-').slice(1).join(' ')}</span>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${ad.format === 'Photo' ? 'bg-blue-500/10 text-blue-700' : 'bg-stone-200 text-stone-700'}`}>{ad.format}</span>
          {ad.photo && <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-800">{ad.photo}</span>}
        </div>
        <p className="text-stone-900 font-semibold leading-snug">&ldquo;{ad.hook}&rdquo;</p>

        <div className="pt-1.5 border-t border-stone-200 space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1"><p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Primary text</p><CopyButton value={ad.primaryText} /></div>
            <p className="text-stone-700 leading-relaxed">{ad.primaryText}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1"><p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Headline</p><CopyButton value={ad.headline} /></div>
            <p className="text-stone-700">{ad.headline}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1"><p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Description</p><CopyButton value={ad.description} /></div>
            <p className="text-stone-700">{ad.description}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1"><p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Destination URL</p><CopyButton value={url} /></div>
            <p className="text-stone-700 break-all text-[11px] leading-relaxed">{url}</p>
          </div>
          <div className="flex items-center justify-between"><p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">CTA button</p><span className="text-stone-700 font-semibold">Learn More</span></div>
        </div>
      </div>
    </div>
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
          <div className="w-7 h-7 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center text-xs font-bold text-stone-600 shrink-0">{number}</div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">{title}</p>
            <div className="flex items-center gap-2 mt-1">
              <Tag color="stone">{day}</Tag>
              <Tag color="stone">{format}</Tag>
            </div>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-xs text-blue-500 hover:text-blue-700 transition-colors font-medium shrink-0">
          {expanded ? 'Hide' : 'View copy'}
        </button>
      </div>
      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">Graphic</p>
            <p className="text-xs text-stone-600">{graphic}</p>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2">Caption</p>
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{caption}</p>
          </div>
          {hashtags && (
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">Hashtags</p>
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
  not_started: { label: 'Not Started', color: 'text-stone-500',  bg: 'bg-stone-200/50',    border: 'border-stone-300' },
  drafted:     { label: 'Drafted',     color: 'text-amber-700',  bg: 'bg-amber-50',    border: 'border-amber-200' },
  scheduled:   { label: 'Scheduled',   color: 'text-blue-700',   bg: 'bg-blue-50',     border: 'border-blue-200' },
  published:   { label: 'Published',   color: 'text-blue-500',   bg: 'bg-blue-50',     border: 'border-blue-200' },
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
  const [profileSetup, setProfileSetup] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem('prelaunch_post_statuses')
      if (saved) setPostStatuses(JSON.parse(saved))
    } catch {}
    try {
      const saved = localStorage.getItem('profile_setup_checklist')
      if (saved) setProfileSetup(JSON.parse(saved))
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

  function toggleProfileItem(key: string, defaultDone: boolean) {
    setProfileSetup(prev => {
      const current = prev[key] ?? defaultDone
      const next = { ...prev, [key]: !current }
      try { localStorage.setItem('profile_setup_checklist', JSON.stringify(next)) } catch {}
      return next
    })
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Marketing Strategy</h1>
        <p className="text-stone-600 text-sm">The complete acquisition system for Body Recode Performance Coaching.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-stone-200 pb-0 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-stone-500 hover:text-stone-700'
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
            <p className="text-lg font-semibold text-[#1A1A1A] leading-snug mb-2">Interpretation before prescription.</p>
            <Body>Social media is not the funnel - it feeds the funnel through two doors by post type: doctrine/engagement posts → the scorecard (&quot;find your state&quot;); Challenge promo posts → the Challenge landing page. The scorecard reads their state and routes them - both doors converge on the Challenge.</Body>
          </Card>

          {/* Funnel flow — two paths off the scorecard */}
          <Card>
            <SectionLabel>The Funnel — two paths off the Scorecard</SectionLabel>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">Funnel B — primary (consumer)</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {['Content / Ad', 'Door 1 Scorecard  ·  Door 2 Challenge', '14-Day Challenge', 'Blueprint $97', 'Membership'].map((step, i, arr) => (
                    <div key={step} className="flex items-center gap-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700">{step}</div>
                      {i < arr.length - 1 && <span className="text-stone-400 text-xs">→</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Funnel A — higher-intent coaching path</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {['Scorecard', 'Performance Check-In', 'Zoom Consult', '1:1 Coaching $299–409/wk'].map((step, i, arr) => (
                    <div key={step} className="flex items-center gap-2">
                      <div className="bg-stone-200 border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-700">{step}</div>
                      {i < arr.length - 1 && <span className="text-stone-400 text-xs">→</span>}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-stone-500"><strong className="text-stone-700">Two doors, both routed by the scorecard:</strong> doctrine/engagement content → <strong>standalone scorecard</strong> (&quot;find your state&quot;, low friction) → routes most into the Challenge; Challenge promo content → <strong>Challenge landing page</strong> → sign-up → the scorecard runs as the Day-0 in-portal gate. Both feed Funnel B; coaching-ready leads flagged into Funnel A.</p>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card>
              <SectionLabel>Primary Channels</SectionLabel>
              <p className="text-[#1A1A1A] font-semibold">Instagram + LinkedIn</p>
              <p className="text-xs text-stone-500 mt-1">IG 5×/wk (scorecard funnel, Meta ads). LinkedIn 1-2×/wk (executive reframe, no ads).</p>
            </Card>
            <Card>
              <SectionLabel>Posting Frequency</SectionLabel>
              <p className="text-[#1A1A1A] font-semibold">5× IG + 1-2× LI</p>
              <p className="text-xs text-stone-500 mt-1">IG: 3 graphics/carousels + 2 reels. LinkedIn: short essays Tue/Thu morning.</p>
            </Card>
            <Card>
              <SectionLabel>Ad Budget</SectionLabel>
              <p className="text-[#1A1A1A] font-semibold">$25 → $75/day AUD</p>
              <p className="text-xs text-stone-500 mt-1">Meta only (Option D ramp: $25/day wk 1-2, then $75/day). LinkedIn stays organic.</p>
            </Card>
          </div>

          <Card>
            <SectionLabel>Revenue Sequence</SectionLabel>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {[
                  { label: 'Front door', value: 'Scorecard', note: 'Free (both funnels)', color: 'text-stone-700' },
                  { label: 'Funnel B (primary)', value: 'Challenge → Blueprint', note: 'Free → $97 → Membership', color: 'text-blue-500' },
                  { label: 'Funnel A (coaching)', value: '$297 → $299–409/wk', note: 'Zoom → 1:1', color: 'text-blue-500' },
                  { label: 'A upsell', value: '$37 Report', note: 'On the coaching path', color: 'text-amber-700' },
                  { label: 'A downsell', value: '$97 Self-guided', note: 'Zoom decline (≠ Blueprint)', color: 'text-violet-700' },
                ].map(item => (
                  <div key={item.label} className="bg-stone-200/50 border border-stone-300 rounded-lg px-3 py-2.5 text-center">
                    <p className="text-xs text-stone-500 mb-1">{item.label}</p>
                    <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{item.note}</p>
                  </div>
                ))}
              </div>
              <div className="bg-stone-200/30 border border-stone-300/50 rounded-lg px-4 py-3">
                <p className="text-xs font-bold text-stone-600 uppercase tracking-widest mb-2">LTV Optimisation - 2x to 3x Upgrade</p>
                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-stone-600 text-xs font-semibold mb-1">When</p>
                    <p className="text-stone-700 text-xs">Week 8+ on 2x package. Client recovering well, consistently completing sessions, body state progressing.</p>
                  </div>
                  <div>
                    <p className="text-stone-600 text-xs font-semibold mb-1">The offer</p>
                    <p className="text-stone-700 text-xs">Move from 2 to 3 sessions per week. $299 → $409/week. Same check-ins, same interpretation. More training contact, faster compounding.</p>
                  </div>
                  <div>
                    <p className="text-stone-600 text-xs font-semibold mb-1">How</p>
                    <p className="text-stone-700 text-xs">Use the Upgrade Companion (linked from client profile). Raise it in a regular session. Data-led, not sales-led.</p>
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
            <p className="text-xs text-stone-700 mt-3"><strong className="text-stone-900">Audience reality:</strong> 100% of paying clients classify as Remediation / Depleted by CFFS. Strategy is calibrated to 4 Depleted-leaning archetypes - see <strong className="text-stone-900">Positioning tab</strong>.</p>
          </Card>

          <Card>
            <SectionLabel>What to Ignore Right Now</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {['TikTok', 'YouTube', 'Twitter / X', 'Podcasts', 'Email newsletters'].map(p => (
                <span key={p} className="text-xs text-stone-400 bg-stone-200/50 border border-stone-200 px-2.5 py-1 rounded-full line-through">{p}</span>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-3">Two channels done well outperform five done badly. Lock Instagram + LinkedIn + Meta ads first.</p>
          </Card>
        </div>
      )}

      {/* ── POSITIONING ── */}
      {tab === 'positioning' && (
        <div className="space-y-4">
          <Card className="border-amber-500/30 bg-amber-500/5">
            <SectionLabel>Audience Reality</SectionLabel>
            <p className="text-sm text-stone-800 leading-relaxed mb-3"><strong className="text-amber-700">100% of paying clients (as of May 2026) classify as Remediation / Depleted by CFFS.</strong> Validated via the full client list (Razia, Kim, Michael, Luke, Amanda, Ruby-Cate, Samantha, Brett, Greg, +). Strategy is calibrated to that reality: 4 validated archetypes, all Depleted-leaning, in observed prevalence order.</p>
            <p className="text-sm text-stone-700 leading-relaxed">Full persona doc: <code className="text-stone-700 text-xs bg-stone-200 px-1 rounded">~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/AUDIENCE-ARCHETYPES-V1.md</code></p>
          </Card>

          <Card className="border-red-500/30 bg-red-500/5">
            <SectionLabel>The Scorecard Underestimates Depletion</SectionLabel>
            <p className="text-sm text-stone-800 leading-relaxed mb-2"><strong className="text-red-700">High performers self-report better than they actually are.</strong> The 5-question scorecard is a coarse signal. The 200-question intake (post-purchase) is the real read.</p>
            <p className="text-sm text-stone-800 leading-relaxed mb-3"><strong className="text-stone-900">Example:</strong> Michael scored 12 (Ready State) on the scorecard, then classified as Remediation / Depleted by CFFS once he became a client. Same pattern across the client base - discipline hides depletion in self-reporting.</p>
            <p className="text-sm text-stone-800 leading-relaxed"><strong className="text-stone-900">Implication for marketing:</strong> hooks must be sharp enough to catch high performers who would score themselves Ready on a 5-question quiz but are clinically Depleted. Don\'t soft-pedal the language because the audience self-image is "I\'m doing fine, just stuck."</p>
          </Card>

          <Card>
            <SectionLabel>The 4 Validated Archetypes</SectionLabel>
            <div className="space-y-3 mt-2">
              {[
                {
                  num: '01',
                  badge: 'DOMINANT',
                  title: 'The Stressed Executive Woman',
                  pattern: 'Stress-Stored (universal)',
                  color: 'teal' as const,
                  who: '35-48. Corporate / finance / law / consulting / healthcare / govt. Brisbane CBD or inner suburbs. Often kids. $100K-$180K+.',
                  presenting: 'Abdominal fat won\'t budge. Wired-and-tired. 3pm crash. Falls asleep hard, wakes at 3am. Morning puffiness.',
                  selfStory: '"I just need to be more disciplined." "I used to be able to do this."',
                  channel: 'IG (lunch) + LinkedIn (morning)',
                },
                {
                  num: '02',
                  badge: 'STRONG',
                  title: 'The Perimenopausal Performer',
                  pattern: 'Estrogen-Shift (female)',
                  color: 'violet' as const,
                  who: '40-50. Was lean in her 30s. Career professional, mother of teens. Brisbane suburban professional.',
                  presenting: '5-10kg gained over 2-3 years. Storage shifted to hips/thighs + bra-line. Cycle irregular. Used to respond to training, no longer does.',
                  selfStory: '"It\'s just menopause." "My GP said my bloods are fine." "Maybe HRT?"',
                  channel: 'IG (evening) primary',
                },
                {
                  num: '03',
                  badge: 'PRESENT',
                  title: 'The Postnatal Athlete',
                  pattern: 'Stress-Stored / Estrogen-Shift hybrid',
                  color: 'amber' as const,
                  who: '32-42. Had kids 2-7 years ago. Was athletic/lean pre-kids. Returned to demanding career fast. Underslept for years.',
                  presenting: 'Never got back to pre-baby baseline. Carries 3-7kg she can\'t lose. Recovery broken. Cycle irregular post-kids.',
                  selfStory: '"My body changed after kids." "I should be able to do this, I used to be a runner / netballer."',
                  channel: 'IG (evening / naptime)',
                },
                {
                  num: '04',
                  badge: 'PRESENT',
                  title: 'The Slipping High Performer',
                  pattern: 'Androgen-Decline + Stress-Stored (male)',
                  color: 'orange' as const,
                  who: '42-55. Male executive / partner-track lawyer / surgeon / consultant. Brisbane or interstate. Travels a lot.',
                  presenting: 'Capacity slipping over 3-5 years. Less drive, less recovery, less sharpness. Sex drive down. Performance is the flag, not weight.',
                  selfStory: '"I\'m just getting older." "GP said my bloods are normal." "Maybe TRT."',
                  channel: 'LinkedIn (weekday morning) primary',
                },
              ].map(a => {
                const colorMap = {
                  teal:   { border: 'border-teal-500/30',   bg: 'bg-teal-500/5',   accent: 'text-teal-700',   badgeBg: 'bg-teal-500/15 border-teal-500/40' },
                  violet: { border: 'border-violet-500/30', bg: 'bg-violet-500/5', accent: 'text-violet-700', badgeBg: 'bg-violet-500/15 border-violet-500/40' },
                  amber:  { border: 'border-amber-500/30',  bg: 'bg-amber-500/5',  accent: 'text-amber-700',  badgeBg: 'bg-amber-500/15 border-amber-500/40' },
                  orange: { border: 'border-orange-500/30', bg: 'bg-orange-500/5', accent: 'text-orange-700', badgeBg: 'bg-orange-500/15 border-orange-500/40' },
                }[a.color]
                return (
                  <div key={a.num} className={`p-4 rounded-lg border ${colorMap.border} ${colorMap.bg}`}>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`text-lg font-bold font-mono ${colorMap.accent} opacity-70`}>{a.num}</span>
                      <p className={`text-sm font-semibold ${colorMap.accent}`}>{a.title}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded-full ${colorMap.accent} ${colorMap.badgeBg}`}>{a.badge}</span>
                      <span className="text-[11px] text-stone-600 italic">{a.pattern}</span>
                    </div>
                    <div className="space-y-1.5 text-[13px]">
                      <p><span className="text-stone-900 font-bold uppercase tracking-widest text-[11px]">Who: </span><span className="text-stone-800">{a.who}</span></p>
                      <p><span className="text-stone-900 font-bold uppercase tracking-widest text-[11px]">Presenting: </span><span className="text-stone-800">{a.presenting}</span></p>
                      <p><span className="text-stone-900 font-bold uppercase tracking-widest text-[11px]">Self-story: </span><span className="text-stone-700">{a.selfStory}</span></p>
                      <p><span className="text-stone-900 font-bold uppercase tracking-widest text-[11px]">Channel: </span><span className="text-stone-700">{a.channel}</span></p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 p-3 bg-stone-200 rounded-lg border border-stone-300">
              <p className="text-xs text-stone-700"><strong className="text-stone-900">On the watch list:</strong> The Ex-Athlete Founder (Insulin-Drift, male). Not yet seen in gym. May appear as the LinkedIn/founder audience grows. Don\'t target in primary content/ads until volume justifies it.</p>
            </div>
          </Card>

          <Card>
            <SectionLabel>The Core Problem You Solve</SectionLabel>
            <p className="text-base font-semibold text-[#1A1A1A] mb-2">People are being prescribed to before they have been interpreted.</p>
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
                  <span className="text-sm font-semibold text-[#1A1A1A]">{a}</span>
                  <span className="text-stone-400 text-sm">-</span>
                  <span className="text-sm text-stone-600">{b}</span>
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
                <div key={n} className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-sm font-bold text-blue-500 w-5 shrink-0 mt-0.5">{n}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A] mb-1">{label}</p>
                    <p className="text-xs text-stone-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">LinkedIn channel</p>
              <p className="text-xs text-stone-700 leading-relaxed">The same intellectual territory drives LinkedIn content through 4 reframed pillars: <strong className="text-[#1A1A1A]">State over Discipline</strong>, <strong className="text-[#1A1A1A]">The Effort Trap</strong>, <strong className="text-[#1A1A1A]">Physiology and Decision-Making</strong>, <strong className="text-[#1A1A1A]">Interpretation over Prescription</strong>. Same physiology, executive vocabulary. See the <strong className="text-blue-700">LinkedIn tab</strong> for the full breakdown.</p>
            </div>
          </Card>

          <Card>
            <SectionLabel>What Every Piece of Content Must Do</SectionLabel>
            <div className="space-y-2">
              {[
                { label: 'Make them feel', value: '"Finally, someone gets it."' },
                { label: 'Then make them think', value: '"I need to find my state" (doctrine) or "I need to join that challenge" (promo).' },
                { label: 'CTA rule - Instagram', value: 'One CTA per post, matched to type: doctrine → "find your state, take the scorecard" (standalone scorecard); Challenge promo → "join the free 14-day Challenge". One job per post.' },
                { label: 'CTA rule - LinkedIn', value: 'CTA every 4-5 posts only. Most posts build credibility without selling.' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-3 py-2 border-b border-stone-200 last:border-0">
                  <span className="text-xs text-stone-500 w-44 shrink-0 mt-0.5">{label}</span>
                  <span className="text-sm text-[#1A1A1A]">{value}</span>
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
                  <span className="text-xs font-bold text-blue-500 w-4 shrink-0 mt-0.5">{n}</span>
                  <div>
                    <span className="text-sm font-semibold text-[#1A1A1A]">{label} </span>
                    <span className="text-sm text-stone-600">- {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>The 3 Body States (Public-Facing Language)</SectionLabel>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-red-500/20">
                <Tag color="red">Depleted</Tag>
                <Body>Body in protection mode. Cortisol elevated, metabolism suppressed. Adding more training makes this worse. Score: 5–8.</Body>
              </div>
              <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-amber-500/20">
                <Tag color="amber">Transitioning</Tag>
                <Body>Mixed signals. Has capacity but not consistent. Something is blocking the response. Score: 9–11.</Body>
              </div>
              <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-blue-500/20">
                <Tag color="teal">Ready</Tag>
                <Body>Biology in a position to respond. If results aren&apos;t happening at this score, the issue is in the prescription. Score: 12–15.</Body>
              </div>
            </div>
            <p className="text-xs text-stone-400 mt-3">Note: Remediation / Optimisation / Post-Optimisation are CFFS-only terms. Use Depleted / Transitioning / Ready in all public-facing content.</p>
          </Card>
        </div>
      )}

      {/* ── CONTENT SYSTEM ── */}
      {tab === 'content' && (
        <div className="space-y-4">
          <Card className="border-pink-500/30 bg-pink-500/5">
            <SectionLabel>Instagram Content System</SectionLabel>
            <p className="text-sm text-stone-700 leading-relaxed">Everything in this tab is the <strong className="text-[#1A1A1A]">Instagram</strong> content system - temperature ladder, weekly cadence, post types, production tools. LinkedIn runs a different cadence (1-2/wk vs 5/wk), different format (short essays, no carousels), and different tone (executive reframe, no fat-loss language). See the <strong className="text-blue-700">LinkedIn tab</strong> for that system.</p>
          </Card>

          <Card className="border-[#1B6DFC]/40 bg-[#1B6DFC]/5">
            <SectionLabel>Doctrine · One Message, Obsessively Repeated</SectionLabel>
            <p className="text-sm text-stone-700 leading-relaxed mb-3">
              Brands are built by becoming known for ONE thing. Variety of message is <em>not</em> authority. Variety of <strong>expression</strong> on the same message is authority. ~1% of any given audience has actually seen a previous post; even they forget within days. The instinct to vary the topic is the instinct that prevents brand recognition from forming.
            </p>
            <div className="p-3 bg-white border border-[#1B6DFC]/30 rounded-lg mb-3">
              <p className="text-[10px] font-bold tracking-[0.18em] text-[#1B6DFC] uppercase mb-1.5">The ONE Body Recode message</p>
              <p className="text-base font-semibold text-[#1A1A1A] leading-snug italic">
                "It's a state problem, not a discipline / training / nutrition / willpower problem. Read the state first, then prescribe."
              </p>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed mb-1.5">
              <strong className="text-[#1A1A1A]">How to apply across every surface:</strong>
            </p>
            <ul className="text-xs text-stone-700 leading-relaxed space-y-1 list-disc pl-5">
              <li>Vary the entry (hook, archetype, signal). Always land on the state-first frame.</li>
              <li>Don't draft a post that ends without it. Different door, same room.</li>
              <li>Stop optimising for topic novelty. Optimise for the 100th way to say the same thing.</li>
              <li>Reels, captions, ads, emails, landing pages, even error states - all bend back to state-first.</li>
              <li>"I said that already" is the wrong instinct. The next viewer is new. Say it again.</li>
            </ul>
          </Card>

          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <SectionLabel>Content Engine · Stop Teaching, Start Reading</SectionLabel>
            <p className="text-sm text-stone-700 leading-relaxed mb-3">
              Engagement comes from self-recognition, not information. Every post should make someone <strong>feel seen</strong>, <strong>prove you can read them</strong>, or hand them a <strong>result about themselves</strong> - never just explain a concept. Lead with the feeling in their words, name the state, then interpret. Write sharp enough to catch the high performer who self-scores &quot;fine, just stuck&quot; but is clinically Depleted.
            </p>
            <p className="text-xs text-stone-700 leading-relaxed mb-1.5"><strong className="text-[#1A1A1A]">Signature formats, mapped into the 5 post types below:</strong></p>
            <ul className="text-xs text-stone-700 leading-relaxed space-y-1 list-disc pl-5">
              <li><strong>Authority</strong> → State of the Data (your real scorecard patterns) · Receipts of the Read (screenshots of &quot;you nailed it&quot;, not before/afters)</li>
              <li><strong>Pattern Recognition</strong> → What Your ___ Says (cravings / 3pm crash / sleep) · The Scenario (named-character self-recognition)</li>
              <li><strong>Coach Perspective</strong> → React to DMs · Receipts</li>
              <li><strong>Contrarian</strong> → The Autopsy (dismantle a viral piece of wrong advice)</li>
              <li><strong>Diagnostic / Funnel</strong> → The Read (&quot;drop your 3 symptoms, I&apos;ll name your state&quot;) · The Prediction Flex · comment-to-DM personalised read</li>
            </ul>
            <p className="text-xs text-stone-500 mt-2">Full detail in <strong className="text-blue-700">Strategy Docs → Body Recode</strong> (Part II). Same 5 types, same archetype rotation - the formats just give each a sharper, repeatable shape.</p>
            <div className="mt-3 p-3 bg-white border border-emerald-500/30 rounded-lg">
              <p className="text-[10px] font-bold tracking-[0.18em] text-emerald-700 uppercase mb-1.5">Two doors + the Challenge promo layer</p>
              <p className="text-xs text-stone-700 leading-relaxed">CTA by post type: <strong>doctrine/engagement → &quot;find your state&quot; (scorecard)</strong>; <strong>Challenge promo → &quot;join the free 14-day Challenge&quot;</strong>. Run ~1 explicit Challenge-promo post/week (rotating angles: what it is / what you get / who it&apos;s for / proof / why now / objection-kill), with a heavier burst when a wave opens. Typical week = 4 doctrine + 1 promo.</p>
            </div>
          </Card>

          <Card className="border-blue-500/30 bg-blue-500/5">
            <SectionLabel>Stories · Daily Rhythm + Weekly Blueprint Beat</SectionLabel>
            <p className="text-sm text-stone-700 leading-relaxed mb-3">
              ~3 IG Stories/day carry the doctrine in short form (hook · pattern spotlight · quote · inside-the-challenge · photo overlay). Their link sticker points to the <strong>free Challenge</strong> - stories are cold / top-of-funnel, so they feed the Challenge entry, not the paid product.
            </p>
            <div className="p-3 bg-white border border-blue-500/30 rounded-lg">
              <p className="text-[10px] font-bold tracking-[0.18em] text-blue-600 uppercase mb-1.5">Weekly Blueprint beat (added Jul 2026)</p>
              <p className="text-xs text-stone-700 leading-relaxed">One story/week (Thursday, 5pm) drives the <strong>warm</strong> audience to <strong>bodyrecode.au/blueprint</strong> rather than the Challenge - the story-level expression of &quot;August = Blueprint drive.&quot; Keeps cold traffic on the free Challenge (per the evergreen ladder, Blueprint is warm-only) while giving Blueprint a consistent organic beat. Posting-reminder link stickers route automatically: Blueprint → /blueprint, every other story → /challenge.</p>
            </div>
          </Card>

          <Card className="border-[#1B6DFC]/30 bg-[#1B6DFC]/5">
            <SectionLabel>Comment-to-DM Lead Mechanic</SectionLabel>
            <p className="text-sm text-stone-700 leading-relaxed mb-3">
              The lead-capture layer: a post says <strong>&quot;comment KEYWORD and I&apos;ll send you X&quot;</strong> → ManyChat auto-replies on the comment + DMs the asset → warms them → funnels to the scorecard / Challenge. The giveaway is a <strong>personalised micro-read or a real one-pager</strong>, never a generic PDF. <strong>Cadence: 1-2 comment-to-DM posts/week</strong> (inside the 5x/week, on a scenario hook - not extra load).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-stone-500 text-left border-b border-[#1B6DFC]/20">
                  <th className="py-1.5 pr-3 font-semibold">Keyword</th><th className="py-1.5 pr-3 font-semibold">Lead magnet</th><th className="py-1.5 font-semibold">Funnels to</th>
                </tr></thead>
                <tbody className="text-stone-700">
                  {[
                    { k: 'STATE', m: 'The 3-State Cheat Sheet (Depleted / Transitioning / Ready)', f: 'Scorecard → Field Guide' },
                    { k: 'DRIFT', m: 'The Insulin-Drift Checklist (7 signs)', f: 'Scorecard → Challenge' },
                    { k: 'ENERGY', m: 'The 3pm Energy Map', f: 'Scorecard' },
                    { k: 'STUCK', m: 'Eat Less, Gain More? (protection-mode one-pager)', f: 'Challenge' },
                    { k: 'RESET', m: 'The Stress-Stored Reset (mini cortisol wind-down)', f: 'Sleep Reset ($19)' },
                  ].map(r => (
                    <tr key={r.k} className="border-b border-stone-200/60 last:border-0">
                      <td className="py-1.5 pr-3 font-mono font-bold text-[#1B6DFC]">{r.k}</td>
                      <td className="py-1.5 pr-3">{r.m}</td>
                      <td className="py-1.5 text-stone-500">{r.f}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-stone-500 mt-2.5">Built: ManyChat automation + the 5 assets exist. Keyword flows + public replies live in <strong className="text-[#1B6DFC]">comment-to-dm-asset-map-v1.md</strong>. The delivery truck is ready - this just schedules the cargo (1-2 posts/week).</p>
          </Card>

          <Card>
            <SectionLabel>Content Temperature - Hormozi Engagement Ladder</SectionLabel>
            <Body className="mb-4">Every post targets one temperature level. Cold content moves people from unaware to problem aware. Warm content moves them from problem aware to solution aware. Hot content pushes them to act. The ratio should be roughly 60% cold, 30% warm, 10% hot.</Body>
            <div className="space-y-2">
              {[
                { temp: 'Cold', colour: 'text-blue-700', bg: 'bg-blue-400/5 border-blue-400/20', ratio: '~60% of posts', desc: 'Unaware → Problem aware. Education and pattern recognition. No CTA or soft "does this sound familiar?" Never ask for action.', types: 'Authority, Pattern Recognition, Coach Perspective' },
                { temp: 'Warm', colour: 'text-amber-700', bg: 'bg-amber-400/5 border-amber-200', ratio: '~30% of posts', desc: 'Problem aware → Solution aware. Introduce the system. "There is a reason for this and it can be read." Soft CTA - link in bio.', types: 'Coach Perspective, Diagnostic (soft)' },
                { temp: 'Hot', colour: 'text-red-700', bg: 'bg-red-400/5 border-red-200', ratio: '~10% of posts', desc: 'Solution aware → Ready to act. Direct CTA. "Take the scorecard. 2 minutes. Free. Find out your state." One job: get them to the scorecard.', types: 'Diagnostic / Funnel' },
              ].map(row => (
                <div key={row.temp} className={`p-3 rounded-lg border ${row.bg}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${row.colour}`}>{row.temp}</span>
                    <span className="text-xs text-stone-500">{row.ratio}</span>
                  </div>
                  <p className="text-sm text-stone-700 leading-relaxed mb-1">{row.desc}</p>
                  <p className="text-xs text-stone-500">Post types: {row.types}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-500 font-medium">Primary lead getter: organic Instagram → scorecard. Go deep here before ads. Ads are the multiplier on a system that already converts.</p>
              <p className="text-xs text-stone-500 mt-1.5">Secondary: LinkedIn (executive reframe, organic only, slow-burn). Same scorecard, separate attribution.</p>
            </div>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <SectionLabel>Per-post measurement ladder · diagnose where it broke</SectionLabel>
            <p className="text-sm text-stone-700 leading-relaxed mb-3">
              Conversion is downstream of reach. Before blaming the caption or CTA, find which gate the post failed at. Fix the <strong>earliest broken step</strong> - don&apos;t rewrite the CTA on a post nobody saw.
            </p>
            <div className="space-y-2">
              {[
                {
                  gate: 'Gate 1',
                  label: 'Reach',
                  metric: 'Views (reels) · Impressions (statics)',
                  bad: 'Reels <500 / Statics <300',
                  diagnose: 'Distribution failure - algorithm didn&apos;t pick it up',
                  cause: 'Weak hook · wrong format for slot · time of day · hashtags off',
                  fix: 'Rewrite the hook for the next post in the same slot. Don&apos;t touch the CTA - nobody saw it.',
                  source: 'IG native analytics on the post',
                },
                {
                  gate: 'Gate 2',
                  label: 'Engagement → Click',
                  metric: 'Link clicks (bio) · Profile visits',
                  bad: 'Views >1K but link clicks = 0',
                  diagnose: 'CTA failure - people saw it but didn&apos;t act',
                  cause: 'CTA too subtle · &quot;Scorecard&quot; not named in caption · bio link unclear · friction in tap path',
                  fix: 'Strengthen CTA copy. Name &quot;Scorecard&quot; explicitly. Simplify bio link routing.',
                  source: 'IG analytics + Linktree/native bio clicks',
                },
                {
                  gate: 'Gate 3',
                  label: 'Click → Conversion',
                  metric: 'Scorecard signups (lead created)',
                  bad: 'Clicks happened but Scorecard signup = 0',
                  diagnose: 'Landing page failure - people landed but bounced',
                  cause: '/scorecard intro page friction · first question off · mobile UX broken · loading too slow',
                  fix: 'Check Vercel analytics bounce rate. Review /scorecard intro copy. Test mobile journey.',
                  source: 'Supabase `leads` table · Vercel analytics',
                },
              ].map(row => (
                <div key={row.gate} className="p-3 bg-white rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold tracking-[0.15em] text-amber-700 uppercase">{row.gate}</span>
                    <span className="text-sm font-bold text-[#1A1A1A]">{row.label}</span>
                    <span className="text-xs text-stone-400">·</span>
                    <span className="text-xs text-stone-600">{row.metric}</span>
                  </div>
                  <p className="text-xs text-red-700 font-medium mb-1">If: {row.bad}</p>
                  <p className="text-xs text-stone-700 leading-snug mb-1" dangerouslySetInnerHTML={{ __html: `<strong>Diagnose:</strong> ${row.diagnose}` }} />
                  <p className="text-xs text-stone-600 leading-snug mb-1" dangerouslySetInnerHTML={{ __html: `<strong>Likely cause:</strong> ${row.cause}` }} />
                  <p className="text-xs text-blue-700 font-medium leading-snug mb-1" dangerouslySetInnerHTML={{ __html: `<strong>Fix:</strong> ${row.fix}` }} />
                  <p className="text-[10px] text-stone-400 italic">Source: {row.source}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-amber-100/40 rounded-lg border border-amber-200">
              <p className="text-xs text-stone-700">
                <strong>Healthy benchmark for the V2 reel pipeline:</strong> &gt;2K views, &gt;50 link clicks, &gt;5 Scorecard starts per reel. Multiply the format that hits this. Kill what underperforms two reels in a row.
              </p>
            </div>
          </Card>

          <Card>
            <SectionLabel>Weekly Structure</SectionLabel>
            <p className="text-xs text-stone-700 mb-3">Each non-Sunday slot rotates across the 4 archetypes week to week, so every archetype sees themselves at least once per fortnight. Sunday Diagnostic always targets the dominant archetype (Stressed Executive Woman) since it\'s the conversion-driving slot.</p>
            <div className="space-y-2">
              {[
                { day: 'Monday', type: 'Authority', temp: 'Cold', archetype: 'Rotate 1→4', format: 'Carousel (5–7 slides) or short video', cta: 'None' },
                { day: 'Tuesday', type: 'Contrarian', temp: 'Cold', archetype: 'Rotate 1→4', format: 'Short video or statement graphic', cta: 'None' },
                { day: 'Wednesday', type: 'Pattern Recognition', temp: 'Cold', archetype: 'Rotate 1→4', format: 'Carousel or graphic card', cta: 'Soft' },
                { day: 'Friday', type: 'Coach Perspective', temp: 'Warm', archetype: 'Rotate 1→4', format: 'Talking video or photo card', cta: 'Soft' },
                { day: 'Sunday', type: 'Challenge Promo (Door 2)', temp: 'Hot', archetype: '01 Stressed Exec', format: 'Graphic card or reel', cta: 'Hard - join the free 14-day Challenge' },
              ].map(row => (
                <div key={row.day} className="grid grid-cols-6 gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs">
                  <div><p className="text-stone-400 mb-0.5">Day</p><p className="font-semibold text-[#1A1A1A]">{row.day}</p></div>
                  <div><p className="text-stone-400 mb-0.5">Type</p><p className="font-medium text-blue-500">{row.type}</p></div>
                  <div><p className="text-stone-400 mb-0.5">Temp</p><p className={row.temp === 'Hot' ? 'text-red-700' : row.temp === 'Warm' ? 'text-amber-700' : 'text-blue-700'}>{row.temp}</p></div>
                  <div><p className="text-stone-400 mb-0.5">Archetype</p><p className="font-medium text-stone-900">{row.archetype}</p></div>
                  <div><p className="text-stone-400 mb-0.5">Format</p><p className="text-stone-600">{row.format}</p></div>
                  <div><p className="text-stone-400 mb-0.5">CTA</p><p className="text-stone-600">{row.cta}</p></div>
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
              tempColor: 'text-blue-700 bg-blue-50 border-blue-400/20',
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
              tempColor: 'text-blue-700 bg-blue-50 border-blue-400/20',
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
              tempColor: 'text-amber-700 bg-amber-50 border-amber-200',
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
              tempColor: 'text-blue-700 bg-blue-50 border-blue-400/20',
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
              tempColor: 'text-red-700 bg-red-50 border-red-200',
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
                <span className="text-xs text-stone-400">{ct.day}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ct.tempColor}`}>{ct.temp} - {ct.tempDesc}</span>
              </div>
              <Body>{ct.goal}</Body>
              <div className="mt-4">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Post Ideas</p>
                <BulletList items={ct.topics} />
              </div>
              <div className="mt-4 p-3 bg-stone-50 rounded-lg border border-stone-200">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-1">Format</p>
                <p className="text-xs text-stone-600">{ct.format}</p>
              </div>
            </Card>
          ))}

          <Card>
            <SectionLabel>Archetype-Mapped Pattern Hooks</SectionLabel>
            <Body className="mb-4">Every Pattern Recognition post (Wednesday) and most Authority posts should target ONE archetype with a hook that names their specific lived experience. Rotate across the 4 weekly. Generic Depleted hooks land softer than archetype-specific ones.</Body>
            <div className="space-y-3">
              {[
                {
                  arch: '01 Stressed Executive Woman',
                  color: 'teal' as const,
                  hooks: [
                    '"You\'re falling asleep at 9pm and wide awake at 3am. Your cortisol is telling you something."',
                    '"The 3pm crash. The coffee. The afternoon scroll. That\'s not laziness - that\'s a depleted system."',
                    '"You can be the most disciplined person in your office and still have a body that won\'t change. Discipline isn\'t the variable."',
                    '"If you\'re training before work, leading meetings all day, and still trying to be present at home - your body is in protection mode and you don\'t know it."',
                  ],
                },
                {
                  arch: '02 Perimenopausal Performer',
                  color: 'violet' as const,
                  hooks: [
                    '"Your body changed at 42 and the program that worked at 32 stopped working. That\'s not failure. That\'s an oestrogen-shift pattern."',
                    '"Your GP said your bloods are fine. That doesn\'t mean your body is."',
                    '"Cardio is making your perimenopausal weight gain worse, not better. Here\'s why."',
                    '"The training that built you in your 30s is breaking you in your 40s. Same effort. Different physiology."',
                  ],
                },
                {
                  arch: '03 Postnatal Athlete',
                  color: 'amber' as const,
                  hooks: [
                    '"You had kids three years ago and still carry the weight. The reason isn\'t time. It\'s recovery debt."',
                    '"You were a runner / netballer / triathlete. Now you can\'t lose 5kg. That\'s a state problem, not a training problem."',
                    '"You\'re training when you can, eating when you can, sleeping when you can. The system can\'t convert any of it because there isn\'t enough of anything."',
                    '"Postnatal isn\'t a window. It\'s a state - and yours hasn\'t shifted yet."',
                  ],
                },
                {
                  arch: '04 Slipping High Performer',
                  color: 'orange' as const,
                  hooks: [
                    '"Your capacity is slipping and you\'re calling it ageing. It\'s not ageing. It\'s androgen decline stacked on chronic stress."',
                    '"Your bloods are \'normal\'. Your performance isn\'t. There\'s a gap between clinical normal and operational normal."',
                    '"TRT is not the answer to a stress problem. It\'s the answer to a TRT problem. Different things."',
                    '"You were sharp at 40. Different at 45. Same brain. Different physiology. The substrate changed and the strategy didn\'t."',
                  ],
                },
              ].map(a => {
                const colorMap = {
                  teal:   { border: 'border-teal-500/30',   bg: 'bg-teal-500/5',   accent: 'text-teal-700' },
                  violet: { border: 'border-violet-500/30', bg: 'bg-violet-500/5', accent: 'text-violet-700' },
                  amber:  { border: 'border-amber-500/30',  bg: 'bg-amber-500/5',  accent: 'text-amber-700' },
                  orange: { border: 'border-orange-500/30', bg: 'bg-orange-500/5', accent: 'text-orange-700' },
                }[a.color]
                return (
                  <div key={a.arch} className={`p-4 rounded-lg border ${colorMap.border} ${colorMap.bg}`}>
                    <p className={`text-sm font-semibold mb-2 ${colorMap.accent}`}>{a.arch}</p>
                    <ul className="space-y-1.5">
                      {a.hooks.map((h, i) => (
                        <li key={i} className="text-[13px] text-stone-800 leading-relaxed flex gap-2">
                          <span className="text-stone-500 shrink-0">·</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-stone-700 mt-3">Weekly rotation: archetype 1 → 2 → 3 → 4, then back to 1. Stressed Executive Woman gets the additional Sunday Diagnostic slot since she\'s the dominant audience.</p>
          </Card>

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
                <div key={row.type} className="flex items-center justify-between gap-4 py-2 border-b border-stone-200 last:border-0 text-sm">
                  <span className="text-stone-700">{row.type}</span>
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

          <Card className="border-stone-300 bg-stone-100/60">
            <SectionLabel>Historical Reference</SectionLabel>
            <p className="text-sm text-stone-600 leading-relaxed">The 5-post pre-launch sequence ran <strong className="text-stone-700">8-15 April 2026</strong> and is complete. Kept here as the brand-arrival template for future channels (LinkedIn launch, future products, white-label rollouts). The Founding Client Program references that originally followed Post 5 have been removed - that program is no longer running. <strong className="text-amber-700">Note:</strong> the sample-caption CTAs here predate the two-door model - the current rule is CTA by post type (doctrine → scorecard, promo → Challenge; see Overview / Content System).</p>
          </Card>

          {/* Tracker */}
          {(() => {
            const publishedCount = PRELAUNCH_POSTS.filter(p => (postStatuses[p.id] ?? 'not_started') === 'published').length
            const allDone = publishedCount === PRELAUNCH_POSTS.length
            return (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel>Pre-Launch Tracker</SectionLabel>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
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
                      <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                        <div className="shrink-0 w-24">
                          <p className="text-stone-700 text-xs font-medium">{p.date}</p>
                          <p className="text-stone-400 text-xs">{p.day}</p>
                        </div>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded border shrink-0 ${p.temp === 'Hot' ? 'text-red-700 bg-red-50 border-red-200' : 'text-blue-700 bg-blue-50 border-blue-400/20'}`}>{p.temp}</span>
                        <span className="text-stone-700 text-sm flex-1">{p.title}</span>
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
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-500 font-semibold">All 5 posts published. Move to ongoing 5×/week cadence and launch Meta ads.</p>
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
                <div key={r.post} className="flex items-center gap-3 text-xs p-2 rounded-lg bg-stone-50 border border-stone-200">
                  <span className="text-stone-500 w-10 shrink-0">{r.post}</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded border shrink-0 ${r.temp === 'Hot' ? 'text-red-700 bg-red-50 border-red-200' : 'text-blue-700 bg-blue-50 border-blue-400/20'}`}>{r.temp}</span>
                  <span className="text-stone-600">{r.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-500 font-medium">After Post 5 - move to the ongoing 5×/week cadence and launch Meta ads.</p>
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
            hashtags="#bodyrecode #bodystate #performancecoaching #cortisol #onlinecoaching"
          />
        </div>
      )}

      {/* ── ORGANIC → ADS ── */}
      {tab === 'organic' && (
        <div className="space-y-4">

          <Card className="border-pink-500/30 bg-pink-500/5">
            <SectionLabel>Instagram Organic System</SectionLabel>
            <p className="text-sm text-stone-700 leading-relaxed">This tab is the <strong className="text-[#1A1A1A]">Instagram</strong> organic-to-ads pathway. LinkedIn runs a separate organic channel (1-2 BR posts/week, executive reframe) with no ad spend tied to it - it&apos;s a slow-burn parallel feed into the same funnel (two-door model: scorecard + Challenge — see Overview). See the <strong className="text-blue-700">LinkedIn tab</strong> for that system.</p>
          </Card>

          {/* Goal */}
          <Card className="border-blue-500/20 bg-blue-500/5">
            <SectionLabel>The Goal</SectionLabel>
            <p className="text-blue-700 font-semibold text-sm">3 scorecard submissions per week from organic Instagram, for 2 consecutive weeks. That&apos;s the signal that the funnel converts. Then Meta ads go on.</p>
            <p className="text-stone-600 text-sm mt-2">Ads placed on a funnel that doesn&apos;t convert waste money. Ads placed on a funnel that already converts multiply what&apos;s working. Organic proves the model first.</p>
            <p className="text-xs text-stone-500 mt-2">Two-door model (see Overview): scorecard submissions are the <strong>Door 1</strong> signal; also track <strong>Challenge sign-ups</strong> from promo posts (Door 2). Both count as conversion.</p>
          </Card>

          {/* Three levers */}
          <Card>
            <SectionLabel>The Three Conversion Levers</SectionLabel>
            <div className="grid sm:grid-cols-3 gap-3 mt-1">
              {[
                {
                  num: '1',
                  title: 'Content',
                  color: 'text-blue-700',
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
                  color: 'text-amber-700',
                  border: 'border-amber-200',
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
                  color: 'text-blue-500',
                  border: 'border-blue-500/20',
                  bg: 'bg-blue-500/5',
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
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${l.color} bg-stone-200`}>{l.num}</span>
                    <p className={`text-sm font-semibold ${l.color}`}>{l.title}</p>
                  </div>
                  <ul className="space-y-1.5">
                    {l.items.map((item, i) => (
                      <li key={i} className="text-xs text-stone-600 leading-relaxed flex gap-2">
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
            <p className="text-stone-500 text-xs mb-3">Steady-state ongoing rhythm. Pre-launch is complete - this is the cadence to maintain week after week. What to do each week beyond just posting.</p>
            <div className="space-y-2">
              {[
                { day: 'Mon', post: true,  action: 'Post (Authority - Cold · Door 1). Reply to all weekend comments within 1hr.' },
                { day: 'Tue', post: true,  action: 'Post (Contrarian - Cold · Door 1). DM the last 5 new followers - soft intro, no pitch.' },
                { day: 'Wed', post: true,  action: 'Post (Pattern Recognition - Cold · Door 1). Check story viewers from last 48hrs - DM anyone warm.' },
                { day: 'Thu', post: false, action: 'No post. DM anyone who saved a post this week. Review engagement on last 3 posts - note what performed.' },
                { day: 'Fri', post: true,  action: 'Post (Coach Perspective - Warm · Door 1). Reply to all comments. DM anyone who replies to stories.' },
                { day: 'Sat', post: false, action: 'No post. Review the week: profile visits, scorecard submissions, Challenge sign-ups, follower growth. Note in weekly log.' },
                { day: 'Sun', post: true,  action: 'Post (Challenge Promo - Hot · Door 2 → "Join the free 14-day Challenge"). The weekly promo slot; turn up wave-scarcity when a wave opens. DM anyone who comments asking how to join.' },
              ].map(r => (
                <div key={r.day} className="flex items-start gap-3 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                  <span className="text-xs font-bold text-stone-500 w-7 shrink-0 pt-0.5">{r.day}</span>
                  {r.post
                    ? <span className="text-xs font-semibold text-blue-500 shrink-0 pt-0.5">Post</span>
                    : <span className="text-xs font-semibold text-stone-700 shrink-0 pt-0.5">Rest</span>
                  }
                  <p className="text-xs text-stone-600 leading-relaxed">{r.action}</p>
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
                { weeks: 'Week 1–2', subs: '0–1/week', label: 'Normal', color: 'text-stone-600', bg: 'bg-stone-200/50', border: 'border-stone-300', note: 'Profile is new. No audience yet. Keep posting and doing outreach.' },
                { weeks: 'Week 3–4', subs: '1–2/week', label: 'Traction', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', note: 'Content is landing. Warm outreach is working. Dial in hook quality.' },
                { weeks: 'Week 5–6', subs: '3+/week', label: 'Converting', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-500/20', note: 'Funnel is proven. Hold for 2 consecutive weeks at this level, then launch ads.' },
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

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <p className="text-xs font-semibold text-[#1A1A1A] mb-2">Step 1 - Comment on hashtag posts (10 min)</p>
                <p className="text-xs text-stone-700 mb-3">Browse these hashtags and leave 5–8 genuine comments on recent posts. Hashtags grouped by archetype so each session targets one specific person, not generic fitness.</p>
                <div className="space-y-2">
                  {[
                    {
                      arch: '01 Stressed Executive Woman',
                      tags: ['#executiveburnout','#cortisol','#highperformingwomen','#womeninbusiness','#workingmothers','#stressmanagement','#bodyrecode'],
                      color: 'teal' as const,
                    },
                    {
                      arch: '02 Perimenopausal Performer',
                      tags: ['#perimenopause','#menopause','#hrtaustralia','#womenover40','#perimenopauseweightgain','#hormonehealth','#womenshealth40'],
                      color: 'violet' as const,
                    },
                    {
                      arch: '03 Postnatal Athlete',
                      tags: ['#postnatalfitness','#postpartumfitness','#mumfitness','#postnatalrecovery','#mumsofbrisbane','#postpartumstrength','#mumlife'],
                      color: 'amber' as const,
                    },
                    {
                      arch: '04 Slipping High Performer',
                      tags: ['#executiveburnout','#mensthealth40','#testosterone','#trtaustralia','#longevity','#executiveperformance','#midlifehealth'],
                      color: 'orange' as const,
                    },
                    {
                      arch: 'Brisbane local discovery',
                      tags: ['#brisbanefitness','#brisbanecoach','#brisbanept','#bodyrecode','#brisbanewellness','#brisbanepersonaltrainer'],
                      color: 'stone' as const,
                    },
                  ].map(g => {
                    const accent = {
                      teal:   'text-teal-700 bg-teal-50 border-teal-500/30',
                      violet: 'text-violet-700 bg-violet-50 border-violet-500/30',
                      amber:  'text-amber-700 bg-amber-50 border-amber-500/30',
                      orange: 'text-orange-700 bg-orange-50 border-orange-500/30',
                      stone:  'text-stone-700 bg-stone-100 border-stone-300',
                    }[g.color]
                    return (
                      <div key={g.arch}>
                        <p className="text-[11px] font-bold text-stone-900 uppercase tracking-widest mb-1.5">{g.arch}</p>
                        <div className="flex flex-wrap gap-1">
                          {g.tags.map(h => (
                            <span key={h} className={`text-[10px] border px-1.5 py-0.5 rounded ${accent}`}>{h}</span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <p className="text-xs font-semibold text-[#1A1A1A] mb-2">Step 2 - Engage with target accounts (5 min)</p>
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
                      <span className="text-blue-500 shrink-0 mt-0.5">-</span>
                      <div>
                        <span className="text-stone-700 font-medium">{r.type}</span>
                        <span className="text-stone-400"> - {r.why}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <p className="text-xs font-semibold text-[#1A1A1A] mb-2">Step 3 - React to stories (5 min)</p>
                <p className="text-xs text-stone-500">React to stories from people in your target audience. A reaction opens a DM thread - low friction, high visibility. Don&apos;t force a conversation. Just a reaction is enough to put your name in front of them.</p>
              </div>

              <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                <p className="text-xs font-semibold text-red-700 mb-2">Comment quality rules - non-negotiable</p>
                <div className="space-y-1">
                  {[
                    { bad: '"Great post!" / "Love this!" / "So true!"', good: 'Never. Generic comments are invisible and signal a bot.' },
                    { bad: 'Always add something real', good: 'A point of agreement, a related insight, a question - 2–3 sentences. Comments that show expertise get profile clicks.' },
                    { bad: 'Example of a good comment', good: '"The cortisol-fat loss connection is underrated. Most people push harder when they\'re stuck and wonder why nothing moves. Usually the opposite is needed."' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs py-1 border-b border-red-500/10 last:border-0">
                      <span className="text-red-700 shrink-0 mt-0.5">-</span>
                      <div>
                        <span className="text-stone-600 font-medium">{r.bad}: </span>
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
                <div key={r.signal} className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-xs font-bold text-blue-500 w-14 shrink-0 pt-0.5">{r.signal}</span>
                  <p className="text-xs text-stone-600 leading-relaxed">{r.how}</p>
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
            <p className="text-stone-600 text-sm mb-3">Don&apos;t launch ads. Diagnose first.</p>
            <div className="space-y-2">
              {[
                { check: 'Hook quality', fix: 'Read back your last 10 first lines. If they don\'t stop your own scroll, they won\'t stop anyone else\'s. Rewrite the weakest 3.' },
                { check: 'Profile link', fix: 'Check the bio link goes directly to the scorecard. Open it yourself on mobile. If there\'s friction, fix it.' },
                { check: 'Outreach frequency', fix: 'Are you actually DMing new followers and story viewers? If you\'re only posting without outreach, the posts alone won\'t convert in week 5.' },
                { check: 'CTA clarity', fix: 'Every Sunday post must have one clear action: take the scorecard. Not "follow", not "save" - one action. Check the last 4 Sunday posts.' },
                { check: 'Content temperature mix', fix: 'If every post is Cold (educational), there\'s nothing pulling people toward an action. Hot posts (Sunday Diagnostic) must run every week without exception.' },
              ].map(r => (
                <div key={r.check} className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                  <p className="text-xs font-semibold text-[#1A1A1A] mb-1">{r.check}</p>
                  <p className="text-xs text-stone-500 leading-relaxed">{r.fix}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* The trigger */}
          <Card className="border-blue-500/20 bg-blue-500/5">
            <SectionLabel>The Ads Trigger</SectionLabel>
            <p className="text-blue-700 font-semibold text-sm mb-2">3 scorecard submissions/week for 2 consecutive weeks. Then go to the Paid Ads tab and launch.</p>
            <p className="text-stone-500 text-xs">At that point you have proof that cold traffic can find you, the profile converts them, and the scorecard holds attention. Ads buy more of that. Without those two weeks of data, you&apos;re paying to test whether the funnel works instead of to scale what already does.</p>
          </Card>

        </div>
      )}

      {/* ── ADS ── */}
      {tab === 'ads' && (
        <div className="space-y-4">
          <WaveStatusCard />

          {/* The upload runbook. Lives in Dropbox as the source of truth and is mirrored
              into public/docs/ads/ so the actual copy is reachable while setting up in
              Ads Manager. Deliberately NOT on the Strategy Docs tab: that tab is one
              durable positioning doc per brand, this is an operational pack per round. */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <SectionLabel>Round 1 Launch Pack · {LAUNCH_PACK_VERSION} · the copy to upload</SectionLabel>
            <Body>Every field for all seven ads, ready to paste into Ads Manager: headline, primary text, link description, creative filename. Ads 6, 3, 2 and the no-banner test are Round 1. Ads 4, 8 and 10 are the second layer, rewritten 5 Aug. Each ad now carries its creative inline, so copy cannot be paired with the wrong image. Opens with the <strong>hyper-dopamine structure</strong> (pattern interrupt + burning intrigue + specific benefit), the pre-flight checklist, and a measured audit of all seven against it.</Body>
            <div className="flex gap-2 mt-3">
              <a href={`/docs/ads/br-funnelb-round1-launch-pack-${LAUNCH_PACK_VERSION}.pdf`} target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">View .pdf</a>
              <a href={`/docs/ads/br-funnelb-round1-launch-pack-${LAUNCH_PACK_VERSION}.md`} target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded border border-stone-300 text-stone-700 hover:bg-stone-100">View .md</a>
            </div>
            <p className="text-xs text-stone-500 mt-2">Source of truth: <code className="text-[11px]">~/Dropbox/01_BODY_RECODE/07_ADS/BR_FUNNELB_ROUND1_LAUNCH.md</code>. Re-copy into <code className="text-[11px]">public/docs/ads/</code> after editing.</p>
          </Card>

          <Card className="border-pink-500/30 bg-pink-500/5">
            <SectionLabel>Meta Ads Only</SectionLabel>
            <p className="text-sm text-stone-700 leading-relaxed">All paid spend goes to Meta (Instagram feed + Facebook, automatic placements). <strong>Statics only - no Reels, no video.</strong> LinkedIn stays organic-only - the executive-reframe channel is a slow-burn brand-build, not a paid acquisition channel. No LinkedIn ads, no LinkedIn boost budget.</p>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <SectionLabel>Sequence Rule - by funnel</SectionLabel>
            <Body><strong>Funnel A (organic IG → Scorecard → Zoom → Coaching):</strong> organic-first. Ads are a multiplier on a system that already converts; not a replacement for proving the funnel works. Run organic until consistent scorecard submissions from content. Funnel A doesn&apos;t take paid spend today.</Body>
            <p className="text-xs text-stone-700 mt-2 leading-relaxed"><strong>Funnel B (cold paid → Challenge → Blueprint → Membership → Coaching):</strong> paid IS the engine. The whole ladder is designed for the cold ad to be the entry point. Don&apos;t wait for organic to prove Funnel B - the Challenge LP, the 14-day product, the Day 0 intake, the ascension cards and the Lead CAPI wire all exist precisely so paid can launch as the primary volume engine. Self-liquidation maths (Blueprint take-rate × $97 + Coaching conversion ≥ CPS) decides whether spend scales; organic doesn&apos;t gate the start.</p>
          </Card>

          <div className="grid sm:grid-cols-3 gap-3">
            <Card>
              <SectionLabel>Daily Budget · Phase 1</SectionLabel>
              <p className="text-xl font-semibold text-[#1A1A1A]">$25/day</p>
              <p className="text-xs text-stone-500 mt-1">One broad ad set. Budget at campaign level.</p>
            </Card>
            <Card>
              <SectionLabel>Minimum Test Period</SectionLabel>
              <p className="text-xl font-semibold text-[#1A1A1A]">2 weeks</p>
              <p className="text-xs text-stone-500 mt-1">Before judging the stage gate</p>
            </Card>
            <Card>
              <SectionLabel>Phase 1 Spend</SectionLabel>
              <p className="text-xl font-semibold text-[#1A1A1A]">~$350</p>
              <p className="text-xs text-stone-500 mt-1">Before scale-or-debug decision</p>
            </Card>
          </div>

          {/* Budget Strategy - Option D Stage Gate (locked 2026-06-29) */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <SectionLabel>Budget Strategy · BROAD (decided 2026-08-05) · supersedes Option D targeting</SectionLabel>
            <Body><strong>The July run exhausted its audience.</strong> 13-30 Jul reached only 3,613 people: the first 10 days returned 21 results at $11.15 each, the last 8 returned 2 at $103.56. CPM held flat at ~$48 across both halves, so it did not get more expensive to reach people - it ran out of people to reach. The unit economics work; capacity was the constraint. <strong>Round 1 therefore runs BROAD</strong>: one ad set, no interest stacking, no lookalikes. The stage-gate budget logic still holds; the archetype ad-set structure does not.</Body>

            <div className="mt-3 space-y-2 text-xs">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">Round 1 · Broad · four ads, one ad set</p>
                <p className="text-stone-700 leading-relaxed">One ad set, <strong>broad</strong>: Australia, 30-60, all genders. No interests, no lookalikes. <strong>$25/day at campaign level.</strong> Four ads run inside it - Ad 5 (four patterns), Ad 6 (insulin drift), Ad 2 (Fat Map), Ad 3 (perimenopause). Four distinct concepts on four different images. The no-banner test moved to Round 2 on 5 Aug so a discovery slot was not spent on a duplicate of Ad 6. At $25/day, separate ad sets would get ~$6 each and learn nothing, so creative is tested inside one set. Target: cost per Challenge signup low enough that Blueprint take-rate × $97 + coaching conversion clears it.</p>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest mb-1">Stage gate decision · End of week 2</p>
                <p className="text-stone-700 leading-relaxed mb-2"><strong>If cost per signup hits target:</strong> raise to $75/day on the same broad set and add fresh creative, rather than adding audiences. Broad plus more creative is the scale path now. <strong>The fresh creative is the three format-breakers below</strong> - tripling spend on four ads that have already run their course just buys the same fatigue faster.</p>
                <p className="text-stone-700 leading-relaxed mb-2"><strong>If it misses:</strong> DO NOT narrow the targeting. Narrowing is what caused the July exhaustion. Debug in order: (1) creative - swap in a format-breaker, one at a time, same ad set, (2) Day 0 intake friction, (3) Challenge LP conversion, (4) the offer itself.</p>
                <p className="text-stone-700 leading-relaxed"><strong>Expect broad to look worse before better.</strong> It takes longer to stabilise - do not judge it on the first 48h. CPM should fall relative to July&apos;s ~$48. If CPM does not fall, the audience was never the constraint and the creative is.</p>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest mb-1">Why one ad set, not several</p>
                <p className="text-stone-700 leading-relaxed">$25/day split across 3 ad sets = $8.30/day each, and Meta needs far more than that per set to learn. It shows ads to suboptimal slices, cost stays high, and you end up with directional noise rather than data. July proved the second half of this too: within the one ad set that did run, a single ad took $220 of $225. Watch spend distribution across the four ads - if it is not roughly even by day 3, you are testing one ad again.</p>
              </div>
            </div>
          </Card>

          {/* Campaign alignment, decided 5 Aug. Organic and paid ran separate
              calendars and never touched. The vocabulary divergence that justified
              keeping them apart died when the ads started naming the four patterns
              outright, so nothing stands in the way of organic pre-selling the ad. */}
          <Card className="border-violet-500/30 bg-violet-500/5">
            <SectionLabel>Campaign alignment · organic × paid (decided 2026-08-05)</SectionLabel>
            <Body><strong>The live ad sets the week&apos;s organic theme.</strong> One idea, four angles, matching whatever concept is in market. Someone who has seen three posts on the four patterns converts on the four-patterns ad at a different rate than someone cold, and it costs nothing to do.</Body>
            <div className="mt-3 space-y-2 text-xs">
              <div className="bg-white/70 border border-violet-500/20 rounded-lg p-3">
                <p className="text-[10px] font-bold text-violet-700 uppercase tracking-widest mb-1">The week, against the campaign</p>
                <p className="text-stone-700 leading-relaxed"><strong>Mon</strong> Authority — the live ad&apos;s claim, expanded. <strong>Tue</strong> Contrarian — the obvious objection, killed. <strong>Wed</strong> Pattern Recognition — self-diagnosis + comment-to-DM. <strong>Fri</strong> Coach Perspective — proof it holds. <strong>Sun</strong> Promo — Challenge invite.</p>
              </div>
              <div className="bg-white/70 border border-violet-500/20 rounded-lg p-3">
                <p className="text-[10px] font-bold text-violet-700 uppercase tracking-widest mb-1">Vocabulary divergence · RETIRED</p>
                <p className="text-stone-700 leading-relaxed">The old rule gave paid &quot;Decode&quot; language and reserved the Fat Map, states and patterns for organic. Every current ad names Stress-Stored, Insulin-Drift, Estrogen-Shift and Androgen-Decline outright, so the two already speak the same language. <strong>What still diverges is format:</strong> paid is statics only, organic keeps reels and carousels.</p>
              </div>
              <div className="bg-white/70 border border-violet-500/20 rounded-lg p-3">
                <p className="text-[10px] font-bold text-violet-700 uppercase tracking-widest mb-1">Routing while paid is live · scoped exception</p>
                <p className="text-stone-700 leading-relaxed">Organic doctrine posts point at <strong>/challenge</strong>, not the scorecard, so the two do not compete for the same reader. The read is not skipped: <strong>the scorecard IS Day 0 of the Challenge.</strong> When paid goes dark, routing <strong>reverts to scorecard-first</strong>. A scoped exception to the locked rule, not a repeal.</p>
              </div>
              <div className="bg-white/70 border border-violet-500/20 rounded-lg p-3">
                <p className="text-[10px] font-bold text-violet-700 uppercase tracking-widest mb-1">Warm audiences · build now, spend later</p>
                <p className="text-stone-700 leading-relaxed">Engagers, video viewers and site visitors accumulate into custom audiences <strong>from today</strong>, because they take time to populate. <strong>Do not put budget behind them at $25/day</strong> — splitting the budget is what exhausted July. They come in at the $75/day step. A warm pool fed by 5 posts a week is <strong>the only narrow audience that cannot exhaust</strong>, because it refills faster than it burns.</p>
              </div>
              <div className="bg-white/70 border border-violet-500/20 rounded-lg p-3">
                <p className="text-[10px] font-bold text-violet-700 uppercase tracking-widest mb-1">Creative moves both ways · one endpoint</p>
                <p className="text-stone-700 leading-relaxed">Ad 12&apos;s plate works as a carousel unchanged, Ad 14&apos;s plain type as a quote post. An organic post that outperforms is a pre-validated ad. Seven creatives used once each is waste. And both channels now measure to <strong>Challenge enrolment</strong>, so they can finally be compared.</p>
              </div>
            </div>
          </Card>

          {/* What to watch. These are the numbers that trigger an action, and they
              lived only in the launch pack PDF until 5 Aug. Frequency in particular
              is the trigger for deploying a format-breaker, so it has to be visible
              on the tab rather than inside a document. */}
          <Card className="border-amber-500/30 bg-amber-500/5">
            <SectionLabel>What to watch · Round 1</SectionLabel>
            <Body>Four numbers, each with an action attached. Everything else is noise while the budget is this small.</Body>
            <div className="mt-3 space-y-2 text-xs">
              <div className="bg-white/70 border border-amber-500/20 rounded-lg p-3">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1">1 · Click → Challenge signup</p>
                <p className="text-stone-700 leading-relaxed">The only number that matters. <strong>Not CTR, not cost per click.</strong> A cheap click that does not enrol is worse than no click, because it teaches the algorithm the wrong buyer.</p>
              </div>
              <div className="bg-white/70 border border-amber-500/20 rounded-lg p-3">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1">2 · Frequency · the format-breaker trigger</p>
                <p className="text-stone-700 leading-relaxed"><strong>July died past roughly 2.4.</strong> If frequency passes 2 in the first ten days, the same people are seeing the same look and a look they recognise is a look they scroll. <strong>Rotate in one format-breaker and pause the most-served ad.</strong> Do not touch the targeting.</p>
              </div>
              <div className="bg-white/70 border border-amber-500/20 rounded-lg p-3">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1">3 · Spend distribution · by day 3</p>
                <p className="text-stone-700 leading-relaxed">If spend is not roughly even across the four ads by day 3, you are testing one ad again. July proved this: one ad took <strong>$220 of $225</strong> inside a single set. Either accept its verdict or pause the leader to force delivery into the rest.</p>
              </div>
              <div className="bg-white/70 border border-amber-500/20 rounded-lg p-3">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1">4 · Decision point · day 5 to 7</p>
                <p className="text-stone-700 leading-relaxed">Kill the bottom two on cost per signup. If <em>nothing</em> is converting at an acceptable cost, stop and look at the Challenge landing page rather than buying more traffic.</p>
              </div>
              <div className="bg-white/70 border border-amber-500/20 rounded-lg p-3">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1">The diagnostic that decides everything</p>
                <p className="text-stone-700 leading-relaxed"><strong>Cost per signup rising while CPM stays flat is creative fatigue, not an audience problem.</strong> Rising CPM would mean a reach problem. Flat CPM with worsening cost means the creative stopped working, and the fix is a format-breaker, never narrower targeting.</p>
              </div>
            </div>
          </Card>

          <Card>
            <SectionLabel>Campaign Configuration - Meta Ads Manager</SectionLabel>
            <Body>The exact values to paste into Meta Ads Manager when setting up the campaign. Click any value to copy.</Body>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { k: 'Campaign name', v: 'BR-FunnelB-Leads-2026Q3' },
                { k: 'Objective', v: 'Sales (Lead Generation)' },
                { k: 'Pixel ID', v: '972772552072010' },
                { k: 'Budget level', v: 'Campaign level (Advantage campaign budget). With one ad set this is equivalent to ABO - the old NOT-CBO rule only mattered when three archetype sets were competing' },
                { k: 'Round 1 daily budget', v: '$25 AUD at campaign level, one broad ad set' },
                { k: 'Targeting', v: 'BROAD - Australia, 30-60, all genders. No interests, no lookalikes' },
                { k: 'Scale path', v: 'Raise to $75/day on the SAME broad set + fresh creative. Never add audiences' },
                { k: 'Optimization event', v: 'CompleteRegistration is what the July run actually optimised on and it IS wired - it fires from challenge/enroll AND scorecard/submit, so the count is blended. Open runbook task to switch to Lead; until then read results knowing they mix both.' },
                { k: 'Action source', v: 'Website' },
                { k: 'CTA button', v: 'Learn More' },
                { k: 'Schedule start', v: 'Round 1 relaunch, Aug 2026. Original launch ran 13-30 Jul and was paused 31 Jul on audience exhaustion.' },
                { k: 'Placements', v: 'Automatic placements. STATICS ONLY - turn Reels and video placements off, there is no video creative' },
                { k: 'Traffic type', v: 'Cold only (retargeting layer added Day 30+)' },
                { k: 'CAPI test event code', v: 'See META_TEST_EVENT_CODE env (unset in prod)' },
              ].map(row => (
                <div key={row.k} className="flex items-start justify-between gap-2 bg-stone-50 border border-stone-200 rounded-lg p-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-0.5">{row.k}</p>
                    <p className="text-stone-700 break-words">{row.v}</p>
                  </div>
                  <CopyButton value={row.v} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>Ad Objective & Audience</SectionLabel>
            <div className="space-y-3">
              <div><Heading>Objective</Heading><Body>Cold traffic → Challenge LP direct. Cold paid Meta + gym-floor are the only surfaces that bypass the scorecard (locked rule, see feedback_scorecard_first_routing). Never ad direct to a paid checkout.</Body></div>
              <div>
                <Heading>Audience - BROAD (superseded 2026-08-05)</Heading>
                <Body><strong>Round 1 runs one broad ad set, not three archetype sets.</strong> Australia, 30-60, all genders, no interests. Interest stacking is what exhausted the July audience at 3,613 reach. The archetypes below are retained as <strong>creative angles</strong> - they tell you who each ad speaks to and which pattern it names - but they are no longer ad-set definitions, and the interest lists are kept for reference only. The creative carries the targeting now, and the scorecard routes whoever arrives.</Body>
                <div className="mt-3 space-y-2">
                  {[
                    {
                      arch: '01 Stressed Executive Woman',
                      demo: 'Women 35-48, Brisbane / inner suburbs + remote AU, $100K+',
                      interests: 'Corporate wellness, executive coaching, cortisol, burnout, productivity, leadership, women in business, working mothers',
                      color: 'teal' as const,
                    },
                    {
                      arch: '02 Perimenopausal Performer',
                      demo: 'Women 40-50, Brisbane suburban + remote AU',
                      interests: 'Perimenopause, menopause, HRT, women over 40, Davina McCall, midlife wellness, hormonal health',
                      color: 'violet' as const,
                    },
                    {
                      arch: '04 Slipping High Performer',
                      demo: 'Men 42-55, Brisbane / interstate, executives + professionals',
                      interests: 'Executive burnout, TRT, men\'s health 40+, longevity, Huberman Lab, Peter Attia, Tim Ferriss, Bryan Johnson',
                      color: 'orange' as const,
                    },
                  ].map(a => {
                    const colorMap = {
                      teal:   'border-teal-500/30 bg-teal-500/5 text-teal-700',
                      violet: 'border-violet-500/30 bg-violet-500/5 text-violet-700',
                      amber:  'border-amber-500/30 bg-amber-500/5 text-amber-700',
                      orange: 'border-orange-500/30 bg-orange-500/5 text-orange-700',
                    }[a.color]
                    return (
                      <div key={a.arch} className={`p-3 rounded-lg border ${colorMap.split(' ').slice(0, 2).join(' ')}`}>
                        <p className={`text-xs font-bold mb-1.5 ${colorMap.split(' ').slice(2).join(' ')}`}>{a.arch}</p>
                        <p className="text-[12px] text-stone-700 mb-1.5"><span className="text-stone-600 uppercase tracking-widest text-[10px] font-semibold">Demo: </span>{a.demo}</p>
                        <p className="text-[12px] text-stone-800"><span className="text-stone-600 uppercase tracking-widest text-[10px] font-semibold">Interests: </span>{a.interests}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-stone-700 mt-3"><strong>These are creative angles now, not ad sets.</strong> The interests listed above are no longer used for targeting: Round 1 runs one broad set, because interest stacking is what exhausted the audience at 3,613 reach in July. What survives is the archetype as a <em>writing</em> input - each current ad still speaks to one of these people, and Meta finds them from the creative rather than from an interest list. Postnatal Athlete stays out of cold paid either way, reached organically via the IG calendar and Funnel A.</p>
              </div>
              <div><Heading>Placement</Heading><Body>Automatic placements across Instagram feed and Facebook feed. <strong>Statics only, no Reels.</strong> Broad targeting means the creative does the targeting, so Meta gets room to place it.</Body></div>
              <div><Heading>Traffic type</Heading><Body>Cold only for now. Retargeting layer added at Day 30+ once pixel has enough data.</Body></div>
            </div>
          </Card>

          <Card className="border-blue-500/30 bg-blue-500/5">
            <SectionLabel>Copy standard · hyper-dopamine (current)</SectionLabel>
            <Body>Every cold paid creative is built to one formula: <strong>pattern interrupt</strong> (the image) + <strong>burning intrigue</strong> (the headline) + <strong>a specific benefit</strong> (so the algorithm finds the right buyer). Miss any of the three and the ad either gets scrolled past or gets clicked by the wrong people. An ad only has to stop the scroll and earn the click - it does not have to sell, explain the method, or establish credibility. That happens after the click.</Body>
            <p className="text-xs text-stone-700 mt-2 leading-relaxed">The full 13-point pre-flight checklist, plus a measured audit of all seven current ads (character counts and readability grade, computed not estimated), is in the <strong>Round 1 Launch Pack</strong> at the top of this tab. Two things it flags: Ad 3 reads at grade 7.3 against a grade-5 rule, kept deliberately because the words causing it are the ones that audience uses; and the link descriptions were rewritten on 5 Aug because five of six stated the offer instead of opening a curiosity gap.</p>
            <p className="text-xs text-stone-700 mt-2 leading-relaxed">Paid Meta only. These do NOT cascade to organic, which keeps state language and scorecard CTAs - see Creative Principle #1 in the Marketing Strategy doc for the deliberate divergence. The retired Amanda-audited doctrine is preserved in the Archive below, with each of its six rules marked as still-applies or superseded.</p>
          </Card>

          <Card>
            <SectionLabel>Creative Format</SectionLabel>
            <Body><strong>Live:</strong> 7 static 4:5 creatives at 1080×1350 - four in Round 1, three held as Layer 2. Photo-led with a headline overlay and the locked offer banner, except the one no-banner test. No reels.</Body>
            <p className="text-xs text-stone-700 mt-2 leading-relaxed"><strong>Future (Phase 2):</strong> when reel production capacity is in place (Amanda + HeyGen, see Filming Guide below), add 15-30 sec talking-head reels alongside the static variants. Reels run in parallel, not as replacements - each ad set splits creative budget across formats so Meta can optimise. The doctrine + audiences + Campaign Configuration stay the same; only the asset type expands.</p>
            <BulletList items={[
              'Phase 1 (NOW): 7 static 4:5 images, no reels',
              'Phase 2 (future): 15-30 sec talking-head reels in parallel with static',
              'No music on reels - calm and direct tone IS the differentiator',
              'No jump cuts every 2 seconds - this audience responds to calm authority',
              'Vertical 9:16 for Reels/Stories. Static stays 4:5 for IG feed + FB feed.',
            ]} />
          </Card>

          {/* CURRENT creative, swapped in 2026-08-05. Copy is generated from the
              Round 1 launch pack so the two cannot drift. The previous 9-variant
              archetype library is archived below, not deleted: it is the only
              record of what actually ran in July, and July's numbers are the
              baseline every future round gets judged against. */}
          <div className="space-y-4">
            <SectionLabel>Current creative · Round 1 (broad)</SectionLabel>
            <p className="text-xs text-stone-700 leading-relaxed">The four that go up first, inside <strong>one broad ad set</strong>: Ad 5, Ad 6, Ad 2 and Ad 3. Four concepts, four different images, no repeats. Built to the hyper-dopamine standard: pattern interrupt, burning intrigue, specific benefit. Every field is verbatim from the <strong>Round 1 Launch Pack {LAUNCH_PACK_VERSION}</strong> linked at the top of this tab. Click any field to copy, click an image to open it full size for upload.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {ROUND1_ADS.filter(a => a.layer === 'round1').map(ad => <Round1AdCard key={ad.slug} ad={ad} />)}
            </div>

            <div className="bg-amber-500/5 border border-amber-500/25 rounded-lg p-3">
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1">The no-banner test · moved to Round 2 on 5 Aug</p>
              <p className="text-xs text-stone-700 leading-relaxed">Built and ready, held deliberately. Running it in Round 1 spent one of four slots on a second copy of Ad 6, so Round 1 tested three concepts instead of four on a budget where four is already the ceiling. It also answered a narrower question than it appeared to: whether the banner helps <em>Ad 6</em>, not whether the banner helps. <strong>Better sequencing is to find the winner in Round 1, then run that winner with and without the banner.</strong> Same test, better subject, no discovery slot spent. When it runs, every field except the creative must match the winner exactly or it is void.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {ROUND1_ADS.filter(a => a.layer === 'deferred').map(ad => <Round1AdCard key={ad.slug} ad={ad} />)}
            </div>

            <SectionLabel>Format-breakers · built 5 Aug</SectionLabel>
            <p className="text-xs text-stone-700 leading-relaxed">Round 1&apos;s four are individually strong but share one visual language: greyscale photo, Signal Blue, same type, same banner. Four ads from one account that look like a matched set read as a campaign, and a campaign reads as an ad. These three break that in three directions, and put <strong>body composition back in the image</strong> — Ad 6&apos;s picture sells a clock, Ad 3&apos;s sells a squat. No new photography: Ad 12 reuses the existing figures, Ads 13 and 14 are pure type.</p>
            <div className="bg-blue-500/5 border border-blue-500/25 rounded-lg p-3">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">When to use them · hold all three for now</p>
              <p className="text-xs text-stone-700 leading-relaxed">Not in Round 1. Round 1&apos;s job is to find which <em>concept</em> wins with the banner on, and a format-breaker beside them makes a win unreadable. These are the answer to <strong>creative fatigue</strong>, which is what actually killed July: CPM held flat at ~$48, so the audience never got more expensive to reach, it stopped converting. Rotate one in when <strong>frequency passes 2</strong>, when <strong>cost per signup rises on a flat CPM</strong>, when you <strong>scale to $75/day</strong> (fresh creative, never new audiences), or to <strong>replace a Round 1 ad killed at day 5-7</strong>. Same campaign, same broad ad set, one at a time. Never a new ad set. Full rules in the launch pack.</p>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/25 rounded-lg p-3">
              <p className="text-xs text-stone-700 leading-relaxed"><strong>Banner caveat.</strong> None carries the blue offer banner, because it would defeat the point of all three. Each keeps the free offer as a native line instead. That entangles them with the deferred no-banner test, so <strong>run that test on a Round 1 ad, not on one of these.</strong></p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ROUND1_ADS.filter(a => a.layer === 'variety').map(ad => <Round1AdCard key={ad.slug} ad={ad} />)}
            </div>

            <SectionLabel>Layer 2 · held until Round 1 reads out</SectionLabel>
            <p className="text-xs text-stone-700 leading-relaxed">Ads 4, 8 and 10, rewritten 5 Aug. Not in Round 1 because four ads on $25/day is already the practical ceiling for learning anything. These go up when Round 1 gives a cost per signup to beat, or when a Round 1 ad is killed and needs replacing.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ROUND1_ADS.filter(a => a.layer === 'layer2').map(ad => <Round1AdCard key={ad.slug} ad={ad} />)}
            </div>
          </div>

          {/* ARCHIVE. Collapsed by default via native <details> so it stays out
              of the way without needing state. Kept because these ran the July
              campaign that produced the $11.15 baseline. */}
          <details className="border border-stone-300 rounded-xl bg-stone-50 overflow-hidden">
            <summary className="cursor-pointer select-none px-4 py-3 hover:bg-stone-100">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-widest">Archive · the 9-variant archetype library (retired 5 Aug 2026)</span>
            </summary>
            <div className="px-4 pb-4 space-y-4 border-t border-stone-200 pt-4">
              <div className="bg-stone-200/60 border border-stone-300 rounded-lg p-3">
                <p className="text-xs text-stone-700 leading-relaxed"><strong>Retired, not deleted.</strong> These nine ran the July campaign. They are superseded on three counts: they are built around <strong>three interest-based archetype ad sets</strong>, which broad targeting replaced after interest exhausted at 3,613 reach; they route on the archetype rather than the Fat Map pattern, which locked at v2.0 on 31 Jul; and their copy predates the body-composition rewrite.</p>
                <p className="text-xs text-stone-700 leading-relaxed mt-2"><strong>Do not upload these.</strong> They are kept because July&apos;s numbers came from them, and $11.15 per result across the first ten days is the baseline Round 1 has to beat. Reading the new creative against the old is only possible if the old is still here.</p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">Retired copy doctrine · Amanda-audited, locked 2026-06-27</p>
                <div className="space-y-2 text-[12px] text-stone-600">
                  <p><span className="font-bold text-stone-800">1. Meta personal-attributes policy.</span> Hooks name the audience or life stage, NEVER the viewer&apos;s body. <strong className="text-stone-800">This one still applies</strong> and carries over to the current creative: it is Meta policy, not a style choice.</p>
                  <p><span className="font-bold text-stone-800">2. &quot;Decode&quot; terminology locked.</span> Use Body Decode / Find your pattern, NOT &quot;Fat Map&quot;. <em>Superseded.</em> The current ads name the Fat Map and the four drivers directly, because the pattern is the product.</p>
                  <p><span className="font-bold text-stone-800">3. Two-sentence subs.</span> <em>Superseded</em> by the hyper-dopamine structure: pattern interrupt, burning intrigue, specific benefit.</p>
                  <p><span className="font-bold text-stone-800">4. CTA locked.</span> &quot;Start the free 14-day Challenge.&quot; <em>Superseded.</em> CTA button is now Learn More on every ad.</p>
                  <p><span className="font-bold text-stone-800">5. Banner sub locked.</span> <em>Under test.</em> This is exactly what the no-banner test resolves.</p>
                  <p><span className="font-bold text-stone-800">6. Photo variant rule.</span> Don&apos;t reuse the same Kade photo across ads. <strong className="text-stone-800">Still applies.</strong> Face fatigue is real.</p>
                </div>
              </div>

              {[
                { name: 'Archetype 01 · Stressed Executive Woman', ads: COLD_ADS.filter(a => a.archetype === 'Stressed Executive Woman') },
                { name: 'Archetype 02 · Perimenopausal Performer', ads: COLD_ADS.filter(a => a.archetype === 'Perimenopausal Performer') },
                { name: 'Archetype 04 · Slipping High Performer',  ads: COLD_ADS.filter(a => a.archetype === 'Slipping High Performer') },
              ].map(group => (
                <div key={group.name}>
                  <p className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">{group.name}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {group.ads.map(ad => <ColdAdCard key={ad.slug} ad={ad} />)}
                  </div>
                </div>
              ))}
            </div>
          </details>

          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <SectionLabel>Reels via Captions · ORGANIC ONLY (added 2026-08-05)</SectionLabel>
            <Body>Reels were never blocked by strategy, they were blocked by <strong>Kade not having a production workflow for them</strong>. Captions removes that for talking-head content, which is the only reel format this brand needs.</Body>
            <p className="text-xs text-stone-700 mt-2 leading-relaxed"><strong>Why it matters more than &quot;more content&quot;.</strong> Reach is not the point. <strong>Video viewers are a custom audience source</strong>, so reels are the cheapest way to fill the warm retargeting pool. That pool is the only narrow audience that cannot exhaust, and it is the structural fix for what killed July. Reels are the pump.</p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="bg-white/70 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">Scope · organic only</p>
                <p className="text-stone-700 leading-relaxed"><strong>Cold paid stays statics only.</strong> Nothing here touches the ad account. The no-Reels rule on the Campaign Configuration above is unchanged.</p>
              </div>
              <div className="bg-white/70 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">Week 1 scripts · ready to film</p>
                <p className="text-stone-700 leading-relaxed mb-2">Five talking-head scripts, one per day of the spine, each built on a message Round 1 is already spending money on. All land 42&ndash;46 seconds. Includes which Captions AI tools to use and which to avoid.</p>
                <div className="flex gap-2">
                  <a href="/docs/organic/br-reel-scripts-week1-v1.0.pdf" target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-emerald-700 text-white hover:bg-emerald-800">View .pdf</a>
                  <a href="/docs/organic/br-reel-scripts-week1-v1.0.md" target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded border border-stone-300 text-stone-700 hover:bg-stone-100">View .md</a>
                </div>
              </div>
              <div className="bg-white/70 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">Workflow</p>
                <p className="text-stone-700 leading-relaxed"><strong>Batch once a week</strong> — five scripts in one ~30 minute sitting. Do not film daily; that is the bottleneck that stopped this before. <strong>Scripts come from the week&apos;s spine:</strong> Monday&apos;s Authority post is the strongest candidate, because it is the message paid is already spending on. 30–45 seconds, one idea, vertical 9:16.</p>
              </div>
              <div className="bg-white/70 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">Three things not to do</p>
                <p className="text-stone-700 leading-relaxed"><strong>Do not post watermarked</strong> — the free tier brands your reel with someone else&apos;s logo. <strong>Do not use the AI avatar for doctrine content</strong> — your face doing the read is the asset, a synthetic stand-in undermines the authority the reel exists to build, and a 40+ professional audience will clock it. Caption and framing tools are fine, they are still you. <strong>Do not let reels replace carousels</strong> — reels buy reach, carousels buy saves.</p>
              </div>
              <div className="bg-white/70 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">Division of labour · Amanda is untouched</p>
                <p className="text-stone-700 leading-relaxed">Amanda&apos;s contra deal covers <strong>funnel-stage video</strong> — the Challenge Day 5 session, the Blueprint education lessons, landing-page assets — produced in HeyGen and ElevenLabs. <strong>It does not cover social media.</strong> Social reels are Kade on camera in Captions. The tools are not competing: HeyGen produces funnel assets at Amanda&apos;s hand, Captions produces social at Kade&apos;s. Nothing here touches her scope or her backlog.</p>
              </div>
            </div>
          </Card>

          <Card className="border-stone-300 bg-stone-50">
            <SectionLabel>Filming + workflow reference (paid reels still NOT active)</SectionLabel>
            <Body>The two cards below are the filming and post-production reference. The rules still apply to organic reels made in Captions. <strong>Cold paid remains static-only</strong> — these are not instructions for the ad account.</Body>
          </Card>

          <Card>
            <SectionLabel>Filming Guide - Gym Session (Phase 2 reel production)</SectionLabel>
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
            <SectionLabel>What to Do With the Footage (Phase 2 reel production)</SectionLabel>
            <div className="space-y-2">
              {[
                '1. Review takes - pick the best one per script',
                '2. Add captions using CapCut (free) - body text, on-screen hook line',
                '3. Upload best take to Content Engine → Generate Reel for AI avatar variations',
                '4. Upload to Meta Ads Manager - add reel variants to the existing ad sets (BR-FunnelB-Leads-2026Q3, one ad set per archetype), in parallel with the existing static creatives. Each ad set runs both formats; Meta optimises within.',
                '5. Run for 14 days at $20–30/day',
                '6. Cut the underperforming creatives. Scale the winners.',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-blue-500 font-bold shrink-0 text-xs mt-0.5">{i + 1}</span>
                  <span className="text-stone-600">{step.replace(/^\d+\. /, '')}</span>
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
          <Card className="border-blue-200 bg-blue-500/5">
            <SectionLabel>LinkedIn - Body Recode Channel</SectionLabel>
            <Body>Opened as a parallel funnel into the same scorecard, reaching the same demographic (high-functioning adults, executives, founders, professionals) through a different channel with different language. Instagram strategy stays locked. LinkedIn is additive, not a replacement.</Body>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Posted from</p>
                <p className="text-xs text-[#1A1A1A] font-medium">Kade Dunstone personal profile</p>
                <p className="text-[11px] text-stone-500 mt-1">No separate Body Recode LinkedIn page. Audience follows the person.</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Source tracking</p>
                <p className="text-xs text-blue-500 font-mono">?source=linkedin</p>
                <p className="text-[11px] text-stone-500 mt-1">Leads tagged separately from Instagram in CRM.</p>
              </div>
            </div>
          </Card>

          {/* Cadence */}
          <Card>
            <SectionLabel>Cadence</SectionLabel>
            <div className="space-y-1.5">
              {[
                { channel: 'The Collective',   freq: '2-3 posts/week', note: 'Already running' },
                { channel: 'Personal Brand',   freq: '1 post/week',    note: '4 personal pillars (Body, Thinking, AI, Rebuild)' },
                { channel: 'Body Recode (NEW)', freq: '1-2 posts/week', note: 'Executive/performance reframe' },
                { channel: 'TOTAL FEED',        freq: '4-6 posts/week', note: 'Sustainable for one person' },
              ].map(r => (
                <div key={r.channel} className={`flex items-center gap-3 text-xs py-2 px-3 rounded-lg ${r.channel === 'TOTAL FEED' ? 'bg-blue-500/5 border border-blue-500/20' : 'border border-stone-200'}`}>
                  <span className={`w-44 shrink-0 font-medium ${r.channel === 'TOTAL FEED' ? 'text-blue-500' : 'text-[#1A1A1A]'}`}>{r.channel}</span>
                  <span className={`w-32 shrink-0 ${r.channel === 'TOTAL FEED' ? 'text-blue-700' : 'text-stone-700'}`}>{r.freq}</span>
                  <span className="text-stone-500 flex-1">{r.note}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-3">BR slot rotates Tue or Thu morning (~7am Brisbane) - when executives scroll before work.</p>
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
                  targets: 'Archetype 01 (Stressed Executive Woman) + 04 (Slipping High Performer)',
                },
                {
                  num: '02',
                  title: 'The Effort Trap',
                  color: 'violet' as const,
                  desc: 'Why adding more input fails when the body cannot convert it. Contrarian to LinkedIn\'s hustle default.',
                  hook: '"When the system stops responding, the instinct is to add more effort. That\'s the problem."',
                  targets: 'Archetype 01 (Stressed Executive Woman) + 04 (Slipping High Performer)',
                },
                {
                  num: '03',
                  title: 'Physiology and Decision-Making',
                  color: 'amber' as const,
                  desc: 'How depleted state degrades executive function, judgement, energy. Career-relevant angle.',
                  hook: '"The decisions you make at 2pm are not made by the same person who made them at 9am."',
                  targets: 'Archetype 04 (Slipping High Performer) primary, 01 (Stressed Exec) secondary',
                },
                {
                  num: '04',
                  title: 'Interpretation over Prescription',
                  color: 'orange' as const,
                  desc: 'The methodology layer. How BR actually works. Bridges into B2B/licensable later.',
                  hook: '"Most coaches prescribe before they read. That\'s why most programs fail high performers."',
                  targets: 'Archetypes 01 + 04 equally. Bridges into B2B coach audience later.',
                },
              ].map(p => {
                const colorMap = {
                  teal:   { border: 'border-blue-200',   bg: 'bg-blue-500/5',   accent: 'text-blue-500' },
                  violet: { border: 'border-violet-500/30', bg: 'bg-violet-500/5', accent: 'text-violet-700' },
                  amber:  { border: 'border-amber-200',  bg: 'bg-amber-500/5',  accent: 'text-amber-700' },
                  orange: { border: 'border-orange-500/30', bg: 'bg-orange-500/5', accent: 'text-orange-400' },
                }[p.color]
                return (
                  <div key={p.num} className={`p-4 rounded-lg border ${colorMap.border} ${colorMap.bg}`}>
                    <div className="flex items-start gap-3">
                      <span className={`text-lg font-bold font-mono ${colorMap.accent} opacity-60`}>{p.num}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${colorMap.accent} mb-1`}>{p.title}</p>
                        <p className="text-xs text-stone-700 mb-2 leading-relaxed">{p.desc}</p>
                        <p className="text-[13px] text-stone-800 italic leading-relaxed mb-2">{p.hook}</p>
                        <p className="text-[11px] text-stone-700"><span className="font-bold text-stone-900 uppercase tracking-widest">Targets: </span>{p.targets}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-stone-700 mt-3">Each pillar has 8-12 angles in the bank. We don\'t burn them all in month one. Pillars 1 and 4 are workhorse - they fit both LinkedIn primary archetypes equally.</p>
          </Card>

          {/* Tone */}
          <Card>
            <SectionLabel>Tone Rules</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-blue-500/60 mb-2 font-bold">Always</p>
                <div className="space-y-1.5">
                  {[
                    'Performance, recovery, decision-making language',
                    'Short essay format, 150-250 words',
                    'One specific reframe per post',
                    'CTA every 4-5 posts only',
                    'First-person, structured, no fluff',
                  ].map(t => (
                    <div key={t} className="flex items-start gap-2 text-xs text-stone-700">
                      <span className="text-blue-500/60 mt-0.5">+</span> {t}
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
                    'Links in post body (kills reach - put in profile)',
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

          {/* Pipeline & Tracking */}
          <Card>
            <SectionLabel>Pipeline & Source Tracking</SectionLabel>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">12-week pipeline</p>
                <p className="text-xs text-stone-700 mb-1.5">24 posts written, rotated across the 4 pillars. Tue + Thu cadence. CTAs every ~5 posts.</p>
                <p className="text-[11px] text-stone-500 font-mono leading-relaxed">~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/LINKEDIN-BODY-RECODE-12-WEEK-PIPELINE.md</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1.5">First post</p>
                <p className="text-xs text-[#1A1A1A] font-medium">Tue 19 May 2026 · 7am Brisbane · Post 1 of 24 (State over Discipline)</p>
              </div>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Source URL variants</p>
                <div className="space-y-1.5">
                  {[
                    { where: 'In-post CTA',         url: 'performance.bodyrecode.au/scorecard?source=linkedin_post' },
                    { where: 'Profile bio link',    url: 'performance.bodyrecode.au/scorecard?source=linkedin_profile' },
                    { where: 'First comment / DM',  url: 'performance.bodyrecode.au/scorecard?source=linkedin_comment' },
                  ].map(r => (
                    <div key={r.where} className="flex items-center gap-3 text-[11px]">
                      <span className="text-stone-600 w-32 shrink-0">{r.where}</span>
                      <code className="text-blue-500 font-mono text-[10px]">{r.url}</code>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-stone-400 mt-2">All variants collapse to <code className="text-blue-500 font-mono">source=linkedin</code> on the lead, with the variant preserved as <code className="text-blue-500 font-mono">source_detail</code> for granular attribution.</p>
              </div>
            </div>
          </Card>

          {/* Archetype split */}
          <Card>
            <SectionLabel>Which Archetypes LinkedIn Reaches</SectionLabel>
            <Body className="mb-3">Per the validated client mix (100% Remediation / Depleted), the 4 archetypes split unevenly across IG and LinkedIn. LinkedIn primarily reaches archetypes 1 and 4. See <strong className="text-stone-300">Positioning tab</strong> for full archetype detail.</Body>
            <div className="space-y-2">
              {[
                { num: '01', name: 'Stressed Executive Woman', strength: 'Primary on LinkedIn',     color: 'teal' as const,   note: 'LinkedIn morning scroll before work matches her schedule exactly.' },
                { num: '02', name: 'Perimenopausal Performer',  strength: 'Rare on LinkedIn',        color: 'violet' as const, note: 'IG-dominant. Don\'t bias LinkedIn content to her - she will not see it.' },
                { num: '03', name: 'Postnatal Athlete',         strength: 'Rare on LinkedIn',        color: 'amber' as const,  note: 'IG-dominant. Naptime / evening scroll, not LinkedIn morning.' },
                { num: '04', name: 'Slipping High Performer',   strength: 'Primary on LinkedIn',     color: 'orange' as const, note: 'Male executive. LinkedIn is his natural channel. Hooks should target this archetype on roughly 1 in 4 BR LinkedIn posts.' },
              ].map(a => {
                const colorMap = {
                  teal:   { dot: 'bg-teal-600',   accent: 'text-teal-700' },
                  violet: { dot: 'bg-violet-600', accent: 'text-violet-700' },
                  amber:  { dot: 'bg-amber-600',  accent: 'text-amber-700' },
                  orange: { dot: 'bg-orange-600', accent: 'text-orange-700' },
                }[a.color]
                return (
                  <div key={a.num} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 border border-stone-200">
                    <span className={`inline-block w-2 h-2 rounded-full mt-2 ${colorMap.dot}`} />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                        <span className="text-stone-600 font-mono text-xs">{a.num}</span>
                        <p className={`text-sm font-medium ${colorMap.accent}`}>{a.name}</p>
                        <span className="text-[11px] text-stone-600 italic">- {a.strength}</span>
                      </div>
                      <p className="text-[13px] text-stone-800 leading-relaxed">{a.note}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-stone-700 mt-3"><strong className="text-stone-900">Implication:</strong> the BR LinkedIn 12-week pipeline (24 posts) is rightly biased toward archetypes 1 and 4. Archetypes 2 and 3 get their primary reach via Instagram, not LinkedIn.</p>
          </Card>

          {/* How IG and LinkedIn coexist */}
          <Card>
            <SectionLabel>How Instagram and LinkedIn Coexist</SectionLabel>
            <Body>Both feed the same funnel via the two-door model: LinkedIn drives to the scorecard (Door 1 — &quot;find your state&quot;), with the Challenge as the direct door (Door 2). Same demographic, same physiology, executive language.</Body>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-pink-500/5 border border-pink-500/20">
                <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-2">Instagram</p>
                <p className="text-xs text-stone-700 mb-2 font-medium">Body state, fat loss, depleted/transitioning/ready</p>
                <p className="text-[11px] text-stone-500 leading-relaxed">5×/week, scorecard funnel, Meta ads running, consumer voice</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-2">LinkedIn</p>
                <p className="text-xs text-stone-700 mb-2 font-medium">Performance, recovery, decision-making, executive function</p>
                <p className="text-[11px] text-stone-500 leading-relaxed">1-2×/week, organic only, no ads, executive voice</p>
              </div>
            </div>
            <p className="text-xs text-stone-400 mt-3">Same physiology underneath. Different surface. The IG audience and LinkedIn audience are largely distinct, so no copy-paste between channels.</p>
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
      {tab === 'timeline' && (() => {
        const launchStart = new Date('2026-04-08T00:00:00+10:00')
        const today = new Date()
        const dayNumber = Math.floor((today.getTime() - launchStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

        const phases = [
          {
            phase: 'Phase 1 - Pre-Launch',
            days: 'Days 1-8',
            dateRange: '8-15 April 2026',
            startDay: 1, endDay: 8,
            color: 'teal' as const,
            items: [
              'Post 5 profile establishment posts (logo, who you are, the problem, three states, scorecard CTA)',
              'No ads running yet',
              'Profile looks established before anyone is sent there',
            ],
          },
          {
            phase: 'Phase 2 - Ads Launch',
            days: 'Days 9-22',
            dateRange: '16-29 April 2026',
            startDay: 9, endDay: 22,
            color: 'amber' as const,
            items: [
              'Start Meta ads at $20-30/day AUD',
              '3 ad angles running simultaneously (Silent Frustration / Contrarian / Diagnosis)',
              'All ads send to the Body State Scorecard',
              'Film gym reel session before this phase starts',
              'Continue 4x/week organic posting',
            ],
          },
          {
            phase: 'Phase 3 - Optimise',
            days: 'Days 23-45',
            dateRange: '30 April - 22 May 2026',
            startDay: 23, endDay: 45,
            color: 'stone' as const,
            items: [
              'Identify which archetype ad set (01-04) produced lowest CPL and highest scorecard completion - lean in.',
              'Review ad performance - cut 2 underperforming angles',
              'Scale budget on winning angle to $40-50/day',
              'Continue organic content rhythm',
              'Review CPL in Ads dashboard',
            ],
          },
          {
            phase: 'Phase 4 - Scale',
            days: 'Days 46-60+',
            dateRange: '23 May 2026 onwards',
            startDay: 46, endDay: 9999,
            color: 'teal' as const,
            items: [
              'LinkedIn channel launches Tue 19 May 2026 - Tue + Thu cadence, BR executive reframe (parallel funnel into same scorecard)',
              'Add retargeting layer - people who visited scorecard but did not complete',
              'Increase budget on proven creative',
              'Produce 2nd round of ad creative from new scripts',
              'AI avatar variations of winning scripts via Content Engine',
              'Organic content continues - system is now a lead engine, not a full-time job',
            ],
          },
        ]

        const currentPhase = phases.find(p => dayNumber >= p.startDay && dayNumber <= p.endDay) ?? phases[phases.length - 1]

        return (
          <div className="space-y-4">
            <Card>
              <SectionLabel>60-Day Launch Plan</SectionLabel>
              <Body>Consistent for 60-90 days while the funnel launches. After that, ads and retargeting carry acquisition. Organic content maintains authority and warm audience.</Body>
              <p className="text-xs text-stone-400 mt-3">Anchor date: <strong className="text-stone-600">8 April 2026</strong> (Pre-Launch Post 1 = Day 1). <strong className="text-amber-700">Historical:</strong> this is the original April launch plan and its ad-angle names (Silent Frustration / Contrarian / Diagnosis). Superseded by the current Challenge-led, two-door strategy + archetype ad sets (see Overview / Paid Ads). Kept for reference.</p>
            </Card>

            <Card className="border-blue-200 bg-blue-500/5">
              <SectionLabel>You Are Here</SectionLabel>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-blue-500">Day {dayNumber}</span>
                <span className="text-sm text-stone-600">{currentPhase.phase}</span>
              </div>
              <p className="text-xs text-stone-500 mt-2">{currentPhase.dateRange}</p>
            </Card>

            {phases.map(phase => {
              const isCurrent = dayNumber >= phase.startDay && dayNumber <= phase.endDay
              const isPast = dayNumber > phase.endDay
              return (
                <Card key={phase.phase} className={isCurrent ? 'border-blue-200 bg-blue-500/5' : isPast ? 'opacity-60' : ''}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#1A1A1A]">{phase.phase}</p>
                      {isCurrent && <span className="text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-widest">Current</span>}
                      {isPast && <span className="text-[10px] font-bold text-stone-500 bg-stone-200 border border-stone-300 px-2 py-0.5 rounded-full uppercase tracking-widest">Complete</span>}
                    </div>
                    <Tag color={phase.color}>{phase.days}</Tag>
                  </div>
                  <p className="text-xs text-stone-500 mb-3">{phase.dateRange}</p>
                  <BulletList items={phase.items} />
                </Card>
              )
            })}

            <Card className="border-blue-500/20 bg-blue-500/5">
              <SectionLabel>The Rule</SectionLabel>
              <p className="text-sm text-blue-700 font-medium">You don&apos;t need to be consistent forever. You need to be consistent for 60-90 days while the funnel launches. After that, the ads carry acquisition and content maintains trust.</p>
            </Card>
          </div>
        )
      })()}

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
                  linkSet: 'performance.bodyrecode.au/scorecard?source=instagram',
                  statusColor: 'teal' as const,
                },
                {
                  platform: 'Facebook',
                  handle: 'Body Recode',
                  status: 'Live',
                  bioUpdated: true,
                  linkSet: 'performance.bodyrecode.au/scorecard?source=facebook',
                  statusColor: 'teal' as const,
                },
                {
                  platform: 'LinkedIn',
                  handle: 'Kade Dunstone (personal)',
                  status: 'Launching',
                  bioUpdated: false,
                  linkSet: 'performance.bodyrecode.au/scorecard?source=linkedin_profile',
                  statusColor: 'amber' as const,
                },
              ].map(row => (
                <div key={row.platform} className="grid grid-cols-4 gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs">
                  <div>
                    <p className="text-stone-400 mb-0.5">Platform</p>
                    <p className="font-semibold text-[#1A1A1A]">{row.platform}</p>
                    <p className="text-stone-500 mt-0.5">{row.handle}</p>
                  </div>
                  <div>
                    <p className="text-stone-400 mb-0.5">Status</p>
                    <Tag color={row.statusColor}>{row.status}</Tag>
                  </div>
                  <div>
                    <p className="text-stone-400 mb-0.5">Bio</p>
                    <p className={row.bioUpdated ? 'text-blue-500 font-medium' : 'text-red-700 font-medium'}>{row.bioUpdated ? 'Updated' : 'Needs update'}</p>
                  </div>
                  <div>
                    <p className="text-stone-400 mb-0.5">Link</p>
                    <p className="text-stone-600 break-all">{row.linkSet}</p>
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
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm text-stone-700 leading-relaxed whitespace-pre-line font-mono">
                  {`Trained 5 days a week. Ate clean. Body still won't shift?\nYou're Depleted, Transitioning, or Ready.\nFree 2-min Scorecard to find out.`}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-stone-400 mb-1">Username</p>
                  <p className="text-[#1A1A1A] font-medium">@body_recode_</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-stone-400 mb-1">Bio link</p>
                  <p className="text-blue-500">performance.bodyrecode.au/scorecard?source=instagram</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-stone-400 mb-1">Account type</p>
                  <p className="text-[#1A1A1A]">Creator or Business</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-stone-400 mb-1">Link tool</p>
                  <p className="text-[#1A1A1A]">None - one link, one destination</p>
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
                    <div key={h.name} className="flex items-center gap-3 text-xs p-2 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="text-blue-500 font-semibold w-20 shrink-0">{h.name}</span>
                      <span className="text-stone-600">{h.purpose}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-stone-400 mt-2">Set up covers even if empty at launch. Dark background, teal icon or text.</p>
              </div>
            </div>
          </Card>

          {/* Facebook */}
          <Card>
            <SectionLabel>Facebook Page</SectionLabel>
            <div className="space-y-4">
              <div>
                <Heading>Current Bio (About field)</Heading>
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm text-stone-700 leading-relaxed">
                  Performance coaching for people whose bodies stopped responding. Body state interpretation. Training. Nutrition. Find out which state you&apos;re in - 2-min scorecard linked below.
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-stone-400 mb-1">Page name</p>
                  <p className="text-[#1A1A1A] font-medium">Body Recode</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-stone-400 mb-1">Website field</p>
                  <p className="text-blue-500">performance.bodyrecode.au</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-stone-400 mb-1">CTA / scorecard link</p>
                  <p className="text-blue-500">performance.bodyrecode.au/scorecard?source=facebook</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-stone-400 mb-1">Bio updated</p>
                  <p className="text-[#1A1A1A]">9 Apr 2026</p>
                </div>
              </div>
            </div>
          </Card>

          {/* LinkedIn */}
          <Card className="border-blue-500/20 bg-blue-500/5">
            <SectionLabel>LinkedIn Profile</SectionLabel>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">Posted from Kade&apos;s personal LinkedIn profile. No separate Body Recode LinkedIn page. The profile carries The Collective + Personal Brand + Body Recode (executive reframe) content - 4 to 6 posts/week total. See <strong className="text-blue-700">LinkedIn tab</strong> for the BR pillars and pipeline.</p>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <p className="text-stone-400 mb-1">Profile</p>
                <p className="text-[#1A1A1A] font-medium">Kade Dunstone</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <p className="text-stone-400 mb-1">Profile bio link</p>
                <p className="text-blue-500 break-all">performance.bodyrecode.au/scorecard?source=linkedin_profile</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <p className="text-stone-400 mb-1">In-post CTA link</p>
                <p className="text-blue-500 break-all">performance.bodyrecode.au/scorecard?source=linkedin_post</p>
                <p className="text-stone-400 mt-1">Put in first comment, not post body (kills reach)</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <p className="text-stone-400 mb-1">Comment / DM follow-up link</p>
                <p className="text-blue-500 break-all">performance.bodyrecode.au/scorecard?source=linkedin_comment</p>
              </div>
            </div>
            <p className="text-xs text-stone-400 mt-3">All variants collapse to <code className="text-blue-500 font-mono">source=linkedin</code> in the CRM with the variant preserved as <code className="text-blue-500 font-mono">source_detail</code> for granular attribution.</p>
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
                  <span className="text-amber-700 font-medium">{row.terms}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-3">Never use CFFS classification terms in public content. The scorecard gives a signal - the CFFS gives the real classification. That gap protects the value of the paid system.</p>
          </Card>

          {/* Profile setup checklist */}
          <Card>
            <SectionLabel>Profile Setup Checklist</SectionLabel>
            <p className="text-xs text-stone-500 mb-3">Click any item to toggle. State persists in your browser.</p>
            <div className="space-y-1.5">
              {[
                // Instagram (pre-launch is complete)
                { key: 'ig_username', item: 'Username is @body_recode_', defaultDone: true, group: 'Instagram' },
                { key: 'ig_bio',      item: 'Instagram bio matches spec exactly', defaultDone: true, group: 'Instagram' },
                { key: 'ig_biolink',  item: 'Bio link set to performance.bodyrecode.au/scorecard?source=instagram', defaultDone: true, group: 'Instagram' },
                { key: 'ig_photo',    item: 'Profile photo on-brand and high contrast', defaultDone: false, group: 'Instagram' },
                { key: 'ig_highlights', item: 'Highlight covers set up (can be empty)', defaultDone: false, group: 'Instagram' },
                { key: 'ig_account',  item: 'Account is Creator or Business (not Personal)', defaultDone: true, group: 'Instagram' },
                // Facebook
                { key: 'fb_bio',     item: 'Facebook bio updated', defaultDone: true, group: 'Facebook' },
                { key: 'fb_website', item: 'Facebook website field set to performance.bodyrecode.au', defaultDone: false, group: 'Facebook' },
                { key: 'fb_cta',     item: 'Facebook CTA button pointing to scorecard', defaultDone: false, group: 'Facebook' },
                // LinkedIn (launching)
                { key: 'li_bio',     item: 'LinkedIn personal bio includes Body Recode positioning', defaultDone: false, group: 'LinkedIn' },
                { key: 'li_biolink', item: 'LinkedIn profile link set to performance.bodyrecode.au/scorecard?source=linkedin_profile', defaultDone: false, group: 'LinkedIn' },
                { key: 'li_banner',  item: 'LinkedIn banner image set (Collective banner can carry over until BR-specific is made)', defaultDone: false, group: 'LinkedIn' },
                { key: 'li_post1',   item: 'First BR LinkedIn post scheduled / drafted (Tue 19 May 2026)', defaultDone: false, group: 'LinkedIn' },
              ].map(({ key, item, defaultDone, group }) => {
                const done = profileSetup[key] ?? defaultDone
                const groupColor = group === 'Instagram' ? 'text-pink-400' : group === 'Facebook' ? 'text-blue-700' : 'text-blue-700'
                return (
                  <button
                    key={key}
                    onClick={() => toggleProfileItem(key, defaultDone)}
                    className="flex items-center gap-2.5 text-xs py-1.5 border-b border-stone-200 last:border-0 w-full text-left hover:bg-stone-100/40 -mx-2 px-2 rounded transition-colors"
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${done ? 'bg-blue-100 border-blue-300' : 'bg-stone-100 border-stone-300'}`}>
                      {done && <span className="text-blue-500 text-[10px] font-bold">✓</span>}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest w-16 shrink-0 ${groupColor}`}>{group}</span>
                    <span className={done ? 'text-stone-600 line-through' : 'text-stone-700'}>{item}</span>
                  </button>
                )
              })}
            </div>
          </Card>

        </div>
      )}

      {/* ── CALENDAR ── */}
      {tab === 'calendar' && <ContentCalendar />}

      {tab === 'docs' && <StrategyDocs />}
    </div>
  )
}
