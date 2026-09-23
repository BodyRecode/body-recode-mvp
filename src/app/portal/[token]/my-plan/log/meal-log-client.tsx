'use client'

/**
 * Daily meal-adherence logger. Mobile-first. Used by BOTH the client portal
 * and the coach dashboard (apiBase switches the write routes; token is unused
 * on the coach side). Each prescribed meal is ticked ate / swapped / skipped,
 * with an optional note on swaps/skips, plus a daily hunger + satisfaction
 * read and an overall note. Everything auto-saves as you tap.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface LogMeal {
  meal_number: number
  meal_name: string
  timing: string | null
  notes: string | null
}

type EntryState = { outcome: string | null; note: string }

const OUTCOMES: Array<{ value: 'ate' | 'swapped' | 'skipped'; label: string }> = [
  { value: 'ate', label: 'Ate it' },
  { value: 'swapped', label: 'Swapped' },
  { value: 'skipped', label: 'Skipped' },
]

const HUNGER = [
  { value: 'low', label: 'Low' },
  { value: 'steady', label: 'Steady' },
  { value: 'high', label: 'High' },
]
const SATISFACTION = [
  { value: 'unsatisfied', label: 'Left hungry' },
  { value: 'ok', label: 'OK' },
  { value: 'satisfied', label: 'Satisfied' },
]

function outcomeClass(active: boolean, value: string): string {
  if (!active) return 'border-[#E4E4E0] text-[#6E747D] hover:border-[#DCDCD7]'
  if (value === 'ate') return 'border-[#0F1115] bg-[#F2F2EF] text-[#0F1115]'
  if (value === 'swapped') return 'border-[#B06E1F] bg-[#FDF8F1] text-[#B06E1F]'
  return 'border-[#DCDCD7] bg-[#F2F2EF] text-[#6E747D]'
}

export default function MealLogClient({
  token,
  clientId,
  meals,
  initialEntries,
  initialDay,
  apiBase,
  backHref,
  firstName,
}: {
  token: string
  clientId: string
  meals: LogMeal[]
  initialEntries: Record<number, { outcome: string | null; note: string | null }>
  initialDay: { hungerSignal: string | null; satisfactionSignal: string | null; overallNote: string | null } | null
  apiBase: string
  backHref: string
  firstName?: string
}) {
  const router = useRouter()

  const [entries, setEntries] = useState<Record<number, EntryState>>(() => {
    const seed: Record<number, EntryState> = {}
    for (const m of meals) {
      const e = initialEntries[m.meal_number]
      seed[m.meal_number] = { outcome: e?.outcome ?? null, note: e?.note ?? '' }
    }
    return seed
  })
  const [hunger, setHunger] = useState(initialDay?.hungerSignal ?? '')
  const [satisfaction, setSatisfaction] = useState(initialDay?.satisfactionSignal ?? '')
  const [overallNote, setOverallNote] = useState(initialDay?.overallNote ?? '')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function postMeal(m: LogMeal, outcome: string, note: string) {
    setError('')
    try {
      const res = await fetch(`${apiBase}/meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          clientId,
          mealNumber: m.meal_number,
          mealName: m.meal_name,
          sortOrder: m.meal_number,
          outcome,
          note: note || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Could not save that meal. Try again.')
      }
    } catch {
      setError('Network error saving that meal.')
    }
  }

  async function postDay(patch: Record<string, unknown>) {
    setError('')
    try {
      const res = await fetch(`${apiBase}/day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, clientId, ...patch }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Could not save. Try again.')
        return false
      }
      return true
    } catch {
      setError('Network error.')
      return false
    }
  }

  function setOutcome(m: LogMeal, outcome: string) {
    setEntries(prev => ({ ...prev, [m.meal_number]: { ...prev[m.meal_number], outcome } }))
    postMeal(m, outcome, entries[m.meal_number]?.note ?? '')
  }

  function setNote(m: LogMeal, note: string) {
    setEntries(prev => ({ ...prev, [m.meal_number]: { ...prev[m.meal_number], note } }))
  }

  const loggedCount = meals.filter(m => entries[m.meal_number]?.outcome).length

  async function handleDone() {
    setSaving(true)
    const ok = await postDay({ hungerSignal: hunger || null, satisfactionSignal: satisfaction || null, overallNote: overallNote || null, status: 'logged' })
    setSaving(false)
    if (ok) setDone(true)
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[#DCDCD7] bg-[#F2F2EF] p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#0F1115] flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-[#0F1115] mb-1">Logged{firstName ? `, ${firstName}` : ''}.</p>
        <p className="text-[#6E747D] text-sm mb-6">Today&apos;s meals are saved. You can update them any time today.</p>
        <button
          onClick={() => router.push(backHref)}
          className="text-sm font-semibold text-white bg-[#0F1115] px-6 py-2.5 rounded-xl hover:bg-[#000000] transition-colors"
        >
          Back to plan
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-[#9CA2AB]">{loggedCount} of {meals.length} meals logged today</p>

      <div className="space-y-3">
        {meals.map(m => {
          const e = entries[m.meal_number]
          const showNote = e?.outcome === 'swapped' || e?.outcome === 'skipped'
          return (
            <div key={m.meal_number} className="rounded-2xl border border-[#E4E4E0] bg-white p-4">
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <p className="text-sm font-bold text-[#0F1115]">{m.meal_name}</p>
                {m.timing && <p className="text-xs text-[#9CA2AB]">{m.timing}</p>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {OUTCOMES.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setOutcome(m, o.value)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-colors ${outcomeClass(e?.outcome === o.value, o.value)}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {showNote && (
                <input
                  type="text"
                  value={e.note}
                  onChange={ev => setNote(m, ev.target.value)}
                  onBlur={() => e.outcome && postMeal(m, e.outcome, e.note)}
                  placeholder={e.outcome === 'swapped' ? 'What did you have instead? (optional)' : 'Anything to note? (optional)'}
                  className="mt-2 w-full bg-white border border-[#E4E4E0] rounded-xl px-3 py-2 text-xs text-[#0F1115] placeholder-[#9CA2AB] focus:outline-none focus:border-[#DCDCD7]"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Daily signals */}
      <div className="rounded-2xl border border-[#E4E4E0] bg-white p-4 space-y-4">
        <div>
          <p className="text-[12.5px] font-medium text-[#9CA2AB] mb-2">Hunger today</p>
          <div className="grid grid-cols-3 gap-2">
            {HUNGER.map(h => (
              <button
                key={h.value}
                type="button"
                onClick={() => { setHunger(h.value); postDay({ hungerSignal: h.value }) }}
                className={`py-2.5 rounded-xl border text-xs font-semibold transition-colors ${hunger === h.value ? 'border-[#0F1115] bg-[#F2F2EF] text-[#0F1115]' : 'border-[#E4E4E0] text-[#6E747D] hover:border-[#DCDCD7]'}`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[12.5px] font-medium text-[#9CA2AB] mb-2">Meals felt</p>
          <div className="grid grid-cols-3 gap-2">
            {SATISFACTION.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => { setSatisfaction(s.value); postDay({ satisfactionSignal: s.value }) }}
                className={`py-2.5 rounded-xl border text-xs font-semibold transition-colors ${satisfaction === s.value ? 'border-[#0F1115] bg-[#F2F2EF] text-[#0F1115]' : 'border-[#E4E4E0] text-[#6E747D] hover:border-[#DCDCD7]'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[12.5px] font-medium text-[#9CA2AB] mb-2">Anything else? <span className="text-[#DCDCD7] normal-case font-normal">(optional)</span></p>
          <textarea
            value={overallNote}
            onChange={e => setOverallNote(e.target.value)}
            onBlur={() => postDay({ overallNote: overallNote || null })}
            rows={2}
            placeholder="e.g. big appetite after training, ran out of time for meal 4"
            className="w-full bg-white border border-[#E4E4E0] rounded-xl px-3 py-2 text-xs text-[#0F1115] placeholder-[#9CA2AB] resize-none focus:outline-none focus:border-[#DCDCD7]"
          />
        </div>
      </div>

      {error && (
        <div className="bg-[#FBF1F1] border border-[#E8C9C9] rounded-xl px-4 py-3">
          <p className="text-sm text-[#8F2D2D]">{error}</p>
        </div>
      )}

      <button
        onClick={handleDone}
        disabled={saving}
        className="w-full py-3.5 bg-[#0F1115] hover:bg-[#000000] disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition-colors"
      >
        {saving ? 'Saving…' : 'Done for today'}
      </button>
    </div>
  )
}
