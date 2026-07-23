'use client'

import { useState } from 'react'
import CopilotPanel from './copilot-panel'

type Msg = { id: string | null; role: 'user' | 'assistant'; content: string; flagged: boolean; followups?: string[] }

/**
 * Floating co-pilot launcher (2026-07-12). A fixed brand-glyph bubble bottom-right
 * of the client profile; click to open the doctrine-tutor chat in a popover.
 * Scoped to the client whose page it's on. Avatar is a neutral brand mark (not a
 * coach photo) so it white-labels; a tenant can swap the glyph later.
 *
 * History is fetched lazily on first open (GET /api/clients/[id]/copilot) so it
 * never taxes page loads where the chat is never opened.
 */
export default function CopilotBubble({
  clientId,
  clientFirstName,
}: {
  clientId: string
  clientFirstName: string
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function openPanel() {
    setOpen(true)
    if (messages === null && !loading) {
      setLoading(true)
      try {
        const res = await fetch(`/api/clients/${clientId}/copilot`)
        const data = await res.json()
        setMessages(Array.isArray(data.messages) ? data.messages : [])
      } catch {
        setMessages([])
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] h-[560px] max-h-[calc(100vh-8rem)] shadow-2xl rounded-2xl"
          role="dialog"
          aria-label="Coach Co-Pilot"
        >
          {messages === null ? (
            <div className="h-full rounded-2xl bg-white border border-[#E5E5E5] flex items-center justify-center text-sm text-[#999999]">
              Loading…
            </div>
          ) : (
            <CopilotPanel
              clientId={clientId}
              clientFirstName={clientFirstName}
              initialMessages={messages}
              onClose={() => setOpen(false)}
              className="h-full shadow-none"
            />
          )}
        </div>
      )}

      <button
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label={open ? 'Close Co-Pilot' : 'Open Co-Pilot'}
        title="Co-Pilot · doctrine tutor"
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-[#1B6DFC] hover:bg-[#1558d6] text-white shadow-xl flex items-center justify-center transition-colors"
      >
        {open ? (
          <span className="text-2xl leading-none">✕</span>
        ) : (
          // Neutral brand glyph — "Aperture": concentric focus rings = the read
          // instrument (reads signals, interprets). White-label-swappable.
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.6" opacity="0.55" />
            <circle cx="12" cy="12" r="1.9" fill="white" />
          </svg>
        )}
      </button>
    </>
  )
}
