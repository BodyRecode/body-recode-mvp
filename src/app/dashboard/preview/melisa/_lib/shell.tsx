'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { HERMONY } from './brand'

/**
 * Mirror of the real dashboard header/nav layout, rebranded for the
 * Hermony (Melisa) preview. Same sticky header, same nav clusters, same
 * cadence - only the brand mark, brand name, and accent bar change.
 *
 * This is what "white-label" actually means: identical platform, her
 * brand. When the tenant is provisioned for real, she gets Kade's
 * dashboard verbatim with tenant_config.brand read at render time.
 */
const BASE = '/dashboard/preview/melisa'
const MONO = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

type NavLink = { href: string; label: string; exact?: boolean }
type NavCluster = { key: string; label: string; items: NavLink[] }

const OVERVIEW: NavLink[] = [
  { href: `${BASE}`,           label: 'Today' },
  { href: `${BASE}/live`,      label: 'Live' },
]

const CRM_CLUSTER: NavCluster = {
  key: 'crm',
  label: 'CRM',
  items: [
    { href: `${BASE}/leads`,     label: 'Leads' },
    { href: `${BASE}/waitlist`,  label: 'Waitlist' },
    { href: `${BASE}/funnel`,    label: 'Funnel' },
    { href: `${BASE}/inbox`,     label: 'Inbox' },
  ],
}

const CLIENTS_CLUSTER: NavCluster = {
  key: 'clients',
  label: 'Students',
  items: [
    { href: `${BASE}/coaching`,  label: 'Coaching' },
    { href: `${BASE}/programs`,  label: 'Programs' },
    { href: `${BASE}/classes`,   label: 'Classes' },
    { href: `${BASE}/feedback`,  label: 'Feedback' },
  ],
}

const MARKETING_CLUSTER: NavCluster = {
  key: 'marketing',
  label: 'Marketing',
  items: [
    { href: `${BASE}/content`,      label: 'Content' },
    { href: `${BASE}/campaigns`,    label: 'Campaigns' },
    { href: `${BASE}/website`,      label: 'Website' },
    { href: `${BASE}/automations`,  label: 'Automations' },
  ],
}

const BUSINESS_CLUSTER: NavCluster = {
  key: 'business',
  label: 'Business',
  items: [
    { href: `${BASE}/business`,   label: 'Hub' },
    { href: `${BASE}/scorecard`,  label: 'CEO' },
    { href: `${BASE}/payments`,   label: 'Payments' },
    { href: `${BASE}/bookings`,   label: 'Bookings' },
    { href: `${BASE}/analytics`,  label: 'Analytics' },
  ],
}

const META: NavLink[] = [
  { href: `${BASE}/guide`,    label: 'Guide' },
  { href: `${BASE}/system`,   label: 'System' },
  { href: `${BASE}/settings`, label: 'Settings' },
]

export function HermonyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || BASE

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      {/* Preview banner - thin strip */}
      <div
        className="text-center py-1 text-[10px] font-bold uppercase tracking-widest"
        style={{ backgroundColor: '#1A1A1A', color: '#F8F8F8', letterSpacing: '0.14em' }}
      >
        Preview mockup · not a live tenant · <Link href="/dashboard/preview" className="underline">back to previews</Link>
      </div>

      {/* Sticky header - identical structure to real DashboardLayout */}
      <header
        className="sticky top-0 z-50 border-b border-[#E5E5E5] backdrop-blur-xl"
        style={{ background: 'rgba(255, 255, 255, 0.85)' }}
      >
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-9 min-w-0">
            <Link href={BASE} className="flex items-center gap-3 shrink-0">
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg font-bold text-[13px] tracking-tight text-white"
                style={{ background: HERMONY.accentBar, fontFamily: MONO }}
              >
                {HERMONY.initials}
              </span>
              <span className="text-[16px] font-semibold text-[#1A1A1A] tracking-tight">{HERMONY.name}</span>
            </Link>
            <HermonyNav pathname={pathname} />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-[#6B6B6B] px-2.5 py-1 rounded-full border border-[#E5E5E5] bg-[#F8F8F8]"
              style={{ fontFamily: MONO }}
            >
              <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_6px] shadow-current" style={{ background: HERMONY.accentBar, color: HERMONY.accentBar }} />
              live
            </span>
            <span className="hidden lg:inline text-[#999999] text-[11px] tracking-wide">{HERMONY.founder.toLowerCase()}@hermony.com.au</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}

function isLinkActive(pathname: string, link: NavLink): boolean {
  if (link.href === BASE) return pathname === BASE
  return pathname === link.href || pathname.startsWith(link.href + '/')
}

function clusterActive(pathname: string, cluster: NavCluster): boolean {
  return cluster.items.some((item) => isLinkActive(pathname, item))
}

function HermonyNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
      {OVERVIEW.map((link) => (
        <TopLink key={link.href} link={link} pathname={pathname} />
      ))}
      <span className="mx-1.5 h-5 w-px bg-[#E5E5E5]" aria-hidden />
      <ClusterButton cluster={CRM_CLUSTER} pathname={pathname} />
      <ClusterButton cluster={CLIENTS_CLUSTER} pathname={pathname} />
      <ClusterButton cluster={MARKETING_CLUSTER} pathname={pathname} />
      <ClusterButton cluster={BUSINESS_CLUSTER} pathname={pathname} />
      <span className="mx-1.5 h-5 w-px bg-[#E5E5E5]" aria-hidden />
      {META.map((link) => (
        <TopLink key={link.href} link={link} pathname={pathname} />
      ))}
    </nav>
  )
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
        <span
          className="absolute left-1/2 -translate-x-1/2 -bottom-[17px] w-6 h-[2px] rounded-full"
          style={{ background: HERMONY.accentBar }}
        />
      )}
    </Link>
  )
}

function ClusterButton({ cluster, pathname }: { cluster: NavCluster; pathname: string }) {
  const active = clusterActive(pathname, cluster)
  // Mock: click goes to first item in cluster (dropdown behavior is real in production)
  const target = cluster.items[0]?.href || '#'
  return (
    <Link
      href={target}
      className={`relative flex items-center gap-1 text-[13px] px-3.5 py-2 rounded-md transition-colors whitespace-nowrap ${
        active
          ? 'text-[#1A1A1A] bg-[#F0F0F0]'
          : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F4F4F4]'
      }`}
    >
      {cluster.label}
      <ChevronDown size={12} strokeWidth={2.5} />
      {active && (
        <span
          className="absolute left-1/2 -translate-x-1/2 -bottom-[17px] w-6 h-[2px] rounded-full"
          style={{ background: HERMONY.accentBar }}
        />
      )}
    </Link>
  )
}
