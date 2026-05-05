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
  const [missing, setMissing] = useState<Set<string>>(new Set())
  const [validationMessage, setValidationMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const m = new Set<string>()
    if (!fullName.trim()) m.add('fullName')
    if (!accepted) m.add('accepted')
    if (m.size > 0) {
      setMissing(m)
      setValidationMessage(
        m.size === 1
          ? '1 field still needs an answer.'
          : `${m.size} fields still need an answer.`
      )
      setTimeout(() => {
        const first = Array.from(m)[0]
        const el = document.getElementById(`f-${first}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 80)
      return
    }

    setMissing(new Set())
    setValidationMessage('')
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
          <p className="text-[#57534e] text-xs mb-1">Version 2.5 - Sole Trader, Queensland, Australia</p>
          <p className="text-[#a8a29e] text-sm">Please read the full agreement before signing.</p>
        </div>

        <div className="space-y-8 mb-10">
          {AGREEMENT_SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-bold tracking-widest text-[#14b8a6] uppercase mb-4">{section.title}</h2>
              <div className="space-y-4">
                {section.subsections.map((sub) => (
                  <div key={sub.title}>
                    <p className="text-sm font-semibold text-white mb-1">{sub.title}</p>
                    <p className="text-sm text-[#a8a29e] leading-relaxed">{sub.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {validationMessage && (
          <div className="mb-6 border-l-2 border-red-500 bg-red-950/30 rounded-r-2xl px-4 py-3">
            <p className="text-red-300 text-sm font-medium">{validationMessage}</p>
            <p className="text-red-400/70 text-xs mt-1">Missing fields are highlighted in red below.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-[#111110] rounded-2xl p-5 border border-[#1c1917]">
            <p className="text-sm text-[#d4cfc9] mb-4">By typing your full name and ticking below, you confirm that you have read, understood, and agree to the terms of this Coaching Agreement.</p>

            <div className="space-y-4">
              <div id="f-fullName" className="scroll-mt-24">
                <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${missing.has('fullName') ? 'text-red-400' : 'text-[#a8a29e]'}`}>Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => {
                    setFullName(e.target.value)
                    if (e.target.value.trim() && missing.has('fullName')) {
                      setMissing(prev => { const n = new Set(prev); n.delete('fullName'); return n })
                    }
                  }}
                  placeholder={clientName}
                  className={`w-full bg-[#1c1917] text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-[#3c3835] border ${missing.has('fullName') ? 'border-red-500/60' : 'border-[#1c1917]'}`}
                />
                {missing.has('fullName') && <p className="text-red-400 text-xs mt-2 font-medium">Please type your full name.</p>}
              </div>

              <label
                id="f-accepted"
                className={`flex items-start gap-3 cursor-pointer scroll-mt-24 p-3 rounded-xl border ${missing.has('accepted') ? 'border-red-500/60 bg-red-950/20' : 'border-transparent'}`}
              >
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={e => {
                    setAccepted(e.target.checked)
                    if (e.target.checked && missing.has('accepted')) {
                      setMissing(prev => { const n = new Set(prev); n.delete('accepted'); return n })
                    }
                  }}
                  className="mt-0.5 w-4 h-4 rounded accent-teal-400"
                />
                <span className={`text-sm ${missing.has('accepted') ? 'text-red-300' : 'text-[#d4cfc9]'}`}>I have read and agree to the Body Recode™ Coaching Agreement.</span>
              </label>
              {missing.has('accepted') && <p className="text-red-400 text-xs -mt-2 ml-7 font-medium">Please tick this box to continue.</p>}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#14b8a6] text-black text-sm font-bold py-4 rounded-2xl hover:bg-[#5eead4] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving…' : 'Sign and continue →'}
          </button>
        </form>
      </div>
    </div>
  )
}
