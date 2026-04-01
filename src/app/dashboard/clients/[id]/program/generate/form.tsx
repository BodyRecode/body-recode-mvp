'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const BLOCK_NAME_OPTIONS = [
  // Accumulation
  'Foundation Strength Block',
  'General Strength Accumulation',
  'Hypertrophy Accumulation Block',
  'Muscle Building Foundation',
  'Work Capacity Accumulation',
  'General Physical Preparation (GPP)',
  // Intensification
  'Strength Intensification Block',
  'Hypertrophy Intensification Block',
  'Capacity Intensification Block',
  'Loading Phase Block',
  'Progressive Overload Block',
  // Realization
  'Strength Realization Block',
  'Peak Performance Block',
  'Expression Phase Block',
  // Restoration
  'Deload / Restoration Block',
  'Active Recovery Block',
  'Consolidation Block',
]

const EQUIPMENT_OPTIONS = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'machine', label: 'Machine' },
  { value: 'cable', label: 'Cable' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'specialty', label: 'Specialty (trap bar, sleds, etc.)' },
]

interface PlanBlock {
  id: string
  block_name: string
  progression_phase: string
  phase_category: string | null
  execution_arc: string | null
  phase_objective: string | null
  training_goal: string
  week_duration: number
  notes: string | null
}

