'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MarkAsFoundingClientButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const router = useRouter()

  async function handleMark() {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    setLoading(true)
    try {
      await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_founding_client: true,
          founding_client_status: 'active',
          founding_client_trigger_type: 'manual_override',
          founding_client_start_date: new Date().toISOString(),
        }),
      })
      router.refresh()
    } catch {
      setLoading(false)
      setConfirmed(false)
    }
  }

  if (confirmed) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-stone-400">Confirm — this marks them as a Founding Client</span>
        <button
          onClick={handleMark}
          disabled={loading}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-400/30 text-violet-300 hover:bg-violet-500/30 transition-colors disabled:opacity-50"
        >
          {loading ? 'Marking...' : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirmed(false)}
          className="text-xs text-stone-600 hover:text-stone-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleMark}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-400 hover:border-violet-400/30 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
    >
      Mark as Founding Client
    </button>
  )
}
