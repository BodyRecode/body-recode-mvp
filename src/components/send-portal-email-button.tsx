'use client'

import { useState } from 'react'

export default function SendPortalEmailButton({ clientId }: { clientId: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function send() {
    setStatus('sending')
    try {
      const res = await fetch(`/api/clients/${clientId}/send-portal-email`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      setStatus('sent')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed'
      console.error(msg)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  if (status === 'sent') {
    return (
      <button
        onClick={() => setStatus('idle')}
        className="text-xs px-3 py-1.5 rounded-lg bg-stone-800 text-teal-400 hover:bg-stone-700 transition-colors"
      >
        ✓ Sent — send again?
      </button>
    )
  }

  return (
    <button
      onClick={send}
      disabled={status === 'sending'}
      className="text-xs px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white transition-colors disabled:opacity-50"
    >
      {status === 'sending' ? 'Sending…' : status === 'error' ? 'Error — retry' : 'Send to client'}
    </button>
  )
}
