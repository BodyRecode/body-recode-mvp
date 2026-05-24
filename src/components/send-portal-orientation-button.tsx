'use client'

import { useState } from 'react'

export default function SendPortalOrientationButton({ clientId }: { clientId: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function send() {
    setStatus('sending')
    try {
      const res = await fetch(`/api/clients/${clientId}/send-portal-orientation`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
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

  const cls = 'text-sm font-medium px-4 py-2.5 rounded-lg border border-[#E5E5E5] text-[#3A3A3A] hover:border-[#1B6DFC] hover:text-[#1B6DFC] hover:bg-blue-50 transition-colors disabled:opacity-50'

  if (status === 'sent') {
    return (
      <button onClick={() => setStatus('idle')} className={cls}>
        ✓ Sent - send again?
      </button>
    )
  }

  return (
    <button onClick={send} disabled={status === 'sending'} className={cls}>
      {status === 'sending' ? 'Sending…' : status === 'error' ? 'Error - retry' : 'Send portal orientation'}
    </button>
  )
}
