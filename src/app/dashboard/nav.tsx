'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', exact: true },
  { href: '/dashboard/today', label: 'Today' },
  { href: '/dashboard/scorecard', label: 'Scorecard' },
  { href: '/dashboard/leads', label: 'Leads' },
  { href: '/dashboard/coaching', label: 'Coaching' },
  { href: '/dashboard/programs', label: 'Programs' },
  { href: '/dashboard/sources', label: 'Sources' },
  { href: '/dashboard/business', label: 'Business' },
  { href: '/dashboard/preview', label: 'Assets' },
  { href: '/dashboard/gym-sessions', label: 'Gym' },
  { href: '/dashboard/group-classes', label: 'Classes' },
  { href: '/dashboard/funnel', label: 'Funnel' },
  { href: '/dashboard/recovery-regulation', label: 'Recovery' },
  { href: '/dashboard/help', label: 'Guide' },
  { href: '/dashboard/system-health', label: 'System' },
]

export default function DashboardNav() {
  const pathname = usePathname() || '/dashboard'

  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
      {NAV_ITEMS.map(item => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative text-[13px] px-3.5 py-2 rounded-md transition-colors whitespace-nowrap ${
              active
                ? 'text-[#1A1A1A] bg-[#F0F0F0]'
                : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F4F4F4]'
            }`}
          >
            {item.label}
            {active && (
              <span className="absolute left-1/2 -translate-x-1/2 -bottom-[17px] w-6 h-[2px] rounded-full bg-[#1B6DFC]" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
