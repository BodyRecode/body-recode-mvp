'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'idle' | 'picking' | 'loading-slots' | 'confirming' | 'custom' | 'booking' | 'done' | 'error'

function groupByDay(slots: string[]): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const slot of slots) {
    const brisbane = new Date(new Date(slot).getTime() + 10 * 60 * 60_000)
    const key = brisbane.toISOString().slice(0, 10)
    if (!map[key]) map[key] = []
    map[key].push(slot)
  }
  return map
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AU', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'Australia/Brisbane',
  })
}

function formatDay(dateKey: string) {
  const d = new Date(dateKey + 'T00:00:00+10:00')
  return d.toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'Australia/Brisbane',
  })
}

export default function BookingActionButtons({
  leadId,
  leadName,
  leadEmail,
  hasZoomDate,
}: {
  leadId: string
  leadName: string
  leadEmail?: string
  hasZoomDate: boolean
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('idle')
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [linkState, setLinkState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [confirmState, setConfirmState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function openSlotPicker() {
    setStep('loading-slots')
    setSelectedSlot(null)
    setErrorMsg('')
    try {
      const res = await fetch('/api/booking-slots?days=14')
      const data = await res.json()
      setSlots(Array.isArray(data) ? data : [])
      setStep('picking')
    } catch {
      setErrorMsg('Could not load available slots.')
      setStep('error')
    }
  }

  async function confirmBooking() {
    if (!selectedSlot || !leadName || !leadEmail) return
    setStep('booking')
    setErrorMsg('')
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: leadName, email: leadEmail, slot: selectedSlot }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Booking failed.')
        setStep('error')
        return
      }
      setStep('done')
      router.refresh()
    } catch {
      setErrorMsg('Something went wrong.')
      setStep('error')
    }
  }

  async function confirmCustomBooking() {
    if (!customDate || !customTime || !leadName || !leadEmail) return
    // Build ISO from Brisbane local datetime - Brisbane is UTC+10 year-round (no DST)
    const slotISO = new Date(`${customDate}T${customTime}:00+10:00`).toISOString()
    setStep('booking')
    setErrorMsg('')
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: leadName, email: leadEmail, slot: slotISO }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Booking failed.')
        setStep('error')
        return
      }
      setStep('done')
      router.refresh()
    } catch {
      setErrorMsg('Something went wrong.')
      setStep('error')
    }
  }

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

  const grouped = groupByDay(slots)
  const days = Object.keys(grouped).sort()

  const selectedDate = selectedSlot
    ? new Date(selectedSlot).toLocaleDateString('en-AU', {
        weekday: 'long', day: 'numeric', month: 'long',
        timeZone: 'Australia/Brisbane',
      })
    : null
  const selectedTime = selectedSlot ? formatTime(selectedSlot) : null

  return (
    <div className="space-y-2">

      {/* Book a call - coach-side slot picker */}
      {step === 'idle' && (
        <button
          onClick={openSlotPicker}
          className="w-full text-left px-4 py-3 rounded-lg border border-[#E5E5E5] text-sm font-medium text-[#3A3A3A] hover:border-[#D4D4D4] hover:text-white transition-colors"
        >
          Book a call
        </button>
      )}

      {step === 'loading-slots' && (
        <div className="px-4 py-3 rounded-lg border border-[#E5E5E5] text-sm text-[#999999]">
          Loading slots...
        </div>
      )}

      {step === 'picking' && (
        <div className="rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Pick a time</p>
            <button onClick={() => setStep('idle')} className="text-xs text-[#999999] hover:text-[#6B6B6B] transition-colors">Cancel</button>
          </div>
          {days.length === 0 ? (
            <p className="text-xs text-[#999999]">No available slots in the next 14 days. Use Custom time below or check your availability settings.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {days.map(day => (
                <div key={day}>
                  <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mb-1.5">{formatDay(day)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {grouped[day].map(slot => (
                      <button
                        key={slot}
                        onClick={() => { setSelectedSlot(slot); setStep('confirming') }}
                        className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#E5E5E5] text-[#3A3A3A] hover:border-teal-500 hover:text-teal-400 transition-colors"
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-[#E5E5E5]">
            <button
              onClick={() => setStep('custom')}
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium"
            >
              + Pick a custom time (outside published availability)
            </button>
          </div>
        </div>
      )}

      {step === 'custom' && (
        <div className="rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Custom time</p>
            <button onClick={() => setStep('picking')} className="text-xs text-[#999999] hover:text-[#6B6B6B] transition-colors">Back</button>
          </div>
          <p className="text-xs text-[#999999] mb-3">Brisbane time. This bypasses your published availability - use when {leadName.split(' ')[0]} needs a slot you don&apos;t normally offer.</p>
          <div className="space-y-2 mb-3">
            <input
              type="date"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors [color-scheme:dark]"
            />
            <input
              type="time"
              value={customTime}
              onChange={e => setCustomTime(e.target.value)}
              step={900}
              className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 transition-colors [color-scheme:dark]"
            />
          </div>
          <button
            onClick={confirmCustomBooking}
            disabled={!customDate || !customTime}
            className="w-full px-4 py-2.5 rounded-lg bg-[#1B6DFC] hover:bg-[#5390FF] text-black text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Book {leadName.split(' ')[0]}
          </button>
        </div>
      )}

      {step === 'confirming' && selectedSlot && (
        <div className="rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Confirm booking</p>
            <button onClick={() => setStep('picking')} className="text-xs text-[#999999] hover:text-[#6B6B6B] transition-colors">Back</button>
          </div>
          <p className="text-sm font-semibold text-white mb-0.5">{selectedDate}</p>
          <p className="text-xs text-[#6B6B6B] mb-4">{selectedTime} Brisbane · 30 min · {leadName}</p>
          <button
            onClick={confirmBooking}
            className="w-full px-4 py-2.5 rounded-lg bg-[#1B6DFC] hover:bg-[#5390FF] text-black text-sm font-bold transition-colors"
          >
            Confirm
          </button>
        </div>
      )}

      {step === 'booking' && (
        <div className="px-4 py-3 rounded-lg border border-[#E5E5E5] text-sm text-[#999999]">
          Booking...
        </div>
      )}

      {step === 'done' && (
        <div className="px-4 py-3 rounded-lg border border-teal-400/20 bg-teal-400/5 text-sm font-medium text-teal-400">
          Booked - confirmation sent to {leadEmail}
        </div>
      )}

      {step === 'error' && (
        <div className="space-y-2">
          <div className="px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/5 text-sm text-red-400">
            {errorMsg || 'Something went wrong.'}
          </div>
          <button onClick={() => setStep('idle')} className="text-xs text-[#999999] hover:text-[#3A3A3A] transition-colors">Try again</button>
        </div>
      )}

      {/* Send booking link */}
      {(step === 'idle' || step === 'done') && (
        <button
          onClick={sendBookingLink}
          disabled={linkState === 'loading'}
          className="w-full text-left px-4 py-3 rounded-lg border border-[#E5E5E5] text-sm font-medium text-[#3A3A3A] hover:border-[#D4D4D4] hover:text-white transition-colors disabled:opacity-50"
        >
          {linkState === 'loading' ? 'Sending...' : linkState === 'sent' ? 'Booking link sent ✓' : linkState === 'error' ? 'Failed to send' : 'Send booking link'}
        </button>
      )}

      {/* Send booking confirmation */}
      {(step === 'idle' || step === 'done') && (
        <button
          onClick={sendConfirmation}
          disabled={confirmState === 'loading' || !hasZoomDate}
          title={!hasZoomDate ? 'Book a call or set a Zoom date in Actions first' : undefined}
          className="w-full text-left px-4 py-3 rounded-lg border border-[#E5E5E5] text-sm font-medium text-[#3A3A3A] hover:border-[#D4D4D4] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {confirmState === 'loading' ? 'Sending...' : confirmState === 'sent' ? 'Confirmation sent ✓' : confirmState === 'error' ? (errorMsg || 'Failed to send') : 'Send booking confirmation'}
        </button>
      )}

      {!hasZoomDate && (step === 'idle' || step === 'done') && (
        <p className="text-xs text-[#999999]">Use &quot;Book a call&quot; above, or set a Zoom date in Actions before sending the confirmation.</p>
      )}

      {(linkState === 'error' || confirmState === 'error') && errorMsg && (
        <p className="text-xs text-red-400">{errorMsg}</p>
      )}
    </div>
  )
}
