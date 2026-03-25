'use client'

import { useState } from 'react'

export default function CommencementFeeButton({ leadId }: { leadId: string }) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/leads/${leadId}/create-checkout`, { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      await navigator.clipboard.writeText(data.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } else {
      setError(data.error ?? 'Failed to generate link')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 bg-[#10E1C2] text-black rounded-lg hover:bg-[#0ecfb2] transition-colors disabled:opacity-50"
      >
        {loading ? 'Generating...' : copied ? 'Link Copied!' : 'Generate Commencement Fee Link'}
      </button>
    </div>
  )
}
