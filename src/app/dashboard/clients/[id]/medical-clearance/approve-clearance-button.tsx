'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ApproveClearanceButton({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!confirm('Approve this medical clearance? This will unlock intake and baseline for the client.')) return
    setLoading(true)
    await fetch(`/api/clients/${clientId}/approve-clearance`, { method: 'POST' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-[12.5px] bg-[#FAFAF8] text-[#0B0D10] font-medium px-3 py-1.5 rounded-lg hover:bg-[#2A2F39] transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? 'Approving…' : 'Approve'}
    </button>
  )
}
