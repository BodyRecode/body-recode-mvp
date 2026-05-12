'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Check } from 'lucide-react'

const CATEGORIES = [
  {
    value: 'portal_experience',
    label: 'Portal experience',
    hint: 'How the app feels to use, what is confusing, what is slow.',
  },
  {
    value: 'coaching_experience',
    label: 'Coaching experience',
    hint: 'The readings, your check-ins, the program, the nutrition plan.',
  },
  {
    value: 'feature_request',
    label: 'Feature request',
    hint: 'Something you wish existed in the platform.',
  },
  {
    value: 'bug',
    label: 'Bug',
    hint: 'Something broke or did not behave the way you expected.',
  },
  {
    value: 'other',
    label: 'Other',
    hint: 'Anything else worth telling us.',
  },
] as const

type Category = (typeof CATEGORIES)[number]['value']

const MAX_LEN = 2000

export default function FeedbackForm({
  clientId,
  portalToken,
}: {
  clientId: string
  portalToken: string
}) {
  const router = useRouter()
  const [category, setCategory] = useState<Category>('portal_experience')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tooShort = body.trim().length < 4
  const tooLong = body.length > MAX_LEN

  const submit = async () => {
    if (submitting || tooShort || tooLong) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/portal/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, category, body: body.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      setSubmitted(true)
      setBody('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-[#111110] border border-[#0d2d29] rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-3">
          <Check size={16} className="text-[#14b8a6]" />
          <p className="text-[14px] font-bold text-[#14b8a6] uppercase tracking-widest">Thanks</p>
        </div>
        <p className="text-[14px] text-[#e7e5e4] leading-relaxed mb-4">
          Got it. Kade reads every one of these and uses them to shape what we build next. If your
          note needs a reply you will hear back directly.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => { setSubmitted(false); router.refresh() }}
            className="text-[12px] font-medium px-3 py-1.5 border border-[#1c1917] text-[#a8a29e] rounded-lg hover:border-[#292524] hover:text-[#e7e5e4] transition-colors"
          >
            Send another
          </button>
          <Link
            href={`/portal/${portalToken}`}
            className="text-[12px] font-semibold px-3 py-1.5 bg-[#14b8a6] text-[#0c0a09] rounded-lg hover:bg-[#5eead4] transition-colors"
          >
            Back to portal
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <p className="text-[10px] font-bold text-[#a8a29e] uppercase tracking-widest mb-3">
          What is this about
        </p>
        <div className="space-y-2">
          {CATEGORIES.map(opt => {
            const selected = category === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selected
                    ? 'border-[#14b8a6] bg-[rgba(20,184,166,0.08)]'
                    : 'border-[#1c1917] bg-[#111110] hover:border-[#292524]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                      selected ? 'border-[#14b8a6] bg-[#14b8a6]' : 'border-[#3c3835]'
                    }`}
                  />
                  <p className={`text-[14px] font-semibold ${selected ? 'text-white' : 'text-[#e7e5e4]'}`}>
                    {opt.label}
                  </p>
                </div>
                <p className="text-[12px] text-[#57534e] leading-relaxed mt-1.5 ml-[22px]">
                  {opt.hint}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Body */}
      <div>
        <p className="text-[10px] font-bold text-[#a8a29e] uppercase tracking-widest mb-2">
          Tell us more
        </p>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="The more specific the better. What did you do, what did you expect, what actually happened, or what would make this better for you."
          rows={8}
          maxLength={MAX_LEN + 200}
          className="w-full bg-[#111110] border border-[#1c1917] rounded-xl px-4 py-3 text-[14px] text-[#e7e5e4] placeholder:text-[#3c3835] focus:outline-none focus:border-[#292524] leading-relaxed resize-y"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-[#3c3835]">
            {tooLong ? (
              <span className="text-amber-400">Trim by {body.length - MAX_LEN} characters.</span>
            ) : (
              `${body.length} / ${MAX_LEN}`
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-[#1a1108] border border-[#3a2410] rounded-lg px-3 py-2.5 text-[12px] text-[#fbbf24]">
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={submitting || tooShort || tooLong}
        className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-[#14b8a6] hover:bg-[#5eead4] text-[#0c0a09] font-bold text-[14px] rounded-2xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
        {submitting ? 'Sending…' : 'Send to Kade'}
      </button>
    </div>
  )
}
