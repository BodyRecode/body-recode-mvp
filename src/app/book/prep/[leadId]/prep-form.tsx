'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { brand } from '@/config/tenant'

type Step = 'form' | 'done'

const INPUT =
  'w-full bg-stone-100 border border-stone-300 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500 transition-colors'

export default function PrepForm({ leadId, firstName }: { leadId: string; firstName: string }) {
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState({
    goal: '', frustration: '', tried: '', age: '', sex: '', height: '', weight: '', routine: '', other: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit() {
    if (!form.goal.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/book-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, ...form }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }
      setStep('done')
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-500/10 rounded-2xl">
            <CheckCircle2 size={40} className="text-blue-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-3">All set. Thank you.</h1>
        <p className="text-stone-600 text-base mb-2">
          I&apos;ve got everything I need to make our call count. Talk soon.
        </p>
        <a
          href={brand().performanceDomain}
          className="text-sm text-blue-500 hover:text-blue-300 transition-colors mt-6 inline-block"
        >
          ← Back to {brand().name}
        </a>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">
          {firstName ? `Thanks ${firstName}. ` : ''}A few things before we talk.
        </h1>
        <p className="text-stone-600 text-base leading-relaxed">
          The more I know going in, the more useful our call is. Takes 3-4 minutes. Only the first question is required.
        </p>
      </div>

      <div className="space-y-5 mb-8">
        <Field label="What do you most want to change? (required)">
          <textarea value={form.goal} onChange={set('goal')} rows={3} placeholder="The result you're after" className={`${INPUT} resize-none`} />
        </Field>
        <Field label="What's frustrating you most right now?">
          <textarea value={form.frustration} onChange={set('frustration')} rows={3} placeholder="What's not working, or what keeps getting in the way" className={`${INPUT} resize-none`} />
        </Field>
        <Field label="What have you already tried? (and roughly how long)">
          <textarea value={form.tried} onChange={set('tried')} rows={3} placeholder="Programs, diets, coaches, apps - and how they went" className={`${INPUT} resize-none`} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Age">
            <input value={form.age} onChange={set('age')} inputMode="numeric" placeholder="e.g. 38" className={INPUT} />
          </Field>
          <Field label="Biological sex">
            <input value={form.sex} onChange={set('sex')} placeholder="Male / Female" className={INPUT} />
          </Field>
          <Field label="Height">
            <input value={form.height} onChange={set('height')} placeholder="e.g. 178cm" className={INPUT} />
          </Field>
          <Field label="Weight">
            <input value={form.weight} onChange={set('weight')} placeholder="e.g. 82kg" className={INPUT} />
          </Field>
        </div>

        <Field label="What does a normal week look like? (training + eating, briefly)">
          <textarea value={form.routine} onChange={set('routine')} rows={3} placeholder="How you train and eat most weeks" className={`${INPUT} resize-none`} />
        </Field>
        <Field label="Anything else I should know? (injuries, medications, health)">
          <textarea value={form.other} onChange={set('other')} rows={2} placeholder="Optional, but useful" className={`${INPUT} resize-none`} />
        </Field>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={submit}
        disabled={!form.goal.trim() || submitting}
        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-500 text-stone-50 font-semibold text-sm py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {submitting && <Loader2 size={15} className="animate-spin" />}
        Send to {brand().name}
      </button>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
