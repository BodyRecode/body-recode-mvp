'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DraftActions({
  programId,
  clientId,
}: {
  programId: string
  clientId: string
}) {
  const router = useRouter()
  const [promoting, setPromoting] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setPromoting(true)
    setError(null)
    try {
      const res = await fetch(`/api/programs/${programId}/promote`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to approve'); return }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setPromoting(false)
    }
  }

  async function handleDiscard() {
    if (!confirm('Discard this draft? This cannot be undone.')) return
    setDiscarding(true)
    setError(null)
    try {
      const res = await fetch(`/api/programs/${programId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to discard'); return }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setDiscarding(false)
    }
  }

  return (
    <div>
      {error && (
        <p className="text-xs text-red-400 mb-3">{error}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={handleDiscard}
          disabled={discarding || promoting}
          className="text-xs px-3 py-1.5 border border-stone-300 text-stone-500 rounded-lg hover:border-red-800 hover:text-red-400 transition-colors disabled:opacity-40"
        >
          {discarding ? 'Discarding…' : 'Discard Draft'}
        </button>
        <button
          onClick={handleApprove}
          disabled={promoting || discarding}
          className="text-xs px-4 py-1.5 bg-[#10E1C2] text-stone-100 font-semibold rounded-lg hover:bg-[#0dcfb2] transition-colors disabled:opacity-40"
        >
          {promoting ? 'Approving…' : 'Approve Program'}
        </button>
      </div>
    </div>
  )
}
