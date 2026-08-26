'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CLIENT_PAGES } from './client-profile-tabs'

/**
 * The same row as the client record's tabs, for the client's other pages.
 * Was a 160px column headed "More on this client"; a column is a poor home
 * for four links, and once the client list arrived it made a fourth column.
 */
export default function ClientPageNav({ clientId }: { clientId: string }) {
  const pathname = usePathname() || ''
  const base = `/dashboard/clients/${clientId}`
  const onProfile = pathname === base

  const item =
    'relative px-3 py-2.5 text-[13px] whitespace-nowrap border-b-2 -mb-px transition-colors'

  return (
    <nav className="flex items-center gap-0.5 border-b border-[#E8EAEE] mb-6 overflow-x-auto">
      <Link
        href={base}
        aria-current={onProfile ? 'page' : undefined}
        className={`${item} ${
          onProfile
            ? 'border-[#1B6DFC] text-[#1B6DFC] font-medium'
            : 'border-transparent text-[#666D7A] hover:text-[#141821]'
        }`}
      >
        Profile
      </Link>
      <span className="mx-2 h-4 w-px bg-[#E8EAEE] shrink-0" aria-hidden />
      {CLIENT_PAGES.map(p => {
        const href = `${base}/${p.slug}`
        const on = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={p.slug}
            href={href}
            aria-current={on ? 'page' : undefined}
            className={`${item} ${
              on
                ? 'border-[#1B6DFC] text-[#1B6DFC] font-medium'
                : 'border-transparent text-[#666D7A] hover:text-[#141821]'
            }`}
          >
            {p.label}
          </Link>
        )
      })}
    </nav>
  )
}
