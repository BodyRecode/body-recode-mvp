'use client'

import { useState } from 'react'

export default function PortalInviteButton({ clientId, onboardingToken }: { clientId: string; onboardingToken?: string }) {
  const [status, setStatus] = useState<'idle' | 'copied'>('idle')

  const handleClick = async () => {
    const token = onboardingToken
    if (!token) return

    const link = `https://app.bodyrecode.au/portal/${token}`
    await navigator.clipboard.writeText(link)
    setStatus('copied')
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <button
      onClick={handleClick}
      disabled={!onboardingToken}
      className="text-xs px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white transition-colors disabled:opacity-50"
    >
      {status === 'copied' ? 'Copied!' : 'Copy portal link'}
    </button>
  )
}
