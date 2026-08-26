'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

// Resolve a flagged co-pilot exchange by clearing the flag. Reuses the existing
// client-scoped flag route (flagged=false), so no new endpoint is needed.
export default function ResolveButton({ clientId, messageId }: { clientId: string; messageId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function resolve() {
    setBusy(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/copilot/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, flagged: false }),
      })
      if (!res.ok) throw new Error('resolve failed')
      router.refresh()
    } catch {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={resolve}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md border border-[#E8EAEE] text-[#4B4B4B] hover:text-[#141821] hover:bg-[#F6F6F6] transition-colors disabled:opacity-50"
    >
      <Check size={13} strokeWidth={2.5} />
      {busy ? 'Resolving…' : 'Mark reviewed'}
    </button>
  )
}
