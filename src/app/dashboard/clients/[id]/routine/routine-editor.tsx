'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sunrise, Moon, Trash2, Plus, RotateCcw, Save, Loader2, Check } from 'lucide-react'
import type { DailyRoutine, DailySequence } from '@/lib/daily-routine-defaults'

/**
 * Coach editor for the Morning Reset + Evening Rhythm sequences.
 *
 * Two side-by-side (stacked on narrow) cards, one per sequence. Coach can
 * edit the tagline, add / remove / edit steps, and write a per-client
 * coach note. Save persists the whole DailyRoutine as JSONB on
 * clients.daily_routine. "Reset all to defaults" clears the column to
 * null, which triggers the fall-back render on the client portal.
 */
export default function RoutineEditor({
  clientId,
  initial,
  canonicalDefaults,
}: {
  clientId: string
  initial: DailyRoutine
  canonicalDefaults: DailyRoutine
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [morning, setMorning] = useState<DailySequence>(initial.morning)
  const [evening, setEvening] = useState<DailySequence>(initial.evening)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/daily-routine`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_routine: { morning, evening } }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Server returned ${res.status}`)
      }
      setSavedAt(new Date())
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const resetAll = async () => {
    if (!confirm('Reset both sequences to canonical Body Recode defaults? Coach overrides will be discarded.')) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/daily-routine`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_routine: null }),
      })
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      setMorning(canonicalDefaults.morning)
      setEvening(canonicalDefaults.evening)
      setSavedAt(new Date())
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reset')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SequenceCard
        icon={<Sunrise size={16} className="text-[#1B6DFC]" />}
        eyebrow="Sequence 01"
        sequence={morning}
        onChange={setMorning}
        defaultSequence={canonicalDefaults.morning}
      />
      <SequenceCard
        icon={<Moon size={16} className="text-[#1B6DFC]" />}
        eyebrow="Sequence 02"
        sequence={evening}
        onChange={setEvening}
        defaultSequence={canonicalDefaults.evening}
      />

      <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#E8EAEE]">
        <button
          onClick={resetAll}
          disabled={saving}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#666D7A] hover:text-[#141821] disabled:opacity-40 transition-colors"
        >
          <RotateCcw size={12} />
          Reset both to defaults
        </button>
        <div className="flex items-center gap-3">
          {error && <span className="text-[11px] text-amber-700">{error}</span>}
          {savedAt && !saving && !error && (
            <span className="text-[11px] text-[#666D7A] inline-flex items-center gap-1">
              <Check size={11} />
              Saved {savedAt.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving || isPending}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium px-4 py-2 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#5390FF] disabled:opacity-40 transition-colors"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SequenceCard({
  icon,
  eyebrow,
  sequence,
  onChange,
  defaultSequence,
}: {
  icon: React.ReactNode
  eyebrow: string
  sequence: DailySequence
  onChange: (next: DailySequence) => void
  defaultSequence: DailySequence
}) {
  const updateStep = (i: number, value: string) => {
    const nextSteps = [...sequence.steps]
    nextSteps[i] = value
    onChange({ ...sequence, steps: nextSteps })
  }
  const removeStep = (i: number) => {
    onChange({ ...sequence, steps: sequence.steps.filter((_, idx) => idx !== i) })
  }
  const addStep = () => {
    onChange({ ...sequence, steps: [...sequence.steps, ''] })
  }
  const resetSequence = () => {
    if (!confirm(`Reset "${sequence.title}" to canonical default? Coach overrides for this sequence will be discarded.`)) return
    onChange({ ...defaultSequence })
  }

  return (
    <div className="rounded-xl border border-[#E8EAEE] bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E8EAEE]">
        <div className="w-8 h-8 rounded-lg bg-[#1B6DFC]/10 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-medium text-[#1B6DFC]">{eyebrow}</p>
          <input
            type="text"
            value={sequence.title}
            onChange={e => onChange({ ...sequence, title: e.target.value })}
            className="w-full text-base font-semibold text-[#141821] bg-transparent border-none p-0 focus:outline-none focus:ring-0"
          />
        </div>
        <button
          onClick={resetSequence}
          type="button"
          className="text-[10px] text-[#666D7A] hover:text-[#141821] inline-flex items-center gap-1"
          title="Reset just this sequence to the canonical default"
        >
          <RotateCcw size={10} />
          Reset
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <label className="text-[10px] font-medium text-[#666D7A]">Tagline (shown under title on portal)</label>
          <input
            type="text"
            value={sequence.tagline}
            onChange={e => onChange({ ...sequence, tagline: e.target.value })}
            className="mt-1 w-full text-sm text-[#141821] bg-[#FBFCFD] border border-[#E8EAEE] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B6DFC]"
          />
        </div>

        <div>
          <label className="text-[10px] font-medium text-[#666D7A]">Steps</label>
          <div className="mt-1 space-y-2">
            {sequence.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[12.5px] text-[#98A0AD] pt-2.5 w-5 text-right shrink-0">{i + 1}.</span>
                <input
                  type="text"
                  value={step}
                  onChange={e => updateStep(i, e.target.value)}
                  className="flex-1 text-sm text-[#141821] bg-[#FBFCFD] border border-[#E8EAEE] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B6DFC]"
                />
                <button
                  onClick={() => removeStep(i)}
                  type="button"
                  className="p-2 text-[#98A0AD] hover:text-red-700 transition-colors"
                  title="Remove step"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              onClick={addStep}
              type="button"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#1B6DFC] hover:text-[#5390FF] transition-colors mt-1"
            >
              <Plus size={12} />
              Add step
            </button>
            {sequence.steps.length >= 7 && (
              <p className="text-[10px] text-amber-700 mt-1">7+ steps hurts adherence. Consider consolidating.</p>
            )}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-medium text-[#666D7A]">
            Coach note <span className="text-[#98A0AD] normal-case tracking-normal">(optional, shown to client under the steps)</span>
          </label>
          <textarea
            value={sequence.coach_note ?? ''}
            onChange={e => onChange({ ...sequence, coach_note: e.target.value })}
            rows={3}
            placeholder="e.g. Skip the outside walk on rain days — 5 min stretching at home works."
            className="mt-1 w-full text-sm text-[#141821] bg-[#FBFCFD] border border-[#E8EAEE] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B6DFC] resize-none"
          />
        </div>
      </div>
    </div>
  )
}
