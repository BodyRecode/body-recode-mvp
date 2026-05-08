'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Home,
  Users,
  GraduationCap,
  Database,
  Briefcase,
  Image as ImageIcon,
  Dumbbell,
  Group,
  Filter,
  BookOpen,
  Activity,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Command as CommandIcon,
  UserPlus,
  Inbox,
  CalendarClock,
  CreditCard,
  Megaphone,
  TrendingUp,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

interface CommandItem {
  id: string
  label: string
  hint?: string
  href: string
  icon: LucideIcon
  group: 'Navigate' | 'Actions' | 'Business' | 'Coaching'
  keywords?: string[]
}

const COMMANDS: CommandItem[] = [
  // Navigate
  { id: 'nav-home',     label: 'Home',                 href: '/dashboard',                   icon: Home,           group: 'Navigate' },
  { id: 'nav-leads',    label: 'Leads',                href: '/dashboard/leads',             icon: Users,          group: 'Navigate', keywords: ['pipeline', 'prospects'] },
  { id: 'nav-coaching', label: 'Coaching',             href: '/dashboard/coaching',          icon: GraduationCap,  group: 'Navigate', keywords: ['clients', 'check-ins'] },
  { id: 'nav-programs', label: 'Programs',             href: '/dashboard/programs',          icon: Dumbbell,       group: 'Navigate', keywords: ['training', 'floor', 'on the floor', 'block', 'program'] },
  { id: 'nav-sources',  label: 'Sources',              href: '/dashboard/sources',           icon: Database,       group: 'Navigate' },
  { id: 'nav-business', label: 'Business',             href: '/dashboard/business',          icon: Briefcase,      group: 'Navigate' },
  { id: 'nav-assets',   label: 'Assets',               href: '/dashboard/preview',           icon: ImageIcon,      group: 'Navigate' },
  { id: 'nav-gym',      label: 'Gym Sessions',         href: '/dashboard/gym-sessions',      icon: Dumbbell,       group: 'Navigate' },
  { id: 'nav-classes',  label: 'Group Classes',        href: '/dashboard/group-classes',     icon: Group,          group: 'Navigate' },
  { id: 'nav-funnel',   label: 'Funnel',               href: '/dashboard/funnel',            icon: Filter,         group: 'Navigate' },
  { id: 'nav-guide',    label: 'Guide',                href: '/dashboard/help',              icon: BookOpen,       group: 'Navigate' },
  { id: 'nav-system',   label: 'System Health',        href: '/dashboard/system-health',     icon: Activity,       group: 'Navigate' },

  // Actions
  { id: 'act-new-lead',   label: 'New Lead',             hint: 'Create a lead manually',           href: '/dashboard/leads/new',     icon: UserPlus,      group: 'Actions' },
  { id: 'act-new-client', label: 'New Client',           hint: 'Add a new coaching client',        href: '/dashboard/clients/new',   icon: UserPlus,      group: 'Actions' },
  { id: 'act-inbox',      label: 'Open Inbox',           hint: 'Latest scorecards awaiting work',  href: '/dashboard/leads?status=new_check_in', icon: Inbox, group: 'Actions' },
  { id: 'act-zoom-due',   label: 'Leads needing Zoom',   hint: 'Reports sent, no call booked',     href: '/dashboard/leads?status=report_sent',  icon: CalendarClock, group: 'Actions' },

  // Business sub-modules
  { id: 'biz-crm',         label: 'CRM',              href: '/dashboard/business/crm',         icon: Users,        group: 'Business' },
  { id: 'biz-inbox',       label: 'Inbox',            href: '/dashboard/business/inbox',       icon: Inbox,        group: 'Business' },
  { id: 'biz-bookings',    label: 'Bookings',         href: '/dashboard/business/bookings',    icon: CalendarClock,group: 'Business' },
  { id: 'biz-availability',label: 'Availability',     href: '/dashboard/business/availability',icon: CalendarClock,group: 'Business' },
  { id: 'biz-payments',    label: 'Payments',         href: '/dashboard/business/payments',    icon: CreditCard,   group: 'Business' },
  { id: 'biz-funnels',     label: 'Funnels',          href: '/dashboard/business/funnels',     icon: Filter,       group: 'Business' },
  { id: 'biz-campaigns',   label: 'Campaigns',        href: '/dashboard/business/campaigns',   icon: Megaphone,    group: 'Business' },
  { id: 'biz-content',     label: 'Content',          href: '/dashboard/business/content',     icon: Sparkles,     group: 'Business' },
  { id: 'biz-ads',         label: 'Ads',              href: '/dashboard/business/ads',         icon: Megaphone,    group: 'Business' },
  { id: 'biz-analytics',   label: 'Analytics',        href: '/dashboard/business/analytics',   icon: TrendingUp,   group: 'Business' },
  { id: 'biz-strategy',    label: 'Strategy',         href: '/dashboard/business/strategy',    icon: TrendingUp,   group: 'Business' },
  { id: 'biz-automations', label: 'Automations',      href: '/dashboard/business/automations', icon: Activity,     group: 'Business' },
  { id: 'biz-cofounder',   label: 'AI Co-Founder',    href: '/dashboard/business/ai-cofounder',icon: Sparkles,     group: 'Business' },
  { id: 'biz-personal',    label: 'Personal Brand',   href: '/dashboard/business/personal-brand', icon: Sparkles,  group: 'Business' },
  { id: 'biz-website',     label: 'Website',          href: '/dashboard/business/website',     icon: ImageIcon,    group: 'Business' },
  { id: 'biz-studio',      label: 'Studio of Ten',    href: '/dashboard/business/studio-of-ten', icon: Briefcase,  group: 'Business' },
  { id: 'biz-peer',        label: 'Peer Review',      href: '/dashboard/business/peer-review', icon: Users,        group: 'Business' },
]

