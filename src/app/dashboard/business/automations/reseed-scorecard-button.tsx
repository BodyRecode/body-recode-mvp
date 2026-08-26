'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const EXPECTED_STEPS = 9

export default function ReseedScorecardButton({ stepCount }: { stepCount: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [synced, setSynced] = useState(false)
  const [error, setError] = useState('')

  const isCurrent = stepCount === EXPECTED_STEPS

  async function resync(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    setSynced(false)
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
        setSynced(true)
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
      {isCurrent && !synced ? (
        <span className="text-[12.5px] font-medium text-[#666D7A] px-3 py-1.5">Up to date</span>
      ) : (
        <button
          onClick={resync}
          disabled={loading}
          className="bg-[#EFF1F4] hover:bg-[#E8EAEE] disabled:opacity-50 text-[#141821] text-[12.5px] font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          {loading ? 'Syncing...' : synced ? 'Synced ✓' : 'Re-sync'}
        </button>
      )}
      {error && <p className="text-[12.5px] text-[#C82626] mt-1">{error}</p>}
    </div>
  )
}
