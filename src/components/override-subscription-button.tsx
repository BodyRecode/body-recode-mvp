'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function OverrideSubscriptionButton({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!confirm('Mark this client\'s coaching package as active? Use this for clients on a free or manual billing arrangement.')) return
    setLoading(true)
    await fetch(`/api/clients/${clientId}/override-subscription`, { method: 'POST' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-[#999999] hover:text-blue-500 border border-[#E5E5E5] hover:border-blue-900/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? 'Overriding…' : 'Override payment'}
    </button>
  )
}
