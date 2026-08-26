'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

/**
 * Manually mark the commencement fee as paid for a client. Used when the
 * automatic detection (one-off ~$297 Stripe charge against a known customer)
 * doesn't catch it — e.g. paid via bank transfer, paid before this feature
 * shipped, paid through a different account, etc.
 */
export default function MarkCommencementButton({ clientId }: { clientId: string }) {
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function mark() {
    if (!confirm('Mark commencement fee as paid for this client? This records the date as today and links no Stripe payment.')) return
    setPending(true)
    try {
      const res = await fetch('/api/admin/payments/mark-commencement', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Failed: ${err.error ?? res.statusText}`)
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
      onClick={mark}
      disabled={pending}
      className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-[#1B6DFC] hover:text-[#1056D6] border border-[#B5CFFC] hover:border-[#1B6DFC]/50 rounded-lg transition-colors disabled:opacity-50"
    >
      <Check size={12} />
      {pending ? 'Saving…' : 'Mark commencement paid'}
    </button>
  )
}
