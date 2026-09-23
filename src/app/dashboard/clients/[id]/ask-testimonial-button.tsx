'use client'

import { useState } from 'react'

/**
 * Sits beside the twelve-week hand-over, because both are the same moment: the
 * point where you show somebody what happened and ask them what they thought.
 *
 * It says what it will do BEFORE it does it, because it sends a real email to a
 * real client and there is no undo on that.
 */
export default function AskTestimonialButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [state, setState] = useState<'idle' | 'confirm' | 'sending' | 'sent' | 'already'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function send() {
    setState('sending'); setError(null)
    try {
      const r = await fetch(`/api/clients/${clientId}/request-testimonial`, { method: 'POST' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error ?? 'Could not send.'); setState('idle'); return }
      setState(d.alreadyAsked ? 'already' : 'sent')
    } catch {
      setError('Could not send.'); setState('idle')
    }
  }

  if (state === 'sent') return <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#FAFAF8]">Asked</span>
  if (state === 'already') return <span className="text-[11px] text-[#8A9099]">Already asked, their link still works</span>

  if (state === 'confirm') {
    return (
      <span className="inline-flex items-center gap-2.5 flex-wrap">
        <span className="text-[11px] text-[#8A9099]">Email {clientName} and ask for a few lines?</span>
        <button onClick={send} className="text-[11px] font-bold uppercase tracking-[0.08em] px-2.5 py-[3px] rounded-full bg-[#FAFAF8] text-[#0F1115]">Send it</button>
        <button onClick={() => setState('idle')} className="text-[11px] text-[#676D76] underline underline-offset-4">Not now</button>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={() => setState('confirm')}
        disabled={state === 'sending'}
        className="text-[11px] font-bold uppercase px-2.5 py-[3px] rounded-full border disabled:opacity-50"
        style={{ letterSpacing: '0.08em', color: '#C2C6CC', borderColor: '#2A2F39' }}
      >
        {state === 'sending' ? 'Sending…' : 'Ask for a testimonial'}
      </button>
      {error && <span className="text-[11px] text-[#8A9099]">{error}</span>}
    </span>
  )
}
