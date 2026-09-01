'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import GenerationProgressOverlay from '@/components/generation-progress-overlay'

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
  const [coachGuidance, setCoachGuidance] = useState('')

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
        coach_guidance: coachGuidance.trim() || null,
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
              ? 'border-[#1B6DFC] bg-[rgba(27,109,252,0.08)] text-[#1056D6]'
              : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <GenerationProgressOverlay
        active={loading}
        title="Generating Nutrition Plan"
        stages={[
          { start: 0,   label: 'Reading client context (CFFS, intake, baseline, medications, dietary)' },
          { start: 5,   label: 'Drafting 3 candidate plans in parallel (Claude Haiku 4.5)' },
          { start: 40,  label: 'Validating each candidate against doctrine rules' },
          { start: 50,  label: 'Escalating to Claude Sonnet 5 if no candidate passed' },
          { start: 95,  label: 'Polishing the higher-accuracy plan' },
          { start: 135, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Nutrition plan generation uses Claude Haiku 4.5 with Sonnet 5 escalation for high-accuracy constraint satisfaction. Typical: 60 to 90 seconds. The page is not frozen, please don't refresh."
      />

      {/* Plan Name */}
      <div>
        <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">Plan Name</label>
        <input
          value={planName}
          onChange={e => setPlanName(e.target.value)}
          placeholder="e.g. Foundation Nutrition - Training Support"
          className="w-full bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg px-4 py-2.5 text-sm text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:border-[#1056D6]"
          required
        />
      </div>

      {/* Entry State */}
      <div>
        <label className="block text-[12.5px] font-medium text-[#666D7A] mb-3">Entry State</label>
        <div className="grid grid-cols-2 gap-2">
          {ENTRY_STATE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setEntryState(opt.value)}
              className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                entryState === opt.value
                  ? 'border-[#1B6DFC] bg-[rgba(27,109,252,0.08)]'
                  : 'border-[#E8EAEE] bg-[#F4F6F9] hover:border-[#CFD4DC]'
              }`}
            >
              <p className={`text-sm font-semibold ${entryState === opt.value ? 'text-[#1056D6]' : 'text-[#141821]'}`}>{opt.label}</p>
              <p className="text-[12.5px] text-[#666D7A] mt-1 leading-snug">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Body State */}
      <div>
        <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">Body State</label>
        <div className="flex gap-2">
          {BODY_STATE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setBodyState(opt.value)}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                bodyState === opt.value
                  ? 'border-[#1B6DFC] bg-[rgba(27,109,252,0.08)] text-[#1056D6]'
                  : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* PTS Phase */}
      <div>
        <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">PTS Phase (Training Context)</label>
        <input
          value={ptsPhase}
          onChange={e => setPtsPhase(e.target.value)}
          placeholder="e.g. Accumulation - Hypertrophy, or No active program"
          className="w-full bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg px-4 py-2.5 text-sm text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:border-[#1056D6]"
        />
      </div>

      {/* Protein Anchor */}
      <div>
        <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">Protein Anchor (g/day)</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={proteinAnchorG}
            onChange={e => setProteinAnchorG(Number(e.target.value))}
            className="w-28 bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg px-4 py-2.5 text-sm text-[#141821] focus:outline-none focus:border-[#1056D6]"
            min={80}
            max={300}
            step={5}
          />
          <span className="text-[#666D7A] text-sm">grams/day - non-variable, distributed evenly across meals</span>
        </div>
      </div>

      {/* Carb Demand */}
      <div>
        <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">Carbohydrate Demand Level</label>
        {toggle3(carbDemandLevel, ['low', 'moderate', 'high'], setCarbDemandLevel)}
        <p className="text-[12.5px] text-[#98A0AD] mt-2">Must respect entry state ceiling: Stabilisation/Recovery Reset → Low only. Training Support → Moderate. High Output → High.</p>
      </div>

      {/* Meal Frequency */}
      <div>
        <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">Meal Frequency</label>
        <div className="flex gap-2">
          {[3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setMealFrequency(n)}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                mealFrequency === n
                  ? 'border-[#1B6DFC] bg-[rgba(27,109,252,0.08)] text-[#1056D6]'
                  : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC]'
              }`}
            >
              {n} meals
            </button>
          ))}
        </div>
      </div>

      {/* Training Days */}
      <div>
        <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">Training Days Per Week</label>
        <div className="flex gap-2">
          {[2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setTrainingDaysPerWeek(n)}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                trainingDaysPerWeek === n
                  ? 'border-[#1B6DFC] bg-[rgba(27,109,252,0.08)] text-[#1056D6]'
                  : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC]'
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
          <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">Constraint Level</label>
          {toggle3(constraintLevel, ['low', 'moderate', 'high'], setConstraintLevel)}
        </div>
        <div>
          <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">Recovery Status</label>
          {toggle3(recoveryStatus, ['stable', 'impaired', 'strong'], setRecoveryStatus)}
        </div>
        <div>
          <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">Uncertainty Level</label>
          {toggle3(uncertaintyLevel, ['low', 'moderate', 'high'], setUncertaintyLevel)}
        </div>
      </div>

      {/* Food Exclusions */}
      <div>
        <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">Food Exclusions</label>
        <input
          value={foodExclusions}
          onChange={e => setFoodExclusions(e.target.value)}
          placeholder="e.g. dairy, shellfish, eggs (comma separated)"
          className="w-full bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg px-4 py-2.5 text-sm text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:border-[#1056D6]"
        />
      </div>

      {/* Coach Guidance (standing free-text steering — mirrors training_plans.coach_guidance) */}
      <div>
        <label className="block text-[12.5px] font-medium text-[#666D7A] mb-2">Coach Guidance (optional)</label>
        <textarea
          value={coachGuidance}
          onChange={e => setCoachGuidance(e.target.value)}
          placeholder="Standing context for this plan — travel block, recent dietary change, post-illness framing, life event constraints. Read at every generation. Persists on the plan; leave blank to keep the prior plan's guidance."
          className="w-full bg-[#F4F6F9] border border-[#E8EAEE] rounded-lg px-4 py-3 text-sm text-[#141821] placeholder-[#98A0AD] focus:outline-none focus:border-[#1056D6] min-h-[120px]"
          rows={5}
        />
        <p className="text-[12.5px] text-[#98A0AD] mt-2">Bounded by HABNS doctrine: cannot override validator floors, appetite-suppression hard rules, dietary restrictions or preferences. See nutrition-prompt.ts § COACH GUIDANCE.</p>
      </div>

      {error && (
        <div className="bg-[#FDEDED] border border-[#F5C9C9] rounded-lg px-4 py-3">
          <p className="text-[#C82626] text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <a
          href={`/dashboard/clients/${clientId}/nutrition/suggest`}
          className="text-[12.5px] text-[#98A0AD] hover:text-[#666D7A] transition-colors"
        >
          ← Use prescription suggestion instead
        </a>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-[#1B6DFC] hover:bg-[#1560E0] disabled:bg-[#E8EAEE] disabled:text-[#666D7A] text-white font-semibold text-sm rounded-lg transition-colors"
        >
          {loading ? 'Generating plan...' : 'Generate Plan'}
        </button>
      </div>
    </form>
  )
}
