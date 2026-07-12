'use client'

import { useState } from 'react'
import CopilotPanel from './copilot-panel'

type Msg = { id: string | null; role: 'user' | 'assistant'; content: string; flagged: boolean }

/**
 * Floating co-pilot launcher (2026-07-12). A fixed brand-glyph bubble bottom-right
 * of the client profile; click to open the doctrine-tutor chat in a popover.
 * Scoped to the client whose page it's on. Avatar is a neutral brand mark (not a
 * coach photo) so it white-labels; a tenant can swap the glyph later.
 */
export default function CopilotBubble({
  clientId,
  clientFirstName,
  initialMessages,
}: {
  clientId: string
  clientFirstName: string
  initialMessages: Msg[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] h-[560px] max-h-[calc(100vh-8rem)] shadow-2xl rounded-2xl"
          role="dialog"
          aria-label="Coach Co-Pilot"
        >
          <CopilotPanel
            clientId={clientId}
            clientFirstName={clientFirstName}
            initialMessages={initialMessages}
            onClose={() => setOpen(false)}
            className="h-full shadow-none"
          />
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close Co-Pilot' : 'Open Co-Pilot'}
        title="Co-Pilot · doctrine tutor"
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-[#1B6DFC] hover:bg-[#1558d6] text-white shadow-xl flex items-center justify-center transition-colors"
      >
        {open ? (
          <span className="text-2xl leading-none">✕</span>
        ) : (
          // Neutral brand glyph (sparkle = "AI assist"). White-label-swappable.
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2.5l1.9 5.1a4 4 0 0 0 2.5 2.5l5.1 1.9-5.1 1.9a4 4 0 0 0-2.5 2.5L12 21.5l-1.9-5.1a4 4 0 0 0-2.5-2.5L2.5 12l5.1-1.9a4 4 0 0 0 2.5-2.5L12 2.5z" fill="white"/>
          </svg>
        )}
      </button>
    </>
  )
}
