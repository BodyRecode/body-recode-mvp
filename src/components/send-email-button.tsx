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
      ? 'border border-[#E8EAEE] text-[#43474F] hover:border-[#1B6DFC] hover:text-[#1B6DFC] hover:bg-blue-50'
      : 'bg-[#1B6DFC] text-white font-semibold hover:bg-[#5390FF]'

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
