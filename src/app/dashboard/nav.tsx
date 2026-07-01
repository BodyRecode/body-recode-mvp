'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

type NavLink = { href: string; label: string; exact?: boolean }
type NavCluster = { key: string; label: string; items: NavLink[] }

const OVERVIEW: NavLink[] = [
  { href: '/dashboard/today', label: 'Today' },
  { href: '/dashboard', label: 'Live', exact: true },
  { href: '/dashboard/scorecard', label: 'CEO' },
]

const CRM_CLUSTER: NavCluster = {
  key: 'crm',
  label: 'CRM',
  items: [
    { href: '/dashboard/sources', label: 'Sources' },
    { href: '/dashboard/leads', label: 'Leads' },
    { href: '/dashboard/business/waitlist', label: 'Waitlist' },
    { href: '/dashboard/funnel', label: 'Funnel' },
    { href: '/dashboard/business/crm', label: 'CRM' },
    { href: '/dashboard/business/inbox', label: 'Inbox' },
  ],
}

const CLIENTS_CLUSTER: NavCluster = {
  key: 'clients',
  label: 'Clients',
  items: [
    { href: '/dashboard/coaching', label: 'Coaching' },
    { href: '/dashboard/programs', label: 'Programs' },
    { href: '/dashboard/gym-sessions', label: 'Gym' },
    { href: '/dashboard/group-classes', label: 'Classes' },
    { href: '/dashboard/recovery-regulation', label: 'Recovery' },
    { href: '/dashboard/feedback', label: 'Feedback' },
  ],
}

const MARKETING_CLUSTER: NavCluster = {
  key: 'marketing',
  label: 'Marketing',
  items: [
    { href: '/dashboard/business/funnels', label: 'Funnel Pages' },
    { href: '/dashboard/business/campaigns', label: 'Campaigns' },
    { href: '/dashboard/business/content', label: 'Content' },
    { href: '/dashboard/business/ads', label: 'Ads' },
    { href: '/dashboard/business/automations', label: 'Automations' },
    { href: '/dashboard/business/website', label: 'Website' },
  ],
}

const BUSINESS_CLUSTER: NavCluster = {
  key: 'business',
  label: 'Business',
  items: [
    { href: '/dashboard/business', label: 'Hub', exact: true },
    { href: '/dashboard/business/bookings', label: 'Bookings' },
    { href: '/dashboard/business/payments', label: 'Payments' },
    { href: '/dashboard/business/availability', label: 'Availability' },
    { href: '/dashboard/business/analytics', label: 'Analytics' },
    { href: '/dashboard/business/strategy', label: 'Strategy' },
  ],
}

const BRANDS_CLUSTER_BASE: NavLink[] = [
  { href: '/dashboard/business/personal-brand', label: 'Personal Brand' },
  { href: '/dashboard/business/studio-of-ten', label: 'Studio of Ten' },
]

const META: NavLink[] = [
  { href: '/dashboard/help', label: 'Guide' },
  { href: '/dashboard/system-health', label: 'System' },
]

const DEV_ONLY_ROUTES = new Set([
  '/dashboard/business/ai-cofounder',
  '/dashboard/business/peer-review',
])

function isLinkActive(pathname: string, link: NavLink): boolean {
  return link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(link.href + '/')
}

function clusterActive(pathname: string, cluster: NavCluster): boolean {
  return cluster.items.some((item) => isLinkActive(pathname, item))
}

function TopLink({ link, pathname }: { link: NavLink; pathname: string }) {
  const active = isLinkActive(pathname, link)
  return (
    <Link
      href={link.href}
      className={`relative text-[13px] px-3.5 py-2 rounded-md transition-colors whitespace-nowrap ${
        active
          ? 'text-[#1A1A1A] bg-[#F0F0F0]'
          : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F4F4F4]'
      }`}
    >
      {link.label}
      {active && (
        <span className="absolute left-1/2 -translate-x-1/2 -bottom-[17px] w-6 h-[2px] rounded-full bg-[#1B6DFC]" />
      )}
    </Link>
  )
}

