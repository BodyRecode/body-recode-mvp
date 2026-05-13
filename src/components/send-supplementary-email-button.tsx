'use client'

import { useState } from 'react'
import { Mail, Loader2, Check } from 'lucide-react'

interface Props {
  clientId: string
  clientName: string
}

/**
 * Coach action: emails the supplementary intake link to the client. Only
 * meaningful when a pending supplementary invitation exists - the parent
 * page only renders this button in that state.
 *
 * Sister action: <SendSupplementaryIntakeButton> creates the invitation
 * (adds the card to the portal) without emailing. This button is the
 * email escape hatch for clients who don't log into the portal between
 * coaching weeks.
 *
 * Logs to client_communications as kind='supplementary_intake_invite'
 * via the API route.
 */
export default function SendSupplementaryEmailButton({
  clientId,
  clientName,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function trigger() {
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/send-supplementary-intake-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setStatus('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed'
      setStatus('error')
      setErrorMsg(msg)
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  if (status === 'done') {
    const first = clientName.split(' ')[0]
    return (
      <div className="inline-flex items-center gap-2 text-[#14b8a6] text-xs font-medium">
        <Check size={13} />
        Emailed {first}
      </div>
    )
  }

  return (
    <button
      onClick={trigger}
      disabled={status === 'sending'}
      title="Email the 5-question follow-up intake link to the client"
      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#1c1917] bg-[#0c0a09] text-[#d4cfc9] hover:border-[#292524] hover:text-white transition-colors disabled:opacity-50"
    >
      {status === 'sending'
        ? <><Loader2 size={12} className="animate-spin" /> Sending…</>
        : status === 'error'
          ? <><Mail size={12} /> Error: {errorMsg || 'retry'}</>
          : <><Mail size={12} /> Email link</>
      }
    </button>
  )
}
