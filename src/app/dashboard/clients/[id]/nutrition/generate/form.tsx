'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ENTRY_STATE_OPTIONS = [
  { value: 'stabilisation', label: 'Stabilisation', desc: 'Instability, high constraints, recovery impaired. Carbs: Low. No modulation.' },
  { value: 'training_support', label: 'Training Support', desc: 'Stable + training demand present. Carbs: Moderate. Restricted modulation.' },
  { value: 'high_output_support', label: 'High Output Support', desc: 'Consistent stability + strong recovery. Carbs: High. Full modulation.' },
  { value: 'recovery_reset', label: 'Recovery Reset', desc: 'Fatigue accumulation, declining recovery. Carbs: Low. No modulation.' },
]

const BODY_STATE_OPTIONS = [
  { value: 'remediation', label: 'Remediation' },
  { value: 'optimisation', label: 'Optimisation' },
  { value: 'post_optimisation', label: 'Post-Optimisation' },
]

export default function NutritionGenerateForm({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [planName, setPlanName] = useState('')
  const [entryState, setEntryState] = useState('training_support')
  const [bodyState, setBodyState] = useState('optimisation')
  const [ptsPhase, setPtsPhase] = useState('')
  const [constraintLevel, setConstraintLevel] = useState('moderate')
  const [recoveryStatus, setRecoveryStatus] = useState('stable')
  const [uncertaintyLevel, setUncertaintyLevel] = useState('moderate')
  const [proteinAnchorG, setProteinAnchorG] = useState(160)
  const [carbDemandLevel, setCarbDemandLevel] = useState('moderate')
  const [mealFrequency, setMealFrequency] = useState(4)
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(3)
  const [foodExclusions, setFoodExclusions] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!planName) { setError('Plan name is required'); return }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/generate-nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        plan_name: planName,
        entry_state: entryState,
        body_state: bodyState,
        pts_phase: ptsPhase || 'Not specified',
        constraint_level: constraintLevel,
        recovery_status: recoveryStatus,
        uncertainty_level: uncertaintyLevel,
        protein_anchor_g: proteinAnchorG,
        carb_demand_level: carbDemandLevel,
        meal_frequency: mealFrequency,
        training_days_per_week: trainingDaysPerWeek,
        food_exclusions: foodExclusions.split(',').map(s => s.trim()).filter(Boolean),
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (data.error) { setError(data.error); return }
    router.push(`/dashboard/clients/${clientId}/nutrition`)
  }

  const toggle3 = (val: string, options: string[], setter: (v: string) => void) => (
    <div className="flex gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => setter(opt)}
          className={`px-3 py-1.5 rounded-lg border text-xs capitalize transition-colors ${
            val === opt
              ? 'border-teal-500 bg-teal-500/10 text-teal-300'
              : 'border-stone-700 text-stone-400 hover:border-stone-500'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Plan Name */}
      <div>
        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Plan Name</label>
        <input
          value={planName}
          onChange={e => setPlanName(e.target.value)}
          placeholder="e.g. Foundation Nutrition — Training Support"
          className="w-full bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-teal-600"
          required
        />
      </div>

      {/* Entry State */}
      <div>
        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Entry State</label>
        <div className="grid grid-cols-2 gap-2">
          {ENTRY_STATE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setEntryState(opt.value)}
              className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                entryState === opt.value
                  ? 'border-teal-500 bg-teal-500/10'
                  : 'border-stone-800 bg-stone-900 hover:border-stone-600'
              }`}
            >
              <p className={`text-sm font-semibold ${entryState === opt.value ? 'text-teal-300' : 'text-stone-300'}`}>{opt.label}</p>
              <p className="text-xs text-stone-500 mt-1 leading-snug">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Body State */}
      <div>
        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Body State</label>
        <div className="flex gap-2">
          {BODY_STATE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setBodyState(opt.value)}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                bodyState === opt.value
                  ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* PTS Phase */}
      <div>
        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">PTS Phase (Training Context)</label>
        <input
          value={ptsPhase}
          onChange={e => setPtsPhase(e.target.value)}
          placeholder="e.g. Accumulation — Hypertrophy, or No active program"
          className="w-full bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-teal-600"
        />
      </div>

      {/* Protein Anchor */}
      <div>
        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Protein Anchor (g/day)</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={proteinAnchorG}
            onChange={e => setProteinAnchorG(Number(e.target.value))}
            className="w-28 bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-600"
            min={80}
            max={300}
            step={5}
          />
          <span className="text-stone-500 text-sm">grams/day — non-variable, distributed evenly across meals</span>
        </div>
      </div>

      {/* Carb Demand */}
      <div>
        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Carbohydrate Demand Level</label>
        {toggle3(carbDemandLevel, ['low', 'moderate', 'high'], setCarbDemandLevel)}
        <p className="text-xs text-stone-600 mt-2">Must respect entry state ceiling: Stabilisation/Recovery Reset → Low only. Training Support → Moderate. High Output → High.</p>
      </div>

      {/* Meal Frequency */}
      <div>
        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Meal Frequency</label>
        <div className="flex gap-2">
          {[3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setMealFrequency(n)}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                mealFrequency === n
                  ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500'
              }`}
            >
              {n} meals
            </button>
          ))}
        </div>
      </div>

      {/* Training Days */}
      <div>
        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Training Days Per Week</label>
        <div className="flex gap-2">
          {[2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setTrainingDaysPerWeek(n)}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                trainingDaysPerWeek === n
                  ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500'
              }`}
            >
              {n}x
            </button>
          ))}
        </div>
      </div>

      {/* Context fields */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Constraint Level</label>
          {toggle3(constraintLevel, ['low', 'moderate', 'high'], setConstraintLevel)}
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Recovery Status</label>
          {toggle3(recoveryStatus, ['stable', 'impaired', 'strong'], setRecoveryStatus)}
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Uncertainty Level</label>
          {toggle3(uncertaintyLevel, ['low', 'moderate', 'high'], setUncertaintyLevel)}
        </div>
      </div>

      {/* Food Exclusions */}
      <div>
        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Food Exclusions</label>
        <input
          value={foodExclusions}
          onChange={e => setFoodExclusions(e.target.value)}
          placeholder="e.g. dairy, shellfish, eggs (comma separated)"
          className="w-full bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-teal-600"
        />
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800 rounded-lg px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <a
          href={`/dashboard/clients/${clientId}/nutrition/suggest`}
          className="text-xs text-stone-600 hover:text-stone-400 transition-colors"
        >
          ← Use prescription suggestion instead
        </a>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:bg-stone-700 disabled:text-stone-500 text-black font-semibold text-sm rounded-lg transition-colors"
        >
          {loading ? 'Generating plan...' : 'Generate Plan'}
        </button>
      </div>
    </form>
  )
}
