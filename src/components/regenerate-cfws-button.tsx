'use client'

import { useState } from 'react'

export default function RegenerateCFWSButton({ clientId, weekNumber }: { clientId: string; weekNumber: number }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function regenerate() {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/generate-cfws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, week_number: weekNumber }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setStatus('done')
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 8000)
    }
  }

  return (
    <button
      onClick={regenerate}
      disabled={status === 'loading' || status === 'done'}
      className="text-xs font-medium px-3 py-1.5 border border-stone-700 text-stone-400 rounded-lg hover:border-stone-500 hover:text-stone-200 transition-colors disabled:opacity-50"
    >
      {status === 'loading' ? 'Generating…' : status === 'done' ? 'Done — reloading' : status === 'error' ? `Error: ${errorMsg || 'retry'}` : 'Generate CFWS'}
    </button>
  )
}
