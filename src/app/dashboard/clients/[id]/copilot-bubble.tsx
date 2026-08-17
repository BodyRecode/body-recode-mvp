'use client'

import { useState } from 'react'
import CopilotPanel from './copilot-panel'

// randomUUID needs a secure context; fall back so a plain-http preview still works.
function newSessionId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Floating co-pilot launcher (2026-07-12). A fixed brand-glyph bubble bottom-right
 * of the client profile; click to open the doctrine-tutor chat in a popover.
 * Scoped to the client whose page it's on. Avatar is a neutral brand mark (not a
 * coach photo) so it white-labels; a tenant can swap the glyph later.
 *
 * EVERY OPEN STARTS A FRESH CONVERSATION (2026-08-17). It used to load the whole
 * message history for the client, so reopening dropped the coach into weeks of old
 * chat — and the route replayed that history to the model, letting stale
 * conversation shape unrelated answers. Now each open mints a new session id;
 * only that session is persisted, replayed and shown. Earlier rows stay in the
 * database for the flagged-exchanges review page, they're just not reloaded.
 *
 * The session id is also the panel's React key, so closing the panel discards its
 * internal state too (draft proposals, refine mode) rather than leaving a stale
 * Apply button pointing at a conversation that no longer exists.
 */
export default function CopilotBubble({
  clientId,
  clientFirstName,
}: {
  clientId: string
  clientFirstName: string
}) {
  const [open, setOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  function openPanel() {
    setSessionId(newSessionId())
    setOpen(true)
  }

  return (
    <>
      {open && sessionId && (
        <div
          className="fixed bottom-24 right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] h-[560px] max-h-[calc(100vh-8rem)] shadow-2xl rounded-2xl"
          role="dialog"
          aria-label="Coach Co-Pilot"
        >
          <CopilotPanel
            key={sessionId}
            clientId={clientId}
            clientFirstName={clientFirstName}
            sessionId={sessionId}
            onClose={() => setOpen(false)}
            className="h-full shadow-none"
          />
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
