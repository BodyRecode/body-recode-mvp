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
        <p className="text-[12.5px] text-[#D4817E] mb-3">{error}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={handleDiscard}
          disabled={discarding || promoting}
          className="text-[12.5px] px-3 py-1.5 border border-[#2A2F39] text-[#8A9099] rounded-lg hover:border-[#4A2222] hover:text-[#D4817E] hover:bg-[#1A1214] transition-colors disabled:opacity-40"
        >
          {discarding ? 'Discarding…' : 'Discard Draft'}
        </button>
        <button
          onClick={handleApprove}
          disabled={promoting || discarding}
          className="text-[12.5px] px-4 py-1.5 bg-[#FAFAF8] text-[#0B0D10] font-semibold rounded-lg hover:bg-[#FFFFFF] transition-colors disabled:opacity-40"
        >
          {promoting ? 'Approving…' : 'Approve Program'}
        </button>
      </div>
    </div>
  )
}
