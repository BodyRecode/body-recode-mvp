'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const EQUIPMENT_OPTIONS = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'machine', label: 'Machine' },
  { value: 'cable', label: 'Cable' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'specialty', label: 'Specialty (trap bar, sleds, etc.)' },
]

export default function GenerateProgramPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    block_name: '',
    progression_phase: 'accumulation',
    training_goal: 'strength',
    training_frequency: 3,
    training_age: 'intermediate',
    week_duration: 4,
    equipment_access: ['barbell', 'dumbbell', 'bodyweight'] as string[],
  })

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
    if (!form.block_name.trim()) {
      setError('Block name is required.')
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
    } catch {
      setError('Unexpected error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 block"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Generate Training Program</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set prescription inputs. All doctrine rules will be applied automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Block Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Block Name
          </label>
          <input
            type="text"
            value={form.block_name}
            onChange={e => setForm(prev => ({ ...prev, block_name: e.target.value }))}
            placeholder="e.g. Foundation Strength Block"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Progression Phase */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Progression Phase
          </label>
          <select
            value={form.progression_phase}
            onChange={e => setForm(prev => ({ ...prev, progression_phase: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="accumulation">Accumulation — volume priority, foundation building</option>
            <option value="intensification">Intensification — intensity priority, load climbs</option>
            <option value="realization">Realization — peak expression, max loads</option>
            <option value="restoration">Restoration — recovery/deload, suppressed load</option>
          </select>
        </div>

        {/* Training Goal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Training Goal
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['strength', 'hypertrophy', 'capacity'] as const).map(goal => (
              <button
                key={goal}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, training_goal: goal }))}
                className={`py-2 rounded-md text-sm font-medium border transition-colors ${
                  form.training_goal === goal
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {goal.charAt(0).toUpperCase() + goal.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {form.training_goal === 'strength' && 'Reps 3–6, RPE 6–8, sets 10–16/session'}
            {form.training_goal === 'hypertrophy' && 'Reps 6–12, RPE 6–7, sets 14–22/session'}
            {form.training_goal === 'capacity' && 'Reps 10–20, RPE 5–7, sets 12–18/session'}
          </p>
        </div>

        {/* Training Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Training Frequency — {form.training_frequency} sessions/week
          </label>
          <input
            type="range"
            min={2}
            max={6}
            value={form.training_frequency}
            onChange={e => setForm(prev => ({ ...prev, training_frequency: parseInt(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
          </div>
        </div>

        {/* Training Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Training Age
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['beginner', 'intermediate', 'advanced'] as const).map(age => (
              <button
                key={age}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, training_age: age }))}
                className={`py-2 rounded-md text-sm font-medium border transition-colors ${
                  form.training_age === age
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {age.charAt(0).toUpperCase() + age.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {form.training_age === 'beginner' && 'Linear progression — load increases each session'}
            {form.training_age === 'intermediate' && 'Double progression — reps then load'}
            {form.training_age === 'advanced' && 'Undulating periodisation — varies session to session'}
          </p>
        </div>

        {/* Week Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Block Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([4, 6, 8] as const).map(weeks => (
              <button
                key={weeks}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, week_duration: weeks }))}
                className={`py-2 rounded-md text-sm font-medium border transition-colors ${
                  form.week_duration === weeks
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {weeks} weeks
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Access */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Equipment Access
          </label>
          <div className="grid grid-cols-2 gap-2">
            {EQUIPMENT_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.equipment_access.includes(opt.value)}
                  onChange={() => toggleEquipment(opt.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating program… this may take 30–60s' : 'Generate Program'}
        </button>
      </form>
    </div>
  )
}
