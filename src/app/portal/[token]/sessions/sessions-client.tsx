'use client'

import { useState } from 'react'

function groupByDay(slots: string[]): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const slot of slots) {
    const d = new Date(slot)
    const brisbane = new Date(d.getTime() + 10 * 60 * 60_000)
    const key = brisbane.toISOString().slice(0, 10)
    if (!map[key]) map[key] = []
    map[key].push(slot)
  }
  return map
}

function formatDayHeader(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-AU', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
}

function formatSlotTime(slot: string): string {
  return new Date(slot).toLocaleTimeString('en-AU', {
    timeZone: 'Australia/Brisbane',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

function formatSlotFull(slot: string): string {
  return new Date(slot).toLocaleDateString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'short', day: 'numeric', month: 'short',
  }) + ' · ' + formatSlotTime(slot)
}

export default function SessionsClient({ token, clientId }: { token: string; clientId: string }) {
  const [open, setOpen] = useState(false)
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  // Track all bookings made this session so they show immediately without a reload
  const [recentlyBooked, setRecentlyBooked] = useState<string[]>([])

  async function loadSlots() {
    setLoading(true)
    try {
      const res = await fetch('/api/booking-slots?days=21&session_type=face_to_face')
      const data = await res.json()
      // Filter out slots already booked this session
      setSlots(data.filter((s: string) => !recentlyBooked.includes(s)))
    } finally {
      setLoading(false)
    }
  }

  function handleOpen() {
    setOpen(true)
    loadSlots()
  }

  async function handleBook() {
    if (!selected) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/portal/reschedule-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: selected, clientId, token }),
      })
      if (res.ok) {
        // Record the booking locally and reset the picker for another booking
        setRecentlyBooked(prev => [...prev, selected])
        setSlots(prev => prev.filter(s => s !== selected))
        setSelected(null)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setSubmitting(false)
  }

  const grouped = groupByDay(slots)
  const days = Object.keys(grouped).sort()

  return (
    <div>
      <p className="text-[12.5px] font-medium text-[#98A0AD] mb-4">Book a session</p>

      {/* Show any sessions booked this page load */}
      {recentlyBooked.length > 0 && (
        <div className="space-y-2 mb-4">
          {recentlyBooked.map(slot => (
            <div key={slot} className="rounded-xl border border-[#B5CFFC] bg-[#EFF5FE] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#141821]">{formatSlotFull(slot)}</p>
                <p className="text-xs text-[#98A0AD] mt-0.5">Confirmation email sent</p>
              </div>
              <span className="text-xs font-bold text-[#1B6DFC] bg-[#EFF5FE] px-2.5 py-1 rounded-full">Booked</span>
            </div>
          ))}
        </div>
      )}

      {!open ? (
        <button
          onClick={handleOpen}
          className="w-full rounded-2xl border border-[#E8EAEE] bg-[#FFFFFF] p-4 text-sm font-medium text-[#43474F] hover:border-[#1B6DFC]/40 hover:text-[#141821] transition-colors text-left"
        >
          View available times →
        </button>
      ) : loading ? (
        <div className="text-center py-8 text-[#98A0AD] text-sm">Loading available times...</div>
      ) : days.length === 0 ? (
        <div className="rounded-2xl border border-[#E8EAEE] p-5">
          <p className="text-sm text-[#666D7A]">No available times right now. Contact your coach directly.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {days.map(day => (
            <div key={day}>
              <p className="text-[12.5px] font-semibold text-[#98A0AD] mb-3">{formatDayHeader(day)}</p>
              <div className="flex flex-wrap gap-2">
                {grouped[day].map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelected(slot)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                      selected === slot
                        ? 'border-[#1B6DFC] bg-[#EFF5FE] text-[#1B6DFC]'
                        : 'border-[#E8EAEE] text-[#43474F] hover:border-[#1B6DFC] hover:text-[#1B6DFC] hover:bg-[#EFF5FE]'
                    }`}
                  >
                    {formatSlotTime(slot)}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {error && <p className="text-sm text-[#C82626]">{error}</p>}

          <button
            onClick={handleBook}
            disabled={!selected || submitting}
            className="w-full py-3.5 rounded-xl bg-[#1B6DFC] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1B6DFC] transition-colors"
          >
            {submitting ? 'Booking...' : selected ? `Book ${formatSlotTime(selected)}` : 'Select a time'}
          </button>
        </div>
      )}
    </div>
  )
}
