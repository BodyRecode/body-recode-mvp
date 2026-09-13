'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NoShowSequenceButton({ leadId }: { leadId: string }) {
  const router = useRouter()
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/leads/${leadId}/send-noshow-sequence`, { method: 'POST' })
    const data = await res.json()
    if (data.sent) {
      setSent(true)
      router.refresh()
    } else {
      setError(data.error ?? 'Failed to start sequence')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 bg-[#1560E0]/10 text-[#177245] border border-[#1560E0]/20 rounded-lg">
        Emails scheduled
      </span>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {error && <p className="text-[12.5px] text-[#C82626]">{error}</p>}
      <button
        onClick={send}
        disabled={loading}
        className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 border border-[#E8EAEE] text-[#43474F] rounded-lg hover:border-[#1B6DFC] hover:text-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)] transition-colors disabled:opacity-50"
      >
        {loading ? 'Starting...' : 'Start re-engagement emails'}
      </button>
    </div>
  )
}
