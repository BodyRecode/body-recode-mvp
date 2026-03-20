'use client'

import { useState } from 'react'

export default function PortalInviteButton({ clientId }: { clientId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle')

  const handleClick = async () => {
    setStatus('loading')
    const res = await fetch('/api/portal/create-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })

    if (!res.ok) {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
      return
    }

    const { link } = await res.json()
    await navigator.clipboard.writeText(link)
    setStatus('copied')
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === 'loading'}
      className="text-xs px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white transition-colors disabled:opacity-50"
    >
      {status === 'loading' ? 'Generating…' : status === 'copied' ? 'Copied!' : status === 'error' ? 'Error — try again' : 'Copy portal invite'}
    </button>
  )
}
