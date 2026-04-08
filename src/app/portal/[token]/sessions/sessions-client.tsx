'use client'

import { useState, useEffect } from 'react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

export default function SessionsClient({ token, clientId }: { token: string; clientId: string }) {
  const [open, setOpen] = useState(false)
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function loadSlots() {
    setLoading(true)
    try {
      const res = await fetch('/api/booking-slots?days=21&session_type=face_to_face')
      const data = await res.json()
      setSlots(data)
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
        setDone(true)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-teal-400/20 bg-teal-400/5 p-5">
        <p className="text-sm font-semibold text-teal-400 mb-1">Session booked</p>
        <p className="text-xs text-stone-400">Your coach has been notified. Check your email for confirmation.</p>
      </div>
    )
  }

  const grouped = groupByDay(slots)
  const days = Object.keys(grouped).sort()

  return (
    <div>
      <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Need to reschedule?</p>
      {!open ? (
        <button
          onClick={handleOpen}
          className="w-full rounded-2xl border border-stone-700 bg-stone-900 p-4 text-sm font-medium text-stone-300 hover:border-teal-400/40 hover:text-white transition-colors text-left"
        >
          View available times →
        </button>
      ) : loading ? (
        <div className="text-center py-8 text-stone-500 text-sm">Loading available times...</div>
      ) : days.length === 0 ? (
        <div className="rounded-2xl border border-stone-800 p-5">
          <p className="text-sm text-stone-400">No available times right now. Contact your coach directly.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {days.map(day => (
            <div key={day}>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">{formatDayHeader(day)}</p>
              <div className="flex flex-wrap gap-2">
                {grouped[day].map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelected(slot)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                      selected === slot
                        ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                        : 'border-stone-700 text-stone-300 hover:border-teal-500 hover:text-teal-400 hover:bg-teal-500/5'
                    }`}
                  >
                    {formatSlotTime(slot)}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={handleBook}
            disabled={!selected || submitting}
            className="w-full py-3.5 rounded-xl bg-teal-500 text-black text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-400 transition-colors"
          >
            {submitting ? 'Booking...' : selected ? `Book ${formatSlotTime(selected)}` : 'Select a time'}
          </button>
        </div>
      )}
    </div>
  )
}
