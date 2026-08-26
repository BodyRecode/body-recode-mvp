'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Info, Loader2, Save, Sparkles } from 'lucide-react'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

/**
 * NutritionCoachGuidanceEditor
 *
 * Standing coach steering for a nutrition plan. Applied on every Generate or
 * Regenerate, and carries forward via inheritance to the next plan generated
 * for this client unless explicitly overridden.
 *
 * Authority is bounded by the COACH GUIDANCE rule in src/lib/nutrition-prompt.ts
 * (CONTEXT-LEVEL OVERRIDE) — may override engine-default conservatism within
 * HABNS doctrine; may NOT override appetite-suppression hard rules, validator
 * floors, dietary restrictions or preferences, RRS clamps, transitional
 * override gating.
 *
 * AI-assist panel: coach picks intent + levers (+ optional one-liner) and the
 * suggester at /api/suggest-coach-guidance-nutrition writes a draft into the
 * textarea. Coach edits before saving.
 *
 * Mirrors src/app/dashboard/clients/[id]/program/coach-guidance-editor.tsx.
 */

type Intent = 'simplify' | 'push_demand' | 'add_flexibility' | 'restructure_meals'
type Lever = 'meal_count' | 'protein_distribution' | 'food_friction' | 'food_variety' | 'timing'

const INTENT_LABELS: { value: Intent; label: string }[] = [
  { value: 'simplify', label: 'Simplify execution' },
  { value: 'push_demand', label: 'Push the demand' },
  { value: 'add_flexibility', label: 'Add flexibility' },
  { value: 'restructure_meals', label: 'Restructure meals' },
]

const LEVER_LABELS: { value: Lever; label: string }[] = [
  { value: 'meal_count', label: 'Meal count' },
  { value: 'protein_distribution', label: 'Protein distribution' },
  { value: 'food_friction', label: 'Food friction (prep / cooking)' },
  { value: 'food_variety', label: 'Food variety (substitutions)' },
  { value: 'timing', label: 'Timing (positioning, peri-workout)' },
]

