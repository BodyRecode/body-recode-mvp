'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StickyScrollNav from '@/components/sticky-scroll-nav'

function parseReason(text: string): { intro: string | null; points: string[] } {
  if (/\(\d+\)/.test(text)) {
    const firstIdx = text.search(/\(\d+\)/)
    const intro = firstIdx > 0 ? text.slice(0, firstIdx).trim() : null
    const rest = firstIdx > 0 ? text.slice(firstIdx) : text
    const points = rest.split(/\s*\(\d+\)\s*/).map(s => s.trim()).filter(Boolean)
    return { intro, points }
  }
  const sentences = text.replace(/([.!?])\s+(?=[A-Z-])/g, '$1|||').split('|||').map(s => s.trim()).filter(s => s.length > 10)
  if (sentences.length >= 3) return { intro: null, points: sentences }
  return { intro: null, points: [text] }
}

function ReasonDisplay({ text }: { text: string }) {
  const { intro, points } = parseReason(text)
  return (
    <div className="space-y-1.5 mt-2">
      {intro && <p className="text-xs text-stone-300 leading-relaxed">{intro}</p>}
      {points.map((point, i) => (
        <div key={i} className="flex items-start gap-2">
          {points.length > 1 && <span className="text-teal-400 shrink-0 mt-0.5 text-[10px]">•</span>}
          {points.length === 1 && <span className="text-teal-400 text-xs mt-0.5 shrink-0">→</span>}
          <p className="text-xs text-stone-400 leading-relaxed">{point}</p>
        </div>
      ))}
    </div>
  )
}

const NAV_SECTIONS = [
  { id: 'rationale', title: 'Rationale' },
  { id: 'plan-name', title: 'Plan Name' },
  { id: 'entry-state', title: 'Entry State' },
  { id: 'body-state', title: 'Body State' },
  { id: 'pts-phase', title: 'PTS Phase' },
  { id: 'protein', title: 'Protein' },
  { id: 'carbs', title: 'Carbs' },
  { id: 'meals', title: 'Meals' },
  { id: 'training-days', title: 'Training Days' },
  { id: 'signals', title: 'Signals' },
  { id: 'exclusions', title: 'Exclusions' },
]

interface Suggestion {
  plan_name: string
  plan_name_reason: string
  entry_state: string
  entry_state_reason: string
  body_state: string
  body_state_reason: string
  pts_phase: string
  pts_phase_reason: string
  constraint_level: string
  constraint_level_reason: string
  recovery_status: string
  recovery_status_reason: string
  uncertainty_level: string
  uncertainty_level_reason: string
  protein_anchor_g: number
  protein_anchor_g_reason: string
  carb_demand_level: string
  carb_demand_level_reason: string
  meal_frequency: number
  meal_frequency_reason: string
  training_days_per_week: number
  training_days_per_week_reason: string
  food_exclusions: string[]
  food_exclusions_reason: string
  overall_rationale: string
}

const ENTRY_STATE_OPTIONS = [
  { value: 'stabilisation', label: 'Stabilisation', desc: 'Instability, high constraints, recovery impaired' },
  { value: 'training_support', label: 'Training Support', desc: 'Stable + training demand present' },
  { value: 'high_output_support', label: 'High Output Support', desc: 'Consistent stability + strong recovery' },
  { value: 'recovery_reset', label: 'Recovery Reset', desc: 'Fatigue accumulation, declining recovery' },
]

const CARB_OPTIONS = ['low', 'moderate', 'high']
const CONSTRAINT_OPTIONS = ['low', 'moderate', 'high']
const RECOVERY_OPTIONS = ['stable', 'impaired', 'strong']
const UNCERTAINTY_OPTIONS = ['low', 'moderate', 'high']
const BODY_STATE_OPTIONS = ['remediation', 'optimisation', 'post_optimisation']

