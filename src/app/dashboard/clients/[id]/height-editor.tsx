'use client'

import { useState } from 'react'
import { MONO_FONT } from '@/components/dashboard/ui'
import { MIN_HEIGHT_CM, MAX_HEIGHT_CM, resolveHeightCm } from '@/lib/client-height'

/**
 * Height on the client file.
 *
 * Height is the one measurement a BMR cannot be estimated without, and until
 * now it could only arrive through the client-facing baseline form. Clients
 * who never submitted a baseline could never have one, so their nutrition
 * plans fell back to "the calories the meals happened to contain".
 *
 * This is the coach's way in. It writes clients.height_cm (the standing
 * record); the baseline keeps its own per-capture height so real height change
 * over years stays visible. The panel shows which of the two is currently
 * winning, and what else is still missing before an energy estimate can run,
 * because a height entered against a client with no bodyweight on file still
 * yields nothing.
 *
 * Saving does not regenerate anything — same rule as the Medications and
 * Dietary editors.
 */
export default function HeightEditor({
  clientId,
  clientHeightCm,
  clientHeightRecordedAt,
  clientHeightSource,
  baselineHeightCm,
  baselineCapturedAt,
  hasBodyweight,
  hasAge,
  hasSex,
}: {
  clientId: string
  clientHeightCm: number | string | null
  clientHeightRecordedAt: string | null
  clientHeightSource: string | null
  baselineHeightCm: number | string | null
  baselineCapturedAt: string | null
  hasBodyweight: boolean
  hasAge: boolean
  hasSex: boolean
}) {
  const initialResolved = resolveHeightCm({
    clientHeightCm,
    clientHeightRecordedAt,
    clientHeightSource,
    baselineHeightCm,
    baselineCapturedAt,
  })

  const [resolved, setResolved] = useState(initialResolved)
  const [value, setValue] = useState(initialResolved.heightCm ? String(initialResolved.heightCm) : '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // What is still blocking an energy estimate, height aside. Listing it here
  // stops the coach entering a height, regenerating, and finding the plan still
  // says an estimate is not possible.
  const stillMissing: string[] = []
  if (!hasBodyweight) stillMissing.push('bodyweight (comes from a baseline capture)')
  if (!hasAge) stillMissing.push('date of birth (from the intake)')
  if (!hasSex) stillMissing.push('sex (from the intake)')

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/height`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ height_cm: value.trim() === '' ? null : value.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Save failed')
        return
      }
      setResolved(
        resolveHeightCm({
          clientHeightCm: data.height_cm,
          clientHeightRecordedAt: new Date().toISOString(),
          clientHeightSource: 'coach',
          baselineHeightCm,
          baselineCapturedAt,
        }),
      )
      setEditing(false)
    } catch {
      setError('Save failed')
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setValue(resolved.heightCm ? String(resolved.heightCm) : '')
    setEditing(false)
    setError(null)
  }

  return (
    <div className="br-card p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" />
          <h2
            className="text-[11px] font-medium text-[#141821]"
          >
            Height
          </h2>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="br-btn"
          >
            {resolved.heightCm ? 'Edit' : 'Add'}
          </button>
        )}
      </div>

      <p className="text-[#98A0AD] text-[12.5px] mb-4">
        The measurement every BMR equation needs. Without it the nutrition engine cannot say whether a
        day&apos;s calories suit the person eating them — it can only report what the meals happened to add up
        to. Enter it once; it carries forward and is not re-asked at check-ins.
      </p>

      {editing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min={MIN_HEIGHT_CM}
              max={MAX_HEIGHT_CM}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="e.g. 172"
              className="w-32 px-3 py-2 border border-[#E8EAEE] rounded-lg text-sm text-[#141821] focus:outline-none focus:border-[#1B6DFC]"
            />
            <span className="text-sm text-[#666D7A]">cm</span>
          </div>
          <p className="text-[11px] text-[#98A0AD]">
            Centimetres, not feet and inches. 5&apos;9&quot; is 175cm. Leave blank and save to clear.
          </p>
          {error && <p className="text-[12.5px] text-[#C82626]">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="text-[12.5px] font-medium px-4 py-2 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#1560E0] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={cancel}
              disabled={saving}
              className="text-[12.5px] font-medium px-4 py-2 border border-[#E8EAEE] text-[#666D7A] rounded-lg hover:border-[#1B6DFC] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : resolved.heightCm ? (
        <div className="space-y-2">
          <p className="text-[22px] font-semibold text-[#141821] tracking-[-0.025em]">
            {resolved.heightCm}
            <span className="text-sm text-[#98A0AD] ml-1.5">cm</span>
          </p>
          <p className="text-[11px] text-[#98A0AD]">Source: {resolved.label}</p>
          {stillMissing.length > 0 && (
            <div className="mt-3 px-3 py-2.5 rounded-lg border border-[#A96A12]/50 bg-[#B7791F]/5">
              <p className="text-[12.5px] font-medium text-[#A96A12] mb-1">
                Energy estimate still blocked
              </p>
              <p className="text-[12.5px] text-[#43474F] leading-relaxed">
                Height is on file, but a BMR still cannot run without {stillMissing.join(', ')}.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="px-3 py-2.5 rounded-lg border border-[#A96A12]/50 bg-[#B7791F]/5">
          <p className="text-[12.5px] font-medium text-[#A96A12] mb-1">No height on file</p>
          <p className="text-[12.5px] text-[#43474F] leading-relaxed">
            Nutrition plans for this client cannot carry an energy requirement. Add the height and regenerate
            the plan from the Nutrition page to pick it up.
          </p>
        </div>
      )}
    </div>
  )
}
