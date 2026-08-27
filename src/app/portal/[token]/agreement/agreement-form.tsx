'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AGREEMENT_SECTIONS } from '@/lib/agreement-sections'
import PortalPageShell from '../portal-page-shell'
import { brand } from "@/config/tenant";

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
    <PortalPageShell
      eyebrow="Coaching Agreement"
      title="Coaching agreement"
      description={
        <>
          <span className="block text-[12px] text-[#98A0AD] mb-1">Version 2.5 · Sole Trader, Queensland, Australia</span>
          Please read the full agreement before signing.
        </>
      }
    >
      <div className="space-y-8 mb-10">
          {AGREEMENT_SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-bold tracking-widest text-[#1B6DFC] uppercase mb-4">{section.title}</h2>
              <div className="space-y-4">
                {section.subsections.map((sub) => (
                  <div key={sub.title}>
                    <p className="text-sm font-semibold text-[#141821] mb-1">{sub.title}</p>
                    <p className="text-sm text-[#666D7A] leading-relaxed">{sub.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {validationMessage && (
          <div className="mb-6 border-l-2 border-[#DC2626] bg-[#FDEDED] rounded-r-2xl px-4 py-3">
            <p className="text-[#C82626] text-sm font-medium">{validationMessage}</p>
            <p className="text-[#C82626]/70 text-xs mt-1">Missing fields are highlighted in red below.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E8EAEE]">
            <p className="text-sm text-[#43474F] mb-4">By typing your full name and ticking below, you confirm that you have read, understood, and agree to the terms of this Coaching Agreement.</p>

            <div className="space-y-4">
              <div id="f-fullName" className="scroll-mt-24">
                <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${missing.has('fullName') ? 'text-[#C82626]' : 'text-[#666D7A]'}`}>Full name</label>
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
                  className={`w-full bg-[#E8EAEE] text-[#141821] text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1B6DFC]/50 placeholder-[#98A0AD] border ${missing.has('fullName') ? 'border-red-400' : 'border-[#E8EAEE]'}`}
                />
                {missing.has('fullName') && <p className="text-[#C82626] text-xs mt-2 font-medium">Please type your full name.</p>}
              </div>

              <label
                id="f-accepted"
                className={`flex items-start gap-3 cursor-pointer scroll-mt-24 p-3 rounded-xl border ${missing.has('accepted') ? 'border-red-400 bg-[#FDEDED]' : 'border-transparent'}`}
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
                  className="mt-0.5 w-4 h-4 rounded accent-[#1B6DFC]"
                />
                <span className={`text-sm ${missing.has('accepted') ? 'text-[#C82626]' : 'text-[#43474F]'}`}>I have read and agree to the {brand().name}™ Coaching Agreement.</span>
              </label>
              {missing.has('accepted') && <p className="text-[#C82626] text-xs -mt-2 ml-7 font-medium">Please tick this box to continue.</p>}
            </div>
          </div>

          {error && <p className="text-[#C82626] text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#1B6DFC] text-white text-sm font-bold py-4 rounded-2xl hover:bg-[#1560E0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving…' : 'Sign and continue →'}
        </button>
      </form>
    </PortalPageShell>
  )
}
