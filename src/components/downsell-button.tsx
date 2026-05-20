'use client'

import { useState } from 'react'

export default function DownsellButton({ leadId, alreadyPurchased }: { leadId: string; alreadyPurchased?: boolean }) {
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getCheckoutUrl = async (): Promise<string | null> => {
    const res = await fetch(`/api/leads/${leadId}/create-downsell-checkout`, { method: 'POST' })
    const data = await res.json()
    if (data.url) return data.url
    setError(data.error ?? 'Failed to generate link')
    return null
  }

  const copyLink = async () => {
    setCopying(true)
    setError(null)
    const url = await getCheckoutUrl()
    if (url) {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
    setCopying(false)
  }

  const sendEmail = async () => {
    setSending(true)
    setError(null)
    const res = await fetch(`/api/leads/${leadId}/send-downsell-offer`, { method: 'POST' })
    const data = await res.json()
    if (data.sent) {
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } else {
      setError(data.error ?? 'Failed to send email')
    }
    setSending(false)
  }

  if (alreadyPurchased) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-400 bg-teal-500/10 px-3 py-1.5 rounded-full border border-teal-500/20">
        Program purchased
      </span>
    )
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-700">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={sendEmail}
          disabled={sending || sent}
          className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#5390FF] transition-colors disabled:opacity-50"
        >
          {sending ? 'Sending...' : sent ? 'Email Sent' : 'Send Offer Email'}
        </button>
        <button
          onClick={copyLink}
          disabled={copying || copied}
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 border border-[#E5E5E5] text-[#3A3A3A] rounded-lg hover:border-[#D4D4D4] hover:text-white transition-colors disabled:opacity-50"
        >
          {copying ? 'Generating...' : copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  )
}
