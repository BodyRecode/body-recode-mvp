/**
 * Inline Nutrition Reading card for the top of the portal /my-plan page.
 *
 * Dark-themed, matches the rest of the portal aesthetic, expandable. Shows the
 * full reading inline (so the why frames every meal view), and links to the
 * cream-on-black standalone version for the premium-deliverable experience.
 *
 * Used by:
 *   - /portal/[token]/my-plan  (above the plan overview)
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

export interface InlineNutritionReading {
  nr_why_this_plan: string | null
  nr_what_this_nutrition_is_doing: string | null
  nr_how_well_know_its_working: string | null
  nr_what_were_not_doing_yet: string | null
  nr_coach_note: string | null
  nutrition_reading_published_at: string | null
}

const SECTIONS: Array<{ key: keyof InlineNutritionReading; label: string }> = [
  { key: 'nr_why_this_plan',                label: 'Why this plan' },
  { key: 'nr_what_this_nutrition_is_doing', label: 'What this nutrition is doing' },
  { key: 'nr_how_well_know_its_working',    label: 'How we will know it is working' },
  { key: 'nr_what_were_not_doing_yet',      label: 'What we are not doing yet' },
  { key: 'nr_coach_note',                   label: 'A note from your coach' },
]

export default function NutritionReadingInline({
  reading,
  documentHref,
}: {
  reading: InlineNutritionReading
  documentHref: string
}) {
  const [expanded, setExpanded] = useState(false)

  // Always show "Why this plan" - it is the frame. Other sections collapse.
  const whyContent = reading.nr_why_this_plan
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
            Nutrition Reading
          </p>
        </div>
        <Link
          href={documentHref}
          className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#6B6B6B] hover:text-[#1B6DFC] hover:border-[#1B6DFC] hover:bg-blue-50 transition-colors shrink-0"
        >
          <FileText size={10} /> View as document
        </Link>
      </div>

      {/* Why this plan - always visible */}
      <div className="px-5 py-4 border-b border-[#E5E5E5]/60">
        <p
          className="text-[10px] font-bold text-[#1B6DFC] uppercase mb-2"
          style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
        >
          01 · Why this plan
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
            className="w-full flex items-center justify-center gap-1.5 px-5 py-3 text-[12px] font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#E5E5E5]/40 transition-colors border-t border-[#E5E5E5]"
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
