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
        className="text-[12.5px] px-3 py-1.5 border border-[#E4E4E0] text-[#6E747D] rounded-lg hover:border-[#E8C9C9] hover:text-[#8F2D2D] hover:bg-[#FBF1F1] transition-colors disabled:opacity-50"
      >
        {loading === 'discard' ? 'Discarding...' : 'Discard Draft'}
      </button>
      <button
        onClick={handleApprove}
        disabled={loading !== null}
        className="text-[12.5px] px-3 py-1.5 border border-[#DCDCD7] text-[#0F1115] rounded-lg hover:bg-[rgba(27,109,252,0.06)] transition-colors disabled:opacity-50"
      >
        {loading === 'approve' ? 'Approving...' : 'Approve Plan'}
      </button>
    </div>
  )
}
