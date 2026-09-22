'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RemoveClearanceButton({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!confirm('Remove the medical clearance requirement? This will clear the flag and all clearance data for this client.')) return
    setLoading(true)
    await fetch(`/api/clients/${clientId}/remove-clearance`, { method: 'POST' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-[12.5px] bg-[#1A1E26] text-[#8A9099] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#1A1214] hover:text-[#D4817E] border border-[#2A2F39] hover:border-[#4A2222] transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? 'Removing…' : 'Remove requirement'}
    </button>
  )
}
