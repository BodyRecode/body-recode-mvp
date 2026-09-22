'use client'

import { useState } from 'react'

interface Props {
  clientId: string
  clientName: string
  clientEmail: string
  intakeToken: string
  variant?: 'default' | 'outline'
}

export default function SendEmailButton({
  clientId,
  clientName,
  clientEmail,
  intakeToken,
  variant = 'default',
}: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function send() {
    setStatus('sending')
    try {
      const res = await fetch('/api/send-intake-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientName, clientEmail, intakeToken }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      setStatus('sent')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed'
      setStatus('error')
      setErrorMsg(msg)
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  const baseClass = 'text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50'
  const variantClass =
    variant === 'outline'
      ? 'border border-[#2A2F39] text-[#C2C6CC] hover:border-[#FAFAF8] hover:text-[#FAFAF8] hover:bg-[rgba(27,109,252,0.06)]'
      : 'bg-[#FAFAF8] text-[#0B0D10] font-semibold hover:bg-[#E4E4E0]'

  if (status === 'sent') {
    return (
      <button
        onClick={() => setStatus('idle')}
        className={`${baseClass} ${variantClass} opacity-60`}
      >
        ✓ Sent - send again?
      </button>
    )
  }

  return (
    <button
      onClick={send}
      disabled={status === 'sending'}
      className={`${baseClass} ${variantClass}`}
    >
      {status === 'sending' ? 'Sending…' : status === 'error' ? `Error: ${errorMsg || 'retry'}` : 'Send email'}
    </button>
  )
}
