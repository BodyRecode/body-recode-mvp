'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Generates a Progress Read draft from a submitted Progress Check. It takes
 * several minutes (measured 4.5 on real data), so the button says so and keeps
 * the coach informed rather than looking frozen.
 */
export default function GenerateProgressReadButton({ progressCheckId, hasRead }: { progressCheckId: string; hasRead: boolean }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'running' | 'error'>('idle')
  const [error, setError] = useState('')

  async function run() {
    setState('running')
    setError('')
    try {
      const res = await fetch('/api/generate-progress-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress_check_id: progressCheckId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setState('idle')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
      setState('error')
    }
  }

  return (
    <div>
      <button onClick={run} disabled={state === 'running'} className="br-btn disabled:opacity-50">
        {state === 'running' ? 'Writing the Progress Read…' : hasRead ? 'Regenerate Progress Read' : 'Generate Progress Read'}
      </button>
      {state === 'running' && (
        <p className="text-[12.5px] text-[#6E747D] mt-2 leading-relaxed">Usually 4 to 6 minutes. It reads everything since the last read. The page is not frozen, please don&apos;t refresh.</p>
      )}
      {state === 'error' && <p className="text-[12.5px] text-[#8F2D2D] mt-2 leading-relaxed">{error}</p>}
    </div>
  )
}