function score(item: CommandItem, query: string): number {
  if (!query) return 1
  const q = query.toLowerCase()
  const haystack = [
    item.label.toLowerCase(),
    item.hint?.toLowerCase() ?? '',
    item.group.toLowerCase(),
    ...(item.keywords?.map(k => k.toLowerCase()) ?? []),
  ].join(' ')
  if (item.label.toLowerCase().startsWith(q)) return 100
  if (item.label.toLowerCase().includes(q)) return 70
  if (haystack.includes(q)) return 40
  // fuzzy: every char appears in order
  let i = 0
  for (const ch of item.label.toLowerCase()) {
    if (ch === q[i]) i++
    if (i === q.length) return 20
  }
  return 0
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  // Open with ⌘K / Ctrl+K, close with Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      // focus the input on next paint
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const filtered = useMemo(() => {
    const scored = COMMANDS
      .map(c => ({ c, s: score(c, query) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
    return scored.map(x => x.c)
  }, [query])

  // Reset active index when filter changes
  useEffect(() => { setActiveIdx(0) }, [query])

  // Group filtered items, preserving order
  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    for (const item of filtered) {
      groups[item.group] = groups[item.group] || []
      groups[item.group].push(item)
    }
    return Object.entries(groups)
  }, [filtered])

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[activeIdx]) {
      e.preventDefault()
      router.push(filtered[activeIdx].href)
      setOpen(false)
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  if (!open) return null

  let runningIdx = -1

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      onClick={() => setOpen(false)}
      style={{ background: 'rgba(12, 10, 9, 0.72)', backdropFilter: 'blur(8px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        onKeyDown={onListKey}
        className="w-full max-w-[640px] bg-[#111110] border border-[#1c1917] rounded-2xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] overflow-hidden"
        role="dialog"
        aria-label="Command palette"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1c1917]">
          <Search size={16} className="text-[#57534e] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, actions…"
            className="flex-1 bg-transparent text-[14px] text-white placeholder:text-[#57534e] outline-none"
          />
          <span
            className="hidden sm:inline-flex items-center gap-1 text-[10px] text-[#57534e] px-1.5 py-0.5 rounded border border-[#1c1917] bg-[#0c0a09]"
            style={{ fontFamily: MONO_FONT }}
          >
            esc
          </span>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[420px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[13px] text-[#a8a29e]">No matches</p>
              <p className="text-[11px] text-[#57534e] mt-1">Try a different search</p>
            </div>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="mb-2 last:mb-0">
                <div
                  className="text-[10px] text-[#57534e] uppercase px-3 pt-2 pb-1"
                  style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
                >
                  {group}
                </div>
                {items.map(item => {
                  runningIdx++
                  const idx = runningIdx
                  const active = idx === activeIdx
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      data-idx={idx}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => { router.push(item.href); setOpen(false) }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        active ? 'bg-[#1c1917]' : 'hover:bg-[#1c1917]/60'
                      }`}
                    >
                      <Icon size={15} className={active ? 'text-[#14b8a6]' : 'text-[#a8a29e]'} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white truncate">{item.label}</p>
                        {item.hint && (
                          <p className="text-[11px] text-[#57534e] truncate">{item.hint}</p>
                        )}
                      </div>
                      {active && (
                        <CornerDownLeft size={13} className="text-[#57534e] shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-[#1c1917] text-[10px] text-[#57534e]"
          style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <ArrowUp size={11} /><ArrowDown size={11} /> navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <CornerDownLeft size={11} /> select
            </span>
          </div>
          <span className="inline-flex items-center gap-1">
            <CommandIcon size={11} /> K
          </span>
        </div>
      </div>
    </div>
  )
}
