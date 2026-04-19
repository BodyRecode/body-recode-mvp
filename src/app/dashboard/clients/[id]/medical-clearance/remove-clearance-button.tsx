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
      className="text-xs bg-stone-800 text-stone-400 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-900/40 hover:text-red-400 border border-stone-700 hover:border-red-800/50 transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? 'Removing…' : 'Remove requirement'}
    </button>
  )
}
