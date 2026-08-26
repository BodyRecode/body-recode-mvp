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
      className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-[#666D7A] hover:text-[#1B6DFC] border border-[#E8EAEE] hover:border-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)] rounded-lg transition-colors disabled:opacity-50"
    >
      <RefreshCw size={12} className={pending ? 'animate-spin' : ''} />
      {pending ? 'Syncing…' : 'Refresh from Stripe'}
    </button>
  )
}
