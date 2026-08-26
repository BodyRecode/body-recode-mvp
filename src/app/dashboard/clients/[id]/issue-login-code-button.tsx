'use client'

import { useState } from 'react'

type Issued = { code: string; email: string; expiresInMinutes: number }

export default function IssueLoginCodeButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false)
  const [issued, setIssued] = useState<Issued | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'code' | 'message' | null>(null)

  async function issue() {
    setLoading(true)
    setError('')
    setIssued(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/issue-login-code`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to generate code')
      } else {
        setIssued(data)
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function copy(text: string, which: 'code' | 'message') {
    navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 2000)
  }

  const relayMessage = issued
    ? `Your Body Recode sign-in code is ${issued.code}. Enter it at app.bodyrecode.au/portal/login (it expires in ${issued.expiresInMinutes} minutes).`
    : ''

  return (
    <div className="inline-block">
      <button
        onClick={issue}
        disabled={loading}
        className="br-btn disabled:opacity-60"
        title="Generate a sign-in code to relay manually (for clients whose email blocks delivery)"
      >
        {loading ? 'Generating…' : issued ? 'New code' : 'Issue login code'}
      </button>

      {error && <p className="text-[12.5px] text-[#C82626] mt-2">{error}</p>}

      {issued && (
        <div className="mt-2 w-full max-w-sm bg-[rgba(27,109,252,0.08)] border border-[#1B6DFC]/30 rounded-xl p-3">
          <p className="text-[12px] font-medium text-[#1B6DFC] mb-1">Sign-in code</p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-extrabold tracking-[0.25em] text-[#141821]">{issued.code}</span>
            <button
              onClick={() => copy(issued.code, 'code')}
              className="text-[12.5px] font-medium px-2.5 py-1 border border-[#E8EAEE] bg-white text-[#666D7A] rounded-lg hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors"
            >
              {copied === 'code' ? 'Copied!' : 'Copy code'}
            </button>
          </div>
          <p className="text-[11px] text-[#666D7A] mt-2 leading-relaxed">
            Relay to {issued.email} by phone/text. Expires in {issued.expiresInMinutes} min. They enter it at
            {' '}app.bodyrecode.au/portal/login.
          </p>
          <button
            onClick={() => copy(relayMessage, 'message')}
            className="text-[12.5px] font-medium mt-2 px-2.5 py-1 border border-[#E8EAEE] bg-white text-[#666D7A] rounded-lg hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors"
          >
            {copied === 'message' ? 'Copied!' : 'Copy ready-to-send message'}
          </button>
        </div>
      )}
    </div>
  )
}
