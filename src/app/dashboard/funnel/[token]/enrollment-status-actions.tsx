'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, RotateCcw } from 'lucide-react'

// Statuses that mean the enrollment has been retired (duplicate sign-up, wrong
// entry, etc). Anything in this set is hidden from the Day 0 scorecard report
// and the active funnel view. 'duplicate' is included so enrollments retired
// before this button existed still read as deactivated here.
const DEACTIVATED_STATES = ['inactive', 'duplicate', 'deactivated', 'withdrawn']

export default function EnrollmentStatusActions({ token, status }: { token: string; status: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isDeactivated = DEACTIVATED_STATES.includes((status ?? '').toLowerCase())

  async function setStatus(next: 'active' | 'inactive') {
    if (next === 'inactive' && !confirm(
      'Deactivate this enrollment?\n\nIt will drop off the Day 0 scorecard report and the active funnel. Nothing is deleted - you can reactivate it any time.',
    )) return

    setLoading(true)
    const res = await fetch(`/api/funnel/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    setLoading(false)
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }))
      alert(`Could not update enrollment: ${error}`)
      return
    }
    router.refresh()
  }

  if (isDeactivated) {
    return (
      <div className="rounded-xl border border-[#F1DEB8] bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#A96A12]">Enrollment deactivated</p>
          <p className="text-[12.5px] text-[#A96A12] mt-1">Hidden from the Day 0 report and active funnel. Reactivate to restore it.</p>
        </div>
        <button
          onClick={() => setStatus('active')}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg border border-[#E5C98F] bg-white text-[#A96A12] hover:border-[#B7791F] hover:bg-[#FAEFD8] transition disabled:opacity-50 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {loading ? 'Saving…' : 'Reactivate enrollment'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setStatus('inactive')}
      disabled={loading}
      className="group w-full flex items-center justify-between rounded-xl border border-[#E8EAEE] bg-white p-4 hover:border-[#EFAFAF] hover:bg-[#FDEDED] transition disabled:opacity-50 text-left"
    >
      <div>
        <div className="flex items-center gap-2">
          <Ban className="w-3.5 h-3.5 text-[#98A0AD] group-hover:text-[#C82626] transition" />
          <p className="text-sm font-bold text-[#141821] group-hover:text-[#C82626] transition">
            {loading ? 'Saving…' : 'Deactivate enrollment'}
          </p>
        </div>
        <p className="text-[12.5px] text-[#666D7A] mt-1">Retire a duplicate or mistaken sign-up. Reversible, deletes nothing.</p>
      </div>
    </button>
  )
}
