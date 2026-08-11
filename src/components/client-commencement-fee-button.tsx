'use client'

/**
 * Client-stage commencement fee send.
 *
 * Rendered inside the per-client Payments section when the client is on a
 * non-billing package (contra / no_charge). Lets the coach optionally send
 * the $297 commencement link to clients who'd normally be skipped by the
 * Payments tracker. Mirrors the lead-stage CommencementFeeButton's send +
 * copy + last-sent affordances; persists communications in
 * client_communications.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface LastSent {
  sent_at: string
  meta: {
    stripe_session_expires_at?: string
  } | null
}

export default function ClientCommencementFeeButton({
  clientId,
  initialPaid,
}: {
  clientId: string
  initialPaid?: boolean
}) {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSent, setLastSent] = useState<LastSent | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/clients/${clientId}/send-commencement-fee`)
      .then(async (r) => {
        if (!r.ok) return
        const data = (await r.json()) as { lastSent: LastSent | null }
        if (!cancelled) setLastSent(data.lastSent ?? null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [clientId])

  const send = async () => {
    setSending(true)
    setError(null)
    const res = await fetch(`/api/clients/${clientId}/send-commencement-fee`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    setSending(false)
    if (res.ok && data.sent) {
      setSent(true)
      router.refresh()
      setTimeout(() => setSent(false), 3000)
    } else {
      setError(data.error ?? 'Failed to send Foundational Read link')
    }
  }

  const copyLink = async () => {
    setCopying(true)
    setError(null)
    const res = await fetch(`/api/clients/${clientId}/send-commencement-fee`, { method: 'PUT' })
    const data = await res.json().catch(() => ({}))
    setCopying(false)
    if (res.ok && data.url) {
      try {
        await navigator.clipboard.writeText(data.url)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      } catch {
        setError('Generated link but could not copy to clipboard')
      }
    } else {
      setError(data.error ?? 'Failed to generate link')
    }
  }

  if (initialPaid) {
    return (
      <p className="text-xs text-blue-500">Foundational Read paid — no further action.</p>
    )
  }

  const sentAt = lastSent?.sent_at ? new Date(lastSent.sent_at) : null
  const expiresAt = lastSent?.meta?.stripe_session_expires_at
    ? new Date(lastSent.meta.stripe_session_expires_at)
    : null
  const expired = expiresAt ? expiresAt.getTime() <= Date.now() : false
  const sentLabel = sentAt
    ? sentAt.toLocaleString('en-AU', {
        timeZone: 'Australia/Brisbane',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-700">{error}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={send}
          disabled={sending || sent}
          className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          {sending ? 'Sending...' : sent ? 'Email sent' : 'Send Foundational Read link'}
        </button>
        <button
          onClick={copyLink}
          disabled={copying || copied}
          className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 border border-stone-200 text-stone-700 rounded-lg hover:border-stone-300 hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
        >
          {copying ? 'Generating...' : copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
      {sentLabel && (
        <p className={`text-[11px] ${expired ? 'text-amber-500' : 'text-stone-500'}`}>
          Last sent {sentLabel} Brisbane{expired ? ' · Stripe link expired (resend to generate new one)' : ''}
        </p>
      )}
    </div>
  )
}
