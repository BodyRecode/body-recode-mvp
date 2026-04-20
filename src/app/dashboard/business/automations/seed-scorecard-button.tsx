'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SeedScorecardButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function sync() {
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
    <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4 flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-teal-500/10 rounded-lg shrink-0">
          <Zap size={14} className="text-teal-400" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Scorecard Follow-up Sequence</p>
          <p className="text-xs text-stone-500 mt-0.5">9-step sequence triggered when someone completes the Body State Scorecard</p>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
      </div>
      <button
        onClick={sync}
        disabled={loading}
        className="shrink-0 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-stone-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
      >
        {loading ? 'Syncing...' : done ? 'Synced' : 'Re-sync'}
      </button>
    </div>
  )
}
