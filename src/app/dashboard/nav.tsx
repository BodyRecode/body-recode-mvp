'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import {
  Sunrise, Activity, Terminal,
  Users, ClipboardCheck, MessageCircle, ListChecks, Dumbbell, CalendarDays, HeartPulse, Star, Sparkles,
  Globe, Magnet, Hourglass, Filter, Contact, Inbox, Zap,
  LayoutTemplate, Megaphone, BookOpen, BarChart3, Workflow, MessageSquare, Globe2,
  LayoutDashboard, Gauge, CalendarCheck, CreditCard, Clock, TrendingUp, Compass, Handshake,
  User, Users2,
  Rocket, BookMarked, Bot, LifeBuoy, ShieldCheck, Settings,
} from 'lucide-react'

import type { NavBadges } from '@/lib/dashboard-badges'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
type NavLink = { href: string; label: string; icon: Icon; exact?: boolean }
type NavGroup = { key: string; label: string; items: NavLink[] }

/* The sidebar replaced a top nav with six hover dropdowns. Every route that
 * lived in a dropdown is now visible in the rail: nothing was dropped, only
 * regrouped so the labels read the way the work does. */
const GROUPS: NavGroup[] = [
  {
    key: 'overview',
    label: 'Overview',
    items: [
      { href: '/dashboard/today', label: 'Today', icon: Sunrise },
      { href: '/dashboard', label: 'Live', icon: Activity, exact: true },
      { href: '/dashboard/console', label: 'Console', icon: Terminal },
    ],
  },
  {
    key: 'clients',
    label: 'Clients',
    items: [
      { href: '/dashboard/coaching', label: 'Coaching', icon: Users },
      { href: '/dashboard/checkins', label: 'Check Ins', icon: ClipboardCheck },
      { href: '/dashboard/messages', label: 'Messages', icon: MessageCircle },
      { href: '/dashboard/programs', label: 'Programs', icon: ListChecks },
      { href: '/dashboard/gym-sessions', label: 'Gym', icon: Dumbbell },
      { href: '/dashboard/group-classes', label: 'Classes', icon: CalendarDays },
      { href: '/dashboard/recovery-regulation', label: 'Recovery', icon: HeartPulse },
      { href: '/dashboard/feedback', label: 'Feedback', icon: Star },
      { href: '/dashboard/copilot-review', label: 'Co-Pilot Review', icon: Sparkles },
    ],
  },
  {
    key: 'crm',
    label: 'Pipeline',
    items: [
      { href: '/dashboard/leads', label: 'Leads', icon: Magnet },
      { href: '/dashboard/sources', label: 'Sources', icon: Globe },
      { href: '/dashboard/business/waitlist', label: 'Waitlist', icon: Hourglass },
      { href: '/dashboard/funnel', label: 'Funnel', icon: Filter },
      { href: '/dashboard/business/crm', label: 'CRM', icon: Contact },
      { href: '/dashboard/business/inbox', label: 'Inbox', icon: Inbox },
      { href: '/dashboard/business/outreach', label: 'Booking Agent', icon: Zap },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    items: [
      { href: '/dashboard/business/campaigns', label: 'Campaigns', icon: Megaphone },
      { href: '/dashboard/business/content', label: 'Content', icon: BookOpen },
      { href: '/dashboard/business/ads', label: 'Ads', icon: BarChart3 },
      { href: '/dashboard/business/automations', label: 'Automations', icon: Workflow },
      { href: '/dashboard/sms', label: 'SMS Pulse', icon: MessageSquare },
      { href: '/dashboard/business/funnels', label: 'Funnel Pages', icon: LayoutTemplate },
      { href: '/dashboard/business/website', label: 'Website', icon: Globe2 },
    ],
  },
  {
    key: 'business',
    label: 'Business',
    items: [
      { href: '/dashboard/business', label: 'Hub', icon: LayoutDashboard, exact: true },
      { href: '/dashboard/scorecard', label: 'CEO Scorecard', icon: Gauge },
      { href: '/dashboard/business/bookings', label: 'Bookings', icon: CalendarCheck },
      { href: '/dashboard/business/payments', label: 'Payments', icon: CreditCard },
      { href: '/dashboard/business/availability', label: 'Availability', icon: Clock },
      { href: '/dashboard/business/analytics', label: 'Analytics', icon: TrendingUp },
      { href: '/dashboard/business/strategy', label: 'Strategy', icon: Compass },
      { href: '/dashboard/partner-room', label: 'Partner Room', icon: Handshake },
    ],
  },
  {
    key: 'brands',
    label: 'Brands',
    items: [
      { href: '/dashboard/business/personal-brand', label: 'Personal Brand', icon: User },
      { href: '/dashboard/business/collective', label: 'The Collective', icon: Users2 },
    ],
  },
  {
    key: 'meta',
    label: 'Setup',
    items: [
      { href: '/dashboard/getting-started', label: 'Setup', icon: Rocket },
      { href: '/dashboard/help', label: 'Guide', icon: BookMarked },
      { href: '/dashboard/copilot-guide', label: 'Co-Pilot', icon: Bot },
      { href: '/dashboard/support', label: 'Support', icon: LifeBuoy },
      { href: '/dashboard/system-health', label: 'System', icon: ShieldCheck },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
]

const DEV_ONLY: NavLink = {
  href: '/dashboard/business/peer-review',
  label: 'Peer Review',
  icon: ShieldCheck,
}
const DEV_ONLY_ROUTES = new Set([DEV_ONLY.href])

function isLinkActive(pathname: string, link: NavLink): boolean {
  return link.exact
    ? pathname === link.href
    : pathname === link.href || pathname.startsWith(link.href + '/')
}

/** Label for the page you are on - used by the panel header breadcrumb. */
export function useNavLocation(): { group: string; label: string } | null {
  const pathname = usePathname() || '/dashboard'
  for (const group of GROUPS) {
    for (const item of group.items) {
      if (isLinkActive(pathname, item)) return { group: group.label, label: item.label }
    }
  }
  return null
}

function NavItem({
  link,
  active,
  badge,
  onNavigate,
}: {
  link: NavLink
  active: boolean
  badge?: { count: number; tone: 'info' | 'alert' }
  onNavigate?: () => void
}) {
  const Icon = link.icon
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-colors ${
        active
          ? 'bg-white text-[#1B6DFC] font-medium shadow-[0_1px_3px_rgba(16,24,40,0.09),0_1px_2px_-1px_rgba(16,24,40,0.05)]'
          : 'text-[#464C58] hover:bg-white/85 hover:text-[#1A1A1A]'
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-[7px] bottom-[7px] w-[3px] rounded-r-[3px]"
          style={{ background: 'linear-gradient(180deg,#4B8DFF,#1B6DFC)' }}
        />
      )}
      <Icon size={15} strokeWidth={2} className={active ? 'opacity-100' : 'opacity-60'} />
      <span className="truncate">{link.label}</span>
      {badge && badge.count > 0 && (
        <span
          title={`${badge.count} waiting`}
          className="ml-auto shrink-0 text-[10.5px] font-semibold text-white rounded-full px-1.5 py-px min-w-[18px] text-center"
          style={{
            fontVariantNumeric: 'tabular-nums',
            background: badge.tone === 'alert'
              ? 'linear-gradient(180deg,#EF4444,#DC2626)'
              : 'linear-gradient(180deg,#3B82F9,#1B6DFC)',
            boxShadow: badge.tone === 'alert'
              ? '0 1px 2px rgba(220,38,38,0.35)'
              : '0 1px 2px rgba(27,109,252,0.35)',
          }}
        >
          {badge.count > 99 ? '99+' : badge.count}
        </span>
      )}
    </Link>
  )
}

export default function DashboardNav({
  onNavigate,
  badges = {},
}: {
  onNavigate?: () => void
  badges?: NavBadges
}) {
  const pathname = usePathname() || '/dashboard'
  const [devMode, setDevMode] = useState(false)

  useEffect(() => {
    const check = () => {
      setDevMode(new URLSearchParams(window.location.search).get('dev') === '1')
    }
    check()
    window.addEventListener('popstate', check)
    return () => window.removeEventListener('popstate', check)
  }, [pathname])

  const showDev = devMode || DEV_ONLY_ROUTES.has(pathname)

  return (
    <nav className="px-2.5 pb-4 pt-1">
      {GROUPS.map((group) => {
        const items =
          group.key === 'meta' && showDev ? [...group.items, DEV_ONLY] : group.items
        return (
          <div key={group.key} className="mb-0.5">
            <p className="px-2 pt-3.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#9AA2B0]">
              {group.label}
            </p>
            <div className="flex flex-col gap-[1px]">
              {items.map((link) => (
                <NavItem
                  key={link.href}
                  link={link}
                  active={isLinkActive(pathname, link)}
                  badge={badges[link.href]}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        )
      })}
      {showDev && (
        <p
          className="mt-3 mx-2 text-[10px] font-semibold uppercase tracking-widest text-[#B45309] bg-[#FEF3C7] px-1.5 py-0.5 rounded inline-block"
          title="Dev-only nav items are visible (append ?dev=1 to any dashboard URL to toggle)"
        >
          dev
        </p>
      )}
    </nav>
  )
}