export default function NutritionCoachGuidanceEditor({
  nutritionPlanId,
  initial,
}: {
  nutritionPlanId: string
  initial: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(initial ?? '')
  const [savedValue, setSavedValue] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Card open: defaults open when guidance is set (so the coach sees what's
  // there) AND when no guidance is set (so the empty-state one-click starter
  // flow is reachable without an extra click). Coach can always Hide.
  const [open, setOpen] = useState(true)

  // AI assist state. When no guidance has been saved yet, auto-expand the
  // Suggest-with-AI panel so the Draft guidance button is a single click
  // away. Defaults are pre-selected (intent = simplify, levers = food
  // friction + meal count) so the coach can just click Draft without
  // configuring anything. When guidance already exists, keep the panel
  // collapsed so the saved text reads first.
  const [assistOpen, setAssistOpen] = useState(!initial)
  const [intent, setIntent] = useState<Intent>('simplify')
  const [levers, setLevers] = useState<Lever[]>(['food_friction', 'meal_count'])
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
      const res = await fetch('/api/suggest-coach-guidance-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutrition_plan_id: nutritionPlanId,
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
      const res = await fetch('/api/update-nutrition-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutrition_plan_id: nutritionPlanId,
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
    <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#EFF1F4]/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare size={13} className="text-[#1B6DFC]" />
          <p
            className="text-[11px] font-medium text-[#141821]"
          >
            Coach Guidance (nutrition plan)
          </p>
          {savedValue && (
            <span
              className="text-[10px] text-[#1B6DFC] px-1.5 py-0.5 rounded-full border border-[#B5CFFC] bg-[rgba(27,109,252,0.10)]"
            >
              SET
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#98A0AD]">{open ? 'Hide' : 'Edit'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-[#E8EAEE]">
          <div className="flex items-start gap-2 pt-3 mb-3">
            <Info size={12} className="text-[#98A0AD] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#98A0AD] leading-relaxed">
              Standing steering for the nutrition generator. Applied to every Generate and Regenerate. Use it to override engine-default conservatism (meal frequency, food selection bias, substitution generosity, structure rigidity). Does not override appetite-suppression hard rules, validator floors, dietary restrictions, or RRS recovery-state constraints.
            </p>
          </div>

          {/* AI assist panel */}
          <div className="mb-3 border border-[#E8EAEE] rounded-lg bg-[#FFFFFF]">
            <button
              onClick={() => setAssistOpen(o => !o)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-[#EFF1F4]/40 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-[#1B6DFC]" />
                <span
                  className="text-[10px] font-medium text-[#43474F]"
                >
                  Suggest with AI
                </span>
              </div>
              <span className="text-[10px] text-[#98A0AD]">{assistOpen ? 'Close' : 'Open'}</span>
            </button>
            {assistOpen && (
              <div className="px-3 pb-3 border-t border-[#E8EAEE]">
                {!savedValue && (
                  <div className="mt-3 -mx-1 mb-3 px-3 py-2 rounded-md bg-[rgba(27,109,252,0.06)] border border-[rgba(27,109,252,0.18)] text-[11px] text-[#1B6DFC] leading-relaxed">
                    Sensible defaults are pre-selected (Simplify execution, Food friction + Meal count). Tap <span className="font-semibold">Draft guidance</span> at the bottom for a one-click starter you can edit, then Save.
                  </div>
                )}
                <div className="pt-3 mb-3">
                  <p
                    className="text-[10px] font-medium text-[#666D7A] mb-1.5"
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
                              : 'bg-[#FFFFFF] border-[#E8EAEE] text-[#666D7A] hover:border-[#1B6DFC] hover:bg-blue-50'
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
                    className="text-[10px] font-medium text-[#666D7A] mb-1.5"
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
                              : 'bg-[#FFFFFF] border-[#E8EAEE] text-[#666D7A] hover:border-[#1B6DFC] hover:bg-blue-50'
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
                    className="text-[10px] font-medium text-[#666D7A] mb-1.5"
                  >
                    Coach note (optional)
                  </p>
                  <textarea
                    value={coachNote}
                    onChange={e => setCoachNote(e.target.value)}
                    placeholder="One line of context the engine cannot read from CFFS / intake. e.g. 'Going from 3 to 4 meals is the real ask. Design meal 4 as a no-cook protein anchor.'"
                    rows={2}
                    className="w-full bg-[#FFFFFF] border border-[#E8EAEE] rounded-lg px-2.5 py-2 text-[12px] text-[#141821] placeholder:text-[#43474F] focus:outline-none focus:border-[#CFD4DC] leading-relaxed resize-y"
                  />
                </div>

                {assistError && (
                  <div className="mb-2 text-[11px] text-[#8A5A14]">{assistError}</div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-[#98A0AD]">
                    Draft is editable before saving. CFFS, medications, and dietary context are pulled automatically.
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
            placeholder="e.g. Meal 4 designed as a no-cook 20g protein anchor (Greek yoghurt, eggs, protein shake). Bias meal 4 mid-afternoon to land on the client's 3-4pm crash and break the caffeine-bridge habit. Hold meals 1-3 structurally close to current plan; the change should read additive."
            rows={6}
            className="w-full bg-[#FFFFFF] border border-[#E8EAEE] rounded-lg px-3 py-2.5 text-[13px] text-[#141821] placeholder:text-[#43474F] focus:outline-none focus:border-[#CFD4DC] leading-relaxed resize-y"
          />
          {error && (
            <div className="mt-2 text-[11px] text-[#8A5A14]">{error}</div>
          )}
          <div className="flex items-center justify-between mt-3">
            <p className="text-[10px] text-[#98A0AD]">
              {savedAt ? 'Saved. Will apply on next Regenerate.' : (savedValue ? 'Applied on every Generate or Regenerate of this plan.' : 'No guidance set yet.')}
            </p>
            <button
              onClick={save}
              disabled={!dirty || saving || isPending}
              className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                dirty
                  ? 'bg-[#1B6DFC] text-[#FFFFFF] hover:bg-[#5390FF] border border-[#1B6DFC]'
                  : 'border border-[#E8EAEE] bg-[#FFFFFF] text-[#666D7A]'
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
