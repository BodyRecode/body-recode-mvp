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
        <p className="text-[12.5px] text-[#C82626] mb-3">{error}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={handleDiscard}
          disabled={discarding || promoting}
          className="text-[12.5px] px-3 py-1.5 border border-[#E8EAEE] text-[#666D7A] rounded-lg hover:border-[#F5C9C9] hover:text-[#C82626] hover:bg-[#FDEDED] transition-colors disabled:opacity-40"
        >
          {discarding ? 'Discarding…' : 'Discard Draft'}
        </button>
        <button
          onClick={handleApprove}
          disabled={promoting || discarding}
          className="text-[12.5px] px-4 py-1.5 bg-[#1B6DFC] text-white font-semibold rounded-lg hover:bg-[#1560E0] transition-colors disabled:opacity-40"
        >
          {promoting ? 'Approving…' : 'Approve Program'}
        </button>
      </div>
    </div>
  )
}
