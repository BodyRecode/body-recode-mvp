'use client'

import { useState } from 'react'
import GenerationProgressOverlay from '@/components/generation-progress-overlay'

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
    <>
      <GenerationProgressOverlay
        active={status === 'loading'}
        title="Regenerating CFFS"
        stages={[
          { start: 0,   label: 'Reading intake responses, baseline, medications, dietary context' },
          { start: 5,   label: 'Reading baseline photos for Fat Map spatial signal' },
          { start: 12,  label: 'Synthesising body state, primary patterns, capacity constraints' },
          { start: 60,  label: 'Drafting the 5 client-facing Foundational Reading sections' },
          { start: 150, label: 'Saving and refreshing the page' },
          { start: 240, label: 'Taking longer than usual. If the connection dropped it retries on its own, give it a few more minutes' },
        ]}
        disclaimer="CFFS regeneration runs the full interpretive synthesis (body state, patterns, constraints, risk flags, FR prose). Typical: 1.5 to 4 minutes. If the connection drops it retries on its own, and it gives up with a clear message after about 12 minutes at most. The page is not frozen, please don't refresh."
      />
      <button
        onClick={regenerate}
        disabled={status === 'loading' || status === 'done'}
        className="br-btn disabled:opacity-50"
      >
        {status === 'loading' ? 'Generating…' : status === 'done' ? 'Done - reloading' : status === 'error' ? `Error: ${errorMsg || 'retry'}` : 'Regenerate CFFS'}
      </button>
    </>
  )
}
