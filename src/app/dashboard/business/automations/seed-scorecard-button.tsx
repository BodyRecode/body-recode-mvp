'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const res = await fetch('/api/admin/resync-scorecard-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId: user?.id }),
      })
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
    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg shrink-0">
          <Zap size={14} className="text-blue-500" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-medium text-[#141821]">Scorecard Follow-up Sequence</p>
          <p className="text-[12.5px] text-[#666D7A] mt-0.5">9-step sequence triggered when someone completes the Readiness Scorecard</p>
          {error && <p className="text-[12.5px] text-red-700 mt-1">{error}</p>}
        </div>
      </div>
      <button
        onClick={sync}
        disabled={loading}
        className="shrink-0 bg-blue-500 hover:bg-blue-500 disabled:opacity-50 text-stone-50 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
      >
        {loading ? 'Syncing...' : done ? 'Synced' : 'Re-sync'}
      </button>
    </div>
  )
}
