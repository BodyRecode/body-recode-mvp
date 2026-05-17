'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface ExistingFeedback {
  id: string
  interpretation: string
  reframe: string | null
  next_focus: string
  email_sent_at: string | null
  updated_at: string
}

export default function CheckinFeedbackForm({
  checkinId,
  existing,
  clientFirstName,
}: {
  checkinId: string
  existing: ExistingFeedback | null
  clientFirstName: string
}) {
  const router = useRouter()
  const [interpretation, setInterpretation] = useState(existing?.interpretation ?? '')
  const [reframe, setReframe] = useState(existing?.reframe ?? '')
  const [nextFocus, setNextFocus] = useState(existing?.next_focus ?? '')
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(sendEmail: boolean) {
    setError(null)
    setStatus(null)
    if (!interpretation.trim()) { setError('Interpretation is required.'); return }
    if (!nextFocus.trim()) { setError('Next focus is required.'); return }

    startTransition(async () => {
      const res = await fetch(`/api/weekly-checkins/${checkinId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interpretation: interpretation.trim(),
          reframe: reframe.trim() || null,
          next_focus: nextFocus.trim(),
          send_email: sendEmail,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to save')
        return
      }
      setStatus(
        sendEmail
          ? `Saved and emailed to ${clientFirstName}.`
          : 'Saved as draft. Client will not receive this until you send it.'
      )
      router.refresh()
    })
  }

  const previouslyEmailed = !!existing?.email_sent_at

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-400">Coach response</p>
        {previouslyEmailed && (
          <p className="text-[10px] uppercase tracking-widest text-stone-500">
            Emailed {new Date(existing!.email_sent_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
          </p>
        )}
      </div>

      <p className="text-xs text-stone-500 leading-relaxed mb-5">
        Three fields go to {clientFirstName} as a dark-template email and appear under this check-in in their portal. Reframe is optional, use it when {clientFirstName} is misreading their own signal.
      </p>

      <div className="space-y-5">
        <Field
          label="Interpretation"
          hint="What you are seeing in this check-in. The read, not the directive."
          value={interpretation}
          onChange={setInterpretation}
          required
          rows={5}
          placeholder="e.g. Recovery has stepped down two notches in a week and capacity is starting to compress. Sleep and appetite are holding, so the foundations are intact, but the load source looks upstream of training..."
        />
        <Field
          label="Reframe (optional)"
          hint="Use when the client is misreading their own pattern. Leave blank if not needed."
          value={reframe}
          onChange={setReframe}
          rows={4}
          placeholder="e.g. The clothes feeling tighter is much more likely abdominal bloating than weight gain..."
        />
        <Field
          label="This week, hold this"
          hint="One thing for the client to anchor on this week."
          value={nextFocus}
          onChange={setNextFocus}
          required
          rows={3}
          placeholder="e.g. Keep training as your stress release, not as an extra demand. If a session feels like adding load, swap it for a 20-minute walk and a sleep-priority night."
        />
      </div>

      {error && (
        <p className="mt-4 text-xs text-red-400">{error}</p>
      )}
      {status && (
        <p className="mt-4 text-xs text-teal-400">{status}</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(true)}
          className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          {pending ? 'Working…' : previouslyEmailed ? 'Save and re-send email' : 'Save and email client'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(false)}
          className="px-4 py-2.5 border border-stone-700 hover:border-stone-500 text-stone-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          Save without sending
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  value,
  onChange,
  rows,
  required,
  placeholder,
}: {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  rows: number
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">
        {label}{required ? '' : ' '}<span className="text-stone-600 font-normal normal-case tracking-normal">{required ? '' : ''}</span>
      </label>
      <p className="text-xs text-stone-500 mb-2 leading-relaxed">{hint}</p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full bg-[#0c0a09] border border-stone-800 rounded-lg p-3 text-sm text-stone-100 placeholder:text-stone-700 focus:outline-none focus:border-teal-500/60 resize-y"
      />
    </div>
  )
}
