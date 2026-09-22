'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { LAUNCHER_PANEL_SHADOW } from '@/components/launcher-style'
import CopilotPanel from './copilot-panel'

/**
 * "Explain this" on a finding, instead of a blank co-pilot.
 *
 * 21 September 2026, Kade's decision. A read-only coach does not get an open
 * chat box. They get this, attached to the thing they are looking at.
 *
 * WHY THE NARROWER SHAPE IS THE BETTER ONE, not just the cheaper one. An empty
 * box asks a coach to know what to ask, and the coach who most needs the answer
 * is the one least able to phrase the question. Kade reads a pattern and knows
 * what it means because he wrote the method. Somebody else does not, and when
 * their client asks "why does it say this about me", a blank box does not help
 * them. A button on the finding does.
 *
 * It opens the same co-pilot, behind the same safety gates, with the question
 * already asked.
 */
export default function ExplainThis({
  clientId,
  clientFirstName,
  question,
  label = 'Explain this',
}: {
  clientId: string
  clientFirstName: string
  /** The question asked on the coach's behalf. Written where the button is. */
  question: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  // A fresh conversation each time it is opened, so the answer is about this
  // finding and not the last thing that was discussed.
  const [sessionId, setSessionId] = useState<string | null>(null)

  return (
    <>
      <button
        onClick={() => {
          setSessionId(`explain-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
          setOpen(true)
        }}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-[#E4E4E0] bg-[#FFFFFF] text-[#4A4F57] hover:border-[#0F1115] hover:text-[#0F1115] hover:bg-[rgba(27,109,252,0.05)] transition-colors"
        title={question}
      >
        {label}
      </button>

      {open && sessionId && (
        <div
          className="fixed bottom-5 right-5 z-50 w-[420px] max-w-[calc(100vw-2.5rem)] h-[600px] max-h-[calc(100vh-4rem)] rounded-xl"
          style={{ boxShadow: LAUNCHER_PANEL_SHADOW }}
          role="dialog"
          aria-label={label}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute -top-3 -right-3 z-10 w-7 h-7 rounded-full bg-[#0F1115] text-white flex items-center justify-center shadow-lg"
          >
            <X size={14} />
          </button>
          <CopilotPanel
            key={sessionId}
            clientId={clientId}
            clientFirstName={clientFirstName}
            sessionId={sessionId}
            seedQuestion={question}
            onClose={() => setOpen(false)}
            className="h-full shadow-none"
          />
        </div>
      )}
    </>
  )
}
