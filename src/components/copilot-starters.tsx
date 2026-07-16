'use client'

import { useState } from 'react'
import type { StarterCategory } from '@/lib/copilot-starter-questions'

/**
 * Drill-down suggested questions for the co-pilot. Shows category chips; tapping
 * one reveals its specific questions; tapping a question fires onPick (which
 * sends it). Keeps the high-value prompts discoverable without a flat wall of
 * text. Shared by the client-scoped panel and the global bubble.
 */
export function CopilotStarters({
  categories,
  onPick,
}: {
  categories: StarterCategory[]
  onPick: (question: string) => void
}) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      {categories.map(cat => {
        const isOpen = open === cat.label
        return (
          <div key={cat.label} className="flex flex-col gap-1.5">
            <button
              onClick={() => setOpen(isOpen ? null : cat.label)}
              aria-expanded={isOpen}
              className="text-left text-[13px] font-semibold text-[#1A1A1A] border border-[#E5E5E5] hover:border-[#B5CFFC] bg-white rounded-lg px-3 py-2 transition-colors flex items-center justify-between"
            >
              <span>{cat.label}</span>
              <span className={`text-[#1B6DFC] transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
            </button>
            {isOpen && (
              <div className="flex flex-col gap-1.5 pl-2">
                {cat.questions.map(q => (
                  <button
                    key={q}
                    onClick={() => onPick(q)}
                    className="text-left text-[13px] text-[#1B6DFC] border border-[#B5CFFC] bg-[rgba(27,109,252,0.05)] hover:bg-[rgba(27,109,252,0.1)] rounded-lg px-3 py-2 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
