'use client'

import { useState } from 'react'
import { MONO_FONT } from '@/components/dashboard/ui'

/**
 * Dietary & Consumption editor on the client profile.
 *
 * Coach-side editor for the eight Section D free-text fields that live on the
 * most-recent intake row (not the clients table). Before this existed, the only
 * way to change these mid-coaching was to send a supplementary intake or retake
 * the whole intake. This is the dietary analogue of the Medications editor.
 *
 * The fields feed the CFFS and nutrition prompts:
 *   - dietary_restrictions / dietary_preferences -> HARD CONSTRAINTS
 *   - typical_day_eating / meals_per_day / fluid_intake / caffeine_intake /
 *     alcohol_intake -> the consumption baseline the engine designs FROM
 *   - eating_context -> adherence design (optional)
 *
 * Saving stamps intakes.dietary_updated_at so the staleness banner can warn
 * when the active program / nutrition plan predates the change. Like the
 * Medications editor, saving does NOT auto-regenerate the CFFS; the coach
 * regenerates from the macro plan / nutrition page when ready.
 */

export type DietaryFieldKey =
  | 'dietary_restrictions'
  | 'dietary_preferences'
  | 'typical_day_eating'
  | 'meals_per_day'
  | 'fluid_intake'
  | 'caffeine_intake'
  | 'alcohol_intake'
  | 'eating_context'

export type DietaryValues = Record<DietaryFieldKey, string>

const FIELDS: Array<{
  key: DietaryFieldKey
  label: string
  hint: string
  required: boolean
  rows: number
}> = [
  {
    key: 'dietary_restrictions',
    label: 'Dietary restrictions',
    hint: 'Allergies, intolerances, medical restrictions. HARD CONSTRAINT for the engine.',
    required: true,
    rows: 2,
  },
  {
    key: 'dietary_preferences',
    label: 'Dietary preferences / framework',
    hint: 'Foods avoided for personal, cultural, religious reasons, or a framework (vegan, halal, etc.). HARD CONSTRAINT.',
    required: true,
    rows: 2,
  },
  {
    key: 'typical_day_eating',
    label: "Typical day's eating",
    hint: 'Breakfast, lunch, dinner, snacks. The baseline the engine designs FROM.',
    required: true,
    rows: 4,
  },
  {
    key: 'meals_per_day',
    label: 'Meals per day',
    hint: 'Eating frequency (meals + snacks). Feeds the appetite-suppression meal-count rules.',
    required: true,
    rows: 2,
  },
  {
    key: 'fluid_intake',
    label: 'Daily fluids',
    hint: 'Water and all other drinks. Surfaces caloric/sugary drinks to the energy picture.',
    required: true,
    rows: 2,
  },
  {
    key: 'caffeine_intake',
    label: 'Daily caffeine',
    hint: 'Serves + timing (sleep, appetite, stimulant interactions).',
    required: true,
    rows: 2,
  },
  {
    key: 'alcohol_intake',
    label: 'Alcohol intake',
    hint: 'What, how many standard drinks, days per week. Caloric + recovery load.',
    required: true,
    rows: 2,
  },
  {
    key: 'eating_context',
    label: 'Eating environment',
    hint: 'Who cooks, family/work meals, travel, takeaway. Optional. Shapes adherence design.',
    required: false,
    rows: 2,
  },
]

function emptyToOriginal(values: DietaryValues): DietaryValues {
  return { ...values }
}

