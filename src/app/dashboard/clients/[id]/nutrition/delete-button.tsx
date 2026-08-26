'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteNutritionPlanButton({
  planId,
  label = 'Delete Plan',
  confirmMessage = 'Delete this nutrition plan? This permanently removes the plan and all its weekly reviews. This cannot be undone.',
}: {
  planId: string
  label?: string
  confirmMessage?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!confirm(confirmMessage)) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/nutrition/${planId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to delete')
        return
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-[12.5px] text-[#C82626]">{error}</span>}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-[12.5px] px-3 py-1.5 border border-[#E8EAEE] text-[#666D7A] rounded-lg hover:border-[#F5C9C9] hover:text-[#C82626] hover:bg-[#FDEDED] transition-colors disabled:opacity-50"
      >
        {loading ? 'Deleting...' : label}
      </button>
    </div>
  )
}
