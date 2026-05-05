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
      className="text-sm font-medium px-4 py-2.5 rounded-lg border border-[#1c1917] text-[#d4cfc9] hover:border-[#292524] transition-colors disabled:opacity-50"
    >
      {status === 'copied' ? 'Copied!' : 'Copy portal link'}
    </button>
  )
}
