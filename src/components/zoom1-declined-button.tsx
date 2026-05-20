'use client'

import { useState } from 'react'

export default function Zoom1DeclinedButton({ leadId }: { leadId: string }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/leads/${leadId}/send-zoom1-declined`, { method: 'POST' })
    const data = await res.json()
    if (data.sent) {
      setSent(true)
    } else {
      setError(data.error ?? 'Failed to start sequence')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
        Sequence Started
      </span>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={send}
        disabled={loading}
        className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 bg-[#1B6DFC] text-black rounded-lg hover:bg-[#5390FF] transition-colors disabled:opacity-50"
      >
        {loading ? 'Starting...' : 'Start Declined Follow-up'}
      </button>
    </div>
  )
}
