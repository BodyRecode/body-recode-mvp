'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AGREEMENT_SECTIONS } from '@/lib/agreement-sections'
import ClientHeader from '@/components/client-header'

export default function AgreementForm({
  clientId,
  clientName,
  portalToken,
}: {
  clientId: string
  clientName: string
  portalToken: string
}) {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accepted || !fullName.trim()) return
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/portal/submit-agreement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, fullName: fullName.trim() }),
    })

    if (!res.ok) {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    router.push(`/portal/${portalToken}`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Coaching Agreement</h1>
          <p className="text-stone-500 text-xs mb-1">Version 2.5 — Sole Trader, Queensland, Australia</p>
          <p className="text-stone-400 text-sm">Please read the full agreement before signing.</p>
        </div>

        <div className="space-y-8 mb-10">
          {AGREEMENT_SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-4">{section.title}</h2>
              <div className="space-y-4">
                {section.subsections.map((sub) => (
                  <div key={sub.title}>
                    <p className="text-sm font-semibold text-white mb-1">{sub.title}</p>
                    <p className="text-sm text-stone-400 leading-relaxed">{sub.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-stone-900 rounded-2xl p-5 border border-stone-800">
            <p className="text-sm text-stone-300 mb-4">By typing your full name and ticking below, you confirm that you have read, understood, and agree to the terms of this Coaching Agreement.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={clientName}
                  required
                  className="w-full bg-stone-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600 border border-stone-700"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={e => setAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-teal-400"
                />
                <span className="text-sm text-stone-300">I have read and agree to the Body Recode™ Coaching Agreement.</span>
              </label>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!accepted || !fullName.trim() || submitting}
            className="w-full bg-teal-400 text-black text-sm font-bold py-4 rounded-2xl hover:bg-teal-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving…' : 'Sign and continue →'}
          </button>
        </form>
      </div>
    </div>
  )
}
