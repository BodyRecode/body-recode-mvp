'use client'

import { useState } from 'react'

interface Props {
  clientId: string
  intakeId: string
}

export default function RegenerateCFFSButton({ clientId, intakeId }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function regenerate() {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/generate-cffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake_id: intakeId, client_id: clientId }),
      })
      const text = await res.text()
      let data: { error?: string } = {}
      try { data = JSON.parse(text) } catch { /* non-JSON response */ }
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
      className="text-xs font-medium px-3 py-1.5 border border-[#E5E5E5] text-[#6B6B6B] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors disabled:opacity-50"
    >
      {status === 'loading' ? 'Generating…' : status === 'done' ? 'Done - reloading' : status === 'error' ? `Error: ${errorMsg || 'retry'}` : 'Regenerate CFFS'}
    </button>
  )
}
