'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Info, Loader2, Save } from 'lucide-react'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

/**
 * CoachGuidanceEditor
 *
 * Standing coach steering for the macro arc (training_plan). Applied on every
 * Generate or Regenerate of any program linked to this plan. Persists across
 * regenerations and across new phase generations within the same arc.
 *
 * Authority is bounded by the COACH GUIDANCE rule in
 * src/lib/program-prompt.ts — may override engine-default conservatism within
 * doctrine, may NOT override RRS clamps, injury contraindications, or
 * eligibility floors.
 */
export default function CoachGuidanceEditor({
  trainingPlanId,
  initial,
}: {
  trainingPlanId: string
  initial: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(initial ?? '')
  const [savedValue, setSavedValue] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(!!initial)

  const dirty = value !== savedValue

  const save = async () => {
    if (saving || !dirty) return
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/update-training-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          training_plan_id: trainingPlanId,
          field: 'coach_guidance',
          value: value.trim() ? value : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      setSavedValue(value)
      setSavedAt(Date.now())
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[#111110] border border-[#1c1917] rounded-2xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#1c1917]/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare size={13} className="text-[#14b8a6]" />
          <p
            className="text-[11px] font-bold text-white uppercase"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
          >
            Coach Guidance (macro arc)
          </p>
          {savedValue && (
            <span
              className="text-[10px] text-[#14b8a6] px-1.5 py-0.5 rounded-full border border-[#0d2d29] bg-[rgba(20,184,166,0.10)]"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
            >
              SET
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#57534e]">{open ? 'Hide' : 'Edit'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-[#1c1917]">
          <div className="flex items-start gap-2 pt-3 mb-3">
            <Info size={12} className="text-[#57534e] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#57534e] leading-relaxed">
              Standing steering for the program generator. Applied to every Generate and Regenerate of every phase in this macro arc. Use it to override engine-default conservatism (RPE, volume, exercise complexity, session density). Does not override recovery state, injury limits, or doctrine safety floors.
            </p>
          </div>
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g. Training-age advanced (10+ years). Target RPE 8 on primaries from week 1. No machine variations where a barbell or dumbbell version exists. Supersets allowed. Bias volume to the top of the range. He can handle and wants intensity."
            rows={5}
            className="w-full bg-[#0c0a09] border border-[#1c1917] rounded-lg px-3 py-2.5 text-[13px] text-[#e7e5e4] placeholder:text-[#3c3835] focus:outline-none focus:border-[#292524] leading-relaxed resize-y"
          />
          {error && (
            <div className="mt-2 text-[11px] text-[#fbbf24]">{error}</div>
          )}
          <div className="flex items-center justify-between mt-3">
            <p className="text-[10px] text-[#57534e]">
              {savedAt ? 'Saved. Will apply on next Regenerate.' : (savedValue ? 'Applied on every Generate or Regenerate of this arc.' : 'No guidance set yet.')}
            </p>
            <button
              onClick={save}
              disabled={!dirty || saving || isPending}
              className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                dirty
                  ? 'bg-[#14b8a6] text-[#0c0a09] hover:bg-[#5eead4] border border-[#14b8a6]'
                  : 'border border-[#1c1917] bg-[#0c0a09] text-[#a8a29e]'
              }`}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {saving ? 'Saving...' : 'Save guidance'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
