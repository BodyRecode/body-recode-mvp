'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { logoUrl } from '@/config/tenant'

interface Props {
  funnelId: string
  headline: string
  subheadline: string
  body: string
  ctaLabel: string
  redirectTo: string
}

export default function FunnelCapturePage({
  funnelId, headline, subheadline, body, ctaLabel, redirectTo,
}: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setError('Name and email are required'); return }
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/funnels/${funnelId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.redirect) {
        router.push(data.redirect)
      } else {
        setSubmitted(true)
      }
    } catch (e: any) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <img src={logoUrl()} width="120" alt="Body Recode" className="mx-auto mb-10" />
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3">You&apos;re in.</h1>
          <p className="text-stone-600 text-sm leading-relaxed">
            We&apos;ve received your details. Kade will be in touch shortly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full">
        <img src={logoUrl()} width="120" alt="Body Recode" className="mb-10" />

        {headline && (
          <h1 className="text-3xl font-bold text-[#1A1A1A] leading-tight mb-4">{headline}</h1>
        )}
        {subheadline && (
          <p className="text-lg text-blue-500 font-medium mb-6">{subheadline}</p>
        )}
        {body && (
          <div className="text-stone-600 text-sm leading-relaxed mb-8 whitespace-pre-line">{body}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full bg-stone-100 border border-stone-200 rounded-lg px-4 py-3 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500"
          />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-stone-100 border border-stone-200 rounded-lg px-4 py-3 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500"
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full bg-stone-100 border border-stone-200 rounded-lg px-4 py-3 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500"
          />

          {error && (
            <p className="text-red-700 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-500 hover:bg-blue-500 disabled:opacity-50 text-stone-50 font-bold text-sm py-3 rounded-lg transition-colors"
          >
            {submitting ? 'Submitting...' : ctaLabel}
          </button>
        </form>

        <p className="text-stone-700 text-xs mt-6 text-center">
          No spam. Unsubscribe any time.
        </p>
      </div>
    </div>
  )
}
