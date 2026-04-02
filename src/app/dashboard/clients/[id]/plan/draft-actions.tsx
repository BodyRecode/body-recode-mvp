'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PlanDraftActions({ planId, clientId }: { planId: string; clientId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'discard' | null>(null)

  async function handleApprove() {
    setLoading('approve')
    await fetch(`/api/plan/${planId}/promote`, { method: 'POST' })
    router.refresh()
    setLoading(null)
  }

  async function handleDiscard() {
    if (!confirm('Discard this draft macro arc? This cannot be undone.')) return
    setLoading('discard')
    await fetch(`/api/plan/${planId}`, { method: 'DELETE' })
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDiscard}
        disabled={loading !== null}
        className="text-xs px-3 py-1.5 border border-stone-700 text-stone-500 rounded-lg hover:border-red-800 hover:text-red-400 transition-colors disabled:opacity-50"
      >
        {loading === 'discard' ? 'Discarding...' : 'Discard Draft'}
      </button>
      <button
        onClick={handleApprove}
        disabled={loading !== null}
        className="text-xs px-3 py-1.5 border border-teal-700 text-teal-400 rounded-lg hover:bg-teal-500/10 transition-colors disabled:opacity-50"
      >
        {loading === 'approve' ? 'Approving...' : 'Approve Arc'}
      </button>
    </div>
  )
}
