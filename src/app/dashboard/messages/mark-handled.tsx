'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, Loader2, RotateCcw } from 'lucide-react'

/**
 * Closes a conversation that was dealt with off-platform.
 *
 * Sends nothing. The client sees no change. This exists because the only way to
 * clear the inbox used to be replying, which meant answering a question twice
 * when the real answer had already happened on the phone.
 */
export default function MarkHandled({
  clientId,
  handled,
}: {
  clientId: string
  /** True when the newest client message is already closed off. */
  handled: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function go(undo: boolean) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/mark-handled`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ undo }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `Failed (${res.status})`)
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => go(handled)}
        disabled={busy}
        title={handled
          ? 'Reopen this conversation in your inbox'
          : 'Close this off without sending anything. Use when you answered by phone or text.'}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-[#E8EAEE] text-[#4A4A4A] hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors disabled:opacity-50"
      >
        {busy
          ? <Loader2 size={12} className="animate-spin" />
          : handled ? <RotateCcw size={12} /> : <CheckCheck size={12} />}
        {handled ? 'Reopen' : 'Handled elsewhere'}
      </button>
      {error && <span className="text-[12px] font-semibold text-red-700">{error}</span>}
    </div>
  )
}
