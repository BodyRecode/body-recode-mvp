'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PlanDraftActions({ planId, clientId }: { planId: string; clientId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'discard' | null>(null)

  async function handleApprove() {
    setLoading('approve')
    try {
      const res = await fetch(`/api/plan/${planId}/promote`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        const msg = res.status === 401
          ? 'Your session has expired. Reload the page and try again.'
          : body.error || `Approve failed (${res.status}).`
        alert(msg)
        return
      }
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  async function handleDiscard() {
    if (!confirm('Discard this draft macro arc? This cannot be undone.')) return
    setLoading('discard')
    try {
      const res = await fetch(`/api/plan/${planId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        const msg = res.status === 401
          ? 'Your session has expired. Reload the page and try again.'
          : body.error || `Discard failed (${res.status}).`
        alert(msg)
        return
      }
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDiscard}
        disabled={loading !== null}
        className="text-[12.5px] px-3 py-1.5 border border-[#E8EAEE] text-[#666D7A] rounded-lg hover:border-[#F5C9C9] hover:text-[#C82626] hover:bg-[#FDEDED] transition-colors disabled:opacity-50"
      >
        {loading === 'discard' ? 'Discarding...' : 'Discard Draft'}
      </button>
      <button
        onClick={handleApprove}
        disabled={loading !== null}
        className="text-[12.5px] px-3 py-1.5 border border-[#B5CFFC] text-[#1B6DFC] rounded-lg hover:bg-[rgba(27,109,252,0.06)] transition-colors disabled:opacity-50"
      >
        {loading === 'approve' ? 'Approving...' : 'Approve Arc'}
      </button>
    </div>
  )
}
