'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const bne = (iso: string) =>
  new Date(iso).toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'short', day: 'numeric', month: 'short',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

export default function CommencementFeeButton({
  leadId,
  email,
  paid,
  lastSentAt,
  linkExpiresAt,
  timesSent,
}: {
  leadId: string
  email: string | null
  paid: boolean
  lastSentAt: string | null
  linkExpiresAt: string | null
  timesSent: number
}) {
  const router = useRouter()
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Read once on load. A send creates a link 24 hours ahead, so a stale clock
  // can only misreport a page left open for a day without reloading.
  const [loadedAt] = useState(() => Date.now())

  const copyLink = async () => {
    setCopying(true)
    setError(null)
    const res = await fetch(`/api/leads/${leadId}/create-checkout`, { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      await navigator.clipboard.writeText(data.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 6000)
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
      // Re-fetch the server component so the line below picks up the send
      // that was just logged, without a manual reload.
      router.refresh()
      setTimeout(() => setSent(false), 3000)
    } else {
      setError(data.error ?? 'Failed to send email')
    }
    setSending(false)
  }

  // What has already happened, in one line under the buttons.
  const expired = linkExpiresAt ? new Date(linkExpiresAt).getTime() <= loadedAt : false
  let status: { text: string; tone: 'muted' | 'done' | 'warn' }
  if (paid) {
    status = { text: 'Commencement fee paid. No further action.', tone: 'done' }
  } else if (lastSentAt) {
    const to = email ? ` to ${email}` : ''
    const again = timesSent > 1 ? ` Sent ${timesSent} times.` : ''
    status = expired
      ? { text: `Emailed${to} on ${bne(lastSentAt)}. Not paid, and the payment link expired ${bne(linkExpiresAt!)}. Send again to create a new one.${again}`, tone: 'warn' }
      : { text: `Emailed${to} on ${bne(lastSentAt)}. Not paid yet. Payment link works until ${bne(linkExpiresAt!)}.${again}`, tone: 'muted' }
  } else {
    status = { text: 'Not sent yet.', tone: 'muted' }
  }
  const toneClass = status.tone === 'warn' ? 'text-[#B45309]' : status.tone === 'done' ? 'text-[#15803D]' : 'text-[#666D7A]'

  return (
    <div className="space-y-2">
      {error && <p className="text-[12.5px] text-[#C82626]">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={sendToClient}
          disabled={sending || sent || paid}
          className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#1560E0] transition-colors disabled:opacity-50"
        >
          {sending ? 'Sending...' : sent ? 'Email Sent' : lastSentAt ? 'Send Again' : 'Send to Client'}
        </button>
        <button
          onClick={copyLink}
          disabled={copying || copied || paid}
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 border border-[#E8EAEE] text-[#43474F] rounded-lg hover:border-[#1B6DFC] hover:text-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)] transition-colors disabled:opacity-50"
        >
          {copying ? 'Generating...' : copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
      <p className={`text-[12px] leading-relaxed ${toneClass}`}>{status.text}</p>
      {copied && (
        <p className="text-[12px] leading-relaxed text-[#666D7A]">
          Payment link copied. Nothing was emailed, so paste it into your own message. Copied links do not show above.
        </p>
      )}
    </div>
  )
}
