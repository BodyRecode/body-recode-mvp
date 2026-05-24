'use client'

import { useState } from 'react'
import SendEmailButton from './send-email-button'

interface Props {
  clientId: string
  clientName: string
  clientEmail?: string
}

export default function NewIntakeButton({ clientId, clientName, clientEmail }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready'>('idle')
  const [token, setToken] = useState('')
  const [copied, setCopied] = useState(false)

  async function createInvitation() {
    setStatus('loading')
    try {
      const res = await fetch('/api/new-intake-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToken(data.token)
      setStatus('ready')
    } catch {
      setStatus('idle')
    }
  }

  function copy() {
    navigator.clipboard.writeText(`${window.location.origin}/intake/${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'idle' || status === 'loading') {
    return (
      <button
        onClick={createInvitation}
        disabled={status === 'loading'}
        className="text-sm px-4 py-2 border border-[#E5E5E5] text-[#3A3A3A] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Creating…' : 'New intake'}
      </button>
    )
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl p-5 mt-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1B6DFC] mb-3">New intake link ready</p>
      <div className="bg-[#FFFFFF] rounded-lg px-4 py-3 flex items-center gap-3 mb-4">
        <p className="text-[#6B6B6B] text-xs font-mono flex-1 truncate">
          {window.location.origin}/intake/{token}
        </p>
        <button
          onClick={copy}
          className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-md border border-[#D4D4D4] text-[#3A3A3A] hover:border-[#999999] hover:text-[#1A1A1A] transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="flex gap-3">
        {clientEmail && (
          <SendEmailButton
            clientId={clientId}
            clientName={clientName}
            clientEmail={clientEmail}
            intakeToken={token}
            variant="outline"
          />
        )}
        <button
          onClick={() => { setStatus('idle'); setToken('') }}
          className="text-xs text-[#999999] hover:text-[#3A3A3A] transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
