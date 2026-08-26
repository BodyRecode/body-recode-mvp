'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * Collapsible wrapper for the top-level sections of the client record.
 *
 * Each major section (CFFS, Baseline, Weekly Check-In, Training, Nutrition,
 * Payments) wraps in one of these. The header stays visible - section name,
 * an attention pill when there is work in it, and any right-side actions.
 *
 * Default state is computed server-side and passed via `defaultOpen`. Action-
 * required sections (no CFFS yet, no FR published, unanswered check-ins, etc.)
 * open by default so coach attention isn't hidden behind a click.
 */
export default function MajorSection({
  id,
  title,
  subtitle,
  actionRight,
  defaultOpen,
  attentionLabel,
  children,
}: {
  id: string
  title: string
  /** Optional small text after the title, e.g. "- CFFS" or "PTS". */
  subtitle?: string
  /** Optional right-side controls — Copy link buttons, etc. Rendered next to the toggle. */
  actionRight?: React.ReactNode
  /** Computed server-side based on whether this section has work for the coach. */
  defaultOpen: boolean
  /** Optional amber-pill label shown when defaultOpen is true, e.g. "Action required". */
  attentionLabel?: string | null
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div id={id} className="mt-6 scroll-mt-8">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2.5 min-w-0 group text-left"
          aria-expanded={open}
        >
          <span
            className="w-[22px] h-[22px] rounded-md shrink-0 flex items-center justify-center text-[#1B6DFC] transition-colors group-hover:text-[#1056D6]"
            style={{
              background: 'rgba(27,109,252,0.08)',
              boxShadow: 'inset 0 0 0 1px #B5CFFC',
            }}
            aria-hidden
          >
            <ChevronDown
              size={13}
              strokeWidth={2.5}
              className={`transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
            />
          </span>
          <h2 className="text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em] truncate">
            {title}
            {subtitle && <span className="text-[#98A0AD] font-normal"> {subtitle}</span>}
          </h2>
          {attentionLabel && !open && (
            <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-[3px] rounded-full border border-[#F1DEB8] text-[#A96A12] bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
              <span className="w-[5px] h-[5px] rounded-full bg-current" aria-hidden />
              {attentionLabel}
            </span>
          )}
        </button>
        {actionRight && (
          <div className="flex items-center gap-2 flex-wrap">{actionRight}</div>
        )}
      </div>
      {open && children}
    </div>
  )
}
