'use client'

/**
 * The client record's tab row.
 *
 * The first five entries are in-page tabs: each direct child is a
 * <div data-tab="overview|training|nutrition|health|admin"> group, server-
 * rendered once, and this wrapper shows only the active group. Data loads
 * once; switching is instant with no re-fetch.
 *
 * The entries after the divider are the client's OTHER pages. They used to
 * live in a 160px "More on this client" column down the left, which made a
 * fourth column once the client list arrived and hid four real destinations
 * in a rail nobody read. Same row, one visual language, no extra column.
 */

import Link from 'next/link'
import { Children, isValidElement, useState, type ReactNode } from 'react'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'training', label: 'Training' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'health', label: 'Health' },
  { id: 'admin', label: 'Admin' },
] as const

type TabId = (typeof TABS)[number]['id']

const TAB_LABELS = new Set<string>(TABS.map(t => t.label))

/** Every page that hangs off a client record. One list, used by this tab row
 *  and by ClientPageNav on the pages themselves. */
export const CLIENT_PAGES = [
  { slug: 'program', label: 'Training' },
  { slug: 'nutrition', label: 'Nutrition' },
  { slug: 'direction', label: 'Direction' },
  { slug: 'routine', label: 'Daily Sequences' },
  { slug: 'recovery', label: 'Recovery' },
  { slug: 'supplements', label: 'Supplements' },
]

const ITEM =
  'relative px-3 py-2.5 text-[13px] whitespace-nowrap border-b-2 -mb-px transition-colors'

export default function ClientProfileTabs({
  children,
  clientId,
}: {
  children: ReactNode
  clientId: string
}) {
  const [active, setActive] = useState<TabId>('overview')

  const panels = Children.toArray(children).filter(
    c => isValidElement(c) && (c.props as { 'data-tab'?: string })['data-tab'] === active,
  )

  return (
    <div>
      <nav className="sticky top-[68px] z-10 flex items-center gap-0.5 border-b border-[#E8EAEE] mb-6 overflow-x-auto bg-white/90 backdrop-blur-md">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            aria-current={active === t.id ? 'true' : undefined}
            className={`${ITEM} ${
              active === t.id
                ? 'border-[#1B6DFC] text-[#1B6DFC] font-medium'
                : 'border-transparent text-[#666D7A] hover:text-[#141821]'
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-[#E8EAEE] shrink-0" aria-hidden />
        {/* Training and Nutrition have an in-page tab AND a full page. Only the
            tab shows here - two entries reading "Training" in one row would be
            a puzzle. The tab links through to the page. */}
        {CLIENT_PAGES.filter(p => !TAB_LABELS.has(p.label)).map(p => (
          <Link
            key={p.slug}
            href={`/dashboard/clients/${clientId}/${p.slug}`}
            className={`${ITEM} border-transparent text-[#666D7A] hover:text-[#141821]`}
          >
            {p.label}
          </Link>
        ))}
      </nav>
      <div className="space-y-4">{panels}</div>
    </div>
  )
}
