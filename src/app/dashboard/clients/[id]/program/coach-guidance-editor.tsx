'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Info, Loader2, Save, Sparkles } from 'lucide-react'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

/**
 * CoachGuidanceEditor
 *
 * Standing coach steering for the macro arc (training_plan). Applied on every
 * Generate or Regenerate of any program linked to this plan. Persists across
 * regenerations and across new phase generations within the same arc.
 *
 * Authority is bounded by the COACH GUIDANCE rule in
 * src/lib/program-prompt.ts - may override engine-default conservatism within
 * doctrine, may NOT override RRS clamps, injury contraindications, or
 * eligibility floors.
 *
 * AI-assist panel: coach picks intent + levers (+ optional one-liner) and the
 * suggester at /api/suggest-coach-guidance writes a draft into the textarea.
 * Coach can edit before saving.
 */

type Intent = 'push_harder' | 'pull_back' | 'maintain_focus'
type Lever = 'volume' | 'intensity' | 'complexity' | 'density'

const INTENT_LABELS: { value: Intent; label: string }[] = [
  { value: 'push_harder', label: 'Push harder' },
  { value: 'pull_back', label: 'Pull back' },
  { value: 'maintain_focus', label: 'Maintain, refine focus' },
]

const LEVER_LABELS: { value: Lever; label: string }[] = [
  { value: 'volume', label: 'Volume' },
  { value: 'intensity', label: 'Intensity (RPE)' },
  { value: 'complexity', label: 'Exercise complexity' },
  { value: 'density', label: 'Density (rests, supersets)' },
]

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

  // AI assist state
  const [assistOpen, setAssistOpen] = useState(false)
  const [intent, setIntent] = useState<Intent>('push_harder')
  const [levers, setLevers] = useState<Lever[]>(['volume', 'intensity'])
  const [coachNote, setCoachNote] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const [assistError, setAssistError] = useState<string | null>(null)

  const dirty = value !== savedValue

  const toggleLever = (l: Lever) => {
    setLevers(curr => curr.includes(l) ? curr.filter(x => x !== l) : [...curr, l])
  }

  const suggest = async () => {
    if (suggesting) return
    if (value.trim() && value !== savedValue) {
      if (!confirm('Replace your in-progress draft with the AI suggestion? Saved guidance is unaffected until you click Save.')) return
    }
    setAssistError(null)
    setSuggesting(true)
    try {
      const res = await fetch('/api/suggest-coach-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          training_plan_id: trainingPlanId,
          intent,
          levers,
          coach_note: coachNote.trim() || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      setValue(data.guidance || '')
      setAssistOpen(false)
    } catch (e) {
      setAssistError(e instanceof Error ? e.message : 'Could not generate suggestion')
    } finally {
      setSuggesting(false)
    }
  }

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
    <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#E5E5E5]/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare size={13} className="text-[#1B6DFC]" />
          <p
            className="text-[11px] font-bold text-[#1A1A1A] uppercase"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
          >
            Coach Guidance (macro arc)
          </p>
          {savedValue && (
            <span
              className="text-[10px] text-[#1B6DFC] px-1.5 py-0.5 rounded-full border border-[#B5CFFC] bg-[rgba(27,109,252,0.10)]"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
            >
              SET
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#999999]">{open ? 'Hide' : 'Edit'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-[#E5E5E5]">
          <div className="flex items-start gap-2 pt-3 mb-3">
            <Info size={12} className="text-[#999999] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#999999] leading-relaxed">
              Standing steering for the program generator. Applied to every Generate and Regenerate of every phase in this macro arc. Use it to override engine-default conservatism (RPE, volume, exercise complexity, session density). Does not override recovery state, injury limits, or doctrine safety floors.
            </p>
          </div>

          {/* AI assist panel */}
          <div className="mb-3 border border-[#E5E5E5] rounded-lg bg-[#FFFFFF]">
            <button
              onClick={() => setAssistOpen(o => !o)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-[#E5E5E5]/40 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-[#1B6DFC]" />
                <span
                  className="text-[10px] font-bold text-[#3A3A3A] uppercase"
                  style={{ fontFamily: MONO_FONT, letterSpacing: '0.12em' }}
                >
                  Suggest with AI
                </span>
              </div>
              <span className="text-[10px] text-[#999999]">{assistOpen ? 'Close' : 'Open'}</span>
            </button>
            {assistOpen && (
              <div className="px-3 pb-3 border-t border-[#E5E5E5]">
                <div className="pt-3 mb-3">
                  <p
                    className="text-[10px] font-bold text-[#6B6B6B] uppercase mb-1.5"
                    style={{ fontFamily: MONO_FONT, letterSpacing: '0.12em' }}
                  >
                    Intent
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {INTENT_LABELS.map(opt => {
                      const active = intent === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setIntent(opt.value)}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                            active
                              ? 'bg-[rgba(27,109,252,0.12)] border-[#B5CFFC] text-[#1B6DFC]'
                              : 'bg-[#FFFFFF] border-[#E5E5E5] text-[#6B6B6B] hover:border-[#1B6DFC] hover:bg-blue-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mb-3">
                  <p
                    className="text-[10px] font-bold text-[#6B6B6B] uppercase mb-1.5"
                    style={{ fontFamily: MONO_FONT, letterSpacing: '0.12em' }}
                  >
                    Levers
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {LEVER_LABELS.map(opt => {
                      const active = levers.includes(opt.value)
                      return (
                        <button
                          key={opt.value}
                          onClick={() => toggleLever(opt.value)}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                            active
                              ? 'bg-[rgba(27,109,252,0.12)] border-[#B5CFFC] text-[#1B6DFC]'
                              : 'bg-[#FFFFFF] border-[#E5E5E5] text-[#6B6B6B] hover:border-[#1B6DFC] hover:bg-blue-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mb-3">
                  <p
                    className="text-[10px] font-bold text-[#6B6B6B] uppercase mb-1.5"
                    style={{ fontFamily: MONO_FONT, letterSpacing: '0.12em' }}
                  >
                    Coach note (optional)
                  </p>
                  <textarea
                    value={coachNote}
                    onChange={e => setCoachNote(e.target.value)}
                    placeholder="One line of context the engine cannot read from CFFS / intake. e.g. 'Came off two weeks of high work stress, now back to normal sleep.'"
                    rows={2}
                    className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-2.5 py-2 text-[12px] text-[#e7e5e4] placeholder:text-[#4A4A4A] focus:outline-none focus:border-[#D4D4D4] leading-relaxed resize-y"
                  />
                </div>

                {assistError && (
                  <div className="mb-2 text-[11px] text-[#8A5A14]">{assistError}</div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-[#999999]">
                    Draft is editable before saving. CFFS context is pulled automatically.
                  </p>
                  <button
                    onClick={suggest}
                    disabled={suggesting}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-[#1B6DFC] bg-[rgba(27,109,252,0.10)] text-[#1B6DFC] hover:bg-[rgba(27,109,252,0.18)]"
                  >
                    {suggesting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {suggesting ? 'Drafting...' : 'Draft guidance'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g. Training-age advanced (10+ years). Target RPE 8 on primaries from week 1. No machine variations where a barbell or dumbbell version exists. Supersets allowed. Bias volume to the top of the range. He can handle and wants intensity."
            rows={6}
            className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-[13px] text-[#e7e5e4] placeholder:text-[#4A4A4A] focus:outline-none focus:border-[#D4D4D4] leading-relaxed resize-y"
          />
          {error && (
            <div className="mt-2 text-[11px] text-[#8A5A14]">{error}</div>
          )}
          <div className="flex items-center justify-between mt-3">
            <p className="text-[10px] text-[#999999]">
              {savedAt ? 'Saved. Will apply on next Regenerate.' : (savedValue ? 'Applied on every Generate or Regenerate of this arc.' : 'No guidance set yet.')}
            </p>
            <button
              onClick={save}
              disabled={!dirty || saving || isPending}
              className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                dirty
                  ? 'bg-[#1B6DFC] text-[#FFFFFF] hover:bg-[#5390FF] border border-[#1B6DFC]'
                  : 'border border-[#E5E5E5] bg-[#FFFFFF] text-[#6B6B6B]'
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