function ClusterDropdown({
  cluster,
  pathname,
  openKey,
  setOpenKey,
}: {
  cluster: NavCluster
  pathname: string
  openKey: string | null
  setOpenKey: (k: string | null) => void
}) {
  const active = clusterActive(pathname, cluster)
  const open = openKey === cluster.key
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenKey(null)
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenKey(null)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open, setOpenKey])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpenKey(open ? null : cluster.key)}
        className={`relative flex items-center gap-1 text-[13px] px-3.5 py-2 rounded-md transition-colors whitespace-nowrap ${
          active || open
            ? 'text-[#1A1A1A] bg-[#F0F0F0]'
            : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F4F4F4]'
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {cluster.label}
        <ChevronDown
          size={12}
          strokeWidth={2.5}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
        {active && (
          <span className="absolute left-1/2 -translate-x-1/2 -bottom-[17px] w-6 h-[2px] rounded-full bg-[#1B6DFC]" />
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-[calc(100%+8px)] min-w-[180px] rounded-lg border border-[#E5E5E5] bg-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] py-1.5 z-50"
        >
          {cluster.items.map((item) => {
            const itemActive = isLinkActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpenKey(null)}
                className={`block px-3.5 py-2 text-[13px] transition-colors ${
                  itemActive
                    ? 'text-[#1B6DFC] bg-[#F0F6FF] font-medium'
                    : 'text-[#4B4B4B] hover:text-[#1A1A1A] hover:bg-[#F6F6F6]'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function DashboardNav() {
  const pathname = usePathname() || '/dashboard'
  const searchParams = useSearchParams()
  const [openKey, setOpenKey] = useState<string | null>(null)

  const devMode = searchParams?.get('dev') === '1'

  const brandsCluster: NavCluster = {
    key: 'brands',
    label: 'Brands',
    items: devMode
      ? [...BRANDS_CLUSTER_BASE, { href: '/dashboard/business/ai-cofounder', label: 'AI Co-Founder' }]
      : BRANDS_CLUSTER_BASE,
  }

  const metaLinks: NavLink[] = devMode
    ? [...META, { href: '/dashboard/business/peer-review', label: 'Peer Review' }]
    : META

  const onDevOnlyRoute = DEV_ONLY_ROUTES.has(pathname)
  const showDevAffordance = devMode || onDevOnlyRoute

  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
      {OVERVIEW.map((link) => (
        <TopLink key={link.href} link={link} pathname={pathname} />
      ))}
      <span className="mx-1.5 h-5 w-px bg-[#E5E5E5]" aria-hidden />
      <ClusterDropdown cluster={CRM_CLUSTER} pathname={pathname} openKey={openKey} setOpenKey={setOpenKey} />
      <ClusterDropdown cluster={CLIENTS_CLUSTER} pathname={pathname} openKey={openKey} setOpenKey={setOpenKey} />
      <ClusterDropdown cluster={MARKETING_CLUSTER} pathname={pathname} openKey={openKey} setOpenKey={setOpenKey} />
      <ClusterDropdown cluster={BUSINESS_CLUSTER} pathname={pathname} openKey={openKey} setOpenKey={setOpenKey} />
      <ClusterDropdown cluster={brandsCluster} pathname={pathname} openKey={openKey} setOpenKey={setOpenKey} />
      <span className="mx-1.5 h-5 w-px bg-[#E5E5E5]" aria-hidden />
      {metaLinks.map((link) => (
        <TopLink key={link.href} link={link} pathname={pathname} />
      ))}
      {showDevAffordance && (
        <span
          className="ml-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#B45309] bg-[#FEF3C7] px-1.5 py-0.5 rounded"
          title="Dev-only nav items are visible (append ?dev=1 to any dashboard URL to toggle)"
        >
          dev
        </span>
      )}
    </nav>
  )
}
