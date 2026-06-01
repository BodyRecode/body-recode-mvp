/**
 * Inline Block-end Trajectory Reading card for the portal program page.
 *
 * The client analogue of the CFWS read across a whole block. Sits below the
 * Program Reading on /portal/[token]/program once the block has been read and
 * published. "Where this block started" is always visible; the rest of the arc
 * expands. Links to the cream-on-white standalone document.
 *
 * Used by:
 *   - /portal/[token]/program  (below the Program Reading)
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

export interface InlineTrajectoryReading {
  tr_where_this_block_started: string | null
  tr_how_your_signal_moved: string | null
  tr_what_held_steady: string | null
  tr_what_this_sets_up_next: string | null
  tr_coach_note: string | null
  trajectory_reading_published_at: string | null
}

const SECTIONS: Array<{ key: keyof InlineTrajectoryReading; label: string }> = [
  { key: 'tr_where_this_block_started', label: 'Where this block started' },
  { key: 'tr_how_your_signal_moved',    label: 'How your signal moved' },
  { key: 'tr_what_held_steady',         label: 'What held steady' },
  { key: 'tr_what_this_sets_up_next',   label: 'What this sets up next' },
  { key: 'tr_coach_note',               label: 'A note from your coach' },
]

export default function TrajectoryReadingInline({
  reading,
  documentHref,
}: {
  reading: InlineTrajectoryReading
  documentHref: string
}) {
  const [expanded, setExpanded] = useState(false)

  // Always show "Where this block started" — it is the anchor. Rest collapses.
  const anchorContent = reading.tr_where_this_block_started
  if (!anchorContent) return null

  const rest = SECTIONS.slice(1)
    .map(s => ({ ...s, content: reading[s.key] as string | null }))
    .filter(s => !!s.content)

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC] shrink-0" />
          <p
            className="text-[10px] font-bold text-[#1A1A1A] uppercase truncate"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
          >
            Block-End Reading
          </p>
        </div>
        <Link
          href={documentHref}
          className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#6B6B6B] hover:text-[#1B6DFC] hover:border-[#1B6DFC] hover:bg-blue-50 transition-colors shrink-0"
        >
          <FileText size={10} /> View as document
        </Link>
      </div>

      {/* Anchor section - always visible */}
      <div className="px-5 py-4 border-b border-[#E5E5E5]/60">
        <p
          className="text-[10px] font-bold text-[#1B6DFC] uppercase mb-2"
          style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
        >
          01 · Where this block started
        </p>
        <p className="text-[14px] text-[#1A1A1A] leading-relaxed whitespace-pre-line">
          {anchorContent}
        </p>
      </div>

      {/* The remaining arc - collapsed by default */}
      {rest.length > 0 && (
        <>
          {expanded && (
            <div className="divide-y divide-[#E5E5E5]/60">
              {rest.map((s, i) => (
                <div key={s.key} className="px-5 py-4">
                  <p
                    className="text-[10px] font-bold text-[#1B6DFC] uppercase mb-2"
                    style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
                  >
                    {String(i + 2).padStart(2, '0')} · {s.label}
                  </p>
                  <p className="text-[14px] text-[#1A1A1A] leading-relaxed whitespace-pre-line">
                    {s.content}
                  </p>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-center gap-1.5 px-5 py-3 text-[12px] font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#E5E5E5]/40 transition-colors border-t border-[#E5E5E5]"
          >
            {expanded ? (
              <>
                <ChevronUp size={13} /> Show less
              </>
            ) : (
              <>
                <ChevronDown size={13} /> Read the full arc
              </>
            )}
          </button>
        </>
      )}
    </div>
  )
}
