'use client'

import { useState } from 'react'
import GenerationProgressOverlay from '@/components/generation-progress-overlay'

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
    <>
      <GenerationProgressOverlay
        active={status === 'loading'}
        title="Generating Weekly Synthesis"
        stages={[
          { start: 0,  label: 'Reading both check-in responses for this week' },
          { start: 4,  label: 'Reading CFFS, active program, active nutrition plan' },
          { start: 10, label: 'Synthesising signal pattern, drift, and next-week direction' },
          { start: 40, label: 'Saving and refreshing the page' },
          { start: 70, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Weekly Synthesis (CFWS) generation uses Claude Sonnet 4.6. Typical: 40 to 60 seconds. The page is not frozen, please don't refresh."
      />
      <button
        onClick={regenerate}
        disabled={status === 'loading' || status === 'done'}
        className="br-btn disabled:opacity-50"
      >
        {status === 'loading' ? 'Generating…' : status === 'done' ? 'Done - reloading' : status === 'error' ? `Error: ${errorMsg || 'retry'}` : 'Generate CFWS'}
      </button>
    </>
  )
}
