'use client'

import Link from 'next/link'
import { canAccess, type ProductTier } from '@/lib/product-tier'
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
  Flag, Blocks,
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
      // "Coaching" under a group called Clients read as two names for one
      // thing, and it is the wrong word for a product that does not do the
      // coaching. 21 Sep 2026.
      { href: '/dashboard/coaching', label: 'All Clients', icon: Users },
      { href: '/dashboard/checkins', label: 'Check Ins', icon: ClipboardCheck },
      { href: '/dashboard/practice', label: 'Your Practice', icon: Activity },
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
    /* The SaaS is a separate business from the coaching practice, so it gets its
     * own section rather than a page inside Business. The buildout board moved
     * here from Settings at the same time: a board nobody can find is a board
     * nobody reads. */
    key: 'saas',
    label: 'Product',
    items: [
      { href: '/dashboard/build', label: 'Build', icon: Blocks },
      { href: '/dashboard/saas', label: 'SaaS Launch', icon: Flag, exact: true },
    ],
  },
  {
    key: 'brands',
    label: 'Brands',
    items: [
      { href: '/dashboard/business/personal-brand', label: 'Personal Brand', icon: User },
      { href: '/dashboard/business/collective', label: 'The Collective', icon: Users2 },
      { href: '/dashboard/business/coaches', label: 'Coaches', icon: Users2 },
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

/**
 * The nav a given tenant should see.
 *
 * Presentation only — the real gate is in the dashboard layout, which redirects.
 * This exists so a licensee is not shown doors that will not open. A group whose
 * every item is out of reach disappears entirely rather than sitting there empty.
 */
function visibleGroups(tier: ProductTier): NavGroup[] {
  if (tier === 'owner') return GROUPS
  return GROUPS
    .map(g => ({ ...g, items: g.items.filter(i => canAccess(tier, i.href)) }))
    .filter(g => g.items.length > 0)
}

function isLinkActive(pathname: string, link: NavLink): boolean {
  return link.exact
    ? pathname === link.href
    : pathname === link.href || pathname.startsWith(link.href + '/')
}

/** Label for the page you are on - used by the panel header breadcrumb. */
export function useNavLocation(tier: ProductTier = 'owner'): { group: string; label: string } | null {
  const pathname = usePathname() || '/dashboard'
  for (const group of visibleGroups(tier)) {
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
          ? 'bg-[#1A1E26] text-[#FAFAF8] font-semibold shadow-[0_1px_3px_rgba(15,17,21,0.08),0_1px_2px_-1px_rgba(15,17,21,0.05)]'
          : 'text-[#C2C6CC] hover:bg-white/[0.06] hover:text-[#FAFAF8]'
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-[7px] bottom-[7px] w-[3px] rounded-r-[3px]"
          style={{ background: '#FAFAF8' }}
        />
      )}
      <Icon size={15} strokeWidth={2} className={active ? 'opacity-100' : 'opacity-60'} />
      <span className="truncate">{link.label}</span>
      {badge && badge.count > 0 && (
        <span
          title={`${badge.count} waiting`}
          className="ml-auto shrink-0 text-[10.5px] font-bold rounded-full px-1.5 py-px min-w-[18px] text-center"
          style={{
            fontVariantNumeric: 'tabular-nums',
            // A count of things waiting is NOT a meaning colour. It is a
            // number, and it is graphite like every other number in the
            // product. 'alert' is the exception and stays coloured, because
            // that one does mean something.
            background: badge.tone === 'alert' ? '#8F2D2D' : '#FAFAF8',
            color: badge.tone === 'alert' ? '#FAFAF8' : '#0B0D10',
            boxShadow: badge.tone === 'alert'
              ? '0 1px 2px rgba(143,45,45,0.30)'
              : '0 1px 2px rgba(15,17,21,0.24)',
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
  tier,
}: {
  onNavigate?: () => void
  badges?: NavBadges
  /** This coach's own tier, resolved on the server. See src/lib/coach-tier.ts. */
  tier: ProductTier
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
      {visibleGroups(tier).map((group) => {
        const items =
          group.key === 'meta' && showDev ? [...group.items, DEV_ONLY] : group.items
        return (
          <div key={group.key} className="mb-0.5">
            <p className="px-2 pt-3.5 pb-1.5 text-[10.5px] font-semibold text-[#676D76]">
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
          className="mt-3 mx-2 text-[11.5px] font-medium text-[#B06E1F] bg-[#FDF8F1] px-1.5 py-0.5 rounded inline-block"
          title="Dev-only nav items are visible (append ?dev=1 to any dashboard URL to toggle)"
        >
          dev
        </p>
      )}
    </nav>
  )
}
