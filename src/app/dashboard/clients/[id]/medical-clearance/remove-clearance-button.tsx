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
      className="text-[12.5px] bg-[#EFF1F4] text-[#666D7A] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#FDEDED] hover:text-[#C82626] border border-[#E8EAEE] hover:border-[#F5C9C9] transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? 'Removing…' : 'Remove requirement'}
    </button>
  )
}
