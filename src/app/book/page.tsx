'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Calendar, Clock, CheckCircle2, Loader2, ChevronLeft } from 'lucide-react'

type Step = 'slots' | 'details' | 'confirmed'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function groupByDay(slots: string[]): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const slot of slots) {
    const d = new Date(slot)
    // Display in Brisbane time
    const brisbane = new Date(d.getTime() + 10 * 60 * 60_000)
    const key = brisbane.toISOString().slice(0, 10)
    if (!map[key]) map[key] = []
    map[key].push(slot)
  }
  return map
}

export default function BookPage() {
  const [step, setStep] = useState<Step>('slots')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/booking-slots?days=28')
      .then(r => r.json())
      .then(data => { setSlots(data); setLoadingSlots(false) })
      .catch(() => setLoadingSlots(false))
  }, [])

  const grouped = groupByDay(slots)
  const days = Object.keys(grouped).sort()

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-AU', {
      hour: 'numeric', minute: '2-digit', hour12: true,
      timeZone: 'Australia/Brisbane',
    })
  }

  function formatDayHeader(dateKey: string) {
    const d = new Date(dateKey + 'T00:00:00+10:00')
    return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
  }

  async function submit() {
    if (!selectedSlot || !form.name || !form.email) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, slot: selectedSlot }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }
      setStep('confirmed')
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const selectedDate = selectedSlot
    ? new Date(selectedSlot).toLocaleDateString('en-AU', {
        weekday: 'long', day: 'numeric', month: 'long',
        timeZone: 'Australia/Brisbane',
      })
    : null
  const selectedTime = selectedSlot ? formatTime(selectedSlot) : null

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      {/* Header */}
      <div className="border-b border-stone-800 px-6 py-5 flex items-center justify-between">
        <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" />
        <a
          href="https://bodyrecode.au"
          className="text-sm text-stone-500 hover:text-stone-300 transition-colors"
        >
          ← Back to website
        </a>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Intro */}
        {step === 'slots' && (
          <>
            <div className="mb-10">
              <h1 className="text-3xl font-bold mb-3">Book a Zoom Call</h1>
              <p className="text-stone-400 text-base leading-relaxed">
                A 30-minute conversation to review your Performance Check-In results and see
                if Body Recode Performance Coaching is the right fit for you.
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-stone-400 mb-10">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-teal-400" />
                30 minutes
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-teal-400" />
                Mon – Thu, Brisbane
              </div>
            </div>

            {loadingSlots ? (
              <div className="flex items-center gap-3 text-stone-500 py-12 justify-center">
                <Loader2 size={18} className="animate-spin" />
                Loading available times...
              </div>
            ) : days.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-stone-400 text-base mb-2">No available times right now.</p>
                <p className="text-stone-600 text-sm">Please check back soon or email kade@bodyrecode.au</p>
              </div>
            ) : (
              <div className="space-y-6">
                {days.map(day => (
                  <div key={day}>
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">
                      {formatDayHeader(day)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {grouped[day].map(slot => (
                        <button
                          key={slot}
                          onClick={() => { setSelectedSlot(slot); setSelectedDay(day); setStep('details') }}
                          className="px-4 py-2.5 text-sm font-medium rounded-lg border border-stone-700 text-stone-300 hover:border-teal-500 hover:text-teal-400 hover:bg-teal-500/5 transition-colors"
                        >
                          {formatTime(slot)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Details form */}
        {step === 'details' && (
          <>
            <button
              onClick={() => setStep('slots')}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-white transition-colors mb-8"
            >
              <ChevronLeft size={15} />
              Back
            </button>

            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Your details</h1>
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center gap-3 mt-4">
                <div className="p-2 bg-teal-500/10 rounded-lg">
                  <Calendar size={15} className="text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{selectedDate}</p>
                  <p className="text-xs text-stone-400">{selectedTime} Brisbane · 30 min</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="John Smith"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Phone (optional)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="0400 000 000"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={submit}
              disabled={!form.name || !form.email || submitting}
              className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-stone-950 font-semibold text-sm py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Confirm Booking
            </button>

            <p className="text-xs text-stone-600 text-center mt-4">
              A confirmation email with your Zoom link will be sent immediately.
            </p>
          </>
        )}

        {/* Confirmed */}
        {step === 'confirmed' && (
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-teal-500/10 rounded-2xl">
                <CheckCircle2 size={40} className="text-teal-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-3">You're booked in.</h1>
            <p className="text-stone-400 text-base mb-2">
              {selectedDate} at {selectedTime} Brisbane
            </p>
            <p className="text-stone-500 text-sm mb-8">
              Check your email for your Zoom link and calendar invite.
            </p>
            <a
              href="https://bodyrecode.au"
              className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >
              ← Back to Body Recode
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