export default function GenerateProgramForm({
  clientId,
  planBlock,
}: {
  clientId: string
  planBlock?: PlanBlock | null
}) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    block_name: planBlock?.block_name ?? '',
    progression_phase: planBlock?.progression_phase ?? 'accumulation',
    training_goal: planBlock?.training_goal ?? 'strength',
    training_frequency: 3,
    training_age: 'intermediate',
    movement_competency: 'developing',
    week_duration: planBlock?.week_duration ?? 4,
    equipment_access: ['barbell', 'dumbbell', 'bodyweight'] as string[],
  })

  // If planBlock changes (shouldn't, but just in case), sync
  useEffect(() => {
    if (planBlock) {
      setForm(prev => ({
        ...prev,
        block_name: planBlock.block_name,
        progression_phase: planBlock.progression_phase,
        training_goal: planBlock.training_goal,
        week_duration: planBlock.week_duration,
      }))
    }
  }, [planBlock?.id])

  function toggleEquipment(value: string) {
    setForm(prev => ({
      ...prev,
      equipment_access: prev.equipment_access.includes(value)
        ? prev.equipment_access.filter(e => e !== value)
        : [...prev.equipment_access, value],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.block_name) {
      setError('Select a block name.')
      return
    }
    if (form.equipment_access.length === 0) {
      setError('Select at least one equipment type.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          plan_block_id: planBlock?.id ?? null,
          ...form,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Generation failed.')
        setLoading(false)
        return
      }

      router.push(`/dashboard/clients/${clientId}/program`)
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10E1C2] focus:border-transparent'
  const labelClass = 'block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2'

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-stone-500 hover:text-stone-300 mb-4 block transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-white">Generate Training Program</h1>
        <p className="text-sm text-stone-400 mt-1">
          Set prescription inputs. All doctrine rules will be applied automatically.
        </p>
      </div>

      {planBlock && (
        <div className="mb-6 bg-[#10E1C2]/5 border border-[#10E1C2]/20 rounded-xl p-4">
          <p className="text-xs font-bold text-[#10E1C2] uppercase tracking-wider mb-1">From Macro Plan</p>
          <p className="text-sm text-stone-200">{planBlock.block_name}</p>
          <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-stone-500">
            <span className="capitalize">{planBlock.progression_phase}</span>
            {planBlock.execution_arc && <span className="capitalize">· {planBlock.execution_arc} arc</span>}
            {planBlock.phase_category && <span>· {planBlock.phase_category}</span>}
            {planBlock.phase_objective && <span>· {planBlock.phase_objective}</span>}
          </div>
          {planBlock.notes && <p className="text-xs text-stone-600 italic mt-1.5">{planBlock.notes}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Block Name */}
        <div>
          <label className={labelClass}>Block Name</label>
          <select
            value={form.block_name}
            onChange={e => setForm(prev => ({ ...prev, block_name: e.target.value }))}
            className={inputClass}
            required
          >
            <option value="" disabled>Select a block name…</option>
            {BLOCK_NAME_OPTIONS.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Progression Phase */}
        <div>
          <label className={labelClass}>Progression Phase</label>
          <select
            value={form.progression_phase}
            onChange={e => setForm(prev => ({ ...prev, progression_phase: e.target.value }))}
            className={inputClass}
          >
            <option value="accumulation">Accumulation — volume priority, foundation building</option>
            <option value="intensification">Intensification — intensity priority, load climbs</option>
            <option value="realization">Realization — peak expression, max loads</option>
            <option value="restoration">Restoration — recovery/deload, suppressed load</option>
          </select>
        </div>

        {/* Training Goal */}
        <div>
          <label className={labelClass}>Training Goal</label>
          <div className="grid grid-cols-3 gap-2">
            {(['strength', 'hypertrophy', 'capacity'] as const).map(goal => (
              <button
                key={goal}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, training_goal: goal }))}
                className={`py-2.5 rounded-md text-sm font-medium border transition-colors ${
                  form.training_goal === goal
                    ? 'bg-[#10E1C2] text-stone-900 border-[#10E1C2]'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:border-stone-500'
                }`}
              >
                {goal.charAt(0).toUpperCase() + goal.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-stone-500 mt-1.5">
            {form.training_goal === 'strength' && 'Reps 3–6 · RPE 6–8 · 10–16 sets/session'}
            {form.training_goal === 'hypertrophy' && 'Reps 6–12 · RPE 6–7 · 14–22 sets/session'}
            {form.training_goal === 'capacity' && 'Reps 10–20 · RPE 5–7 · 12–18 sets/session'}
          </p>
        </div>

        {/* Training Frequency */}
        <div>
          <label className={labelClass}>
            Training Frequency — <span className="text-[#10E1C2]">{form.training_frequency} sessions/week</span>
          </label>
          <input
            type="range"
            min={2}
            max={6}
            value={form.training_frequency}
            onChange={e => setForm(prev => ({ ...prev, training_frequency: parseInt(e.target.value) }))}
            className="w-full accent-[#10E1C2]"
          />
          <div className="flex justify-between text-xs text-stone-600 mt-1">
            <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
          </div>
        </div>

        {/* Training Age */}
        <div>
          <label className={labelClass}>Training Age</label>
          <div className="grid grid-cols-3 gap-2">
            {(['beginner', 'intermediate', 'advanced'] as const).map(age => (
              <button
                key={age}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, training_age: age }))}
                className={`py-2.5 rounded-md text-sm font-medium border transition-colors ${
                  form.training_age === age
                    ? 'bg-[#10E1C2] text-stone-900 border-[#10E1C2]'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:border-stone-500'
                }`}
              >
                {age.charAt(0).toUpperCase() + age.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-stone-500 mt-1.5">
            {form.training_age === 'beginner' && 'Linear progression — load increases each session'}
            {form.training_age === 'intermediate' && 'Double progression — reps then load'}
            {form.training_age === 'advanced' && 'Undulating periodisation — varies session to session'}
          </p>
        </div>

        {/* Movement Competency */}
        <div>
          <label className={labelClass}>Movement Competency</label>
          <div className="grid grid-cols-3 gap-2">
            {(['limited', 'developing', 'proficient'] as const).map(level => (
              <button
                key={level}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, movement_competency: level }))}
                className={`py-2.5 rounded-md text-sm font-medium border transition-colors ${
                  form.movement_competency === level
                    ? 'bg-[#10E1C2] text-stone-900 border-[#10E1C2]'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:border-stone-500'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-stone-500 mt-1.5">
            {form.movement_competency === 'limited' && 'Supported, bilateral, low stability — machine and bodyweight base movements'}
            {form.movement_competency === 'developing' && 'Bilateral preferred, standard compounds permitted, moderate stability'}
            {form.movement_competency === 'proficient' && 'Full range — unilateral, high stability, all compounds available'}
          </p>
        </div>

        {/* Week Duration */}
        <div>
          <label className={labelClass}>Block Duration</label>
          <div className="grid grid-cols-3 gap-2">
            {([4, 6, 8] as const).map(weeks => (
              <button
                key={weeks}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, week_duration: weeks }))}
                className={`py-2.5 rounded-md text-sm font-medium border transition-colors ${
                  form.week_duration === weeks
                    ? 'bg-[#10E1C2] text-stone-900 border-[#10E1C2]'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:border-stone-500'
                }`}
              >
                {weeks} weeks
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Access */}
        <div>
          <label className={labelClass}>Equipment Access</label>
          <div className="grid grid-cols-2 gap-2">
            {EQUIPMENT_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.equipment_access.includes(opt.value)}
                  onChange={() => toggleEquipment(opt.value)}
                  className="rounded border-stone-600 bg-stone-800 accent-[#10E1C2]"
                />
                <span className={`text-sm transition-colors ${form.equipment_access.includes(opt.value) ? 'text-stone-200' : 'text-stone-500'}`}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-[#10E1C2] text-stone-900 font-semibold rounded-md hover:bg-[#0dcfb2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating program… this may take 30–60s' : 'Generate Program'}
        </button>
      </form>
    </div>
  )
}
