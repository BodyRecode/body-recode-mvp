'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CancelSequenceButton({ leadId, hasScheduled }: { leadId: string; hasScheduled: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleClick = async () => {
    if (!confirm('Cancel the remaining follow-up emails for this lead? Any emails already sent cannot be recalled.')) return
    setLoading(true)
    const res = await fetch(`/api/leads/${leadId}/cancel-sequence`, { method: 'POST' })
    const data = await res.json()
    setDone(true)
    setLoading(false)
    router.refresh()
  }

  if (done) {
    return <p className="text-[12.5px] text-[#676D76]">Sequence cancelled.</p>
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || !hasScheduled}
      className="text-[12.5px] text-[#676D76] hover:text-[#D4817E] transition-colors disabled:opacity-40 disabled:hover:text-[#676D76]"
    >
      {loading ? 'Cancelling…' : 'Cancel follow-up sequence'}
    </button>
  )
}
