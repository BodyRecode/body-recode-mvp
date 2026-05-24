'use client'

import { useState } from 'react'
import { MONO_FONT } from '@/components/dashboard/ui'

/**
 * Medications editor on the client profile.
 *
 * Captures the client's full pharmacological context, not just hormonal-class
 * support. Free text so the coach can describe regimen + dose + duration. The
 * program and nutrition prompts parse the text for:
 *   - Hormonal-class signals (TRT, GLP-1, androgens, peptides) -> training-tier
 *     shift + protein anchor modulation
 *   - Non-hormonal categories (beta-blockers, SSRIs/SNRIs, stimulants, chronic
 *     NSAIDs, anticoagulants, corticosteroids, contraceptives, statins) ->
 *     signal interpretation, exercise selection, recovery margins
 *
 * Staleness banner fires when the active program or nutrition plan was
 * generated before the most recent edit, so the coach knows the prescription
 * doesn't reflect the current regimen.
 */
export default function MedicationsEditor({
  clientId,
  initialValue,
  updatedAt,
  activeProgramGeneratedAt,
  activeNutritionGeneratedAt,
}: {
  clientId: string
  initialValue: string | null
  updatedAt?: string | null
  activeProgramGeneratedAt?: string | null
  activeNutritionGeneratedAt?: string | null
}) {
  const [value, setValue] = useState(initialValue ?? '')
  const [original, setOriginal] = useState(initialValue ?? '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = value !== original

  const updatedAtMs = updatedAt ? new Date(updatedAt).getTime() : null
  const programStale = updatedAtMs && activeProgramGeneratedAt
    ? new Date(activeProgramGeneratedAt).getTime() < updatedAtMs
    : false
  const nutritionStale = updatedAtMs && activeNutritionGeneratedAt
    ? new Date(activeNutritionGeneratedAt).getTime() < updatedAtMs
    : false
  const showStaleBanner = !editing && original && (programStale || nutritionStale)
  const daysSinceUpdate = updatedAtMs
    ? Math.max(0, Math.floor((Date.now() - updatedAtMs) / 86_400_000))
    : null

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medications: value.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Save failed')
        return
      }
      setOriginal(value)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setValue(original)
    setEditing(false)
    setError(null)
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" />
          <h2
            className="text-[11px] font-bold text-[#1A1A1A] uppercase"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
          >
            Medications
          </h2>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium px-3 py-1.5 border border-[#E5E5E5] text-[#6B6B6B] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors"
          >
            {value ? 'Edit' : 'Add'}
          </button>
        )}
      </div>
      <p className="text-[#999999] text-xs mb-3">
        All prescribed medications and chronic over-the-counter use. Include hormonal support (TRT, GLP-1, peptides, anabolics), cardiovascular meds (beta-blockers, statins), CNS-active meds (SSRIs/SNRIs, stimulants, anxiolytics), anti-inflammatories (chronic NSAIDs, corticosteroids), anticoagulants, contraceptives/HRT, and similar. Free text, describe each with dose and duration if known. Drives prescription modulation and signal interpretation across program + nutrition.
      </p>
      {showStaleBanner && (
        <div className="mb-3 px-3 py-2.5 rounded-lg border border-amber-700/50 bg-amber-500/5">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            Prescription is older than current medications
          </p>
          <p className="text-xs text-[#3A3A3A] leading-relaxed">
            Medications {daysSinceUpdate !== null ? `were updated ${daysSinceUpdate}d ago` : 'have been updated'}. The active{' '}
            {programStale && nutritionStale ? 'training program and nutrition plan' : programStale ? 'training program' : 'nutrition plan'}{' '}
            {programStale && nutritionStale ? 'were' : 'was'} generated before that change. Recovery capacity, RPE ceilings, exercise selection, and protein synthesis assumptions may no longer match. Consider regenerating from the macro plan / nutrition page.
          </p>
        </div>
      )}
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g. TRT 150mg test cypionate / week, year 2. Metoprolol 25mg / day for BP, year 1. No NSAIDs. No other meds."
            className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg p-3 text-[#1A1A1A] text-sm leading-relaxed focus:outline-none focus:border-[#D4D4D4] placeholder-[#4A4A4A] min-h-[120px]"
          />
          {error && <p className="text-xs text-red-700">{error}</p>}
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
              className="text-sm font-bold px-4 py-2 border border-[#E5E5E5] text-[#6B6B6B] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : value ? (
        <p className="text-sm text-[#3A3A3A] leading-relaxed whitespace-pre-line">{value}</p>
      ) : (
        <p className="text-sm text-[#4A4A4A] italic">None reported.</p>
      )}
    </div>
  )
}
