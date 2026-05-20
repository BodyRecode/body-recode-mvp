'use client'

import { useState } from 'react'

/**
 * Collapsible wrapper for the top-level sections of the client profile page.
 *
 * Each major section (CFFS, Baseline, Weekly Check-In, Training, Nutrition,
 * Payments) wraps in one of these. The header stays visible — section name,
 * optional accent dot, action-required pill, and any right-side action
 * buttons (e.g. Copy link). The content collapses on click.
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
          className="flex items-center gap-2.5 min-w-0 group"
          aria-expanded={open}
        >
          <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" />
          <h2
            className="text-[11px] font-bold text-[#1A1A1A] uppercase"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: '0.14em' }}
          >
            {title}
            {subtitle && <span className="text-[#4A4A4A] font-normal"> {subtitle}</span>}
          </h2>
          {attentionLabel && !open && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700">
              {attentionLabel}
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 group-hover:text-blue-700 transition-colors">
            {open ? 'Close' : 'Open'}
          </span>
        </button>
        {actionRight && (
          <div className="flex items-center gap-2 flex-wrap">{actionRight}</div>
        )}
      </div>
      {open && children}
    </div>
  )
}
