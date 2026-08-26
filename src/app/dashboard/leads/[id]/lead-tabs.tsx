'use client'

import { useState, type ReactNode } from 'react'

export interface LeadTab {
  id: string
  label: string
  /** Small count or dot rendered next to the label, e.g. number of timeline events. */
  badge?: string | number | null
  /** Amber dot for something that needs attention, e.g. scope flags. */
  alert?: boolean
  content: ReactNode
}

/**
 * Tab shell for the lead page.
 *
 * Replaced a single 15-section scroll on 2026-08-12. The old page rendered every
 * panel unconditionally down one column, so the two things actually used before a
 * call — the brief and the timeline — sat below six panels that are relevant a
 * handful of times a year.
 */
export default function LeadTabs({ tabs, initial }: { tabs: LeadTab[]; initial?: string }) {
  const available = tabs.filter(Boolean)
  const [active, setActive] = useState(initial && available.some(t => t.id === initial) ? initial : available[0]?.id)
  const current = available.find(t => t.id === active) ?? available[0]

  return (
    <div>
      <div className="flex items-center gap-1 border-b border-[#E8EAEE] mb-5 overflow-x-auto">
        {available.map(tab => {
          const on = tab.id === current?.id
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`relative shrink-0 px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
                on ? 'text-[#1B6DFC]' : 'text-[#666D7A] hover:text-[#141821]'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {tab.label}
                {tab.alert && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                {tab.badge != null && tab.badge !== '' && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    on ? 'bg-blue-50 text-[#1B6DFC]' : 'bg-[#F4F6F9] text-[#98A0AD]'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </span>
              {on && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#1B6DFC] rounded-full" />}
            </button>
          )
        })}
      </div>
      <div>{current?.content}</div>
    </div>
  )
}
