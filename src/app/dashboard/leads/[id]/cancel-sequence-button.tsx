'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CancelSequenceButton({ leadId }: { leadId: string }) {
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
    return <p className="text-[12.5px] text-[#98A0AD]">Sequence cancelled.</p>
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-[12.5px] text-[#98A0AD] hover:text-[#C82626] transition-colors disabled:opacity-50"
    >
      {loading ? 'Cancelling…' : 'Cancel follow-up sequence'}
    </button>
  )
}
