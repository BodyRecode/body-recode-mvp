'use client'

import { useState } from 'react'
import type { CoachAgreement } from '@/lib/coach-agreement'
import { nameLooksReal } from '@/lib/coach-agreement'

type Acceptance = { version: string; accepted_at: string; accepted_name: string }

export function AgreementClient({
  agreement,
  accepted,
  history,
}: {
  agreement: CoachAgreement
  accepted: boolean
  history: Acceptance[]
}) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(accepted)

  async function accept() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/coach/agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body?.error ?? 'Could not record that. Try again.')
        return
      }
      setDone(true)
    } catch {
      setError('Could not reach the server. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-8">
      <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-[#676D76]">Your agreement</p>
      <h1 className="text-[34px] font-semibold text-[#FAFAF8] mt-2 leading-tight">{agreement.title}</h1>
      <p className="text-[13.5px] text-[#C2C6CC] mt-2 leading-relaxed">{agreement.subtitle}</p>

      {!agreement.cleared && (
        <div className="mt-6 p-4 rounded-xl border border-[#4A3A22] bg-[#1A1E26]">
          <p className="text-[13.5px] text-[#E0A254] leading-relaxed">
            <strong>Draft {agreement.version}.</strong> {agreement.draftNotice}
          </p>
        </div>
      )}

      {done && (
        <div className="mt-6 p-4 rounded-xl border border-[#1F242C] bg-[#14171D]">
          <p className="text-[13.5px] text-[#6FA98B] leading-relaxed">
            <strong>Accepted.</strong> Your acceptance of {agreement.version} is recorded. You can read it here
            any time, and you will be asked again only if the agreement itself changes.
          </p>
        </div>
      )}

      <div className="mt-8 space-y-7">
        {agreement.clauses.map((clause) => (
          <section key={clause.heading}>
            <h2 className="text-[16px] font-semibold text-[#FAFAF8]">{clause.heading}</h2>
            <div className="mt-2 space-y-2">
              {clause.body.map((line, i) =>
                line.startsWith('- ') ? (
                  <p key={i} className="text-[13.5px] text-[#C2C6CC] leading-relaxed pl-4 relative">
                    <span className="absolute left-0 text-[#676D76]">·</span>
                    {line.slice(2)}
                  </p>
                ) : (
                  <p key={i} className="text-[13.5px] text-[#C2C6CC] leading-relaxed">
                    {line}
                  </p>
                ),
              )}
            </div>
          </section>
        ))}
      </div>

      {!done && agreement.cleared && (
        <div className="mt-10 p-5 rounded-xl border border-[#2A2F39] bg-[#14171D]">
          <p className="text-[13.5px] text-[#FAFAF8] leading-relaxed">{agreement.acceptanceStatement}</p>
          <label className="block text-[12.5px] text-[#8A9099] mt-4 mb-1.5">
            Type your full name, as you would sign it
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-[#2A2F39] bg-[#14171D] text-[13.5px] text-[#FAFAF8] focus:outline-none focus:border-[#FAFAF8]"
            placeholder="First and last name"
            autoComplete="off"
          />
          {error && <p className="text-[12.5px] text-[#D4817E] mt-2">{error}</p>}
          <button
            onClick={accept}
            disabled={saving || !nameLooksReal(name)}
            className="mt-4 px-5 py-2.5 rounded-lg bg-[#FAFAF8] text-[#0B0D10] text-[13.5px] font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Recording…' : 'I accept this agreement'}
          </button>
          <p className="text-[12.5px] text-[#676D76] mt-3 leading-relaxed">
            Typing your name here has the same effect as signing it. The date, your name as you typed it, and
            the version you accepted are recorded.
          </p>
        </div>
      )}

      {!agreement.cleared && !done && (
        <div className="mt-10 p-5 rounded-xl border border-[#2A2F39] bg-[#14171D]">
          <p className="text-[13.5px] text-[#8A9099] leading-relaxed">
            Nothing to accept yet. This page is here so you can read the terms before anyone asks you to agree
            to them.
          </p>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-10">
          <h2 className="text-[13.5px] font-semibold text-[#FAFAF8]">What you have accepted</h2>
          <div className="mt-2 space-y-1">
            {history.map((h) => (
              <p key={`${h.version}-${h.accepted_at}`} className="text-[12.5px] text-[#8A9099]">
                {h.version} · accepted by {h.accepted_name} on{' '}
                {new Date(h.accepted_at).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
