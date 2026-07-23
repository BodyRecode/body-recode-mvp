'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Left nav for the client area. Now that the profile page uses tabs for its
 * own sections, this sidebar only links to the client's OTHER pages (Direction,
 * Daily Sequences, Recovery, Supplements) — the in-page section jump-links were
 * removed because the tabs handle in-page navigation.
 */
export default function ProfileSidebar({ clientId }: { clientId: string }) {
  const pathname = usePathname()
  const base = `/dashboard/clients/${clientId}`
  const links = [
    { href: `${base}/direction`, label: 'Direction' },
    { href: `${base}/routine`, label: 'Daily Sequences' },
    { href: `${base}/recovery`, label: 'Recovery Protocols' },
    { href: `${base}/supplements`, label: 'Supplements' },
  ]

  return (
    <div className="w-40 shrink-0">
      <nav className="sticky top-8 space-y-0.5">
        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#999999]">More on this client</p>
        {links.map(l => {
          const active = pathname === l.href
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`block w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                active ? 'bg-blue-50 text-blue-500' : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#E5E5E5]/50'
              }`}
            >
              {l.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
