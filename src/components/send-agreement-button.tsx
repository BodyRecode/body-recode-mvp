'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  clientId: string
  agreementStatus: 'none' | 'pending' | 'signed'
  agreementSentAt?: string | null
}

export default function SendAgreementButton({ clientId, agreementStatus, agreementSentAt }: Props) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()

  async function handleSend() {
    setSending(true)
    await fetch(`/api/clients/${clientId}/send-agreement`, { method: 'POST' })
    setSending(false)
    setSent(true)
    router.refresh()
  }

  if (agreementStatus === 'signed') {
    return (
      <span className="text-xs text-teal-400 bg-teal-400/10 border border-teal-400/20 px-2.5 py-1 rounded-full">
        Agreement signed
      </span>
    )
  }

  if (agreementStatus === 'pending') {
    const sentDate = agreementSentAt
      ? new Date(agreementSentAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'Australia/Brisbane' })
      : null
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
          Agreement pending{sentDate ? ` · sent ${sentDate}` : ''}
        </span>
        <button
          onClick={handleSend}
          disabled={sending || sent}
          className="text-xs text-stone-500 hover:text-stone-300 transition-colors disabled:opacity-50"
        >
          {sending ? 'Resending...' : sent ? 'Resent' : 'Resend'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleSend}
      disabled={sending || sent}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-700 text-stone-400 hover:border-violet-400/30 hover:text-violet-300 hover:bg-violet-500/10 transition-colors disabled:opacity-50"
    >
      {sending ? 'Sending...' : sent ? 'Sent!' : 'Send Case Study Agreement'}
    </button>
  )
}
