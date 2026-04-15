'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BookingActionButtons({ leadId, hasZoomDate }: { leadId: string; hasZoomDate: boolean }) {
  const router = useRouter()
  const [linkState, setLinkState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [confirmState, setConfirmState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function sendBookingLink() {
    setLinkState('loading')
    try {
      const res = await fetch(`/api/leads/${leadId}/send-booking-link`, { method: 'POST' })
      if (res.ok) {
        setLinkState('sent')
        setTimeout(() => setLinkState('idle'), 3000)
      } else {
        const d = await res.json()
        setErrorMsg(d.error ?? 'Failed to send')
        setLinkState('error')
        setTimeout(() => setLinkState('idle'), 4000)
      }
    } catch {
      setLinkState('error')
      setTimeout(() => setLinkState('idle'), 4000)
    }
  }

  async function sendConfirmation() {
    setConfirmState('loading')
    setErrorMsg('')
    try {
      const res = await fetch(`/api/leads/${leadId}/send-booking-confirmation`, { method: 'POST' })
      if (res.ok) {
        setConfirmState('sent')
        router.refresh()
        setTimeout(() => setConfirmState('idle'), 3000)
      } else {
        const d = await res.json()
        setErrorMsg(d.error ?? 'Failed to send')
        setConfirmState('error')
        setTimeout(() => setConfirmState('idle'), 4000)
      }
    } catch {
      setConfirmState('error')
      setTimeout(() => setConfirmState('idle'), 4000)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={sendBookingLink}
        disabled={linkState === 'loading'}
        className="w-full text-left px-4 py-3 rounded-lg border border-stone-700 text-sm font-medium text-stone-300 hover:border-stone-500 hover:text-white transition-colors disabled:opacity-50"
      >
        {linkState === 'loading' ? 'Sending...' : linkState === 'sent' ? 'Booking link sent ✓' : linkState === 'error' ? 'Failed to send' : 'Send booking link'}
      </button>
      <button
        onClick={sendConfirmation}
        disabled={confirmState === 'loading' || !hasZoomDate}
        title={!hasZoomDate ? 'Set a Zoom date in Actions first' : undefined}
        className="w-full text-left px-4 py-3 rounded-lg border border-stone-700 text-sm font-medium text-stone-300 hover:border-stone-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {confirmState === 'loading' ? 'Sending...' : confirmState === 'sent' ? 'Confirmation sent ✓' : confirmState === 'error' ? (errorMsg || 'Failed to send') : 'Send booking confirmation'}
      </button>
      {!hasZoomDate && (
        <p className="text-xs text-stone-600">Set a Zoom date in Actions before sending the confirmation.</p>
      )}
      {(linkState === 'error' || confirmState === 'error') && errorMsg && (
        <p className="text-xs text-red-400">{errorMsg}</p>
      )}
    </div>
  )
}
