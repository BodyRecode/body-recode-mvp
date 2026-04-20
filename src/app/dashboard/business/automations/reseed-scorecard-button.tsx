'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReseedScorecardButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function reseed(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    setDone(false)
    setError('')
    try {
      const res = await fetch('/api/admin/resync-scorecard-workflow', { method: 'POST' })
      if (res.ok) {
        setDone(true)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? `Error ${res.status}`)
      }
    } catch (e) {
      setError(String(e))
    }
    setLoading(false)
  }

  return (
    <div>
      <button
        onClick={reseed}
        disabled={loading}
        className="bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0"
      >
        {loading ? 'Syncing...' : done ? 'Synced' : 'Re-sync'}
      </button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
