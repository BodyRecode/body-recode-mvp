'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', exact: true },
  { href: '/dashboard/leads', label: 'Leads' },
  { href: '/dashboard/coaching', label: 'Coaching' },
  { href: '/dashboard/sources', label: 'Sources' },
  { href: '/dashboard/business', label: 'Business' },
  { href: '/dashboard/preview', label: 'Assets' },
  { href: '/dashboard/gym-sessions', label: 'Gym' },
  { href: '/dashboard/group-classes', label: 'Classes' },
  { href: '/dashboard/funnel', label: 'Funnel' },
  { href: '/dashboard/help', label: 'Guide' },
  { href: '/dashboard/system-health', label: 'System' },
]

export default function DashboardNav() {
  const pathname = usePathname() || '/dashboard'

  return (
    <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
      {NAV_ITEMS.map(item => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative text-[13px] px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              active
                ? 'text-white bg-[#1c1917]'
                : 'text-[#a8a29e] hover:text-white hover:bg-[#1c1917]/60'
            }`}
          >
            {item.label}
            {active && (
              <span className="absolute left-1/2 -translate-x-1/2 -bottom-[15px] w-6 h-[2px] rounded-full bg-[#14b8a6]" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
