'use client'

import { useState } from 'react'
import { ListPlus, Loader2, Check } from 'lucide-react'

interface Props {
  clientId: string
  clientName: string
}

/**
 * Coach action: adds a pending supplementary intake invitation that will
 * surface as a task card on the client's portal landing page next time they
 * sign in. No email is sent.
 *
 * Idempotent server-side - calling twice does not create duplicates.
 */
export default function SendSupplementaryIntakeButton({
  clientId,
  clientName,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [wasReused, setWasReused] = useState(false)

  async function trigger() {
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/send-supplementary-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setWasReused(!!data.reused)
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
      <div className="inline-flex items-center gap-2 text-[#1B6DFC] text-[12.5px] font-medium">
        <Check size={13} />
        {wasReused
          ? `Already in ${first}'s portal — they'll see it on next sign-in`
          : `Added to ${first}'s portal — they'll see it on next sign-in`}
      </div>
    )
  }

  return (
    <button
      onClick={trigger}
      disabled={status === 'sending'}
      title="Add a 5-question follow-up intake (medications + dietary context) to the client's portal as a task card"
      className="inline-flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-[#E8EAEE] bg-[#FFFFFF] text-[#43474F] hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors disabled:opacity-50"
    >
      {status === 'sending'
        ? <><Loader2 size={12} className="animate-spin" /> Adding…</>
        : status === 'error'
          ? <><ListPlus size={12} /> Error: {errorMsg || 'retry'}</>
          : <><ListPlus size={12} /> Add follow-up to portal</>
      }
    </button>
  )
}
