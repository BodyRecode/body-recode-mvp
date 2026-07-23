'use client'

/**
 * Tab shell for the coach client profile. Each direct child is a
 * <div data-tab="overview|training|nutrition|health|admin"> group (server-
 * rendered); this client wrapper shows only the active tab's groups. Data
 * loads once on the server; switching tabs is instant (no re-fetch).
 *
 * Replaces the old long single-scroll + section-jump sidebar.
 */

import { Children, isValidElement, useState, type ReactNode } from 'react'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'training', label: 'Training' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'health', label: 'Health' },
  { id: 'admin', label: 'Admin' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function ClientProfileTabs({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<TabId>('overview')

  const panels = Children.toArray(children).filter(
    c => isValidElement(c) && (c.props as { 'data-tab'?: string })['data-tab'] === active,
  )

  return (
    <div>
      <nav className="sticky top-0 z-10 flex gap-1 border-b border-[#E5E5E5] mb-6 overflow-x-auto bg-white/95 backdrop-blur-sm">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            aria-current={active === t.id}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              active === t.id
                ? 'border-[#1B6DFC] text-[#1B6DFC]'
                : 'border-transparent text-[#999999] hover:text-[#3A3A3A]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="space-y-4">{panels}</div>
    </div>
  )
}
