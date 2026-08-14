'use client'

import { useState } from 'react'
import { InboxNote } from '@/components/inbox-note'
import { Clock, Calendar, CheckCircle2, Loader2 } from 'lucide-react'
import { logoUrl, brand, coach } from '@/config/tenant'

type Step = 'request' | 'request_confirmed'

export default function BookPage() {
  const [step, setStep] = useState<Step>('request')
  const [requestForm, setRequestForm] = useState({ name: '', email: '', phone: '', preferredTime: '', note: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

        {/* Request a call */}
        {step === 'request' && (
          <>
            <div className="mb-8">
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

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-2">Tell me when suits you.</h2>
              <p className="text-stone-600 text-sm leading-relaxed">
                Leave your details and the times that work for you. I&apos;ll get back to you within 24 hours to lock in a time.
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
                <label className="block text-xs font-medium text-stone-600 mb-1.5">What times work for you?</label>
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
              {coach().firstName} will reply within 24 hours.
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
              {coach().firstName} will get back to you within 24 hours to lock in a time.
            </p>
            <p className="text-stone-500 text-sm mb-5">
              Check your email for confirmation. It carries your pre-call form.
            </p>
            <div className="mb-8"><InboxNote /></div>
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
