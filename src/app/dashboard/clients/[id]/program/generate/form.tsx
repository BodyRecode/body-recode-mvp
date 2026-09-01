'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GenerationProgressOverlay from '@/components/generation-progress-overlay'
import { parseApiResponse } from '@/lib/parse-api-response'

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
  'Travel-Adapted Movement Continuity',
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

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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
  training_frequency?: number | null
}

export default function GenerateProgramForm({
  clientId,
  planBlock,
  intakeTrainingDays = [],
}: {
  clientId: string
  planBlock?: PlanBlock | null
  intakeTrainingDays?: string[]
}) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    block_name: planBlock?.block_name ?? '',
    progression_phase: planBlock?.progression_phase ?? 'accumulation',
    training_goal: planBlock?.training_goal ?? 'strength',
    // From the arc, not a hardcoded guess. Vicki's Block 1 is 2x/week and this
    // field defaulted to 3, so the program would have been generated at 50 per
    // cent more frequency than the approved arc with nothing flagging it.
    training_frequency: planBlock?.training_frequency ?? 3,
    // Conservative by default. Progression is permissioned, never assumed, and
    // that applies to a form default as much as to a clamp. 'intermediate' was
    // asserting competence nobody had verified: a 52-year-old with a long
    // endurance background and zero resistance history was generated as
    // intermediate and prescribed RPE 8 primaries against a live sacroiliac.
    training_age: 'beginner',
    movement_competency: 'developing',
    week_duration: planBlock?.week_duration ?? 4,
    equipment_access: ['barbell', 'dumbbell', 'bodyweight'] as string[],
  })

  const [trainingDays, setTrainingDays] = useState<string[]>(intakeTrainingDays)

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

  function toggleDay(day: string) {
    setTrainingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
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
          preferred_training_days: trainingDays,
          ...form,
        }),
      })

      const { data, error: apiError } = await parseApiResponse<any>(res)
      if (!res.ok) {
        setError(apiError || data?.error || 'Generation failed.')
        setLoading(false)
        return
      }

      router.push(`/dashboard/clients/${clientId}/program`)
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-[#EFF1F4] border border-[#E8EAEE] text-[#141821] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6DFC] focus:border-transparent'
  const labelClass = 'block text-xs font-bold text-[#666D7A] uppercase tracking-wider mb-2'

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <GenerationProgressOverlay
        active={loading}
        title="Generating Training Program"
        stages={[
          // Timed 2026-07-30 against the real prompt: 95s to first token, 126s
          // total, 12.9k output tokens. The old stages claimed to be saving the
          // draft at 90s and apologising by 130s, when 90s was still the model
          // thinking and 126s was normal. A progress bar that finishes before
          // the work does teaches the coach to distrust it and refresh.
          { start: 0,   label: 'Reading CFFS, active recovery state, intake, and macro arc context' },
          { start: 10,  label: 'Working through the exercise library against her injury domains' },
          { start: 35,  label: 'Selecting movement patterns and building each session' },
          { start: 70,  label: 'Setting sets, reps and RPE within the doctrine ceilings' },
          { start: 100, label: 'Applying coach guidance and the recovery clamps' },
          { start: 120, label: 'Validating against doctrine and saving the draft' },
          { start: 150, label: 'Still going. This one runs about two minutes, please do not refresh' },
          { start: 240, label: 'Longer than expected. If nothing happens by 5 minutes, try again' },
        ]}
        disclaimer="Program generation uses Claude Sonnet 5 for high-accuracy constraint satisfaction across exercise selection, set / rep design, RPE, and RRS recovery clamps. Typical: about two minutes, and roughly the first 90 seconds show no visible movement while the model works. The page is not frozen, please don't refresh."
      />
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-[#666D7A] hover:text-[#141821] mb-4 block transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-[22px] font-semibold text-[#141821] tracking-[-0.025em]">Generate Training Program</h1>
        <p className="text-sm text-[#666D7A] mt-1">
          Set prescription inputs. All doctrine rules will be applied automatically.
        </p>
      </div>

      {planBlock && (
        <div className="mb-6 bg-[rgba(27,109,252,0.08)] border border-[#B5CFFC] rounded-xl p-4">
          <p className="text-[12.5px] font-medium text-[#1B6DFC] mb-1">From Macro Plan</p>
          <p className="text-sm text-[#141821]">{planBlock.block_name}</p>
          <div className="flex flex-wrap gap-2 mt-1.5 text-[12.5px] text-[#666D7A]">
            <span className="capitalize">{planBlock.progression_phase}</span>
            {planBlock.execution_arc && <span className="capitalize">· {planBlock.execution_arc} arc</span>}
            {planBlock.phase_category && <span>· {planBlock.phase_category}</span>}
            {planBlock.phase_objective && <span>· {planBlock.phase_objective}</span>}
          </div>
          {planBlock.notes && <p className="text-[12.5px] text-[#98A0AD] italic mt-1.5">{planBlock.notes}</p>}
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
            <option value="accumulation">Accumulation - volume priority, foundation building</option>
            <option value="intensification">Intensification - intensity priority, load climbs</option>
            <option value="realization">Realization - peak expression, max loads</option>
            <option value="restoration">Restoration - recovery/deload, suppressed load</option>
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
                    ? 'bg-[#1B6DFC] text-white border-[#1B6DFC]'
                    : 'bg-[#EFF1F4] text-[#141821] border-[#E8EAEE] hover:border-[#CFD4DC]'
                }`}
              >
                {goal.charAt(0).toUpperCase() + goal.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-[12.5px] text-[#666D7A] mt-1.5">
            {form.training_goal === 'strength' && 'Reps 3–6 · RPE 6–8 · 10–16 sets/session'}
            {form.training_goal === 'hypertrophy' && 'Reps 6–12 · RPE 6–7 · 14–22 sets/session'}
            {form.training_goal === 'capacity' && 'Reps 10–20 · RPE 5–7 · 12–18 sets/session'}
          </p>
        </div>

        {/* Training Frequency */}
        <div>
          <label className={labelClass}>
            Training Frequency - <span className="text-[#1B6DFC]">{form.training_frequency} sessions/week</span>
          </label>
          <input
            type="range"
            min={2}
            max={6}
            value={form.training_frequency}
            onChange={e => setForm(prev => ({ ...prev, training_frequency: parseInt(e.target.value) }))}
            className="w-full accent-[#1B6DFC]"
          />
          <div className="flex justify-between text-[12.5px] text-[#98A0AD] mt-1">
            <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
          </div>
        </div>

        {/* Available Training Days (POOL — engine distributes) */}
        <div>
          <label className={labelClass}>
            Available Training Days
            {trainingDays.length > 0 && (
              <span className="ml-2 text-[#1B6DFC] normal-case font-normal">
                {trainingDays.length} available
                {trainingDays.length < form.training_frequency && (
                  <span className="text-[#A96A12] ml-1">- need at least {form.training_frequency}</span>
                )}
              </span>
            )}
          </label>
          <p className="text-[12.5px] text-[#666D7A] mb-2">
            Days the client <em>can</em> train (the pool). The engine picks {form.training_frequency} from this pool and spaces them for recovery — it does <strong>not</strong> use the first N. Pick exactly {form.training_frequency} only if you want to pin specific days.
            {intakeTrainingDays.length > 0 && ' Pre-filled from intake availability.'}
          </p>
          <div className="grid grid-cols-7 gap-1">
            {ALL_DAYS.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`py-2 rounded-md text-xs font-medium border transition-colors ${
                  trainingDays.includes(day)
                    ? 'bg-[#1B6DFC] text-white border-[#1B6DFC]'
                    : 'bg-[#EFF1F4] text-[#666D7A] border-[#E8EAEE] hover:border-[#CFD4DC]'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
          {trainingDays.length === 0 && (
            <p className="text-[12.5px] text-[#98A0AD] mt-1.5">No days selected. Sessions will use abstract labels (Day 1, Day 2) with maximum recovery spacing.</p>
          )}
          {trainingDays.length > 0 && trainingDays.length === form.training_frequency && (
            <p className="text-[12.5px] text-[#666D7A] mt-1.5">
              Pool size matches frequency — engine will use exactly these days: {trainingDays.join(', ')}.
            </p>
          )}
          {trainingDays.length > form.training_frequency && (
            <p className="text-[12.5px] text-[#666D7A] mt-1.5">
              Pool of {trainingDays.length}; engine will pick {form.training_frequency} with recovery spacing (e.g. every-other-day where possible).
            </p>
          )}
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
                    ? 'bg-[#1B6DFC] text-white border-[#1B6DFC]'
                    : 'bg-[#EFF1F4] text-[#141821] border-[#E8EAEE] hover:border-[#CFD4DC]'
                }`}
              >
                {age.charAt(0).toUpperCase() + age.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-[12.5px] text-[#666D7A] mt-1.5">
            {form.training_age === 'beginner' && 'Linear progression - load increases each session'}
            {form.training_age === 'intermediate' && 'Double progression - reps then load'}
            {form.training_age === 'advanced' && 'Undulating periodisation - varies session to session'}
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
                    ? 'bg-[#1B6DFC] text-white border-[#1B6DFC]'
                    : 'bg-[#EFF1F4] text-[#141821] border-[#E8EAEE] hover:border-[#CFD4DC]'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-[12.5px] text-[#666D7A] mt-1.5">
            {form.movement_competency === 'limited' && 'Supported, bilateral, low stability - machine and bodyweight base movements'}
            {form.movement_competency === 'developing' && 'Bilateral preferred, standard compounds permitted, moderate stability'}
            {form.movement_competency === 'proficient' && 'Full range - unilateral, high stability, all compounds available'}
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
                    ? 'bg-[#1B6DFC] text-white border-[#1B6DFC]'
                    : 'bg-[#EFF1F4] text-[#141821] border-[#E8EAEE] hover:border-[#CFD4DC]'
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
                  className="rounded border-[#CFD4DC] bg-[#EFF1F4] accent-[#1B6DFC]"
                />
                <span className={`text-sm transition-colors ${form.equipment_access.includes(opt.value) ? 'text-[#141821]' : 'text-[#666D7A]'}`}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-[#C82626] bg-[#FDEDED] border border-[#F5C9C9] rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-[#1B6DFC] text-white font-semibold rounded-md hover:bg-[#1560E0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating program… this may take 30–60s' : 'Generate Program'}
        </button>
      </form>
    </div>
  )
}