function ReasonCard({
  label,
  value,
  reason,
  editing,
  onEdit,
  children,
}: {
  label: string
  value: string | number
  reason: string
  editing: boolean
  onEdit: () => void
  children?: React.ReactNode
}) {
  const displayValue = typeof value === 'string'
    ? value.replace(/_/g, ' ')
    : value

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{label}</p>
          <button
            onClick={onEdit}
            className="text-[10px] text-stone-600 hover:text-teal-400 transition-colors shrink-0"
          >
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>

        {!editing && (
          <span className="inline-block text-sm font-semibold text-white bg-stone-800 border border-stone-700 px-3 py-1 rounded-lg capitalize mb-3">
            {displayValue}
          </span>
        )}

        {editing && children}

        <ReasonDisplay text={reason} />
      </div>
    </div>
  )
}

export default function NutritionPrescriptionSuggest({
  clientId,
  clientName,
}: {
  clientId: string
  clientName: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [generating, setGenerating] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)

  // Editable values
  const [planName, setPlanName] = useState('')
  const [entryState, setEntryState] = useState('')
  const [bodyState, setBodyState] = useState('')
  const [ptsPhase, setPtsPhase] = useState('')
  const [constraintLevel, setConstraintLevel] = useState('')
  const [recoveryStatus, setRecoveryStatus] = useState('')
  const [uncertaintyLevel, setUncertaintyLevel] = useState('')
  const [proteinAnchorG, setProteinAnchorG] = useState(0)
  const [carbDemandLevel, setCarbDemandLevel] = useState('')
  const [mealFrequency, setMealFrequency] = useState(4)
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(3)
  const [foodExclusions, setFoodExclusions] = useState<string[]>([])
  const [foodExclusionsText, setFoodExclusionsText] = useState('')

  useEffect(() => {
    fetch('/api/suggest-nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        const s: Suggestion = data.suggestion
        setSuggestion(s)
        setPlanName(s.plan_name)
        setEntryState(s.entry_state)
        setBodyState(s.body_state)
        setPtsPhase(s.pts_phase)
        setConstraintLevel(s.constraint_level)
        setRecoveryStatus(s.recovery_status)
        setUncertaintyLevel(s.uncertainty_level)
        setProteinAnchorG(s.protein_anchor_g)
        setCarbDemandLevel(s.carb_demand_level)
        setMealFrequency(s.meal_frequency)
        setTrainingDaysPerWeek(s.training_days_per_week)
        setFoodExclusions(s.food_exclusions || [])
        setFoodExclusionsText((s.food_exclusions || []).join(', '))
        setLoading(false)
      })
      .catch(() => { setError('Failed to load suggestion'); setLoading(false) })
  }, [clientId])

  async function handleGenerate() {
    setGenerating(true)
    const exclusions = foodExclusionsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const res = await fetch('/api/generate-nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        plan_name: planName,
        entry_state: entryState,
        body_state: bodyState,
        pts_phase: ptsPhase,
        constraint_level: constraintLevel,
        recovery_status: recoveryStatus,
        uncertainty_level: uncertaintyLevel,
        protein_anchor_g: proteinAnchorG,
        carb_demand_level: carbDemandLevel,
        meal_frequency: mealFrequency,
        training_days_per_week: trainingDaysPerWeek,
        food_exclusions: exclusions,
      }),
    })

    const data = await res.json()
    setGenerating(false)

    if (data.error) { setError(data.error); return }
    router.push(`/dashboard/clients/${clientId}/nutrition`)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
            <p className="text-sm text-stone-400">Reading client context and generating prescription suggestion...</p>
          </div>
          <div className="space-y-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-4 bg-stone-800 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 15}%` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-950/30 border border-red-800 rounded-xl p-5">
        <p className="text-red-400 text-sm">{error}</p>
        <a href={`/dashboard/clients/${clientId}/nutrition/generate`} className="text-xs text-stone-500 hover:text-stone-300 mt-3 inline-block">
          Fill in manually instead →
        </a>
      </div>
    )
  }

  if (!suggestion) return null

  const toggle = (field: string) => setEditingField(editingField === field ? null : field)

  return (
    <div className="flex gap-8 max-w-5xl">
      <StickyScrollNav sections={NAV_SECTIONS} />
      <div className="flex-1 min-w-0 space-y-4">

      {/* Overall rationale */}
      <div id="rationale" className="scroll-mt-8 bg-teal-950/30 border border-teal-800/40 rounded-xl px-5 py-4">
        <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-3">Overall Rationale</p>
        {(() => {
          const { intro, points } = parseReason(suggestion.overall_rationale)
          return (
            <div className="space-y-2">
              {intro && <p className="text-sm text-stone-200 leading-relaxed">{intro}</p>}
              {points.length > 1 ? (
                <div className="space-y-2 mt-1">
                  {points.map((point, i) => (
                    <div key={i} className="flex items-start gap-2.5 border-l-2 border-teal-800/40 pl-3">
                      <p className="text-sm text-stone-300 leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-200 leading-relaxed">{points[0]}</p>
              )}
            </div>
          )
        })()}
      </div>

      {/* Plan Name */}
      <div id="plan-name" className="scroll-mt-8">
      <ReasonCard
        label="Plan Name"
        value={planName}
        reason={suggestion.plan_name_reason}
        editing={editingField === 'plan_name'}
        onEdit={() => toggle('plan_name')}
      >
        <input
          value={planName}
          onChange={e => setPlanName(e.target.value)}
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white mb-3"
        />
      </ReasonCard>
      </div>

      {/* Entry State */}
      <div id="entry-state" className="scroll-mt-8">
      <ReasonCard
        label="Entry State"
        value={entryState}
        reason={suggestion.entry_state_reason}
        editing={editingField === 'entry_state'}
        onEdit={() => toggle('entry_state')}
      >
        <div className="grid grid-cols-2 gap-2 mb-3">
          {ENTRY_STATE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setEntryState(opt.value)}
              className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                entryState === opt.value
                  ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500'
              }`}
            >
              <p className="font-semibold capitalize">{opt.label}</p>
              <p className="text-stone-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </ReasonCard>
      </div>

      {/* Body State */}
      <div id="body-state" className="scroll-mt-8">
      <ReasonCard
        label="Body State"
        value={bodyState}
        reason={suggestion.body_state_reason}
        editing={editingField === 'body_state'}
        onEdit={() => toggle('body_state')}
      >
        <div className="flex gap-2 mb-3">
          {BODY_STATE_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setBodyState(opt)}
              className={`px-3 py-1.5 rounded-lg border text-xs capitalize transition-colors ${
                bodyState === opt
                  ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500'
              }`}
            >
              {opt.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </ReasonCard>
      </div>

      {/* PTS Phase */}
      <div id="pts-phase" className="scroll-mt-8">
      <ReasonCard
        label="PTS Phase (Training Context)"
        value={ptsPhase}
        reason={suggestion.pts_phase_reason}
        editing={editingField === 'pts_phase'}
        onEdit={() => toggle('pts_phase')}
      >
        <input
          value={ptsPhase}
          onChange={e => setPtsPhase(e.target.value)}
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white mb-3"
        />
      </ReasonCard>
      </div>

      {/* Protein Anchor */}
      <div id="protein" className="scroll-mt-8">
      <ReasonCard
        label="Protein Anchor (g/day)"
        value={`${proteinAnchorG}g`}
        reason={suggestion.protein_anchor_g_reason}
        editing={editingField === 'protein_anchor'}
        onEdit={() => toggle('protein_anchor')}
      >
        <div className="flex items-center gap-3 mb-3">
          <input
            type="number"
            value={proteinAnchorG}
            onChange={e => setProteinAnchorG(Number(e.target.value))}
            className="w-28 bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white"
            min={80}
            max={300}
            step={5}
          />
          <span className="text-stone-500 text-sm">grams/day</span>
        </div>
      </ReasonCard>
      </div>

      {/* Carb Demand Level */}
      <div id="carbs" className="scroll-mt-8">
      <ReasonCard
        label="Carbohydrate Demand Level"
        value={carbDemandLevel}
        reason={suggestion.carb_demand_level_reason}
        editing={editingField === 'carb_demand'}
        onEdit={() => toggle('carb_demand')}
      >
        <div className="flex gap-2 mb-3">
          {CARB_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setCarbDemandLevel(opt)}
              className={`px-4 py-1.5 rounded-lg border text-xs capitalize transition-colors ${
                carbDemandLevel === opt
                  ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </ReasonCard>
      </div>

      {/* Meal Frequency */}
      <div id="meals" className="scroll-mt-8">
      <ReasonCard
        label="Meal Frequency"
        value={`${mealFrequency} meals/day`}
        reason={suggestion.meal_frequency_reason}
        editing={editingField === 'meal_frequency'}
        onEdit={() => toggle('meal_frequency')}
      >
        <div className="flex gap-2 mb-3">
          {[3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setMealFrequency(n)}
              className={`px-4 py-1.5 rounded-lg border text-xs transition-colors ${
                mealFrequency === n
                  ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500'
              }`}
            >
              {n} meals
            </button>
          ))}
        </div>
      </ReasonCard>
      </div>

      {/* Training Days */}
      <div id="training-days" className="scroll-mt-8">
      <ReasonCard
        label="Training Days Per Week"
        value={`${trainingDaysPerWeek}x/week`}
        reason={suggestion.training_days_per_week_reason}
        editing={editingField === 'training_days'}
        onEdit={() => toggle('training_days')}
      >
        <div className="flex gap-2 mb-3">
          {[2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              onClick={() => setTrainingDaysPerWeek(n)}
              className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                trainingDaysPerWeek === n
                  ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500'
              }`}
            >
              {n}x
            </button>
          ))}
        </div>
      </ReasonCard>
      </div>

      {/* Constraint / Recovery / Uncertainty */}
      <div id="signals" className="scroll-mt-8 grid grid-cols-3 gap-3">
        {[
          { label: 'Constraint Level', value: constraintLevel, field: 'constraint', options: CONSTRAINT_OPTIONS, setter: setConstraintLevel, reason: suggestion.constraint_level_reason },
          { label: 'Recovery Status', value: recoveryStatus, field: 'recovery', options: RECOVERY_OPTIONS, setter: setRecoveryStatus, reason: suggestion.recovery_status_reason },
          { label: 'Uncertainty Level', value: uncertaintyLevel, field: 'uncertainty', options: UNCERTAINTY_OPTIONS, setter: setUncertaintyLevel, reason: suggestion.uncertainty_level_reason },
        ].map(({ label, value, field, options, setter, reason }) => (
          <div key={field} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">{label}</p>
            <div className="flex flex-col gap-1.5 mb-3">
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={() => setter(opt)}
                  className={`px-3 py-1 rounded-lg border text-xs capitalize transition-colors ${
                    value === opt
                      ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                      : 'border-stone-700 text-stone-400 hover:border-stone-500'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-stone-600 leading-relaxed">{reason}</p>
          </div>
        ))}
      </div>

      {/* Food Exclusions */}
      <div id="exclusions" className="scroll-mt-8 bg-stone-900 border border-stone-800 rounded-xl p-5">
        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">Food Exclusions</p>
        <input
          value={foodExclusionsText}
          onChange={e => setFoodExclusionsText(e.target.value)}
          placeholder="e.g. dairy, shellfish (comma separated)"
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600"
        />
        <ReasonDisplay text={suggestion.food_exclusions_reason} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <a
          href={`/dashboard/clients/${clientId}/nutrition/generate`}
          className="text-xs text-stone-600 hover:text-stone-400 transition-colors"
        >
          Fill in manually instead
        </a>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:bg-stone-700 disabled:text-stone-500 text-black font-semibold text-sm rounded-lg transition-colors"
        >
          {generating ? 'Generating plan...' : 'Approve & Generate Plan'}
        </button>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800 rounded-lg px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      </div>
    </div>
  )
}
