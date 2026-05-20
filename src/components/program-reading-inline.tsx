/**
 * Inline Program Reading card for the top of the portal program page.
 *
 * Dark-themed, matches the rest of the portal aesthetic, expandable. Shows the
 * full reading inline (so the why frames every session view), and links to the
 * cream-on-black standalone version for the premium-deliverable experience.
 *
 * Used by:
 *   - /portal/[token]/program  (above the block overview)
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

export interface InlineReading {
  pr_why_this_block: string | null
  pr_what_this_program_is_doing: string | null
  pr_how_well_know_its_working: string | null
  pr_what_were_not_doing_yet: string | null
  pr_coach_note: string | null
  program_reading_published_at: string | null
}

const SECTIONS: Array<{ key: keyof InlineReading; label: string }> = [
  { key: 'pr_why_this_block',             label: 'Why this block' },
  { key: 'pr_what_this_program_is_doing', label: 'What this program is doing' },
  { key: 'pr_how_well_know_its_working',  label: 'How we will know it is working' },
  { key: 'pr_what_were_not_doing_yet',    label: 'What we are not doing yet' },
  { key: 'pr_coach_note',                 label: 'A note from your coach' },
]

export default function ProgramReadingInline({
  reading,
  documentHref,
}: {
  reading: InlineReading
  documentHref: string
}) {
  const [expanded, setExpanded] = useState(false)

  // Always show "Why this block" — it is the frame. Other sections collapse.
  const whyContent = reading.pr_why_this_block
  if (!whyContent) return null

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
            className="text-[10px] font-bold text-white uppercase truncate"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
          >
            Program Reading
          </p>
        </div>
        <Link
          href={documentHref}
          className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#6B6B6B] hover:text-white hover:border-[#D4D4D4] transition-colors shrink-0"
        >
          <FileText size={10} /> View as document
        </Link>
      </div>

      {/* Why this block - always visible */}
      <div className="px-5 py-4 border-b border-[#E5E5E5]/60">
        <p
          className="text-[10px] font-bold text-[#1B6DFC] uppercase mb-2"
          style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
        >
          01 · Why this block
        </p>
        <p className="text-[14px] text-[#e7e5e4] leading-relaxed whitespace-pre-line">
          {whyContent}
        </p>
      </div>

      {/* The remaining sections - collapsed by default */}
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
                  <p className="text-[14px] text-[#e7e5e4] leading-relaxed whitespace-pre-line">
                    {s.content}
                  </p>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-center gap-1.5 px-5 py-3 text-[12px] font-semibold text-[#6B6B6B] hover:text-white hover:bg-[#E5E5E5]/40 transition-colors border-t border-[#E5E5E5]"
          >
            {expanded ? (
              <>
                <ChevronUp size={13} /> Show less
              </>
            ) : (
              <>
                <ChevronDown size={13} /> Read the full reading
              </>
            )}
          </button>
        </>
      )}
    </div>
  )
}
