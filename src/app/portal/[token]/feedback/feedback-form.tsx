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
    hint: 'The reads, your check-ins, the program, the nutrition plan.',
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
      <div className="bg-[#FFFFFF] border border-[#DCDCD7] rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-3">
          <Check size={16} className="text-[#0F1115]" />
          <p className="text-[13.5px] font-bold text-[#0F1115] uppercase tracking-widest">Thanks</p>
        </div>
        <p className="text-[13.5px] text-[#0F1115] leading-relaxed mb-4">
          Got it. Kade reads every one of these and uses them to shape what we build next. If your
          note needs a reply you will hear back directly.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => { setSubmitted(false); router.refresh() }}
            className="text-[12.5px] font-medium px-3 py-1.5 border border-[#E4E4E0] text-[#6E747D] rounded-lg hover:border-[#0F1115] hover:bg-[#F2F2EF] hover:text-[#0F1115] transition-colors"
          >
            Send another
          </button>
          <Link
            href={`/portal/${portalToken}`}
            className="text-[12.5px] font-semibold px-3 py-1.5 bg-[#0F1115] text-[#FFFFFF] rounded-lg hover:bg-[#000000] transition-colors"
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
        <p className="text-[11px] font-medium text-[#6E747D] mb-3">
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
                    ? 'border-[#0F1115] bg-[rgba(15,17,21,0.06)]'
                    : 'border-[#E4E4E0] bg-[#FFFFFF] hover:border-[#DCDCD7]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                      selected ? 'border-[#0F1115] bg-[#0F1115]' : 'border-[#9CA2AB]'
                    }`}
                  />
                  <p className={`text-[13.5px] font-semibold ${selected ? 'text-[#0F1115]' : 'text-[#0F1115]'}`}>
                    {opt.label}
                  </p>
                </div>
                <p className="text-[12.5px] text-[#9CA2AB] leading-relaxed mt-1.5 ml-[22px]">
                  {opt.hint}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Body */}
      <div>
        <p className="text-[11px] font-medium text-[#6E747D] mb-2">
          Tell us more
        </p>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="The more specific the better. What did you do, what did you expect, what actually happened, or what would make this better for you."
          rows={8}
          maxLength={MAX_LEN + 200}
          className="w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-xl px-4 py-3 text-[13.5px] text-[#0F1115] placeholder:text-[#9CA2AB] focus:outline-none focus:border-[#DCDCD7] leading-relaxed resize-y"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-[#9CA2AB]">
            {tooLong ? (
              <span className="text-[#B06E1F]">Trim by {body.length - MAX_LEN} characters.</span>
            ) : (
              `${body.length} / ${MAX_LEN}`
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-[#FDF8F1] border border-[#EADCC4] rounded-lg px-3 py-2.5 text-[12.5px] text-[#8A5514]">
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={submitting || tooShort || tooLong}
        className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-[#0F1115] hover:bg-[#000000] text-[#FFFFFF] font-bold text-[13.5px] rounded-2xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
        {submitting ? 'Sending…' : 'Send to Kade'}
      </button>
    </div>
  )
}
