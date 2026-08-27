'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { logoUrl, brand } from '@/config/tenant'

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
          <img src={logoUrl()} width="120" alt={brand().name} className="mx-auto mb-10" />
          <h1 className="text-2xl font-bold text-[#141821] mb-3">You&apos;re in.</h1>
          <p className="text-[#666D7A] text-sm leading-relaxed">
            We&apos;ve received your details. Kade will be in touch shortly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full">
        <img src={logoUrl()} width="120" alt={brand().name} className="mb-10" />

        {headline && (
          <h1 className="text-3xl font-bold text-[#141821] leading-tight mb-4">{headline}</h1>
        )}
        {subheadline && (
          <p className="text-lg text-[#1B6DFC] font-medium mb-6">{subheadline}</p>
        )}
        {body && (
          <div className="text-[#666D7A] text-sm leading-relaxed mb-8 whitespace-pre-line">{body}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full bg-[#F4F6F9] border border-[#EFF1F4] rounded-lg px-4 py-3 text-sm text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:border-[#1B6DFC]"
          />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-[#F4F6F9] border border-[#EFF1F4] rounded-lg px-4 py-3 text-sm text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:border-[#1B6DFC]"
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full bg-[#F4F6F9] border border-[#EFF1F4] rounded-lg px-4 py-3 text-sm text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:border-[#1B6DFC]"
          />

          {error && (
            <p className="text-[#C82626] text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1B6DFC] hover:bg-[#1B6DFC] disabled:opacity-50 text-[#FBFCFD] font-bold text-sm py-3 rounded-lg transition-colors"
          >
            {submitting ? 'Submitting...' : ctaLabel}
          </button>
        </form>

        <p className="text-[#43474F] text-xs mt-6 text-center">
          No spam. Unsubscribe any time.
        </p>
      </div>
    </div>
  )
}
