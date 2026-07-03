'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Calendar, Clock, CheckCircle2, Loader2, ChevronLeft } from 'lucide-react'
import { logoUrl, brand, coach } from '@/config/tenant'

type Step = 'slots' | 'details' | 'confirmed' | 'request' | 'request_confirmed'

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
  const [requestForm, setRequestForm] = useState({ name: '', email: '', phone: '', preferredTime: '', note: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/booking-slots?days=14')
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
      if (typeof window !== 'undefined' && (window as { fbq?: (...args: unknown[]) => void }).fbq) {
        ;(window as { fbq?: (...args: unknown[]) => void }).fbq?.('track', 'Schedule', {
          content_name: 'book_call_slot',
        })
      }
      setStep('confirmed')
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  async function submitRequest() {
    if (!requestForm.name || !requestForm.email || !requestForm.preferredTime) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/book-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }
      if (typeof window !== 'undefined' && (window as { fbq?: (...args: unknown[]) => void }).fbq) {
        ;(window as { fbq?: (...args: unknown[]) => void }).fbq?.('track', 'Schedule', {
          content_name: 'book_call_request',
        })
      }
      setStep('request_confirmed')
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
    <div className="min-h-screen bg-stone-50 text-[#1A1A1A]">
      {/* Header */}
      <div className="border-b border-stone-200 px-6 py-5 flex items-center justify-between">
        <img src={logoUrl()} width="110" alt={brand().name} />
        <a
          href={brand().performanceDomain}
          className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          ← Back to website
        </a>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Intro */}
        {step === 'slots' && (
          <>
            <div className="mb-10">
              <h1 className="text-3xl font-bold mb-3">Let&apos;s go through your results.</h1>
              <p className="text-stone-600 text-base leading-relaxed">
                30 minutes. We identify the specific driver behind what is not working and map out exactly what needs to change first. Free. No pitch.
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-stone-600 mb-10">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-blue-500" />
                30 minutes
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-500" />
                Brisbane time
              </div>
            </div>

            {loadingSlots ? (
              <div className="flex items-center gap-3 text-stone-500 py-12 justify-center">
                <Loader2 size={18} className="animate-spin" />
                Loading available times...
              </div>
            ) : (
              <>
                {days.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-stone-600 text-base mb-2">No available times right now.</p>
                    <p className="text-stone-400 text-sm">Request a time below or email {coach().email}</p>
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
                              className="px-4 py-2.5 text-sm font-medium rounded-lg border border-stone-300 text-stone-700 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/5 transition-colors"
                            >
                              {formatTime(slot)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-10 pt-6 border-t border-stone-200 text-center">
                  <p className="text-stone-500 text-sm mb-2">None of these times work for you?</p>
                  <button
                    onClick={() => setStep('request')}
                    className="text-sm font-medium text-blue-500 hover:text-blue-300 transition-colors"
                  >
                    Request a different time →
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Details form */}
        {step === 'details' && (
          <>
            <button
              onClick={() => setStep('slots')}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-[#1A1A1A] transition-colors mb-8"
            >
              <ChevronLeft size={15} />
              Back
            </button>

            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Your details</h1>
              <div className="bg-stone-100 border border-stone-200 rounded-xl p-4 flex items-center gap-3 mt-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Calendar size={15} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{selectedDate}</p>
                  <p className="text-xs text-stone-600">{selectedTime} Brisbane · 30 min</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="John Smith"
                  className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Phone (optional)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="0400 000 000"
                  className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={submit}
              disabled={!form.name || !form.email || submitting}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-500 text-stone-50 font-semibold text-sm py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Confirm Booking
            </button>

            <p className="text-xs text-stone-400 text-center mt-4">
              A confirmation email with your Zoom link will be sent immediately.
            </p>
          </>
        )}

        {/* Confirmed */}
        {step === 'confirmed' && (
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-500/10 rounded-2xl">
                <CheckCircle2 size={40} className="text-blue-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-3">You're booked in.</h1>
            <p className="text-stone-600 text-base mb-2">
              {selectedDate} at {selectedTime} Brisbane
            </p>
            <p className="text-stone-500 text-sm mb-8">
              Check your email for your Zoom link and calendar invite.
            </p>
            <a
              href={brand().performanceDomain}
              className="text-sm text-blue-500 hover:text-blue-300 transition-colors"
            >
              ← Back to {brand().name}
                                      </a>
          </div>
        )}

        {/* Request a different time */}
        {step === 'request' && (
          <>
            <button
              onClick={() => setStep('slots')}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-[#1A1A1A] transition-colors mb-8"
            >
              <ChevronLeft size={15} />
              Back
            </button>

            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Request a different time</h1>
              <p className="text-stone-600 text-sm leading-relaxed">
                Tell me when works for you. I'll get back to you within 24 hours to confirm or suggest the closest match.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={requestForm.name}
                  onChange={e => setRequestForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="John Smith"
                  className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={requestForm.email}
                  onChange={e => setRequestForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Phone (optional)</label>
                <input
                  type="tel"
                  value={requestForm.phone}
                  onChange={e => setRequestForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="0400 000 000"
                  className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">What time works for you?</label>
                <textarea
                  value={requestForm.preferredTime}
                  onChange={e => setRequestForm(f => ({ ...f, preferredTime: e.target.value }))}
                  placeholder="e.g. Tuesday or Thursday around 3pm Brisbane"
                  rows={3}
                  className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Anything else? (optional)</label>
                <textarea
                  value={requestForm.note}
                  onChange={e => setRequestForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Schedule constraints, time zone, anything useful"
                  rows={2}
                  className="w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={submitRequest}
              disabled={!requestForm.name || !requestForm.email || !requestForm.preferredTime || submitting}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-500 text-stone-50 font-semibold text-sm py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Send Request
            </button>

            <p className="text-xs text-stone-400 text-center mt-4">
              Kade will reply within 24 hours.
            </p>
          </>
        )}

        {/* Request confirmed */}
        {step === 'request_confirmed' && (
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-500/10 rounded-2xl">
                <CheckCircle2 size={40} className="text-blue-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-3">Request received.</h1>
            <p className="text-stone-600 text-base mb-2">
              Kade will get back to you within 24 hours.
            </p>
            <p className="text-stone-500 text-sm mb-8">
              Check your email for confirmation.
            </p>
            <a
              href={brand().performanceDomain}
              className="text-sm text-blue-500 hover:text-blue-300 transition-colors"
            >
              ← Back to {brand().name}
                                      </a>
          </div>
        )}
      </div>
    </div>
  )
}
