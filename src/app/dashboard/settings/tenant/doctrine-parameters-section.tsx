'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type DoctrineParameters = {
  voiceTone?: string
  bannedPhrases?: string[]
  terminologySubstitutions?: Record<string, string>
  checkinCoachingGuidance?: string
  programGenerationGuidance?: string
  nutritionGenerationGuidance?: string
} | null

export function DoctrineParametersSection({
  initial,
}: {
  initial: DoctrineParameters
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [voiceTone, setVoiceTone] = useState(initial?.voiceTone ?? '')
  const [bannedPhrasesText, setBannedPhrasesText] = useState(
    (initial?.bannedPhrases ?? []).join('\n'),
  )
  const [terminologyText, setTerminologyText] = useState(
    Object.entries(initial?.terminologySubstitutions ?? {})
      .map(([from, to]) => `${from} => ${to}`)
      .join('\n'),
  )
  const [checkinGuidance, setCheckinGuidance] = useState(initial?.checkinCoachingGuidance ?? '')
  const [programGuidance, setProgramGuidance] = useState(initial?.programGenerationGuidance ?? '')
  const [nutritionGuidance, setNutritionGuidance] = useState(initial?.nutritionGenerationGuidance ?? '')

  function parsePhrasesLines(text: string): string[] {
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
  }

  function parseTerminologyLines(text: string): Record<string, string> {
    const out: Record<string, string> = {}
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const parts = trimmed.split(/\s*=>\s*/)
      if (parts.length !== 2 || !parts[0] || !parts[1]) continue
      out[parts[0]] = parts[1]
    }
    return out
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const payload: DoctrineParameters = {
      voiceTone: voiceTone.trim() || undefined,
      bannedPhrases: parsePhrasesLines(bannedPhrasesText),
      terminologySubstitutions: parseTerminologyLines(terminologyText),
      checkinCoachingGuidance: checkinGuidance.trim() || undefined,
      programGenerationGuidance: programGuidance.trim() || undefined,
      nutritionGenerationGuidance: nutritionGuidance.trim() || undefined,
    }

    startTransition(async () => {
      const r = await fetch('/api/tenant/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'licence',
          patch: { doctrineParameters: payload },
        }),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => ({ error: 'save failed' }))
        setError(body.error ?? 'save failed')
        return
      }
      setSuccess('Saved. Cache invalidated. Generators will read the new values on next call.')
      router.refresh()
    })
  }

  return (
    <div className="mb-4 bg-white border border-stone-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-200 bg-stone-50">
        <h3 className="text-[13px] font-bold text-stone-900 uppercase tracking-widest">Doctrine parameters (Mode A+)</h3>
      </div>
      <div className="p-5">
        <p className="text-[13px] text-stone-600 leading-relaxed mb-4">
          Middle ground between running BR&apos;s doctrine unchanged (Mode A) and injecting your own method (Mode B, reserved for post-Founding-Ten). Tune tone, add banned phrases, substitute terminology, add coaching-style guidance. <strong>Hard Safety Floors cannot be tuned here</strong> — RRS clamps, Fat Map limits, injury contraindications, eligibility floors remain immutable per the Founding Partner Agreement.
        </p>

        {error && (
          <div className="mb-3 p-3 rounded-lg border border-red-200 bg-red-50 text-[12px] text-red-800">{error}</div>
        )}
        {success && (
          <div className="mb-3 p-3 rounded-lg border border-green-200 bg-green-50 text-[12px] text-green-800">{success}</div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <Field
            label="Voice tone"
            hint='Appended to system prompts for client-facing content. Examples: "warm and encouraging", "gentle and grounding", "direct and clinical". Read by nutrition, program, and check-in generators.'
          >
            <input
              type="text"
              value={voiceTone}
              onChange={(e) => setVoiceTone(e.target.value)}
              placeholder="warm and grounded"
              className="w-full px-3 py-2 rounded-md border border-stone-300 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={pending}
            />
          </Field>

          <Field
            label="Banned phrases"
            hint="Partner-specific banned phrases, one per line. Applied on top of the platform-wide banned-terms list. Content that leaks any of these will fail the audit and prompt regeneration."
          >
            <textarea
              value={bannedPhrasesText}
              onChange={(e) => setBannedPhrasesText(e.target.value)}
              rows={4}
              placeholder="downregulate\nsympathetic dominance"
              className="w-full px-3 py-2 rounded-md border border-stone-300 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={pending}
            />
          </Field>

          <Field
            label="Terminology substitutions"
            hint='One substitution per line in the form "from => to". Case-insensitive. Applied post-generation as a rewrite. Example: "winding down => settling".'
          >
            <textarea
              value={terminologyText}
              onChange={(e) => setTerminologyText(e.target.value)}
              rows={4}
              placeholder="winding down => settling\ndownregulate => soften"
              className="w-full px-3 py-2 rounded-md border border-stone-300 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={pending}
            />
          </Field>

          <Field
            label="Weekly check-in coaching guidance"
            hint="Partner-specific coaching philosophy appended to the weekly check-in feedback prompt. Shapes tone + focus of feedback."
          >
            <textarea
              value={checkinGuidance}
              onChange={(e) => setCheckinGuidance(e.target.value)}
              rows={3}
              placeholder="Emphasise breath awareness in every regulation cue. Never prescribe measurable metrics."
              className="w-full px-3 py-2 rounded-md border border-stone-300 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={pending}
            />
          </Field>

          <Field
            label="Program generation guidance"
            hint="Appended to program generation prompt. Frequency preferences, session structure, favoured exercise families. NOT a safety override."
          >
            <textarea
              value={programGuidance}
              onChange={(e) => setProgramGuidance(e.target.value)}
              rows={3}
              placeholder="Prefer 4 sessions per week over 5. Always include one restorative session."
              className="w-full px-3 py-2 rounded-md border border-stone-300 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={pending}
            />
          </Field>

          <Field
            label="Nutrition generation guidance"
            hint="Appended to nutrition plan generation prompt. Food preferences, cultural context, dietary philosophy. NOT a safety override."
          >
            <textarea
              value={nutritionGuidance}
              onChange={(e) => setNutritionGuidance(e.target.value)}
              rows={3}
              placeholder="Emphasise plant-forward proteins. Prefer whole-food-first substitutions."
              className="w-full px-3 py-2 rounded-md border border-stone-300 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={pending}
            />
          </Field>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <p className="text-[11px] text-stone-500 italic">
              Cache is invalidated on save. Generators read new values on their next call.
            </p>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-40"
            >
              {pending ? 'Saving…' : 'Save doctrine parameters'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-1">{label}</div>
      {children}
      {hint && <p className="text-[11px] text-stone-500 leading-relaxed mt-1.5">{hint}</p>}
    </div>
  )
}
