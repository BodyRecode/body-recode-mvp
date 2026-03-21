'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function MarkClearanceButton({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!confirm('Mark medical clearance as received? This will unlock intake and baseline for this client.')) return
    setLoading(true)
    await fetch(`/api/clients/${clientId}/mark-clearance`, { method: 'POST' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs bg-amber-400 text-black font-bold px-3 py-1.5 rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? 'Saving…' : 'Mark received'}
    </button>
  )
}