export default function DietaryConsumptionEditor({
  clientId,
  initialValues,
  updatedAt,
  activeProgramGeneratedAt,
  activeNutritionGeneratedAt,
}: {
  clientId: string
  initialValues: DietaryValues
  updatedAt?: string | null
  activeProgramGeneratedAt?: string | null
  activeNutritionGeneratedAt?: string | null
}) {
  const [values, setValues] = useState<DietaryValues>(initialValues)
  const [original, setOriginal] = useState<DietaryValues>(emptyToOriginal(initialValues))
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = FIELDS.some(f => values[f.key] !== original[f.key])
  const hasAny = FIELDS.some(f => (original[f.key] ?? '').trim().length > 0)
  const missingRequired = FIELDS.filter(f => f.required && !values[f.key].trim()).map(f => f.key)

  const updatedAtMs = updatedAt ? new Date(updatedAt).getTime() : null
  const programStale = updatedAtMs && activeProgramGeneratedAt
    ? new Date(activeProgramGeneratedAt).getTime() < updatedAtMs
    : false
  const nutritionStale = updatedAtMs && activeNutritionGeneratedAt
    ? new Date(activeNutritionGeneratedAt).getTime() < updatedAtMs
    : false
  const showStaleBanner = !editing && hasAny && (programStale || nutritionStale)
  const daysSinceUpdate = updatedAtMs
    ? Math.max(0, Math.floor((Date.now() - updatedAtMs) / 86_400_000))
    : null

  function setField(key: DietaryFieldKey, v: string) {
    setValues(prev => ({ ...prev, [key]: v }))
  }

  async function save() {
    if (missingRequired.length > 0) {
      setError('All fields except eating environment are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload: Record<string, string> = {}
      for (const f of FIELDS) payload[f.key] = values[f.key].trim()
      const res = await fetch(`/api/clients/${clientId}/dietary`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Save failed')
        return
      }
      setOriginal(emptyToOriginal(values))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setValues(original)
    setEditing(false)
    setError(null)
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" />
          <h2
            className="text-[11px] font-medium text-[#141821]"
          >
            Dietary &amp; Consumption
          </h2>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[12.5px] font-medium px-3 py-1.5 border border-[#E8EAEE] text-[#666D7A] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors"
          >
            {hasAny ? 'Edit' : 'Add'}
          </button>
        )}
      </div>
      <p className="text-[#98A0AD] text-[12.5px] mb-4">
        Section D dietary and consumption answers, captured at intake and editable here without sending a supplementary intake. Restrictions and preferences are hard constraints; the rest is the baseline the nutrition engine designs from. Saving flags the active program / nutrition plan as stale so you know to regenerate.
      </p>
      {showStaleBanner && (
        <div className="mb-4 px-3 py-2.5 rounded-lg border border-amber-700/50 bg-amber-500/5">
          <p className="text-[12.5px] font-medium text-amber-700 mb-1">
            Prescription is older than current dietary context
          </p>
          <p className="text-[12.5px] text-[#43474F] leading-relaxed">
            Dietary context {daysSinceUpdate !== null ? `was updated ${daysSinceUpdate}d ago` : 'has been updated'}. The active{' '}
            {programStale && nutritionStale ? 'training program and nutrition plan' : programStale ? 'training program' : 'nutrition plan'}{' '}
            {programStale && nutritionStale ? 'were' : 'was'} generated before that change. Constraints, calorie band, and meal structure may no longer match. Consider regenerating from the macro plan / nutrition page (and regenerating the CFFS if the change is material).
          </p>
        </div>
      )}
      {editing ? (
        <div className="space-y-4">
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-[12.5px] font-medium text-[#141821] mb-1">
                {f.label}
                {f.required && <span className="text-[#1B6DFC] ml-1">*</span>}
              </label>
              <p className="text-[11px] text-[#98A0AD] mb-2 leading-relaxed">{f.hint}</p>
              <textarea
                value={values[f.key]}
                onChange={e => setField(f.key, e.target.value)}
                rows={f.rows}
                className={`w-full bg-[#FFFFFF] border rounded-lg p-3 text-[#141821] text-sm leading-relaxed focus:outline-none focus:border-[#CFD4DC] placeholder-[#4A4A4A] resize-y ${
                  f.required && missingRequired.includes(f.key) ? 'border-red-500/60' : 'border-[#E8EAEE]'
                }`}
              />
            </div>
          ))}
          {error && <p className="text-[12.5px] text-red-700">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="text-sm font-bold px-4 py-2 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#5390FF] transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={cancel}
              disabled={saving}
              className="text-sm font-bold px-4 py-2 border border-[#E8EAEE] text-[#666D7A] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : hasAny ? (
        <div className="space-y-3">
          {FIELDS.map(f => (
            <div key={f.key}>
              <p className="text-[10px] font-medium text-[#666D7A] mb-0.5">{f.label}</p>
              {original[f.key].trim() ? (
                <p className="text-sm text-[#43474F] leading-relaxed whitespace-pre-line">{original[f.key]}</p>
              ) : (
                <p className="text-sm text-[#4A4A4A] italic">Not captured.</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#4A4A4A] italic">Not captured. This intake predates the Section D dietary/consumption fields — click Add to capture them, or send a supplementary intake.</p>
      )}
    </div>
  )
}
