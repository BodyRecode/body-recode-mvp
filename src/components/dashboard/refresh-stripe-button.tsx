'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

/**
 * Pulls live subscription state from Stripe for the given client and
 * refreshes the page. Used on the per-client Payments section.
 */
export default function RefreshStripeButton({ clientId }: { clientId: string }) {
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function refresh() {
    setPending(true)
    try {
      const res = await fetch('/api/admin/stripe/refresh-client', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Refresh failed: ${err.error ?? res.statusText}`)
        return
      }
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={pending}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-[#1B6DFC] border border-stone-200 hover:border-[#1B6DFC] hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
    >
      <RefreshCw size={12} className={pending ? 'animate-spin' : ''} />
      {pending ? 'Syncing…' : 'Refresh from Stripe'}
    </button>
  )
}
