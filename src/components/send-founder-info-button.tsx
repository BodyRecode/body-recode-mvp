'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SendFounderInfoButton({
  clientId,
  sentAt,
}: {
  clientId: string
  sentAt: string | null
}) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()

  async function handleSend() {
    setSending(true)
    const res = await fetch(`/api/clients/${clientId}/send-founder-info`, { method: 'POST' })
    setSending(false)
    if (res.ok) {
      setSent(true)
      router.refresh()
    }
  }

  if (sentAt) {
    return (
      <span className="text-xs text-stone-600">
        Info package sent {new Date(sentAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Brisbane' })}
      </span>
    )
  }

  return (
    <button
      onClick={handleSend}
      disabled={sending || sent}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-700 text-stone-400 hover:border-violet-400/30 hover:text-violet-300 hover:bg-violet-500/10 transition-colors disabled:opacity-50"
    >
      {sending ? 'Sending...' : sent ? 'Sent!' : 'Send Info Package'}
    </button>
  )
}
