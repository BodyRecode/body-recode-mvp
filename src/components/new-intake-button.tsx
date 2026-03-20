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
        className="text-sm px-4 py-2 border border-stone-700 text-stone-300 rounded-lg hover:border-stone-500 transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Creating…' : 'New intake'}
      </button>
    )
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mt-4">
      <p className="text-xs uppercase tracking-wider text-stone-500 mb-3">New intake link ready</p>
      <div className="bg-stone-950 rounded-lg px-4 py-3 flex items-center gap-3 mb-4">
        <p className="text-stone-400 text-xs font-mono flex-1 truncate">
          {window.location.origin}/intake/{token}
        </p>
        <button
          onClick={copy}
          className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-md border border-stone-600 text-stone-300 hover:border-stone-400 hover:text-white transition-colors"
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
          className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
