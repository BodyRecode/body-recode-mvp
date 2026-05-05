'use client'

import { useState } from 'react'

export default function CommencementFeeButton({ leadId }: { leadId: string }) {
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const copyLink = async () => {
    setCopying(true)
    setError(null)
    const res = await fetch(`/api/leads/${leadId}/create-checkout`, { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      await navigator.clipboard.writeText(data.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } else {
      setError(data.error ?? 'Failed to generate link')
    }
    setCopying(false)
  }

  const sendToClient = async () => {
    setSending(true)
    setError(null)
    const res = await fetch(`/api/leads/${leadId}/send-commencement-fee`, { method: 'POST' })
    const data = await res.json()
    if (data.sent) {
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } else {
      setError(data.error ?? 'Failed to send email')
    }
    setSending(false)
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={sendToClient}
          disabled={sending || sent}
          className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 bg-[#14b8a6] text-black rounded-lg hover:bg-[#5eead4] transition-colors disabled:opacity-50"
        >
          {sending ? 'Sending...' : sent ? 'Email Sent' : 'Send to Client'}
        </button>
        <button
          onClick={copyLink}
          disabled={copying || copied}
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 border border-[#1c1917] text-[#d4cfc9] rounded-lg hover:border-[#292524] hover:text-white transition-colors disabled:opacity-50"
        >
          {copying ? 'Generating...' : copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  )
}
