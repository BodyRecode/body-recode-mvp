'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteProgramButton({
  programId,
  label = 'Delete Program',
  confirmMessage = 'Delete this training program? This permanently removes the program and all its weekly reviews. This cannot be undone.',
}: {
  programId: string
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
      const res = await fetch(`/api/programs/${programId}`, { method: 'DELETE' })
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
      {error && <span className="text-xs text-red-400">{error}</span>}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs px-3 py-1.5 border border-stone-700 text-stone-500 rounded-lg hover:border-red-800 hover:text-red-400 transition-colors disabled:opacity-50"
      >
        {loading ? 'Deleting...' : label}
      </button>
    </div>
  )
}
