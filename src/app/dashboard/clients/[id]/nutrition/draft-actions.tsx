'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NutritionDraftActions({ planId, clientId }: { planId: string; clientId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'discard' | null>(null)

  async function handleApprove() {
    setLoading('approve')
    await fetch(`/api/nutrition/${planId}/promote`, { method: 'POST' })
    router.refresh()
    setLoading(null)
  }

  async function handleDiscard() {
    if (!confirm('Discard this draft nutrition plan? This cannot be undone.')) return
    setLoading('discard')
    await fetch(`/api/nutrition/${planId}`, { method: 'DELETE' })
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDiscard}
        disabled={loading !== null}
        className="text-xs px-3 py-1.5 border border-stone-300 text-stone-500 rounded-lg hover:border-red-200 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {loading === 'discard' ? 'Discarding...' : 'Discard Draft'}
      </button>
      <button
        onClick={handleApprove}
        disabled={loading !== null}
        className="text-xs px-3 py-1.5 border border-blue-800 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
      >
        {loading === 'approve' ? 'Approving...' : 'Approve Plan'}
      </button>
    </div>
  )
}
